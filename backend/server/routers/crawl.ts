/**
 * 数据采集任务 tRPC 路由
 * 提供任务 CRUD、启动/暂停、日志查询、数据预览等接口
 */
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../lib/trpc';
import { db } from '../lib/db';
import { crawlJobs, crawlLogs, crawlRawData, cities, cases } from '../lib/schema';
import { eq, desc, and, gte, count, sql } from 'drizzle-orm';
import { enqueueJob, pauseJob, getQueueStats } from '../crawler/engines/job-queue';

// 创建任务的输入验证
const CreateJobSchema = z.object({
  name: z.string().min(1, '任务名称不能为空'),
  source: z.enum(['lianjia', 'beike', 'anjuke', 'fang58', 'custom']),
  dataType: z.enum(['sold_cases', 'listing', 'estate_info']),
  cityId: z.number().optional(),
  cityName: z.string().optional(),
  districtName: z.string().optional(),
  keyword: z.string().optional(),
  maxPages: z.number().min(1).max(100).default(5),
  concurrency: z.number().min(1).max(5).default(2),
  delayMin: z.number().default(2000),
  delayMax: z.number().default(5000),
  useProxy: z.boolean().default(false),
  scheduleType: z.enum(['manual', 'cron']).default('manual'),
  cronExpression: z.string().optional(),
});

export const crawlRouter = router({
  // 获取任务列表
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
        db.select().from(crawlJobs)
          .where(where)
          .orderBy(desc(crawlJobs.createdAt))
          .limit(pageSize)
          .offset(offset),
        db.select({ count: count() }).from(crawlJobs).where(where),
      ]);

      return {
        jobs,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  // 获取任务详情
  getJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, input.id)).limit(1);
      if (!job) throw new Error('任务不存在');
      return job;
    }),

  // 创建任务
  createJob: protectedProcedure
    .input(CreateJobSchema)
    .mutation(async ({ input, ctx }) => {
      // 如果传了 cityId 但没有 cityName，自动从数据库查询
      let cityName = input.cityName;
      if (!cityName && input.cityId) {
        const [city] = await db.select({ name: cities.name })
          .from(cities)
          .where(eq(cities.id, input.cityId))
          .limit(1);
        cityName = city?.name;
      }

      const [job] = await (db.insert(crawlJobs) as any).values({
        ...input,
        cityName,
        createdBy: ctx.user.id,
        status: 'pending',
      }).$returningId();

      return { id: job.id, name: input.name, cityName, status: 'pending', cityId: input.cityId, message: '任务创建成功' };
    }),

  // 启动任务
  startJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, input.id)).limit(1);
      if (!job) throw new Error('任务不存在');
      if (job.status === 'running') throw new Error('任务已在运行中');

      await db.update(crawlJobs).set({ status: 'pending' }).where(eq(crawlJobs.id, input.id));
      const queueId = await enqueueJob(input.id);

      return { message: '任务已加入队列', queueId };
    }),

  // 暂停/取消任务
  pauseJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await pauseJob(input.id);
      return { message: '任务已暂停' };
    }),

  // 删除任务
  deleteJob: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(crawlLogs).where(eq(crawlLogs.jobId, input.id));
      await db.delete(crawlRawData).where(eq(crawlRawData.jobId, input.id));
      await db.delete(crawlJobs).where(eq(crawlJobs.id, input.id));
      return { message: '任务已删除' };
    }),

  // 获取任务日志
  getJobLogs: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      limit: z.number().default(100),
      level: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { jobId, limit, level } = input;
      const where = level
        ? and(eq(crawlLogs.jobId, jobId), eq(crawlLogs.level, level as any))
        : eq(crawlLogs.jobId, jobId);

      const logs = await db.select().from(crawlLogs)
        .where(where)
        .orderBy(desc(crawlLogs.createdAt))
        .limit(limit);

      return logs.reverse(); // 按时间正序返回
    }),

  // 获取采集数据预览
  getJobData: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { jobId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const [rawData, totalResult] = await Promise.all([
        db.select().from(crawlRawData)
          .where(eq(crawlRawData.jobId, jobId))
          .orderBy(desc(crawlRawData.createdAt))
          .limit(pageSize)
          .offset(offset),
        db.select({ count: count() }).from(crawlRawData).where(eq(crawlRawData.jobId, jobId)),
      ]);

      return {
        data: rawData.map(r => ({
          ...r,
          parsedData: r.parsedData ? JSON.parse(r.parsedData) : null,
        })),
        total: totalResult[0]?.count ?? 0,
      };
    }),

  // 获取队列统计
  getQueueStats: protectedProcedure
    .query(async () => {
      try {
        return await getQueueStats();
      } catch (e) {
        return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
      }
    }),

  // 获取采集数据统计（用于仪表盘）
  getStats: protectedProcedure
    .query(async () => {
      const [totalJobs, runningJobs, totalCases, recentCases] = await Promise.all([
        db.select({ count: count() }).from(crawlJobs),
        db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'running')),
        db.select({ count: count() }).from(cases),
        db.select({ count: count() }).from(cases)
          .where(gte(cases.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))),
      ]);

      // 各来源数据量统计
      const sourceStats = await db.select({
        source: sql<string>`COALESCE(source, 'unknown')`,
        count: count(),
      }).from(cases).groupBy(sql`source`);

      return {
        totalJobs: totalJobs[0]?.count ?? 0,
        runningJobs: runningJobs[0]?.count ?? 0,
        totalCases: totalCases[0]?.count ?? 0,
        recentCases: recentCases[0]?.count ?? 0,
        sourceStats,
      };
    }),

  // 获取城市列表（用于任务配置）
  getCities: protectedProcedure
    .query(async () => {
      return db.select({ id: cities.id, name: cities.name, province: cities.province })
        .from(cities)
        .where(eq(cities.isActive, true))
        .orderBy(cities.name);
    }),
});
