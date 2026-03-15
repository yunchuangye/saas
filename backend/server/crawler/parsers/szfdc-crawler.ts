/**
 * 深圳市住建局房源信息采集器
 * 目标：https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk
 *
 * 采集内容：楼盘（estates）、楼栋（buildings）、房屋（units）
 * 去重策略：以楼盘名（estate.name）为唯一标识，已存在则跳过
 *
 * 技术方案：
 * - 使用 Playwright Chromium（支持国密 TLS）访问页面
 * - 拦截 XHR/Fetch 请求获取真实 API 接口
 * - 解析 JSON 响应，映射到数据库字段
 * - 支持分页采集
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { db } from '../../lib/db';
import { estates, buildings, units } from '../../lib/schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================================
// 类型定义
// ============================================================

export interface SzfdcEstate {
  /** 楼盘名称（去重键） */
  name: string;
  /** 开发商 */
  developer?: string;
  /** 地址 */
  address?: string;
  /** 所在区 */
  district?: string;
  /** 预售许可证号 */
  saleLicence?: string;
  /** 建筑类型（住宅/商业等） */
  propertyType?: string;
  /** 总套数 */
  totalUnits?: number;
  /** 批准日期 */
  approveDate?: string;
  /** 原始 ID（来源系统） */
  sourceId?: string;
  /** 来源 URL */
  sourceUrl?: string;
}

export interface SzfdcBuilding {
  /** 楼栋名称 */
  name: string;
  /** 所属楼盘名（关联键） */
  estateName: string;
  /** 楼层数 */
  floors?: number;
  /** 每层套数 */
  unitsPerFloor?: number;
  /** 总套数 */
  totalUnits?: number;
  /** 建筑类型 */
  buildingType?: string;
  /** 建筑结构 */
  buildStructure?: string;
  /** 预售许可证号 */
  saleLicence?: string;
  /** 竣工日期 */
  completionDate?: string;
  /** 开盘日期 */
  saleDate?: string;
  /** 均价 */
  avgPrice?: number;
  /** 原始 ID */
  sourceId?: string;
  /** 来源楼盘 ID */
  sourceEstateId?: string;
}

export interface SzfdcUnit {
  /** 房号 */
  unitNumber: string;
  /** 所属楼栋名 */
  buildingName: string;
  /** 所属楼盘名 */
  estateName: string;
  /** 楼层 */
  floor?: number;
  /** 建筑面积 */
  buildArea?: number;
  /** 套内面积 */
  area?: number;
  /** 房型（室数） */
  rooms?: number;
  /** 朝向 */
  orientation?: string;
  /** 用途/物业类型 */
  propertyType?: string;
  /** 房产证号 */
  propertyNo?: string;
  /** 单价 */
  unitPrice?: number;
  /** 总价 */
  totalPrice?: number;
  /** 备注 */
  remark?: string;
  /** 原始 ID */
  sourceId?: string;
}

export interface CrawlSzfdcResult {
  /** 新增楼盘数 */
  newEstates: number;
  /** 跳过楼盘数（已存在） */
  skippedEstates: number;
  /** 新增楼栋数 */
  newBuildings: number;
  /** 新增房屋数 */
  newUnits: number;
  /** 错误信息 */
  errors: string[];
  /** 采集到的楼盘列表 */
  estateNames: string[];
}

// ============================================================
// Playwright 采集核心
// ============================================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  browserInstance = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  return browserInstance;
}

/**
 * 访问深圳住建局预售许可列表页，拦截 API 请求
 * @param page - Playwright 页面
 * @param pageNum - 页码（从 1 开始）
 * @returns 拦截到的 API 响应数据
 */
async function fetchEstateListPage(
  page: Page,
  pageNum: number = 1
): Promise<{ apiUrl: string; data: any } | null> {
  const captured: { url: string; data: any }[] = [];

  // 拦截 XHR/Fetch 响应
  const handler = async (res: any) => {
    const url: string = res.url();
    const ct: string = res.headers()['content-type'] || '';
    if (ct.includes('json') || url.includes('/api/') || url.includes('list') || url.includes('query')) {
      try {
        const body = await res.text();
        if (body && body.startsWith('{') || body.startsWith('[')) {
          captured.push({ url, data: JSON.parse(body) });
        }
      } catch (_) {}
    }
  };

  page.on('response', handler);

  const targetUrl = `https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk&page=${pageNum}`;
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  } catch (e: any) {
    console.warn(`[SZFDC] 页面加载警告: ${e.message}`);
  }

  page.off('response', handler);

  // 找到包含楼盘列表的响应
  const listResponse = captured.find(c =>
    c.data?.data?.list || c.data?.list || c.data?.rows || c.data?.records
  );

  return listResponse ? { apiUrl: listResponse.url, data: listResponse.data } : null;
}

// ============================================================
// 数据解析器
// ============================================================

/**
 * 解析预售许可列表响应，提取楼盘信息
 */
export function parseEstateListResponse(data: any): SzfdcEstate[] {
  const list: any[] = data?.data?.list || data?.list || data?.rows || data?.records || [];
  return list.map((item: any) => ({
    name: item.LPMC || item.lpmc || item.projectName || item.name || item.XMMC || '',
    developer: item.KFQY || item.kfqy || item.developer || item.KFQYMC || '',
    address: item.ZL || item.zl || item.address || item.XMDZ || '',
    district: item.QY || item.qy || item.district || item.SZQY || '',
    saleLicence: item.YSXKZH || item.ysxkzh || item.licenceNo || item.XKZH || '',
    propertyType: item.FWYT || item.fwyt || item.propertyType || item.JZYT || '',
    totalUnits: parseInt(item.PZTS || item.pzts || item.totalUnits || '0') || undefined,
    approveDate: item.PZRQ || item.pzrq || item.approveDate || '',
    sourceId: String(item.ID || item.id || item.XMID || ''),
    sourceUrl: `https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/detail?id=${item.ID || item.id || item.XMID}`,
  })).filter(e => e.name);
}

/**
 * 解析楼栋列表响应
 */
export function parseBuildingListResponse(data: any, estateName: string): SzfdcBuilding[] {
  const list: any[] = data?.data?.list || data?.list || data?.rows || data?.records || [];
  return list.map((item: any) => ({
    name: item.LDMC || item.ldmc || item.buildingName || item.name || item.LDH || '',
    estateName,
    floors: parseInt(item.ZCS || item.zcs || item.floors || '0') || undefined,
    unitsPerFloor: parseInt(item.MCTHS || item.mcths || '0') || undefined,
    totalUnits: parseInt(item.ZTS || item.zts || item.totalUnits || '0') || undefined,
    buildingType: item.JZLX || item.jzlx || item.buildingType || '',
    buildStructure: item.JZJG || item.jzjg || item.structure || '',
    saleLicence: item.YSXKZH || item.ysxkzh || item.licenceNo || '',
    completionDate: item.JGRQ || item.jgrq || item.completionDate || '',
    saleDate: item.KPRQ || item.kprq || item.saleDate || '',
    avgPrice: parseFloat(item.PJDJ || item.pjdj || item.avgPrice || '0') || undefined,
    sourceId: String(item.ID || item.id || item.LDID || ''),
    sourceEstateId: String(item.XMID || item.xmid || item.estateId || ''),
  })).filter(b => b.name);
}

/**
 * 解析房屋单元列表响应
 */
export function parseUnitListResponse(data: any, buildingName: string, estateName: string): SzfdcUnit[] {
  const list: any[] = data?.data?.list || data?.list || data?.rows || data?.records || [];
  return list.map((item: any) => ({
    unitNumber: item.FH || item.fh || item.unitNo || item.FWBH || '',
    buildingName,
    estateName,
    floor: parseInt(item.CS || item.cs || item.floor || '0') || undefined,
    buildArea: parseFloat(item.JZMJ || item.jzmj || item.buildArea || '0') || undefined,
    area: parseFloat(item.TNJMJ || item.tnjmj || item.area || '0') || undefined,
    rooms: parseInt(item.HX || item.hx || item.rooms || '0') || undefined,
    orientation: item.CX || item.cx || item.orientation || '',
    propertyType: item.FWYT || item.fwyt || item.propertyType || '',
    propertyNo: item.FWZH || item.fwzh || item.propertyNo || '',
    unitPrice: parseFloat(item.DJ || item.dj || item.unitPrice || '0') || undefined,
    totalPrice: parseFloat(item.ZJ || item.zj || item.totalPrice || '0') || undefined,
    remark: item.BZ || item.bz || item.remark || '',
    sourceId: String(item.ID || item.id || item.FWID || ''),
  })).filter(u => u.unitNumber);
}

// ============================================================
// 数据库入库（带去重）
// ============================================================

/**
 * 获取深圳市的 cityId
 */
async function getSzCityId(): Promise<number> {
  const { cities } = await import('../../lib/schema');
  const [city] = await db.select({ id: cities.id })
    .from(cities)
    .where(eq(cities.name, '深圳'))
    .limit(1);
  return city?.id ?? 1;
}

/**
 * 获取深圳各区的 districtId 映射
 */
async function getSzDistrictMap(): Promise<Map<string, number>> {
  const { districts } = await import('../../lib/schema');
  const cityId = await getSzCityId();
  const rows = await db.select({ id: districts.id, name: districts.name })
    .from(districts)
    .where(eq(districts.cityId, cityId));
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.name, r.id));
  return map;
}

/**
 * 将楼盘列表入库（以楼盘名去重）
 * @returns { inserted: number, skipped: number, estateIdMap: Map<name, id> }
 */
export async function importEstatesToDB(
  estateList: SzfdcEstate[],
  jobId?: number
): Promise<{ inserted: number; skipped: number; estateIdMap: Map<string, number> }> {
  const cityId = await getSzCityId();
  const districtMap = await getSzDistrictMap();
  const estateIdMap = new Map<string, number>();

  let inserted = 0;
  let skipped = 0;

  for (const estate of estateList) {
    if (!estate.name) continue;

    // 查询是否已存在（以楼盘名为去重标准）
    const existing = await db.select({ id: estates.id })
      .from(estates)
      .where(eq(estates.name, estate.name))
      .limit(1);

    if (existing.length > 0) {
      // 已存在，记录 ID 供后续楼栋/房屋使用
      estateIdMap.set(estate.name, existing[0].id);
      skipped++;
      continue;
    }

    // 解析 districtId
    let districtId: number | undefined;
    if (estate.district) {
      // 模糊匹配区名
      for (const [dName, dId] of districtMap) {
        if (dName.includes(estate.district) || estate.district.includes(dName.replace('区', ''))) {
          districtId = dId;
          break;
        }
      }
    }

    try {
      const [result] = await db.insert(estates).values({
        name: estate.name,
        cityId,
        districtId,
        address: estate.address || undefined,
        developer: estate.developer || undefined,
        propertyType: estate.propertyType || undefined,
        totalUnits: estate.totalUnits || undefined,
        isActive: true,
      } as any).$returningId();

      estateIdMap.set(estate.name, result.id);
      inserted++;
    } catch (e: any) {
      if (e.message?.includes('Duplicate')) {
        // 并发插入重复，查询已有 ID
        const [ex] = await db.select({ id: estates.id })
          .from(estates)
          .where(eq(estates.name, estate.name))
          .limit(1);
        if (ex) estateIdMap.set(estate.name, ex.id);
        skipped++;
      } else {
        console.error(`[SZFDC] 楼盘入库失败 ${estate.name}:`, e.message);
      }
    }
  }

  return { inserted, skipped, estateIdMap };
}

/**
 * 将楼栋列表入库
 */
export async function importBuildingsToDB(
  buildingList: SzfdcBuilding[],
  estateIdMap: Map<string, number>
): Promise<{ inserted: number; skipped: number; buildingIdMap: Map<string, number> }> {
  const buildingIdMap = new Map<string, number>();
  let inserted = 0;
  let skipped = 0;

  for (const building of buildingList) {
    const estateId = estateIdMap.get(building.estateName);
    if (!estateId) {
      console.warn(`[SZFDC] 找不到楼盘 ID: ${building.estateName}`);
      continue;
    }

    const buildingKey = `${building.estateName}::${building.name}`;

    // 查询是否已存在（同楼盘下同楼栋名去重）
    const { and: andOp, eq: eqOp } = await import('drizzle-orm');
    const existingByName = await db.select({ id: buildings.id })
      .from(buildings)
      .where(andOp(eqOp(buildings.estateId, estateId), eqOp(buildings.name, building.name)))
      .limit(1);

    if (existingByName.length > 0) {
      buildingIdMap.set(buildingKey, existingByName[0].id);
      skipped++;
      continue;
    }

    try {
      const [result] = await db.insert(buildings).values({
        estateId,
        name: building.name,
        floors: building.floors || undefined,
        unitsPerFloor: building.unitsPerFloor || undefined,
        totalUnits: building.totalUnits || undefined,
        buildingType: building.buildingType || undefined,
        buildStructure: building.buildStructure || undefined,
        saleLicence: building.saleLicence || undefined,
        completionDate: building.completionDate || undefined,
        saleDate: building.saleDate || undefined,
        avgPrice: building.avgPrice ? String(building.avgPrice) : undefined,
        sourceId: building.sourceId ? parseInt(building.sourceId) : undefined,
        sourceEstateId: building.sourceEstateId ? parseInt(building.sourceEstateId) : undefined,
      } as any).$returningId();

      buildingIdMap.set(buildingKey, result.id);
      inserted++;
    } catch (e: any) {
      if (e.message?.includes('Duplicate')) {
        skipped++;
      } else {
        console.error(`[SZFDC] 楼栋入库失败 ${building.name}:`, e.message);
      }
    }
  }

  return { inserted, skipped, buildingIdMap };
}

/**
 * 将房屋单元列表入库
 */
export async function importUnitsToDB(
  unitList: SzfdcUnit[],
  estateIdMap: Map<string, number>,
  buildingIdMap: Map<string, number>
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const unit of unitList) {
    const estateId = estateIdMap.get(unit.estateName);
    const buildingKey = `${unit.estateName}::${unit.buildingName}`;
    const buildingId = buildingIdMap.get(buildingKey);

    if (!estateId || !buildingId) {
      console.warn(`[SZFDC] 找不到楼盘/楼栋 ID: ${unit.estateName} / ${unit.buildingName}`);
      continue;
    }

    try {
      await db.insert(units).values({
        buildingId,
        estateId,
        unitNumber: unit.unitNumber,
        floor: unit.floor || undefined,
        buildArea: unit.buildArea ? String(unit.buildArea) : undefined,
        area: unit.area ? String(unit.area) : undefined,
        rooms: unit.rooms || undefined,
        orientation: unit.orientation || undefined,
        propertyType: unit.propertyType || undefined,
        propertyNo: unit.propertyNo || undefined,
        unitPrice: unit.unitPrice ? String(unit.unitPrice) : undefined,
        totalPrice: unit.totalPrice ? String(unit.totalPrice) : undefined,
        remark: unit.remark || undefined,
        sourceId: unit.sourceId ? parseInt(unit.sourceId) : undefined,
      } as any);
      inserted++;
    } catch (e: any) {
      if (e.message?.includes('Duplicate')) {
        skipped++;
      } else {
        console.error(`[SZFDC] 房屋入库失败 ${unit.unitNumber}:`, e.message);
      }
    }
  }

  return { inserted, skipped };
}

// ============================================================
// 主采集流程
// ============================================================

export interface SzfdcCrawlOptions {
  /** 最大采集页数（默认 10） */
  maxPages?: number;
  /** 页面加载等待时间（ms，默认 3000） */
  waitMs?: number;
  /** 是否采集楼栋信息（默认 true） */
  fetchBuildings?: boolean;
  /** 是否采集房屋信息（默认 false，数据量大） */
  fetchUnits?: boolean;
  /** 任务 ID（用于日志） */
  jobId?: number;
  /** 进度回调 */
  onProgress?: (page: number, total: number, msg: string) => void;
}

/**
 * 主采集函数：采集深圳住建局预售许可楼盘/楼栋/房屋信息
 */
export async function crawlSzfdcEstates(
  options: SzfdcCrawlOptions = {}
): Promise<CrawlSzfdcResult> {
  const {
    maxPages = 10,
    waitMs = 3000,
    fetchBuildings: doFetchBuildings = true,
    fetchUnits: doFetchUnits = false,
    jobId,
    onProgress,
  } = options;

  const result: CrawlSzfdcResult = {
    newEstates: 0,
    skippedEstates: 0,
    newBuildings: 0,
    newUnits: 0,
    errors: [],
    estateNames: [],
  };

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  const page = await context.newPage();

  // 存储所有采集到的楼盘
  const allEstates: SzfdcEstate[] = [];
  // 存储发现的 API 端点
  let estateListApiUrl = '';
  let buildingListApiUrl = '';
  let unitListApiUrl = '';

  // 拦截所有 JSON 响应，分析 API 结构
  const apiEndpoints = new Map<string, string>(); // url pattern -> type
  const capturedResponses: { url: string; data: any }[] = [];

  page.on('response', async (res) => {
    const url = res.url();
    const ct = res.headers()['content-type'] || '';
    if (ct.includes('json') || url.includes('/api/')) {
      try {
        const text = await res.text();
        if (text && (text.startsWith('{') || text.startsWith('['))) {
          const data = JSON.parse(text);
          capturedResponses.push({ url, data });
        }
      } catch (_) {}
    }
  });

  try {
    // 第一步：访问主页面，分析 API 结构
    console.log('[SZFDC] 正在访问深圳住建局预售许可页面...');
    onProgress?.(0, maxPages, '正在访问目标页面...');

    const baseUrl = 'https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk';
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(waitMs);
    } catch (e: any) {
      console.warn('[SZFDC] 页面加载警告:', e.message);
    }

    // 分析捕获到的 API 请求
    console.log(`[SZFDC] 捕获到 ${capturedResponses.length} 个 JSON 响应`);
    for (const { url, data } of capturedResponses) {
      console.log(`  [API] ${url}`);
      const list = data?.data?.list || data?.list || data?.rows || data?.records;
      if (Array.isArray(list) && list.length > 0) {
        console.log(`    -> 包含列表数据，共 ${list.length} 条，字段: ${Object.keys(list[0]).join(', ')}`);
        // 判断数据类型
        const sample = list[0];
        const keys = Object.keys(sample).join(',').toLowerCase();
        if (keys.includes('lpmc') || keys.includes('xmmc') || keys.includes('projectname')) {
          estateListApiUrl = url;
          console.log('    -> 识别为楼盘列表 API');
        } else if (keys.includes('ldmc') || keys.includes('ldh') || keys.includes('buildingname')) {
          buildingListApiUrl = url;
          console.log('    -> 识别为楼栋列表 API');
        } else if (keys.includes('fh') || keys.includes('fwbh') || keys.includes('unitno')) {
          unitListApiUrl = url;
          console.log('    -> 识别为房屋列表 API');
        }
      }
    }

    // 第二步：分页采集楼盘列表
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      onProgress?.(pageNum, maxPages, `正在采集第 ${pageNum}/${maxPages} 页楼盘列表...`);
      console.log(`[SZFDC] 采集第 ${pageNum} 页...`);

      capturedResponses.length = 0; // 清空

      try {
        // 尝试直接调用 API（如果已知 URL）
        if (estateListApiUrl) {
          // 修改分页参数
          const apiUrl = new URL(estateListApiUrl);
          apiUrl.searchParams.set('pageNo', String(pageNum));
          apiUrl.searchParams.set('pageNum', String(pageNum));
          apiUrl.searchParams.set('page', String(pageNum));
          apiUrl.searchParams.set('pageSize', '20');

          const response = await page.evaluate(async (url) => {
            const res = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            });
            return res.text();
          }, apiUrl.toString());

          if (response) {
            const data = JSON.parse(response);
            const pageEstates = parseEstateListResponse(data);
            if (pageEstates.length === 0) {
              console.log(`[SZFDC] 第 ${pageNum} 页无数据，停止采集`);
              break;
            }
            allEstates.push(...pageEstates);
            console.log(`[SZFDC] 第 ${pageNum} 页采集到 ${pageEstates.length} 个楼盘`);
          }
        } else {
          // 通过页面交互翻页
          const pageUrl = `${baseUrl}&page=${pageNum}`;
          await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(waitMs);

          // 从捕获的响应中提取楼盘数据
          for (const { data } of capturedResponses) {
            const pageEstates = parseEstateListResponse(data);
            if (pageEstates.length > 0) {
              allEstates.push(...pageEstates);
              console.log(`[SZFDC] 第 ${pageNum} 页采集到 ${pageEstates.length} 个楼盘`);
            }
          }
        }
      } catch (e: any) {
        console.error(`[SZFDC] 第 ${pageNum} 页采集失败:`, e.message);
        result.errors.push(`第 ${pageNum} 页: ${e.message}`);
      }

      // 随机延迟，避免被封
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }

    console.log(`[SZFDC] 共采集到 ${allEstates.length} 个楼盘`);

    // 第三步：楼盘入库（去重）
    if (allEstates.length > 0) {
      onProgress?.(maxPages, maxPages, `正在入库 ${allEstates.length} 个楼盘（去重）...`);
      const { inserted, skipped, estateIdMap } = await importEstatesToDB(allEstates, jobId);
      result.newEstates = inserted;
      result.skippedEstates = skipped;
      result.estateNames = allEstates.map(e => e.name);
      console.log(`[SZFDC] 楼盘入库完成：新增 ${inserted}，跳过 ${skipped}`);

      // 第四步：采集楼栋（可选）
      if (doFetchBuildings && buildingListApiUrl) {
        onProgress?.(maxPages, maxPages, '正在采集楼栋信息...');
        const allBuildings: SzfdcBuilding[] = [];

        for (const [estateName, estateId] of estateIdMap) {
          if (result.skippedEstates > 0) continue; // 已存在的楼盘跳过楼栋采集

          try {
            const apiUrl = new URL(buildingListApiUrl);
            apiUrl.searchParams.set('estateId', String(estateId));
            apiUrl.searchParams.set('pageSize', '100');

            const response = await page.evaluate(async (url) => {
              const res = await fetch(url);
              return res.text();
            }, apiUrl.toString());

            if (response) {
              const data = JSON.parse(response);
              const pageBuildings = parseBuildingListResponse(data, estateName);
              allBuildings.push(...pageBuildings);
            }
          } catch (e: any) {
            console.error(`[SZFDC] 楼栋采集失败 ${estateName}:`, e.message);
          }

          await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
        }

        if (allBuildings.length > 0) {
          const { inserted: bInserted, buildingIdMap } = await importBuildingsToDB(allBuildings, estateIdMap);
          result.newBuildings = bInserted;
          console.log(`[SZFDC] 楼栋入库完成：新增 ${bInserted}`);

          // 第五步：采集房屋（可选）
          if (doFetchUnits && unitListApiUrl) {
            onProgress?.(maxPages, maxPages, '正在采集房屋信息...');
            const allUnits: SzfdcUnit[] = [];

            for (const [buildingKey, buildingId] of buildingIdMap) {
              const [estateName, buildingName] = buildingKey.split('::');

              try {
                const apiUrl = new URL(unitListApiUrl);
                apiUrl.searchParams.set('buildingId', String(buildingId));
                apiUrl.searchParams.set('pageSize', '500');

                const response = await page.evaluate(async (url) => {
                  const res = await fetch(url);
                  return res.text();
                }, apiUrl.toString());

                if (response) {
                  const data = JSON.parse(response);
                  const pageUnits = parseUnitListResponse(data, buildingName, estateName);
                  allUnits.push(...pageUnits);
                }
              } catch (e: any) {
                console.error(`[SZFDC] 房屋采集失败 ${buildingKey}:`, e.message);
              }

              await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
            }

            if (allUnits.length > 0) {
              const { inserted: uInserted } = await importUnitsToDB(allUnits, estateIdMap, buildingIdMap);
              result.newUnits = uInserted;
              console.log(`[SZFDC] 房屋入库完成：新增 ${uInserted}`);
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.error('[SZFDC] 采集异常:', e);
    result.errors.push(`采集异常: ${e.message}`);
  } finally {
    await context.close();
  }

  return result;
}

/**
 * 关闭浏览器实例
 */
export async function closeSzfdcBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
