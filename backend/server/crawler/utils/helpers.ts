import { db } from '../../lib/db';
import { crawlLogs, type InsertCrawlLog } from '../../lib/schema';

/** 随机延迟 */
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/** 写入采集日志到数据库 */
export async function writeLog(
  jobId: number,
  level: 'info' | 'warn' | 'error' | 'success',
  message: string,
  url?: string,
  dataCount?: number
) {
  try {
    await db.insert(crawlLogs).values({ jobId, level, message, url, dataCount: dataCount ?? 0 } as InsertCrawlLog);
  } catch (e) {
    console.error('[CrawlLog] 写入日志失败:', e);
  }
}

/** 常用 User-Agent 池 */
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

export function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/** 解析价格字符串为数字（元）
 *  支持：'150万', '1500000', '15000元/㎡', '150.5万'
 */
export function parsePrice(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[,，\s]/g, '');
  const wanMatch = cleaned.match(/([\d.]+)\s*万/);
  if (wanMatch) return Math.round(parseFloat(wanMatch[1]) * 10000);
  const numMatch = cleaned.match(/([\d.]+)/);
  if (numMatch) return Math.round(parseFloat(numMatch[1]));
  return 0;
}

/** 解析面积字符串为数字（㎡）*/
export function parseArea(str: string): number {
  if (!str) return 0;
  const match = str.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/** 解析楼层字符串 */
export function parseFloor(str: string): { floor: number; totalFloor: number } {
  if (!str) return { floor: 0, totalFloor: 0 };
  // 格式：'15层/共32层' 或 '高楼层/32层' 或 '15/32'
  const match = str.match(/(\d+)\s*[层\/]\s*(?:共\s*)?(\d+)/);
  if (match) return { floor: parseInt(match[1]), totalFloor: parseInt(match[2]) };
  const totalMatch = str.match(/共\s*(\d+)\s*层/);
  if (totalMatch) return { floor: 0, totalFloor: parseInt(totalMatch[1]) };
  return { floor: 0, totalFloor: 0 };
}

/** 标准化房屋朝向 */
export function normalizeOrientation(str: string): string {
  if (!str) return '';
  if (str.includes('南北')) return '南北';
  if (str.includes('东西')) return '东西';
  if (str.includes('南')) return '南';
  if (str.includes('北')) return '北';
  if (str.includes('东')) return '东';
  if (str.includes('西')) return '西';
  return str.trim();
}

/** 标准化装修情况 */
export function normalizeDecoration(str: string): string {
  if (!str) return '';
  if (str.includes('精装') || str.includes('豪装')) return '精装';
  if (str.includes('简装') || str.includes('中等')) return '简装';
  if (str.includes('毛坯')) return '毛坯';
  if (str.includes('其他')) return '其他';
  return str.trim();
}
