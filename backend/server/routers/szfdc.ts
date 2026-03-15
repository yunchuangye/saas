/**
 * 深圳市住建局（fdc.zjj.sz.gov.cn）房源采集路由
 *
 * 提供以下接口：
 * - szfdc.testConnection      测试与目标网站的连通性
 * - szfdc.probeApiEndpoints   探测目标网站的 API 接口结构
 * - szfdc.startCrawl          启动采集任务（楼盘/楼栋/房屋）
 * - szfdc.getStatus           获取采集状态
 * - szfdc.checkDuplicate      检查楼盘是否已存在（去重预览）
 * - szfdc.importMockData      导入模拟数据（用于测试，不依赖目标网站）
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../lib/trpc';
import { db } from '../lib/db';
import { estates, buildings, units, crawlLogs } from '../lib/schema';
import { eq, like, inArray, count, desc } from 'drizzle-orm';
import {
  crawlSzfdcEstates,
  importEstatesToDB,
  importBuildingsToDB,
  importUnitsToDB,
  parseEstateListResponse,
  parseBuildingListResponse,
  parseUnitListResponse,
  type SzfdcEstate,
  type SzfdcBuilding,
  type SzfdcUnit,
  type SzfdcCrawlOptions,
} from '../crawler/parsers/szfdc-crawler';

// ============================================================
// 采集状态管理（内存）
// ============================================================

interface CrawlStatus {
  running: boolean;
  currentPage: number;
  totalPages: number;
  message: string;
  startedAt?: Date;
  finishedAt?: Date;
  result?: {
    newEstates: number;
    skippedEstates: number;
    newBuildings: number;
    newUnits: number;
    errors: string[];
    estateNames: string[];
  };
}

const crawlStatus: CrawlStatus = {
  running: false,
  currentPage: 0,
  totalPages: 0,
  message: '未开始',
};

// ============================================================
// 路由定义
// ============================================================

export const szfdcRouter = router({

  /**
   * 测试与深圳住建局网站的连通性
   * 使用 Playwright Chromium 访问目标页面，检测是否可达
   */
  testConnection: protectedProcedure
    .mutation(async () => {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
          '--disable-gpu', '--ignore-certificate-errors'],
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ignoreHTTPSErrors: true,
        locale: 'zh-CN',
      });
      const page = await context.newPage();

      const captured: { url: string; status: number; contentType: string }[] = [];
      page.on('response', (res) => {
        captured.push({
          url: res.url(),
          status: res.status(),
          contentType: res.headers()['content-type'] || '',
        });
      });

      let reachable = false;
      let pageTitle = '';
      let errorMsg = '';
      const apiEndpoints: string[] = [];

      try {
        await page.goto(
          'https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk',
          { waitUntil: 'domcontentloaded', timeout: 20000 }
        );
        await page.waitForTimeout(5000);
        pageTitle = await page.title();
        reachable = true;

        // 收集 API 端点
        captured.forEach(r => {
          if (r.contentType.includes('json') || r.url.includes('/api/')) {
            apiEndpoints.push(`${r.status} ${r.url}`);
          }
        });
      } catch (e: any) {
        errorMsg = e.message;
      } finally {
        await context.close();
        await browser.close();
      }

      return {
        reachable,
        pageTitle,
        errorMsg,
        apiEndpoints,
        totalRequests: captured.length,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * 探测目标网站 API 接口结构
   * 访问页面并分析所有 XHR/Fetch 请求，返回发现的 API 端点和数据结构
   */
  probeApiEndpoints: protectedProcedure
    .mutation(async () => {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
          '--disable-gpu', '--ignore-certificate-errors'],
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ignoreHTTPSErrors: true,
        locale: 'zh-CN',
      });
      const page = await context.newPage();

      const endpoints: {
        url: string;
        method: string;
        status: number;
        dataType: string;
        sampleFields: string[];
        recordCount: number;
      }[] = [];

      page.on('response', async (res) => {
        const url = res.url();
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('json') || url.includes('/api/') || url.includes('query') || url.includes('list')) {
          try {
            const text = await res.text();
            if (!text || (!text.startsWith('{') && !text.startsWith('['))) return;
            const data = JSON.parse(text);
            const list = data?.data?.list || data?.list || data?.rows || data?.records || [];
            const sample = Array.isArray(list) && list.length > 0 ? list[0] : null;
            const keys = sample ? Object.keys(sample) : [];
            const keyStr = keys.join(',').toLowerCase();

            let dataType = 'unknown';
            if (keyStr.includes('lpmc') || keyStr.includes('xmmc') || keyStr.includes('projectname')) {
              dataType = 'estate_list';
            } else if (keyStr.includes('ldmc') || keyStr.includes('ldh') || keyStr.includes('buildingname')) {
              dataType = 'building_list';
            } else if (keyStr.includes('fh') || keyStr.includes('fwbh') || keyStr.includes('unitno')) {
              dataType = 'unit_list';
            } else if (keys.length > 0) {
              dataType = 'other';
            }

            endpoints.push({
              url,
              method: res.request().method(),
              status: res.status(),
              dataType,
              sampleFields: keys.slice(0, 20),
              recordCount: Array.isArray(list) ? list.length : 0,
            });
          } catch (_) {}
        }
      });

      try {
        await page.goto(
          'https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk',
          { waitUntil: 'networkidle', timeout: 25000 }
        );
        await page.waitForTimeout(5000);
      } catch (_) {}

      await context.close();
      await browser.close();

      return {
        endpoints,
        summary: {
          total: endpoints.length,
          estateApis: endpoints.filter(e => e.dataType === 'estate_list').length,
          buildingApis: endpoints.filter(e => e.dataType === 'building_list').length,
          unitApis: endpoints.filter(e => e.dataType === 'unit_list').length,
        },
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * 检查楼盘是否已存在（去重预览）
   * 传入楼盘名列表，返回哪些已存在、哪些是新的
   */
  checkDuplicate: protectedProcedure
    .input(z.object({
      estateNames: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const { estateNames } = input;
      if (estateNames.length === 0) return { existing: [], newOnes: [] };

      const existing = await db.select({ id: estates.id, name: estates.name })
        .from(estates)
        .where(inArray(estates.name, estateNames));

      const existingNames = new Set(existing.map(e => e.name));
      const newOnes = estateNames.filter(n => !existingNames.has(n));

      return {
        existing: existing.map(e => ({ id: e.id, name: e.name })),
        newOnes,
        stats: {
          total: estateNames.length,
          existing: existing.length,
          new: newOnes.length,
        },
      };
    }),

  /**
   * 启动深圳住建局采集任务
   * 异步执行，立即返回任务已启动的响应
   */
  startCrawl: adminProcedure
    .input(z.object({
      maxPages: z.number().min(1).max(100).default(10),
      fetchBuildings: z.boolean().default(true),
      fetchUnits: z.boolean().default(false),
      waitMs: z.number().min(1000).max(10000).default(3000),
    }))
    .mutation(async ({ input }) => {
      if (crawlStatus.running) {
        return { success: false, message: '采集任务正在运行中，请等待完成后再启动' };
      }

      // 重置状态
      crawlStatus.running = true;
      crawlStatus.currentPage = 0;
      crawlStatus.totalPages = input.maxPages;
      crawlStatus.message = '正在初始化采集器...';
      crawlStatus.startedAt = new Date();
      crawlStatus.finishedAt = undefined;
      crawlStatus.result = undefined;

      // 异步执行采集
      const options: SzfdcCrawlOptions = {
        maxPages: input.maxPages,
        fetchBuildings: input.fetchBuildings,
        fetchUnits: input.fetchUnits,
        waitMs: input.waitMs,
        onProgress: (page, total, msg) => {
          crawlStatus.currentPage = page;
          crawlStatus.totalPages = total;
          crawlStatus.message = msg;
        },
      };

      crawlSzfdcEstates(options)
        .then(result => {
          crawlStatus.running = false;
          crawlStatus.finishedAt = new Date();
          crawlStatus.message = `采集完成：新增楼盘 ${result.newEstates}，跳过 ${result.skippedEstates}，新增楼栋 ${result.newBuildings}，新增房屋 ${result.newUnits}`;
          crawlStatus.result = result;
        })
        .catch(e => {
          crawlStatus.running = false;
          crawlStatus.finishedAt = new Date();
          crawlStatus.message = `采集失败: ${e.message}`;
          crawlStatus.result = {
            newEstates: 0,
            skippedEstates: 0,
            newBuildings: 0,
            newUnits: 0,
            errors: [e.message],
            estateNames: [],
          };
        });

      return {
        success: true,
        message: '采集任务已启动，请通过 getStatus 接口查询进度',
        startedAt: crawlStatus.startedAt,
      };
    }),

  /**
   * 获取当前采集状态
   */
  getStatus: protectedProcedure
    .query(async () => {
      return {
        ...crawlStatus,
        progress: crawlStatus.totalPages > 0
          ? Math.round((crawlStatus.currentPage / crawlStatus.totalPages) * 100)
          : 0,
      };
    }),

  /**
   * 导入模拟数据（用于测试，不依赖目标网站）
   * 模拟深圳住建局预售许可数据格式，验证入库逻辑
   */
  importMockData: adminProcedure
    .input(z.object({
      estateCount: z.number().min(1).max(50).default(5),
      buildingsPerEstate: z.number().min(1).max(10).default(3),
      unitsPerBuilding: z.number().min(1).max(50).default(10),
    }))
    .mutation(async ({ input }) => {
      const { estateCount, buildingsPerEstate, unitsPerBuilding } = input;

      // 深圳各区
      const districts = ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '龙华区', '坪山区', '光明区'];
      const developers = [
        '深圳万科房地产有限公司', '深圳华润置地有限公司', '深圳恒大地产有限公司',
        '深圳碧桂园房地产有限公司', '深圳保利地产有限公司', '深圳招商蛇口有限公司',
        '深圳金地集团有限公司', '深圳龙光地产有限公司',
      ];
      const propertyTypes = ['住宅', '商业', '公寓', '办公', '商住两用'];
      const buildingTypes = ['高层', '超高层', '多层', '小高层', '别墅'];
      const structures = ['框架结构', '剪力墙结构', '框剪结构', '钢结构'];
      const orientations = ['南', '北', '东', '西', '东南', '西南', '东北', '西北'];

      // 生成模拟楼盘
      const mockEstates: SzfdcEstate[] = Array.from({ length: estateCount }, (_, i) => {
        const idx = i + 1;
        const district = districts[i % districts.length];
        return {
          name: `深圳测试楼盘${idx.toString().padStart(3, '0')}`,
          developer: developers[i % developers.length],
          address: `${district}测试路${idx}号`,
          district,
          saleLicence: `深房许字（2024）${district.slice(0, 2)}${String(idx).padStart(4, '0')}`,
          propertyType: propertyTypes[i % propertyTypes.length],
          totalUnits: buildingsPerEstate * unitsPerBuilding,
          approveDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
          sourceId: `MOCK_ESTATE_${idx}`,
          sourceUrl: `https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/detail?id=MOCK_${idx}`,
        };
      });

      // 入库楼盘（带去重）
      const { inserted: estateInserted, skipped: estateSkipped, estateIdMap } =
        await importEstatesToDB(mockEstates);

      // 生成模拟楼栋
      const mockBuildings: SzfdcBuilding[] = [];
      for (const estate of mockEstates) {
        for (let b = 1; b <= buildingsPerEstate; b++) {
          mockBuildings.push({
            name: `${b}栋`,
            estateName: estate.name,
            floors: 20 + Math.floor(Math.random() * 30),
            unitsPerFloor: Math.floor(unitsPerBuilding / 4) + 1,
            totalUnits: unitsPerBuilding,
            buildingType: buildingTypes[b % buildingTypes.length],
            buildStructure: structures[b % structures.length],
            saleLicence: estate.saleLicence,
            completionDate: '2025-12-31',
            saleDate: '2024-06-01',
            avgPrice: 50000 + Math.floor(Math.random() * 50000),
            sourceId: `MOCK_BUILDING_${estate.sourceId}_${b}`,
            sourceEstateId: estate.sourceId,
          });
        }
      }

      const { inserted: buildingInserted, buildingIdMap } =
        await importBuildingsToDB(mockBuildings, estateIdMap);

      // 生成模拟房屋
      const mockUnits: SzfdcUnit[] = [];
      for (const building of mockBuildings) {
        const estateId = estateIdMap.get(building.estateName);
        if (!estateId) continue;
        for (let u = 1; u <= unitsPerBuilding; u++) {
          const floor = Math.ceil(u / 4);
          const unitInFloor = ((u - 1) % 4) + 1;
          const rooms = [1, 2, 2, 3, 3, 4][u % 6];
          const area = 50 + rooms * 20 + Math.floor(Math.random() * 30);
          const unitPrice = 50000 + Math.floor(Math.random() * 50000);
          mockUnits.push({
            unitNumber: `${floor.toString().padStart(2, '0')}0${unitInFloor}`,
            buildingName: building.name,
            estateName: building.estateName,
            floor,
            buildArea: area + 5,
            area,
            rooms,
            orientation: orientations[u % orientations.length],
            propertyType: building.buildingType === '别墅' ? '别墅' : '住宅',
            unitPrice,
            totalPrice: Math.round(area * unitPrice / 10000) * 10000,
            sourceId: `MOCK_UNIT_${building.sourceId}_${u}`,
          });
        }
      }

      const { inserted: unitInserted } =
        await importUnitsToDB(mockUnits, estateIdMap, buildingIdMap);

      return {
        success: true,
        message: `模拟数据导入完成`,
        stats: {
          estates: { inserted: estateInserted, skipped: estateSkipped },
          buildings: { inserted: buildingInserted },
          units: { inserted: unitInserted },
        },
        sampleEstates: mockEstates.slice(0, 3).map(e => e.name),
      };
    }),

  /**
   * 获取深圳楼盘统计信息
   */
  getEstateStats: protectedProcedure
    .query(async () => {
      const SZ_CITY_ID = 6;

      const [totalEstates] = await db.select({ count: count() })
        .from(estates).where(eq(estates.cityId, SZ_CITY_ID));

      const [totalBuildings] = await db.select({ count: count() })
        .from(buildings);

      const [totalUnits] = await db.select({ count: count() })
        .from(units);

      // 按区统计楼盘
      const byDistrict = await db.select({
        districtId: estates.districtId,
        count: count(),
      })
        .from(estates)
        .where(eq(estates.cityId, SZ_CITY_ID))
        .groupBy(estates.districtId);

      return {
        totalEstates: totalEstates.count,
        totalBuildings: totalBuildings.count,
        totalUnits: totalUnits.count,
        byDistrict,
        cityId: SZ_CITY_ID,
      };
    }),

  /**
   * 搜索楼盘（支持模糊匹配）
   */
  searchEstates: protectedProcedure
    .input(z.object({
      keyword: z.string().min(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const SZ_CITY_ID = 6;
      const results = await db.select({
        id: estates.id,
        name: estates.name,
        address: estates.address,
        developer: estates.developer,
        districtId: estates.districtId,
        propertyType: estates.propertyType,
        totalUnits: estates.totalUnits,
        createdAt: estates.createdAt,
      })
        .from(estates)
        .where(like(estates.name, `%${input.keyword}%`))
        .orderBy(desc(estates.createdAt))
        .limit(input.limit);

      return results;
    }),

  /**
   * 获取楼盘下的楼栋列表
   */
  getEstateBuildings: protectedProcedure
    .input(z.object({ estateId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(buildings)
        .where(eq(buildings.estateId, input.estateId))
        .orderBy(buildings.name);
    }),

  /**
   * 获取楼栋下的房屋列表
   */
  getBuildingUnits: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const { buildingId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const [rows, totalResult] = await Promise.all([
        db.select().from(units)
          .where(eq(units.buildingId, buildingId))
          .orderBy(units.floor, units.unitNumber)
          .limit(pageSize).offset(offset),
        db.select({ count: count() }).from(units).where(eq(units.buildingId, buildingId)),
      ]);

      return {
        units: rows,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),
});
