/**
 * 数据采集任务 tRPC 路由（完整版）
 * 包含：任务 CRUD、定时调度、代理管理、告警、配置、统计图表
 */
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../lib/trpc';
import { db } from '../lib/db';
import {
  crawlJobs, crawlLogs, crawlRawData, crawlProxies, crawlAlerts,
  crawlScheduleHistory, crawlConfig, cities, cases,
  type InsertCrawlJob, type InsertCrawlProxy, type InsertCrawlAlert,
  type InsertCrawlScheduleHistory, type InsertCrawlConfig
} from '../lib/schema';
import { eq, desc, and, gte, count, sql, ne, lt, isNull } from 'drizzle-orm';
import { enqueueJob, pauseJob, getQueueStats } from '../crawler/engines/job-queue';
import {
  checkScraplingHealth,
  scraplingStartJob,
  scraplingStopJob,
} from '../crawler/engines/scrapling-client';
import {
  registerJobSchedule, unregisterJobSchedule,
  getScheduledTasksStatus, getCronDescription
} from '../crawler/engines/cron-scheduler';

// ─── 输入验证 Schema ───────────────────────────────────────────
const CreateJobSchema = z.object({
  name: z.string().min(1, '任务名称不能为空'),
  source: z.enum(['lianjia', 'beike', 'anjuke', 'fang', 'leyoujia', 'szfdc', 'custom']),
  dataType: z.enum(['sold_cases', 'listing', 'estate_info']),
  cityId: z.number().optional(),
  cityName: z.string().optional(),
  districtName: z.string().optional(),
  keyword: z.string().optional(),
  maxPages: z.number().min(1).max(200).default(5),
  concurrency: z.number().min(1).max(5).default(2),
  delayMin: z.number().default(2000),
  delayMax: z.number().default(5000),
  useProxy: z.boolean().default(false),
  scheduleType: z.enum(['manual', 'cron']).default('manual'),
  cronExpression: z.string().optional(),
  customConfigJson: z.any().optional(),
});

const UpdateJobSchema = CreateJobSchema.partial().extend({ id: z.number() });

export const crawlRouter = router({

  // ─── 任务管理 ──────────────────────────────────────────────────

  /** 获取任务列表（支持状态筛选、分页） */
  listJobs: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, status } = input;
      const offset = (page - 1) * pageSize;
      const where = status ? eq(crawlJobs.status, status as any) : undefined;
      const [jobs, totalResult] = await Promise.all([
        db.select().from(crawlJobs).where(where)
          .orderBy(desc(crawlJobs.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(crawlJobs).where(where),
      ]);
      // 附加 cron 描述
      const scheduledIds = new Set(getScheduledTasksStatus().map(s => s.jobId));
      return {
        jobs: jobs.map(j => ({
          ...j,
          cronDescription: j.cronExpression ? getCronDescription(j.cronExpression) : null,
          isScheduled: scheduledIds.has(j.id),
        })),
        total: totalResult[0]?.count ?? 0,
        page, pageSize,
      };
    }),

  /** 获取任务详情 */
  getJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, input.id)).limit(1);
      if (!job) throw new Error('任务不存在');
      return {
        ...job,
        cronDescription: job.cronExpression ? getCronDescription(job.cronExpression) : null,
      };
    }),

  /** 创建任务 */
  createJob: protectedProcedure
    .input(CreateJobSchema)
    .mutation(async ({ input, ctx }) => {
      let cityName = input.cityName;
      if (!cityName && input.cityId) {
        const [city] = await db.select({ name: cities.name }).from(cities)
          .where(eq(cities.id, input.cityId)).limit(1);
        cityName = city?.name;
      }
      const [job] = await db.insert(crawlJobs).values({
        ...input, cityName, createdBy: ctx.user.id, status: 'pending',
      } as InsertCrawlJob).$returningId();

      // 如果是 cron 任务，注册调度
      if (input.scheduleType === 'cron' && input.cronExpression) {
        await registerJobSchedule(job.id);
      }
      return { id: job.id, name: input.name, cityName, status: 'pending', message: '任务创建成功' };
    }),

  /** 更新任务配置 */
  updateJob: protectedProcedure
    .input(UpdateJobSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.source === 'custom' && !data.customConfigJson) {
        throw new Error('自定义任务必须提供 configJson');
      }
      await db.update(crawlJobs).set(data as any).where(eq(crawlJobs.id, id));
      // 重新注册调度
      unregisterJobSchedule(id);
      if (data.scheduleType === 'cron' && data.cronExpression) {
        await registerJobSchedule(id);
      }
      return { message: '任务已更新' };
    }),

  /** 启动任务（优先使用 Scrapling 微服务，降级到 BullMQ） */
  startJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, input.id)).limit(1);
      if (!job) throw new Error('任务不存在');
      if (job.status === 'running') throw new Error('任务已在运行中');
      await db.update(crawlJobs).set({ status: 'pending' } as Partial<InsertCrawlJob>).where(eq(crawlJobs.id, input.id));
      // 记录手动触发历史
      await db.insert(crawlScheduleHistory).values({
        jobId: input.id, triggeredBy: 'manual', status: 'success', startedAt: new Date(),
      } as InsertCrawlScheduleHistory);
      // 优先使用 Scrapling 微服务（Python，更强反爬能力）
      const scraplingAvailable = await checkScraplingHealth();
      if (scraplingAvailable) {
        const result = await scraplingStartJob(input.id);
        return { message: `[Scrapling] ${result.message}`, engine: 'scrapling', thread: result.thread };
      }
      // 降级：使用原有 BullMQ 队列
      const queueId = await enqueueJob(input.id);
      return { message: '任务已加入队列（BullMQ 降级）', engine: 'bullmq', queueId };
    }),

  /** 暂停任务（同时通知 Scrapling 微服务停止） */
  pauseJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // 通知 Scrapling 微服务停止
      const scraplingAvailable = await checkScraplingHealth();
      if (scraplingAvailable) {
        try { await scraplingStopJob(input.id); } catch { /* 忽略 */ }
      }
      await pauseJob(input.id);
      return { message: '任务已暂停' };
    }),

  /** 重启任务（清空进度重新执行，优先使用 Scrapling） */
  restartJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(crawlJobs).set({
        status: 'pending', progress: 0, successCount: 0, failCount: 0,
        duplicateCount: 0, errorMessage: null, startedAt: null, completedAt: null,
      } as Partial<InsertCrawlJob>).where(eq(crawlJobs.id, input.id));
      const scraplingAvailable = await checkScraplingHealth();
      if (scraplingAvailable) {
        const result = await scraplingStartJob(input.id);
        return { message: `[Scrapling] ${result.message}`, engine: 'scrapling' };
      }
      const queueId = await enqueueJob(input.id);
      return { message: '任务已重启（BullMQ 降级）', engine: 'bullmq', queueId };
    }),

  /** 删除任务（含日志和原始数据） */
  deleteJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      unregisterJobSchedule(input.id);
      await db.delete(crawlLogs).where(eq(crawlLogs.jobId, input.id));
      await db.delete(crawlRawData).where(eq(crawlRawData.jobId, input.id));
      await db.delete(crawlScheduleHistory).where(eq(crawlScheduleHistory.jobId, input.id));
      await db.delete(crawlJobs).where(eq(crawlJobs.id, input.id));
      return { message: '任务已删除' };
    }),

  /** 批量操作任务 */
  batchOperation: adminProcedure
    .input(z.object({
      ids: z.array(z.number()),
      action: z.enum(['start', 'pause', 'delete', 'restart']),
    }))
    .mutation(async ({ input }) => {
      const { ids, action } = input;
      let successCount = 0;
      for (const id of ids) {
        try {
          if (action === 'start') { await enqueueJob(id); }
          else if (action === 'pause') { await pauseJob(id); }
          else if (action === 'restart') {
            await db.update(crawlJobs).set({ status: 'pending', progress: 0 } as Partial<InsertCrawlJob>).where(eq(crawlJobs.id, id));
            await enqueueJob(id);
          } else if (action === 'delete') {
            unregisterJobSchedule(id);
            await db.delete(crawlLogs).where(eq(crawlLogs.jobId, id));
            await db.delete(crawlJobs).where(eq(crawlJobs.id, id));
          }
          successCount++;
        } catch (e) { /* 单个失败不影响其他 */ }
      }
      return { message: `批量操作完成，成功 ${successCount}/${ids.length} 个` };
    }),

  // ─── 日志 ──────────────────────────────────────────────────────

  /** 获取任务日志（支持级别筛选） */
  getJobLogs: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      limit: z.number().default(200),
      level: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { jobId, limit, level } = input;
      const where = level
        ? and(eq(crawlLogs.jobId, jobId), eq(crawlLogs.level, level as any))
        : eq(crawlLogs.jobId, jobId);
      const logs = await db.select().from(crawlLogs).where(where)
        .orderBy(desc(crawlLogs.createdAt)).limit(limit);
      return logs.reverse();
    }),

  // ─── 数据预览 ──────────────────────────────────────────────────

  /** 获取任务采集的成交案例数据 */
  getJobCases: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;
      const [job] = await db.select({ cityId: crawlJobs.cityId, source: crawlJobs.source })
        .from(crawlJobs).where(eq(crawlJobs.id, input.jobId)).limit(1);
      if (!job) return { data: [], total: 0 };

      const [data, totalResult] = await Promise.all([
        db.select().from(cases)
          .where(and(eq(cases.cityId, job.cityId ?? 0), eq(cases.source, job.source)))
          .orderBy(desc(cases.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(cases)
          .where(and(eq(cases.cityId, job.cityId ?? 0), eq(cases.source, job.source))),
      ]);
      return { data, total: totalResult[0]?.count ?? 0 };
    }),

  // ─── 统计图表 ──────────────────────────────────────────────────

  /** 仪表盘总览统计 */
  getDashboardStats: protectedProcedure
    .query(async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

      const [
        totalJobs, runningJobs, completedJobs, failedJobs, pausedJobs,
        totalCases, todayCases, weekCases, monthCases,
        activeProxies, unreadAlerts, queueStats,
      ] = await Promise.all([
        db.select({ count: count() }).from(crawlJobs),
        db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'running')),
        db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'completed')),
        db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'failed')),
        db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'paused')),
        db.select({ count: count() }).from(cases),
        db.select({ count: count() }).from(cases).where(gte(cases.createdAt, today)),
        db.select({ count: count() }).from(cases).where(gte(cases.createdAt, weekAgo)),
        db.select({ count: count() }).from(cases).where(gte(cases.createdAt, monthAgo)),
        db.select({ count: count() }).from(crawlProxies).where(eq(crawlProxies.status, 'active')),
        db.select({ count: count() }).from(crawlAlerts).where(eq(crawlAlerts.isRead, false)),
        getQueueStats().catch(() => ({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 })),
      ]);

      // 各来源数据量
      const sourceStats = await db.select({
        source: sql<string>`COALESCE(source, 'unknown')`,
        cnt: count(),
      }).from(cases).groupBy(sql`source`);

      // 各城市数据量 Top 10
      const cityStats = await db.select({
        cityId: cases.cityId,
        cnt: count(),
      }).from(cases).groupBy(cases.cityId)
        .orderBy(desc(count())).limit(10);

      // 近30天每日采集量
      const dailyStats = await db.execute(sql`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM cases
        WHERE created_at >= ${monthAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      return {
        jobs: {
          total: totalJobs[0]?.count ?? 0,
          running: runningJobs[0]?.count ?? 0,
          completed: completedJobs[0]?.count ?? 0,
          failed: failedJobs[0]?.count ?? 0,
          paused: pausedJobs[0]?.count ?? 0,
        },
        cases: {
          total: totalCases[0]?.count ?? 0,
          today: todayCases[0]?.count ?? 0,
          week: weekCases[0]?.count ?? 0,
          month: monthCases[0]?.count ?? 0,
        },
        proxies: { active: activeProxies[0]?.count ?? 0 },
        alerts: { unread: unreadAlerts[0]?.count ?? 0 },
        queue: queueStats,
        sourceStats,
        cityStats,
        dailyStats: (dailyStats as any[]).map((r: any) => {
          let dateStr: string;
          if (r.date instanceof Date) {
            dateStr = r.date.toISOString().split('T')[0];
          } else if (typeof r.date === 'string') {
            dateStr = r.date.split('T')[0];
          } else {
            dateStr = String(r.date);
          }
          return { date: dateStr, count: Number(r.count) };
        }),
        scheduledTasks: getScheduledTasksStatus().length,
      };
    }),

  /** 获取执行历史（用于趋势图） */
  getScheduleHistory: protectedProcedure
    .input(z.object({
      jobId: z.number().optional(),
      limit: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const where = input.jobId ? eq(crawlScheduleHistory.jobId, input.jobId) : undefined;
      return db.select().from(crawlScheduleHistory).where(where)
        .orderBy(desc(crawlScheduleHistory.startedAt)).limit(input.limit);
    }),

  // ─── 代理管理 ──────────────────────────────────────────────────

  /** 获取代理列表 */
  listProxies: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, status } = input;
      const offset = (page - 1) * pageSize;
      const where = status ? eq(crawlProxies.status, status as any) : undefined;
      const [proxies, totalResult] = await Promise.all([
        db.select().from(crawlProxies).where(where)
          .orderBy(desc(crawlProxies.updatedAt)).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(crawlProxies).where(where),
      ]);
      return { proxies, total: totalResult[0]?.count ?? 0 };
    }),

  /** 添加代理 */
  addProxy: adminProcedure
    .input(z.object({
      host: z.string().min(1),
      port: z.number().min(1).max(65535),
      protocol: z.enum(['http', 'https', 'socks5']).default('http'),
      username: z.string().optional(),
      password: z.string().optional(),
      region: z.string().optional(),
      provider: z.string().optional(),
      expireAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(crawlProxies).values({
        ...input,
        expireAt: input.expireAt ? new Date(input.expireAt) : null,
        status: 'active',
      } as InsertCrawlProxy);
      return { message: '代理已添加' };
    }),

  /** 批量导入代理（格式: host:port 或 host:port:user:pass） */
  importProxies: adminProcedure
    .input(z.object({
      text: z.string(),
      protocol: z.enum(['http', 'https', 'socks5']).default('http'),
      provider: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const lines = input.text.split('\n').map(l => l.trim()).filter(Boolean);
      let imported = 0;
      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length < 2) continue;
        const [host, portStr, username, password] = parts;
        const port = parseInt(portStr);
        if (!host || isNaN(port)) continue;
        try {
          await db.insert(crawlProxies).values({
            host, port, protocol: input.protocol,
            username: username || null, password: password || null,
            provider: input.provider || null, status: 'active',
          } as InsertCrawlProxy);
          imported++;
        } catch (e) { /* 重复跳过 */ }
      }
      return { message: `成功导入 ${imported} 个代理` };
    }),

  /** 测试代理可用性 */
  testProxy: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [proxy] = await db.select().from(crawlProxies)
        .where(eq(crawlProxies.id, input.id)).limit(1);
      if (!proxy) throw new Error('代理不存在');

      await db.update(crawlProxies).set({ status: 'testing' } as Partial<InsertCrawlProxy>)
        .where(eq(crawlProxies.id, input.id));

      const startTime = Date.now();
      try {
        const axios = (await import('axios')).default;
        const proxyUrl = proxy.username
          ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
          : `${proxy.protocol}://${proxy.host}:${proxy.port}`;

        await axios.get('https://httpbin.org/ip', {
          proxy: { host: proxy.host, port: proxy.port, protocol: proxy.protocol ?? undefined },
          timeout: 8000,
        });

        const responseMs = Date.now() - startTime;
        await db.update(crawlProxies).set({
          status: 'active',
          avgResponseMs: responseMs,
          successCount: (proxy.successCount ?? 0) + 1,
          lastTestedAt: new Date(),
        } as Partial<InsertCrawlProxy>).where(eq(crawlProxies.id, input.id));

        return { success: true, responseMs, message: `代理可用，响应时间 ${responseMs}ms` };
      } catch (e: any) {
        await db.update(crawlProxies).set({
          status: 'inactive',
          failCount: (proxy.failCount ?? 0) + 1,
          lastTestedAt: new Date(),
        } as Partial<InsertCrawlProxy>).where(eq(crawlProxies.id, input.id));
        return { success: false, message: `代理不可用: ${e.message}` };
      }
    }),

  /** 删除代理 */
  deleteProxy: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(crawlProxies).where(eq(crawlProxies.id, input.id));
      return { message: '代理已删除' };
    }),

  // ─── 告警管理 ──────────────────────────────────────────────────

  /** 获取告警列表 */
  listAlerts: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const where = input.unreadOnly ? eq(crawlAlerts.isRead, false) : undefined;
      return db.select().from(crawlAlerts).where(where)
        .orderBy(desc(crawlAlerts.createdAt)).limit(input.limit);
    }),

  /** 标记告警已读 */
  markAlertRead: protectedProcedure
    .input(z.object({ id: z.number().optional() })) // 不传 id 则标记全部已读
    .mutation(async ({ input }) => {
      if (input.id) {
        await db.update(crawlAlerts).set({ isRead: true } as Partial<InsertCrawlAlert>).where(eq(crawlAlerts.id, input.id));
      } else {
        await db.update(crawlAlerts).set({ isRead: true } as Partial<InsertCrawlAlert>);
      }
      return { message: '已标记为已读' };
    }),

  // ─── 系统配置 ──────────────────────────────────────────────────

  /** 获取采集系统配置 */
  getConfig: adminProcedure
    .query(async () => {
      const configs = await db.select().from(crawlConfig);
      return Object.fromEntries(configs.map(c => [c.key, c.value]));
    }),

  /** 更新采集系统配置 */
  updateConfig: adminProcedure
    .input(z.record(z.string()))
    .mutation(async ({ input }) => {
      for (const [key, value] of Object.entries(input)) {
        await db.update(crawlConfig).set({ value } as Partial<InsertCrawlConfig>).where(eq(crawlConfig.key, key));
      }
      return { message: '配置已保存' };
    }),

  /** 获取队列统计 */
  getQueueStats: protectedProcedure
    .query(async () => {
      try { return await getQueueStats(); }
      catch (e) { return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }; }
    }),

  /** 获取城市列表 */
  getCities: protectedProcedure
    .query(async () => {
      return db.select({ id: cities.id, name: cities.name, province: cities.province })
        .from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
    }),

  /** 获取定时任务状态 */
  getScheduledTasks: protectedProcedure
    .query(async () => {
      return getScheduledTasksStatus();
    }),

  /** 手动触发定时任务注册 */
  refreshSchedule: adminProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      await registerJobSchedule(input.jobId);
      return { message: '定时调度已刷新' };
    }),

  // ─── 两大类采集配置 ──────────────────────────────────────────────

  /** 获取楼盘基础信息采集配置（可用数据源、城市、字段说明） */
  getEstateInfoConfig: protectedProcedure
    .query(async () => {
      const cityList = await db.select({ id: cities.id, name: cities.name, province: cities.province })
        .from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
      return {
        sources: [
          { value: 'szfdc',    label: '深圳住建局', desc: '官方预售许可数据，楼盘/楼栋/房屋三级结构，数据权威', recommended: true, dataType: 'estate_info' },
          { value: 'fang',     label: '房天下',     desc: '全国楼盘基础信息，覆盖广，含开发商/均价/容积率等', recommended: true, dataType: 'estate_info' },
          { value: 'lianjia',  label: '链家',       desc: '链家楼盘信息，含户型/物业/建成年份等', recommended: false, dataType: 'estate_info' },
          { value: 'anjuke',   label: '安居客',     desc: '安居客楼盘信息，含地图坐标/评分/配套设施', recommended: false, dataType: 'estate_info' },
        ],
        fields: [
          { key: 'name',        label: '楼盘名称',   required: true },
          { key: 'address',     label: '详细地址',   required: true },
          { key: 'district',    label: '所属区域',   required: true },
          { key: 'developer',   label: '开发商',     required: false },
          { key: 'avgPrice',    label: '参考均价',   required: false },
          { key: 'buildYear',   label: '建成年份',   required: false },
          { key: 'plotRatio',   label: '容积率',     required: false },
          { key: 'greenRate',   label: '绿化率',     required: false },
          { key: 'totalUnits',  label: '总套数',     required: false },
          { key: 'propertyType', label: '物业类型',  required: false },
        ],
        cities: cityList,
        dedupeRule: '以楼盘名称为去重标准，同城市同名楼盘不重复入库',
      };
    }),

  /** 获取案例交易报盘采集配置（可用数据源、城市、字段说明） */
  getCaseListingConfig: protectedProcedure
    .query(async () => {
      const cityList = await db.select({ id: cities.id, name: cities.name, province: cities.province })
        .from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
      return {
        sources: [
          { value: 'lianjia',  label: '链家',   desc: '链家成交案例，数据真实，含成交价/成交周期/挂牌价', recommended: true, dataType: 'sold_cases' },
          { value: 'beike',    label: '贝壳',   desc: '贝壳成交数据，覆盖更广，含装修/楼层/朝向等', recommended: true, dataType: 'sold_cases' },
          { value: 'anjuke',   label: '安居客', desc: '安居客在售报盘，含挂牌价/带看量/关注度', recommended: true, dataType: 'listing' },
          { value: 'leyoujia', label: '乐有家', desc: '深圳本地平台，深圳数据质量高，含核验价', recommended: true, dataType: 'listing' },
          { value: 'fang',     label: '房天下', desc: '房天下二手房报盘，全国覆盖广', recommended: false, dataType: 'listing' },
        ],
        dataTypes: [
          { value: 'sold_cases', label: '成交案例', desc: '已成交的真实交易记录，用于估价模型训练' },
          { value: 'listing',    label: '在售报盘', desc: '当前在售房源，用于市场行情分析' },
        ],
        fields: [
          { key: 'title',       label: '房源标题',   required: true },
          { key: 'community',   label: '小区名称',   required: true },
          { key: 'area',        label: '建筑面积',   required: true },
          { key: 'totalPrice',  label: '总价（万）', required: true },
          { key: 'unitPrice',   label: '单价（元/㎡）', required: true },
          { key: 'floor',       label: '楼层',       required: false },
          { key: 'rooms',       label: '户型',       required: false },
          { key: 'orientation', label: '朝向',       required: false },
          { key: 'decoration',  label: '装修',       required: false },
          { key: 'buildYear',   label: '建成年份',   required: false },
          { key: 'dealDate',    label: '成交日期',   required: false },
          { key: 'dealCycle',   label: '成交周期',   required: false },
          { key: 'listingPrice', label: '挂牌价',    required: false },
        ],
        cities: cityList,
        dedupeRule: '以来源平台+房源ID为主键去重，无ID时以小区名+面积+成交日期组合去重',
      };
    }),

  /** 查询 Scrapling 微服务引擎状态 */
  getScraplingStatus: protectedProcedure
    .query(async () => {
      const available = await checkScraplingHealth();
      if (!available) {
        return { available: false, running_jobs: [], count: 0 };
      }
      try {
        const { scraplingRunningJobs } = await import('../crawler/engines/scrapling-client');
        const data = await scraplingRunningJobs();
        return { available: true, ...data };
      } catch {
        return { available: true, running_jobs: [], count: 0 };
      }
    }),

  /** 按类型统计采集任务 */
  getJobStatsByType: protectedProcedure
    .query(async () => {
      const estateJobs = await db.select({ count: count() }).from(crawlJobs)
        .where(eq(crawlJobs.dataType, 'estate_info'));
      const listingJobs = await db.select({ count: count() }).from(crawlJobs)
        .where(eq(crawlJobs.dataType, 'listing'));
      const soldJobs = await db.select({ count: count() }).from(crawlJobs)
        .where(eq(crawlJobs.dataType, 'sold_cases'));
      const runningJobs = await db.select({ count: count() }).from(crawlJobs)
        .where(eq(crawlJobs.status, 'running'));
      const totalCases = await db.select({ count: count() }).from(cases);
      return {
        estateInfoJobs: estateJobs[0]?.count ?? 0,
        listingJobs: listingJobs[0]?.count ?? 0,
        soldCasesJobs: soldJobs[0]?.count ?? 0,
        runningJobs: runningJobs[0]?.count ?? 0,
        totalCases: totalCases[0]?.count ?? 0,
      };
    }),
});
