/**
 * 案例交易报盘采集器
 * 分类：案例信息类（case_listing）
 * 目标：采集各大平台各城市的二手房交易报盘数据，写入 cases 表
 * 数据源：
 *   - lianjia（链家）：二手房成交/在售
 *   - beike（贝壳）：二手房成交/在售
 *   - anjuke（安居客）：二手房报盘
 *   - fang（房天下）：二手房报盘
 *   - leyoujia（乐有家）：深圳二手房
 */

import * as cheerio from 'cheerio';
import { db } from '../../../server/lib/db';
import { cases } from '../../../server/lib/schema';
import { eq, and } from 'drizzle-orm';

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface ParsedCase {
  title?: string;               // 房源标题
  community?: string;           // 小区名（楼盘名）
  cityId?: number;
  cityName: string;
  districtName?: string;        // 所在区
  address?: string;             // 地址
  area?: number;                // 建筑面积（㎡）
  rooms?: string;               // 户型（3室2厅）
  floor?: string;               // 楼层描述（中层/共18层）
  floorNum?: number;            // 楼层数字
  totalFloors?: number;         // 总楼层
  orientation?: string;         // 朝向
  decoration?: string;          // 装修（精装/简装/毛坯）
  buildYear?: number;           // 建成年份
  totalPrice?: number;          // 总价（万元）
  unitPrice?: number;           // 单价（元/㎡）
  listingPrice?: number;        // 挂牌价（万元）
  dealDate?: string;            // 成交日期（YYYY-MM-DD）
  dealCycle?: number;           // 成交周期（天）
  propertyType?: string;        // 物业类型
  tags?: string[];              // 标签
  sourceId?: string;            // 数据源原始 ID
  sourceUrl?: string;           // 来源 URL
  source: string;               // 数据源
  dataType: 'sold_cases' | 'listing'; // 成交案例 or 在售报盘
}

// ─── 城市 URL 代码映射 ─────────────────────────────────────────────────────────

const CITY_CODES: Record<string, { lianjia: string; beike: string; anjuke: string; fang: string; leyoujia?: string }> = {
  '北京':   { lianjia: 'bj',  beike: 'bj',  anjuke: 'bj',  fang: 'bj'  },
  '上海':   { lianjia: 'sh',  beike: 'sh',  anjuke: 'sh',  fang: 'sh'  },
  '广州':   { lianjia: 'gz',  beike: 'gz',  anjuke: 'gz',  fang: 'gz'  },
  '深圳':   { lianjia: 'sz',  beike: 'sz',  anjuke: 'sz',  fang: 'sz',  leyoujia: 'sz' },
  '杭州':   { lianjia: 'hz',  beike: 'hz',  anjuke: 'hz',  fang: 'hz'  },
  '成都':   { lianjia: 'cd',  beike: 'cd',  anjuke: 'cd',  fang: 'cd'  },
  '武汉':   { lianjia: 'wh',  beike: 'wh',  anjuke: 'wh',  fang: 'wh'  },
  '南京':   { lianjia: 'nj',  beike: 'nj',  anjuke: 'nj',  fang: 'nj'  },
  '西安':   { lianjia: 'xa',  beike: 'xa',  anjuke: 'xa',  fang: 'xa'  },
  '重庆':   { lianjia: 'cq',  beike: 'cq',  anjuke: 'cq',  fang: 'cq'  },
  '天津':   { lianjia: 'tj',  beike: 'tj',  anjuke: 'tj',  fang: 'tj'  },
  '苏州':   { lianjia: 'su',  beike: 'su',  anjuke: 'su',  fang: 'su'  },
  '东莞':   { lianjia: 'dg',  beike: 'dg',  anjuke: 'dg',  fang: 'dg'  },
  '佛山':   { lianjia: 'fs',  beike: 'fs',  anjuke: 'fs',  fang: 'fs'  },
};

// ─── URL 生成器 ───────────────────────────────────────────────────────────────

/** 生成案例/报盘采集 URL */
export function generateCaseListingUrls(
  cityName: string,
  districtName: string = '',
  maxPages: number = 10,
  source: string = 'lianjia',
  dataType: 'sold_cases' | 'listing' = 'listing'
): string[] {
  const codes = CITY_CODES[cityName] || CITY_CODES['北京'];
  const urls: string[] = [];

  if (source === 'lianjia') {
    const code = codes.lianjia;
    if (dataType === 'sold_cases') {
      // 链家成交记录
      for (let p = 1; p <= maxPages; p++) {
        urls.push(`https://${code}.lianjia.com/chengjiao/pg${p}/`);
      }
    } else {
      // 链家在售二手房
      for (let p = 1; p <= maxPages; p++) {
        urls.push(`https://${code}.lianjia.com/ershoufang/pg${p}/`);
      }
    }
  } else if (source === 'beike') {
    const code = codes.beike;
    if (dataType === 'sold_cases') {
      for (let p = 1; p <= maxPages; p++) {
        urls.push(`https://${code}.ke.com/chengjiao/pg${p}/`);
      }
    } else {
      for (let p = 1; p <= maxPages; p++) {
        urls.push(`https://${code}.ke.com/ershoufang/pg${p}/`);
      }
    }
  } else if (source === 'anjuke') {
    // 安居客移动端二手房
    const code = codes.anjuke;
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://m.anjuke.com/${code}/sale/?page=${p}`);
    }
  } else if (source === 'fang') {
    // 房天下二手房
    const code = codes.fang;
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://${code}.esf.fang.com/house-a0${p}/`);
    }
  } else if (source === 'leyoujia') {
    // 乐有家深圳二手房
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://www.leyoujia.com/esf/sz/?page=${p}`);
    }
  }

  return urls;
}

// ─── 解析器：链家/贝壳二手房列表 ─────────────────────────────────────────────

export function parseLianjiaCaseList(
  html: string,
  cityName: string,
  cityId: number,
  url: string,
  source: 'lianjia' | 'beike',
  dataType: 'sold_cases' | 'listing'
): ParsedCase[] {
  const results: ParsedCase[] = [];
  const $ = cheerio.load(html);

  // 链家/贝壳二手房列表条目
  $('li.clear, .LOGCLICKDATA, [data-hid]').each((_, el) => {
    const $el = $(el);

    // 标题/小区名
    const title = $el.find('.title a, .houseTitle a').first().text().trim();
    const community = $el.find('.positionInfo a, .communityName a').first().text().trim();
    if (!title && !community) return;

    // 户型、面积、楼层、朝向、装修、年份
    const houseInfoText = $el.find('.houseInfo, .house-desc').text();
    const roomsM = houseInfoText.match(/(\d+室\d+厅)/);
    const areaM = houseInfoText.match(/(\d+(?:\.\d+)?)\s*平米/);
    const orientationM = houseInfoText.match(/(南北|正南|东南|西南|正东|正西|东北|西北|南|北|东|西)/);
    const decorationM = houseInfoText.match(/(精装|简装|毛坯|豪装|中等装修)/);

    // 楼层
    const floorText = $el.find('.positionInfo, .floor').text();
    const floorM = floorText.match(/(\d+)层/);
    const totalFloorM = floorText.match(/共(\d+)层/);
    const floorLevelM = floorText.match(/(低层|中层|高层)/);

    // 年份
    const yearM = floorText.match(/(\d{4})年/);

    // 价格
    const totalPriceText = $el.find('.totalPrice, .price').text();
    const totalPriceM = totalPriceText.match(/(\d+(?:\.\d+)?)/);
    const totalPrice = totalPriceM ? parseFloat(totalPriceM[1]) : undefined;

    const unitPriceText = $el.find('.unitPrice, .unit-price').text();
    const unitPriceM = unitPriceText.match(/(\d+)/);
    const unitPrice = unitPriceM ? parseInt(unitPriceM[1]) : undefined;

    // 成交日期（成交记录页面）
    const dealText = $el.find('.dealDate, .deal-date').text();
    const dealDateM = dealText.match(/(\d{4}-\d{2}-\d{2})/);

    // 来源 URL 和 ID
    const href = $el.find('a').first().attr('href') || '';
    const sourceIdM = href.match(/\/(\d+)\.html/);

    // 区域
    const posText = $el.find('.positionInfo, .position').text();
    const districtM = posText.match(/[\u4e00-\u9fa5]{2,4}(?:区|街道)/);

    results.push({
      title: title || community,
      community: community || undefined,
      cityId,
      cityName,
      districtName: districtM ? districtM[0] : undefined,
      area: areaM ? parseFloat(areaM[1]) : undefined,
      rooms: roomsM ? roomsM[1] : undefined,
      floor: floorLevelM ? floorLevelM[1] : undefined,
      floorNum: floorM ? parseInt(floorM[1]) : undefined,
      totalFloors: totalFloorM ? parseInt(totalFloorM[1]) : undefined,
      orientation: orientationM ? orientationM[1] : undefined,
      decoration: decorationM ? decorationM[1] : undefined,
      buildYear: yearM ? parseInt(yearM[1]) : undefined,
      totalPrice,
      unitPrice,
      dealDate: dealDateM ? dealDateM[1] : undefined,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: href.startsWith('http') ? href : undefined,
      source,
      dataType,
    });
  });

  return results;
}

// ─── 解析器：安居客移动端二手房 ───────────────────────────────────────────────

export function parseAnjukeCaseList(
  html: string,
  cityName: string,
  cityId: number,
  url: string
): ParsedCase[] {
  const results: ParsedCase[] = [];
  const $ = cheerio.load(html);

  // 安居客移动端房源条目
  $('li[class*="item"], .property-item, [data-property-id]').each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();

    // 小区名
    const community = $el.find('.comm-name, .community-name, [class*="comm"]').first().text().trim();
    // 标题
    const title = $el.find('.property-title, .title, h3').first().text().trim();

    if (!community && !title) return;

    // 面积
    const areaM = text.match(/(\d+(?:\.\d+)?)\s*㎡/);
    // 户型
    const roomsM = text.match(/(\d+室\d+厅)/);
    // 楼层
    const floorM = text.match(/(低层|中层|高层)/);
    // 朝向
    const orientationM = text.match(/(南北|正南|东南|西南|正东|正西|东北|西北)/);
    // 价格（万）
    const totalPriceM = text.match(/(\d+(?:\.\d+)?)\s*万/);
    // 单价
    const unitPriceM = text.match(/(\d+)\s*元\/㎡/);
    // 区域
    const districtM = text.match(/(福田|南山|罗湖|盐田|宝安|龙岗|龙华|坪山|光明|大鹏|朝阳|海淀|浦东|黄浦|天河|越秀)/);

    // 来源 URL
    const href = $el.find('a').first().attr('href') || '';
    const sourceIdM = href.match(/\/(\d+)\//);

    results.push({
      title: title || community,
      community: community || undefined,
      cityId,
      cityName,
      districtName: districtM ? districtM[1] : undefined,
      area: areaM ? parseFloat(areaM[1]) : undefined,
      rooms: roomsM ? roomsM[1] : undefined,
      floor: floorM ? floorM[1] : undefined,
      orientation: orientationM ? orientationM[1] : undefined,
      totalPrice: totalPriceM ? parseFloat(totalPriceM[1]) : undefined,
      unitPrice: unitPriceM ? parseInt(unitPriceM[1]) : undefined,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: href.startsWith('http') ? href : undefined,
      source: 'anjuke',
      dataType: 'listing',
    });
  });

  return results;
}

// ─── 解析器：乐有家深圳二手房 ─────────────────────────────────────────────────

export function parseLeyoujiaCaseList(
  html: string,
  cityName: string,
  cityId: number,
  url: string
): ParsedCase[] {
  const results: ParsedCase[] = [];
  const $ = cheerio.load(html);

  // 乐有家房源列表
  $('.house-item, .list-item, [class*="house-item"]').each((_, el) => {
    const $el = $(el);

    const title = $el.find('.house-title a, .title a, h3 a').first().text().trim();
    const community = $el.find('.community a, .comm-name').first().text().trim();

    if (!title && !community) return;

    const infoText = $el.find('.house-info, .info').text();
    const areaM = infoText.match(/(\d+(?:\.\d+)?)\s*㎡/);
    const roomsM = infoText.match(/(\d+室\d+厅)/);
    const floorM = infoText.match(/(低层|中层|高层)/);

    const priceText = $el.find('.price, .house-price').text();
    const totalPriceM = priceText.match(/(\d+(?:\.\d+)?)\s*万/);
    const unitPriceM = priceText.match(/(\d+)\s*元\/㎡/);

    const districtText = $el.find('.location, .district').text();
    const districtM = districtText.match(/(福田|南山|罗湖|盐田|宝安|龙岗|龙华|坪山|光明|大鹏)/);

    const href = $el.find('a').first().attr('href') || '';
    const sourceIdM = href.match(/\/(\d+)(?:\.html)?/);

    results.push({
      title: title || community,
      community: community || undefined,
      cityId,
      cityName,
      districtName: districtM ? districtM[1] : undefined,
      area: areaM ? parseFloat(areaM[1]) : undefined,
      rooms: roomsM ? roomsM[1] : undefined,
      floor: floorM ? floorM[1] : undefined,
      totalPrice: totalPriceM ? parseFloat(totalPriceM[1]) : undefined,
      unitPrice: unitPriceM ? parseInt(unitPriceM[1]) : undefined,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: href.startsWith('http') ? href : `https://www.leyoujia.com${href}`,
      source: 'leyoujia',
      dataType: 'listing',
    });
  });

  return results;
}

// ─── 解析器：房天下二手房 ─────────────────────────────────────────────────────

export function parseFangCaseList(
  html: string,
  cityName: string,
  cityId: number,
  url: string
): ParsedCase[] {
  const results: ParsedCase[] = [];
  const $ = cheerio.load(html);

  // 房天下二手房列表
  $('dl.list_dl, .house-item, [class*="house_item"]').each((_, el) => {
    const $el = $(el);

    const title = $el.find('.house_title a, .title a, dt a').first().text().trim();
    const community = $el.find('.house_add a, .community a').first().text().trim();

    if (!title && !community) return;

    const descText = $el.find('.house_desc, .info, dd').text();
    const areaM = descText.match(/(\d+(?:\.\d+)?)\s*㎡/);
    const roomsM = descText.match(/(\d+室\d+厅)/);
    const floorM = descText.match(/(低层|中层|高层)/);
    const yearM = descText.match(/(\d{4})年/);

    const priceText = $el.find('.house_price, .price').text();
    const totalPriceM = priceText.match(/(\d+(?:\.\d+)?)\s*万/);
    const unitPriceM = priceText.match(/(\d+)\s*元\/㎡/);

    const href = $el.find('a').first().attr('href') || '';
    const sourceIdM = href.match(/\/(\d+)(?:\.html)?/);

    results.push({
      title: title || community,
      community: community || undefined,
      cityId,
      cityName,
      area: areaM ? parseFloat(areaM[1]) : undefined,
      rooms: roomsM ? roomsM[1] : undefined,
      floor: floorM ? floorM[1] : undefined,
      buildYear: yearM ? parseInt(yearM[1]) : undefined,
      totalPrice: totalPriceM ? parseFloat(totalPriceM[1]) : undefined,
      unitPrice: unitPriceM ? parseInt(unitPriceM[1]) : undefined,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: href.startsWith('http') ? href : undefined,
      source: 'fang',
      dataType: 'listing',
    });
  });

  return results;
}

// ─── 数据库入库（案例/报盘） ──────────────────────────────────────────────────

export async function importCasesToDB(
  parsedCases: ParsedCase[],
  jobId: number,
  cityId?: number,
): Promise<{ success: number; duplicate: number }> {
  let success = 0;
  let duplicate = 0;

  for (const c of parsedCases) {
    if (!c.area && !c.totalPrice) continue; // 无效数据跳过

    // 案例去重：以 sourceId + source 为唯一键（有 sourceId 时），或 community + area + totalPrice 组合
    if (c.sourceId) {
      const existing = await db
        .select({ id: cases.id })
        .from(cases)
        .where(and(eq(cases.sourceId, c.sourceId), eq(cases.source, c.source)))
        .limit(1);
      if (existing.length > 0) {
        duplicate++;
        continue;
      }
    }

    try {
      await (db.insert(cases) as any).values({
        title: c.title,
        community: c.community,
        cityId: cityId || c.cityId,
        districtName: c.districtName,
        address: c.address,
        area: c.area,
        rooms: c.rooms,
        floor: c.floor,
        floorNum: c.floorNum,
        totalFloors: c.totalFloors,
        orientation: c.orientation,
        decoration: c.decoration,
        buildYear: c.buildYear,
        totalPrice: c.totalPrice,
        unitPrice: c.unitPrice,
        listingPrice: c.listingPrice,
        dealDate: c.dealDate ? new Date(c.dealDate) : undefined,
        dealCycle: c.dealCycle,
        propertyType: c.propertyType || '住宅',
        tags: c.tags ? JSON.stringify(c.tags) : null,
        sourceId: c.sourceId,
        sourceUrl: c.sourceUrl,
        source: c.source,
        dataType: c.dataType,
        crawlJobId: jobId,
        isVerified: false,
      });
      success++;
    } catch (e: any) {
      if (e.message?.includes('Duplicate') || e.message?.includes('duplicate')) {
        duplicate++;
      }
    }
  }

  return { success, duplicate };
}
