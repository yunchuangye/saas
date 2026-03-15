/**
 * 数据采集控制器 v2.0
 * 两大类采集任务统一调度：
 *   1. 楼盘基础信息（estate_info）：采集楼盘/楼栋/房屋三级结构，写入 estates/buildings/units
 *   2. 案例交易报盘（case_listing / sold_cases）：采集各平台二手房报盘/成交数据，写入 cases
 */
import { db } from '../../lib/db';
import { crawlJobs, crawlLogs, crawlRawData } from '../../lib/schema';
import { eq } from 'drizzle-orm';
import { crawlPages } from './playwright-engine';
import { fetchPages } from './http-engine';
import { writeLog } from '../utils/helpers';

// ── 楼盘基础信息采集器 ──────────────────────────────────────────────────────────
import {
  generateEstateInfoUrls,
  parseFangEstateList,
  parseLianjiaEstateList,
  parseAnjukeEstateList,
  importEstatesToDB,
} from '../parsers/estate-info-crawler';

// ── 案例交易报盘采集器 ──────────────────────────────────────────────────────────
import {
  generateCaseListingUrls,
  parseLianjiaCaseList,
  parseAnjukeCaseList,
  parseLeyoujiaCaseList,
  parseFangCaseList,
  importCasesToDB,
} from '../parsers/case-listing-crawler';

// ─── 执行楼盘基础信息采集任务 ─────────────────────────────────────────────────

async function executeEstateInfoJob(jobId: number): Promise<void> {
  const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);
  if (!job) throw new Error(`任务 ${jobId} 不存在`);

  await writeLog(jobId, 'info', `[楼盘基础信息] 开始采集 | 城市：${job.cityName} | 来源：${job.source} | 计划 ${job.maxPages} 页`);

  const urls = generateEstateInfoUrls(
    job.cityName ?? '深圳',
    job.districtName ?? '',
    job.maxPages ?? 10,
    job.source,
  );

  await writeLog(jobId, 'info', `生成 ${urls.length} 个采集 URL`);
  await (db.update(crawlJobs) as any).set({ totalCount: urls.length * 30 }).where(eq(crawlJobs.id, jobId));

  let totalSuccess = 0;
  let totalFail = 0;
  let totalDuplicate = 0;
  let totalBuildings = 0;
  let totalUnits = 0;
  let processedPages = 0;

  const handlePage = async (_done: number, _total: number, result: { html: string; url: string; error?: string }) => {
    processedPages++;
    const progress = Math.round((processedPages / urls.length) * 100);

    if (result.error) {
      totalFail++;
      await writeLog(jobId, 'error', `页面采集失败: ${result.error}`, result.url);
    } else if (result.html) {
      let parsedEstates: ReturnType<typeof parseFangEstateList> = [];

      if (job.source === 'fang') {
        parsedEstates = parseFangEstateList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url);
      } else if (job.source === 'lianjia' || job.source === 'beike') {
        parsedEstates = parseLianjiaEstateList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url, job.source as 'lianjia' | 'beike');
      } else if (job.source === 'anjuke') {
        parsedEstates = parseAnjukeEstateList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url);
      }

      if (parsedEstates.length > 0) {
        // 保存原始数据
        await (db.insert(crawlRawData) as any).values({
          jobId,
          source: job.source,
          dataType: 'estate_info',
          rawData: JSON.stringify({ url: result.url, htmlLength: result.html.length }),
          parsedData: JSON.stringify(parsedEstates),
          status: 'parsed',
        });

        const { success, duplicate, buildingCount, unitCount } = await importEstatesToDB(parsedEstates, jobId);
        totalSuccess += success;
        totalDuplicate += duplicate;
        totalBuildings += buildingCount;
        totalUnits += unitCount;
        await writeLog(jobId, 'success',
          `页面解析完成：新增楼盘 ${success} 个，重复 ${duplicate} 个，楼栋 ${buildingCount} 个，房屋 ${unitCount} 套`,
          result.url, success);
      } else {
        await writeLog(jobId, 'warn', `页面解析结果为空（可能触发反爬或页面结构变化）`, result.url);
      }
    }

    await (db.update(crawlJobs) as any).set({
      progress,
      successCount: totalSuccess,
      failCount: totalFail,
      duplicateCount: totalDuplicate,
    }).where(eq(crawlJobs.id, jobId));
  };

  // 安居客使用 HTTP 引擎，其他使用 Playwright
  if (job.source === 'anjuke') {
    await fetchPages(urls, job.concurrency ?? 2, job.delayMin ?? 2000, job.delayMax ?? 5000, handlePage);
  } else {
    await crawlPages(
      urls,
      { waitForSelector: '.list_li, .xiaoquListItem, .house-item', waitMs: 3000, scrollToBottom: true, timeout: 30000 },
      job.concurrency ?? 2,
      job.delayMin ?? 2000,
      job.delayMax ?? 5000,
      handlePage,
    );
  }

  await writeLog(jobId, 'success',
    `[楼盘基础信息] 任务完成！新增楼盘 ${totalSuccess} 个，重复 ${totalDuplicate} 个，楼栋 ${totalBuildings} 个，房屋 ${totalUnits} 套`);
}

// ─── 执行案例交易报盘采集任务 ─────────────────────────────────────────────────

async function executeCaseListingJob(jobId: number): Promise<void> {
  const [job] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);
  if (!job) throw new Error(`任务 ${jobId} 不存在`);

  const dataType = (job.dataType === 'sold_cases' ? 'sold_cases' : 'listing') as 'sold_cases' | 'listing';
  const typeLabel = dataType === 'sold_cases' ? '成交案例' : '在售报盘';

  await writeLog(jobId, 'info', `[案例报盘] 开始采集 ${typeLabel} | 城市：${job.cityName} | 来源：${job.source} | 计划 ${job.maxPages} 页`);

  const urls = generateCaseListingUrls(
    job.cityName ?? '深圳',
    job.districtName ?? '',
    job.maxPages ?? 10,
    job.source,
    dataType,
  );

  await writeLog(jobId, 'info', `生成 ${urls.length} 个采集 URL`);
  await (db.update(crawlJobs) as any).set({ totalCount: urls.length * 30 }).where(eq(crawlJobs.id, jobId));

  let totalSuccess = 0;
  let totalFail = 0;
  let totalDuplicate = 0;
  let processedPages = 0;

  const handlePage = async (_done: number, _total: number, result: { html: string; url: string; error?: string }) => {
    processedPages++;
    const progress = Math.round((processedPages / urls.length) * 100);

    if (result.error) {
      totalFail++;
      await writeLog(jobId, 'error', `页面采集失败: ${result.error}`, result.url);
    } else if (result.html) {
      let parsedCases: ReturnType<typeof parseLianjiaCaseList> = [];

      if (job.source === 'lianjia') {
        parsedCases = parseLianjiaCaseList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url, 'lianjia', dataType);
      } else if (job.source === 'beike') {
        parsedCases = parseLianjiaCaseList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url, 'beike', dataType);
      } else if (job.source === 'anjuke') {
        parsedCases = parseAnjukeCaseList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url);
      } else if (job.source === 'leyoujia') {
        parsedCases = parseLeyoujiaCaseList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url);
      } else if (job.source === 'fang') {
        parsedCases = parseFangCaseList(result.html, job.cityName ?? '', job.cityId ?? 6, result.url);
      }

      if (parsedCases.length > 0) {
        await (db.insert(crawlRawData) as any).values({
          jobId,
          source: job.source,
          dataType: job.dataType,
          rawData: JSON.stringify({ url: result.url, htmlLength: result.html.length }),
          parsedData: JSON.stringify(parsedCases),
          status: 'parsed',
        });

        const { success, duplicate } = await importCasesToDB(parsedCases, jobId, job.cityId ?? undefined);
        totalSuccess += success;
        totalDuplicate += duplicate;
        await writeLog(jobId, 'success',
          `页面解析完成：新增 ${typeLabel} ${success} 条，重复 ${duplicate} 条`,
          result.url, success);
      } else {
        await writeLog(jobId, 'warn', `页面解析结果为空（可能触发反爬或页面结构变化）`, result.url);
      }
    }

    await (db.update(crawlJobs) as any).set({
      progress,
      successCount: totalSuccess,
      failCount: totalFail,
      duplicateCount: totalDuplicate,
    }).where(eq(crawlJobs.id, jobId));
  };

  // 安居客和乐有家使用 HTTP 引擎，其他使用 Playwright
  if (job.source === 'anjuke' || job.source === 'leyoujia') {
    await fetchPages(urls, job.concurrency ?? 2, job.delayMin ?? 2000, job.delayMax ?? 5000, handlePage);
  } else {
    await crawlPages(
      urls,
      {
        waitForSelector: '.listContent, .list-wrap, .LOGCLICKDATA, .house-item, .list_dl',
        waitMs: 3000,
        scrollToBottom: true,
        timeout: 30000,
      },
      job.concurrency ?? 2,
      job.delayMin ?? 2000,
      job.delayMax ?? 5000,
      handlePage,
    );
  }

  await writeLog(jobId, 'success',
    `[案例报盘] 任务完成！新增 ${typeLabel} ${totalSuccess} 条，重复 ${totalDuplicate} 条，${totalFail} 个页面失败`);
}

// ─── 主执行入口 ───────────────────────────────────────────────────────────────

/** 执行采集任务（统一入口，根据 dataType 分发） */
export async function executeCrawlJob(jobId: number): Promise<void> {
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

  try {
    if (job.dataType === 'estate_info') {
      // 楼盘基础信息采集
      await executeEstateInfoJob(jobId);
    } else {
      // 案例交易报盘采集（listing / sold_cases）
      await executeCaseListingJob(jobId);
    }

    // 任务完成
    const [finalJob] = await db.select().from(crawlJobs).where(eq(crawlJobs.id, jobId)).limit(1);
    await (db.update(crawlJobs) as any).set({
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
    }).where(eq(crawlJobs.id, jobId));

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
