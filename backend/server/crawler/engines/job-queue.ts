/**
 * BullMQ 任务队列调度器
 * 使用 Redis 作为消息队列，管理爬虫任务的分发和执行
 */
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { db } from '../../lib/db';
import { crawlJobs } from '../../lib/schema';
import { eq } from 'drizzle-orm';
import { executeCrawlJob } from './crawler-controller';
import { writeLog } from '../utils/helpers';

// Redis 连接配置（使用原始配置对象，避免 ioredis 版本冲突）
const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
};

// 任务队列名称
const QUEUE_NAME = 'crawl-jobs';

// 创建队列实例
export const crawlQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// 队列事件监听
export const crawlQueueEvents = new QueueEvents(QUEUE_NAME, {
  connection: { ...redisConnection },
});

// Worker 实例（全局）
let crawlWorker: Worker | null = null;

/** 启动 Worker 进程 */
export function startCrawlWorker(concurrency = 3): Worker {
  if (crawlWorker) return crawlWorker;

  crawlWorker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { jobId } = job.data;
      console.log(`[Worker] 开始执行采集任务 #${jobId}`);
      await executeCrawlJob(jobId);
      console.log(`[Worker] 采集任务 #${jobId} 执行完成`);
    },
    {
      connection: { ...redisConnection },
      concurrency,
    }
  );

  crawlWorker.on('completed', async (job) => {
    console.log(`[Worker] 任务 ${job.id} 完成`);
  });

  crawlWorker.on('failed', async (job, err) => {
    console.error(`[Worker] 任务 ${job?.id} 失败:`, err.message);
    if (job?.data?.jobId) {
      await (db.update(crawlJobs) as any).set({
        status: 'failed',
        errorMessage: err.message,
        completedAt: new Date(),
      }).where(eq(crawlJobs.id, job.data.jobId));
      await writeLog(job.data.jobId, 'error', `Worker 执行失败: ${err.message}`);
    }
  });

  crawlWorker.on('error', (err) => {
    console.error('[Worker] 错误:', err);
  });

  console.log('[Worker] 采集 Worker 已启动，并发数:', concurrency);
  return crawlWorker;
}

/** 将任务加入队列 */
export async function enqueueJob(jobId: number, priority = 0): Promise<string> {
  const job = await crawlQueue.add(
    `crawl-${jobId}`,
    { jobId },
    {
      priority,
      jobId: `crawl-job-${jobId}`,
    }
  );
  console.log(`[Queue] 任务 #${jobId} 已加入队列，队列 ID: ${job.id}`);
  return job.id ?? '';
}

/** 暂停任务 */
export async function pauseJob(jobId: number): Promise<void> {
  const job = await crawlQueue.getJob(`crawl-job-${jobId}`);
  if (job) {
    await job.remove();
  }
  await (db.update(crawlJobs) as any).set({ status: 'paused' }).where(eq(crawlJobs.id, jobId));
}

/** 获取队列统计信息 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    crawlQueue.getWaitingCount(),
    crawlQueue.getActiveCount(),
    crawlQueue.getCompletedCount(),
    crawlQueue.getFailedCount(),
    crawlQueue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed };
}

/** 停止 Worker */
export async function stopCrawlWorker(): Promise<void> {
  if (crawlWorker) {
    await crawlWorker.close();
    crawlWorker = null;
    console.log('[Worker] 采集 Worker 已停止');
  }
}
