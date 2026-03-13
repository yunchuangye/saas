/**
 * 定时采集调度器
 * 基于 node-cron 实现，支持每个任务独立的 cron 表达式
 */
import cron from 'node-cron';
import { db } from '../../lib/db';
import { crawlJobs, crawlAlerts, crawlScheduleHistory } from '../../lib/schema';
import { eq, and } from 'drizzle-orm';
import { enqueueJob } from './job-queue';

// 活跃的定时任务 Map<jobId, ScheduledTask>
const scheduledTasks = new Map<number, cron.ScheduledTask>();

/**
 * 为指定 crawlJob 注册定时调度
 */
export async function registerJobSchedule(jobId: number): Promise<void> {
  const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);
  if (!job || job.scheduleType !== 'cron' || !job.cronExpression) return;

  // 先取消旧的调度
  unregisterJobSchedule(jobId);

  if (!cron.validate(job.cronExpression)) {
    console.warn(`[Cron] 任务 #${jobId} 的 cron 表达式无效: ${job.cronExpression}`);
    return;
  }

  const task = cron.schedule(job.cronExpression, async () => {
    console.log(`[Cron] 触发定时采集任务 #${jobId}: ${job.name}`);
    const startedAt = new Date();

    try {
      // 如果任务已在运行，跳过本次
      const [currentJob] = await db.select({ status: crawlJobs.status })
        .from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);

      if (currentJob?.status === 'running') {
        console.log(`[Cron] 任务 #${jobId} 正在运行中，跳过本次调度`);
        await (db.insert(crawlScheduleHistory) as any).values({
          jobId,
          triggeredBy: 'cron',
          status: 'skipped',
          startedAt,
          completedAt: new Date(),
        });
        return;
      }

      await enqueueJob(jobId);

      // 记录执行历史
      await (db.insert(crawlScheduleHistory) as any).values({
        jobId,
        triggeredBy: 'cron',
        status: 'success',
        startedAt,
        completedAt: new Date(),
      });

    } catch (error: any) {
      console.error(`[Cron] 任务 #${jobId} 调度失败:`, error.message);

      // 记录失败历史
      await (db.insert(crawlScheduleHistory) as any).values({
        jobId,
        triggeredBy: 'cron',
        status: 'failed',
        errorMessage: error.message,
        startedAt,
        completedAt: new Date(),
      });

      // 写入告警
      await (db.insert(crawlAlerts) as any).values({
        jobId,
        level: 'error',
        type: 'schedule_failed',
        title: `定时任务调度失败`,
        message: `任务 #${jobId} "${job.name}" 定时调度失败：${error.message}`,
      });
    }
  }, { timezone: 'Asia/Shanghai' });

  scheduledTasks.set(jobId, task);
  console.log(`[Cron] 已注册任务 #${jobId} 调度: ${job.cronExpression}`);
}

/**
 * 取消指定任务的定时调度
 */
export function unregisterJobSchedule(jobId: number): void {
  const task = scheduledTasks.get(jobId);
  if (task) {
    task.stop();
    scheduledTasks.delete(jobId);
    console.log(`[Cron] 已取消任务 #${jobId} 的定时调度`);
  }
}

/**
 * 启动时加载所有已配置 cron 的任务
 */
export async function initCronScheduler(): Promise<void> {
  console.log('[Cron] 初始化定时调度器...');
  const jobs = await db.select().from(crawlJobs)
    .where(and(eq(crawlJobs.scheduleType, 'cron')));

  let registered = 0;
  for (const job of jobs) {
    if (job.cronExpression && cron.validate(job.cronExpression)) {
      await registerJobSchedule(job.id);
      registered++;
    }
  }
  console.log(`[Cron] 定时调度器启动完成，已注册 ${registered} 个定时任务`);
}

/**
 * 获取所有已注册的定时任务状态
 */
export function getScheduledTasksStatus(): Array<{ jobId: number; active: boolean }> {
  return Array.from(scheduledTasks.entries()).map(([jobId, task]) => ({
    jobId,
    active: true,
  }));
}

/**
 * 解析 cron 表达式，返回下次执行时间描述
 */
export function getCronDescription(expression: string): string {
  const presets: Record<string, string> = {
    '0 2 * * *': '每天凌晨 2:00',
    '0 3 * * *': '每天凌晨 3:00',
    '0 6 * * *': '每天早上 6:00',
    '0 8 * * *': '每天早上 8:00',
    '0 */6 * * *': '每6小时一次',
    '0 */12 * * *': '每12小时一次',
    '0 2 * * 1': '每周一凌晨 2:00',
    '0 2 1 * *': '每月1日凌晨 2:00',
    '*/30 * * * *': '每30分钟一次',
  };
  return presets[expression] || `Cron: ${expression}`;
}
