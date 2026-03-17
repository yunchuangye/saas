/**
 * Scrapling 微服务客户端
 * Node.js 后端通过 HTTP 调用 Python Scrapling 微服务（端口 8722）
 */
import axios from 'axios';

const SCRAPLING_BASE_URL = process.env.SCRAPLING_SERVICE_URL ?? 'http://localhost:8722';
const SCRAPLING_TIMEOUT = 10_000; // 10 秒超时（仅用于控制接口，非采集超时）

const client = axios.create({
  baseURL: SCRAPLING_BASE_URL,
  timeout: SCRAPLING_TIMEOUT,
});

/** 检查 Scrapling 微服务是否可用 */
export async function checkScraplingHealth(): Promise<boolean> {
  try {
    const res = await client.get('/health');
    return res.data?.status === 'ok';
  } catch {
    return false;
  }
}

/** 启动采集任务（委托给 Scrapling 微服务执行） */
export async function scraplingStartJob(jobId: number): Promise<{ message: string; thread: string }> {
  const res = await client.post('/job/start', { job_id: jobId });
  return res.data;
}

/** 停止采集任务 */
export async function scraplingStopJob(jobId: number): Promise<{ message: string }> {
  const res = await client.post('/job/stop', { job_id: jobId });
  return res.data;
}

/** 查询任务运行状态 */
export async function scraplingJobStatus(jobId: number): Promise<{
  job_id: number;
  status: string;
  progress: number;
  success_count: number;
  fail_count: number;
  duplicate_count: number;
  is_running_in_thread: boolean;
}> {
  const res = await client.get('/job/status', { params: { job_id: jobId } });
  return res.data;
}

/** 查询所有正在运行的任务 */
export async function scraplingRunningJobs(): Promise<{ running_jobs: any[]; count: number }> {
  const res = await client.get('/jobs/running');
  return res.data;
}

/** 测试解析器（调试用） */
export async function scraplingTestParse(params: {
  html: string;
  source: string;
  data_type: string;
  city_name: string;
  city_id: number;
  url: string;
}): Promise<{ count: number; items: any[] }> {
  const res = await client.post('/test/parse', params, { timeout: 30_000 });
  return res.data;
}
