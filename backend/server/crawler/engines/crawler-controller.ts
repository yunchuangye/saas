/**
 * 数据采集控制器
 * 负责执行具体的采集任务：URL 生成、页面抓取、数据解析、入库
 */
import { db } from '../../lib/db';
import { crawlJobs, crawlLogs, crawlRawData, cases, estates } from '../../lib/schema';
import { eq, and } from 'drizzle-orm';
import { crawlPages } from './playwright-engine';
import { parseLianjiaList, ParsedCase } from '../parsers/lianjia-parser';
import { writeLog, randomDelay } from '../utils/helpers';

// 城市拼音映射（链家 URL 前缀）
const CITY_PINYIN_MAP: Record<string, string> = {
  '北京': 'bj', '上海': 'sh', '广州': 'gz', '深圳': 'sz', '杭州': 'hz',
  '南京': 'nj', '苏州': 'su', '成都': 'cd', '武汉': 'wh', '重庆': 'cq',
  '天津': 'tj', '西安': 'xa', '郑州': 'zz', '长沙': 'cs', '沈阳': 'sy',
  '大连': 'dl', '青岛': 'qd', '济南': 'jn', '宁波': 'nb', '厦门': 'xm',
  '福州': 'fz', '合肥': 'hf', '南昌': 'nc', '昆明': 'km', '贵阳': 'gy',
  '哈尔滨': 'hrb', '长春': 'cc', '石家庄': 'sjz', '太原': 'ty', '南宁': 'nn',
};

/** 生成链家成交案例 URL 列表 */
function generateLianjiaUrls(cityName: string, districtName: string, maxPages: number): string[] {
  const cityCode = CITY_PINYIN_MAP[cityName] ?? 'bj';
  const urls: string[] = [];
  const districtPath = districtName ? `${encodeURIComponent(districtName)}/` : '';

  for (let page = 1; page <= maxPages; page++) {
    const pageStr = page > 1 ? `pg${page}/` : '';
    urls.push(`https://${cityCode}.lianjia.com/chengjiao/${districtPath}${pageStr}`);
  }
  return urls;
}

/** 生成安居客挂牌房源 URL 列表 */
function generateAnjukeUrls(cityName: string, districtName: string, maxPages: number): string[] {
  const cityCode = CITY_PINYIN_MAP[cityName] ?? 'beijing';
  const urls: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    urls.push(`https://${cityCode}.anjuke.com/sale/${districtName ? districtName + '/' : ''}?page=${page}`);
  }
  return urls;
}

/** 将解析后的案例数据入库 */
async function importCasesToDB(parsedCases: ParsedCase[], jobId: number, cityId?: number): Promise<{ success: number; duplicate: number }> {
  let success = 0;
  let duplicate = 0;

  for (const c of parsedCases) {
    try {
      // 检查是否重复（按 source + sourceId 或 address + dealDate + area）
      if (c.sourceId) {
        const existing = await db.select({ id: cases.id })
          .from(cases)
          .where(and(eq(cases.source as any, c.source), eq(cases.sourceId as any, c.sourceId)))
          .limit(1);
        if (existing.length > 0) {
          duplicate++;
          continue;
        }
      }

      // 尝试匹配楼盘
      let estateId: number | null = null;
      if (c.community && cityId) {
        const estateMatch = await db.select({ id: estates.id })
          .from(estates)
          .where(eq(estates.cityId, cityId))
          .limit(1);
        if (estateMatch.length > 0) estateId = estateMatch[0].id;
      }

      // 插入成交案例
      await db.insert(cases).values({
        estateId: estateId ?? undefined,
        cityId: cityId ?? undefined,
        address: c.address || c.community,
        community: c.community,
        totalPrice: c.totalPrice,
        unitPrice: c.unitPrice,
        area: c.area.toString(),
        rooms: c.rooms,
        floor: c.floor,
        totalFloor: c.totalFloor,
        orientation: c.orientation,
        decoration: c.decoration,
        buildYear: c.buildYear || undefined,
        dealDate: c.dealDate ? new Date(c.dealDate) : undefined,
        source: c.source,
        sourceId: c.sourceId,
        sourceUrl: c.sourceUrl,
        isVerified: false,
      } as any);

      success++;
    } catch (e: any) {
      // 忽略重复键错误
      if (e.message?.includes('Duplicate')) {
        duplicate++;
      }
    }
  }

  return { success, duplicate };
}

/** 执行采集任务主函数 */
export async function executeCrawlJob(jobId: number): Promise<void> {
  // 获取任务配置
  const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);
  if (!job) throw new Error(`任务 ${jobId} 不存在`);

  // 更新状态为运行中
  await (db.update(crawlJobs) as any).set({
    status: 'running',
    startedAt: new Date(),
    progress: 0,
    successCount: 0,
    failCount: 0,
    duplicateCount: 0,
  }).where(eq(crawlJobs.id, jobId));

  await writeLog(jobId, 'info', `任务开始：${job.name}，来源：${job.source}，城市：${job.cityName}`);

  try {
    // 生成目标 URL 列表
    let urls: string[] = [];
    if (job.source === 'lianjia' || job.source === 'beike') {
      urls = generateLianjiaUrls(job.cityName ?? '北京', job.districtName ?? '', job.maxPages ?? 10);
    } else if (job.source === 'anjuke') {
      urls = generateAnjukeUrls(job.cityName ?? '北京', job.districtName ?? '', job.maxPages ?? 10);
    } else if (job.source === 'custom' && job.keyword) {
      urls = [job.keyword]; // 自定义 URL
    }

    await writeLog(jobId, 'info', `生成 ${urls.length} 个采集 URL`);
    await (db.update(crawlJobs) as any).set({ totalCount: urls.length * 20 }).where(eq(crawlJobs.id, jobId)); // 预估每页20条

    let totalSuccess = 0;
    let totalFail = 0;
    let totalDuplicate = 0;
    let processedPages = 0;

    // 批量采集
    await crawlPages(
      urls,
      {
        waitForSelector: '.listContent, .list-wrap, .property-list',
        waitMs: 3000,
        scrollToBottom: true,
        timeout: 30000,
      },
      job.concurrency ?? 2,
      job.delayMin ?? 2000,
      job.delayMax ?? 5000,
      async (done, total, result) => {
        processedPages++;
        const progress = Math.round((processedPages / urls.length) * 100);

        if (result.error) {
          totalFail++;
          await writeLog(jobId, 'error', `页面采集失败: ${result.error}`, result.url);
        } else if (result.html) {
          // 解析数据
          let parsedCases: ParsedCase[] = [];
          if (job.source === 'lianjia' || job.source === 'beike') {
            parsedCases = parseLianjiaList(result.html, job.cityName ?? '', result.url);
          }

          // 保存原始数据
          if (parsedCases.length > 0 || result.html.length > 1000) {
            await (db.insert(crawlRawData) as any).values({
              jobId,
              source: job.source,
              dataType: job.dataType,
              rawData: JSON.stringify({ url: result.url, htmlLength: result.html.length }),
              parsedData: JSON.stringify(parsedCases),
              status: 'parsed',
            });
          }

          // 入库
          if (parsedCases.length > 0) {
            const { success, duplicate } = await importCasesToDB(parsedCases, jobId, job.cityId ?? undefined);
            totalSuccess += success;
            totalDuplicate += duplicate;
            await writeLog(jobId, 'success', `页面采集成功：新增 ${success} 条，重复 ${duplicate} 条`, result.url, success);
          } else {
            await writeLog(jobId, 'warn', `页面解析结果为空（可能触发反爬）`, result.url);
          }
        }

        // 更新进度
        await (db.update(crawlJobs) as any).set({
          progress,
          successCount: totalSuccess,
          failCount: totalFail,
          duplicateCount: totalDuplicate,
        }).where(eq(crawlJobs.id, jobId));
      }
    );

    // 任务完成
    await (db.update(crawlJobs) as any).set({
      status: 'completed',
      progress: 100,
      successCount: totalSuccess,
      failCount: totalFail,
      duplicateCount: totalDuplicate,
      completedAt: new Date(),
    }).where(eq(crawlJobs.id, jobId));

    await writeLog(jobId, 'success', `任务完成！共采集 ${totalSuccess} 条有效数据，${totalDuplicate} 条重复，${totalFail} 个页面失败`);

  } catch (error: any) {
    await (db.update(crawlJobs) as any).set({
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date(),
    }).where(eq(crawlJobs.id, jobId));

    await writeLog(jobId, 'error', `任务异常终止: ${error.message}`);
    throw error;
  }
}
