/**
 * 楼盘基础信息采集器
 * 分类：基础信息类（estate_info）
 * 目标：采集各城市楼盘（estates）、楼栋（buildings）、房屋（units）三级结构
 * 数据源：
 *   - fang.com（房天下）：楼盘列表 + 楼栋信息
 *   - anjuke（安居客）：楼盘基础信息
 *   - lianjia（链家）：楼盘基础信息
 *   - beike（贝壳）：楼盘基础信息
 *   - szfdc（深圳住建局）：官方楼盘数据（含楼栋/房屋）
 */

import * as cheerio from 'cheerio';
import { db } from '../../../server/lib/db';
import { estates, buildings, units } from '../../../server/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface ParsedEstate {
  name: string;                 // 楼盘名（去重键）
  cityId: number;
  cityName: string;
  districtName?: string;        // 所在区
  address?: string;             // 详细地址
  developer?: string;           // 开发商
  propertyType?: string;        // 物业类型（住宅/商业/办公/公寓）
  buildYear?: number;           // 竣工年份
  totalFloors?: number;         // 总楼层
  totalUnits?: number;          // 总套数
  plotRatio?: number;           // 容积率
  greenRate?: number;           // 绿化率
  parkingRatio?: string;        // 车位比
  avgPrice?: number;            // 参考均价（元/㎡）
  priceRange?: string;          // 价格区间
  tags?: string[];              // 标签（地铁/学区/新房等）
  sourceId?: string;            // 数据源原始 ID
  sourceUrl?: string;           // 来源 URL
  source: string;               // 数据源标识
  buildings?: ParsedBuilding[]; // 楼栋列表（可选）
}

export interface ParsedBuilding {
  name: string;                 // 楼栋名
  totalFloors?: number;         // 总楼层
  totalUnits?: number;          // 本楼栋总套数
  buildYear?: number;
  propertyType?: string;
  units?: ParsedUnit[];         // 房屋列表（可选）
}

export interface ParsedUnit {
  unitNumber: string;           // 房号
  floor?: number;               // 楼层
  area?: number;                // 建筑面积（㎡）
  rooms?: string;               // 户型（3室2厅）
  orientation?: string;         // 朝向
  unitPrice?: number;           // 备案单价（元/㎡）
  totalPrice?: number;          // 备案总价（万元）
  status?: string;              // 状态（在售/已售/未售）
}

// ─── 城市代码映射 ─────────────────────────────────────────────────────────────

export const CITY_CODE_MAP: Record<string, { fang: string; anjuke: string; lianjia: string; beike: string }> = {
  '北京':   { fang: 'bj',  anjuke: 'bj',  lianjia: 'bj',  beike: 'bj'  },
  '上海':   { fang: 'sh',  anjuke: 'sh',  lianjia: 'sh',  beike: 'sh'  },
  '广州':   { fang: 'gz',  anjuke: 'gz',  lianjia: 'gz',  beike: 'gz'  },
  '深圳':   { fang: 'sz',  anjuke: 'sz',  lianjia: 'sz',  beike: 'sz'  },
  '杭州':   { fang: 'hz',  anjuke: 'hz',  lianjia: 'hz',  beike: 'hz'  },
  '成都':   { fang: 'cd',  anjuke: 'cd',  lianjia: 'cd',  beike: 'cd'  },
  '武汉':   { fang: 'wh',  anjuke: 'wh',  lianjia: 'wh',  beike: 'wh'  },
  '南京':   { fang: 'nj',  anjuke: 'nj',  lianjia: 'nj',  beike: 'nj'  },
  '西安':   { fang: 'xa',  anjuke: 'xa',  lianjia: 'xa',  beike: 'xa'  },
  '重庆':   { fang: 'cq',  anjuke: 'cq',  lianjia: 'cq',  beike: 'cq'  },
  '天津':   { fang: 'tj',  anjuke: 'tj',  lianjia: 'tj',  beike: 'tj'  },
  '苏州':   { fang: 'su',  anjuke: 'su',  lianjia: 'su',  beike: 'su'  },
  '东莞':   { fang: 'dg',  anjuke: 'dg',  lianjia: 'dg',  beike: 'dg'  },
  '佛山':   { fang: 'fs',  anjuke: 'fs',  lianjia: 'fs',  beike: 'fs'  },
};

// ─── URL 生成器 ───────────────────────────────────────────────────────────────

/** 生成楼盘基础信息采集 URL（房天下，楼盘库） */
export function generateEstateInfoUrls(
  cityName: string,
  districtName: string = '',
  maxPages: number = 10,
  source: string = 'fang'
): string[] {
  const codes = CITY_CODE_MAP[cityName] || { fang: 'bj', anjuke: 'bj', lianjia: 'bj', beike: 'bj' };
  const urls: string[] = [];

  if (source === 'fang') {
    // 房天下楼盘库：https://newhouse.fang.com/house/s/
    const cityCode = codes.fang;
    for (let p = 1; p <= maxPages; p++) {
      if (districtName) {
        urls.push(`https://${cityCode}.newhouse.fang.com/house/s/b91${p}/`);
      } else {
        urls.push(`https://${cityCode}.newhouse.fang.com/house/s/b91${p}/`);
      }
    }
  } else if (source === 'anjuke') {
    // 安居客楼盘库（移动端）
    const cityCode = codes.anjuke;
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://m.anjuke.com/${cityCode}/loupan/?page=${p}`);
    }
  } else if (source === 'lianjia') {
    // 链家小区库
    const cityCode = codes.lianjia;
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://${cityCode}.lianjia.com/xiaoqu/pg${p}/`);
    }
  } else if (source === 'beike') {
    // 贝壳小区库
    const cityCode = codes.beike;
    for (let p = 1; p <= maxPages; p++) {
      urls.push(`https://${cityCode}.ke.com/xiaoqu/pg${p}/`);
    }
  }

  return urls;
}

// ─── 解析器：房天下楼盘库 ─────────────────────────────────────────────────────

export function parseFangEstateList(html: string, cityName: string, cityId: number, url: string): ParsedEstate[] {
  const results: ParsedEstate[] = [];
  
  // 房天下楼盘列表解析
  const $ = cheerio.load(html);
  
  // 楼盘条目选择器
  $('li.list_li, div.list_li, .nlcd_name, .house-item').each((_, el) => {
    const $el = $(el);
    
    const name = $el.find('.nlcd_name a, .house-name a, h3 a').first().text().trim()
      || $el.find('a[href*="newhouse"]').first().text().trim();
    
    if (!name || name.length < 2) return;
    
    const priceText = $el.find('.nhouse_price, .price, .house-price').text();
    const avgPriceM = priceText.match(/(\d+(?:,\d+)?)\s*元\/㎡/);
    const avgPrice = avgPriceM ? parseInt(avgPriceM[1].replace(',', '')) : undefined;
    
    const addressText = $el.find('.house_add, .address, .location').text().trim();
    const districtM = addressText.match(/[\u4e00-\u9fa5]{2,4}(?:区|街道|镇)/);
    
    const sourceUrl = $el.find('a').first().attr('href') || url;
    const sourceIdM = sourceUrl.match(/\/(\d+)\//);
    
    results.push({
      name,
      cityId,
      cityName,
      districtName: districtM ? districtM[0] : undefined,
      address: addressText || undefined,
      avgPrice,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://newhouse.fang.com${sourceUrl}`,
      source: 'fang',
    });
  });
  
  return results;
}

/** 解析链家/贝壳小区列表 */
export function parseLianjiaEstateList(html: string, cityName: string, cityId: number, url: string, source: 'lianjia' | 'beike' = 'lianjia'): ParsedEstate[] {
  const results: ParsedEstate[] = [];
  const $ = cheerio.load(html);
  
  // 链家/贝壳小区列表
  $('li.xiaoquListItem, .resblock-list-item, [class*="xiaoquListItem"]').each((_, el) => {
    const $el = $(el);
    
    const name = $el.find('.xiaoquListItemTitle a, .resblock-name a, .title a').first().text().trim();
    if (!name || name.length < 2) return;
    
    const priceText = $el.find('.xiaoquListItemPrice, .resblock-price, .price').text();
    const avgPriceM = priceText.match(/(\d+)/);
    const avgPrice = avgPriceM ? parseInt(avgPriceM[1]) : undefined;
    
    const districtText = $el.find('.xiaoquErshoufang, .resblock-location, .district').text();
    const districtM = districtText.match(/[\u4e00-\u9fa5]{2,4}(?:区|街道)/);
    
    const addressText = $el.find('.xiaoquListItemDesc, .resblock-desc').text().trim();
    
    const sourceUrl = $el.find('a').first().attr('href') || '';
    const sourceIdM = sourceUrl.match(/xiaoqu\/(\d+)/);
    
    results.push({
      name,
      cityId,
      cityName,
      districtName: districtM ? districtM[0] : undefined,
      address: addressText || undefined,
      avgPrice,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : undefined,
      source,
    });
  });
  
  return results;
}

/** 解析安居客楼盘列表（移动端） */
export function parseAnjukeEstateList(html: string, cityName: string, cityId: number, url: string): ParsedEstate[] {
  const results: ParsedEstate[] = [];
  
  // 安居客移动端楼盘列表
  const itemMatches = html.match(/<li[^>]*class="[^"]*item[^"]*"[^>]*>[\s\S]*?<\/li>/g) || [];
  
  for (const itemHtml of itemMatches) {
    const text = itemHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 楼盘名
    const nameM = text.match(/([^\s，,]{2,20}(?:花园|苑|园|里|庭|城|府|轩|阁|居|家|湾|台|广场|公寓|大厦|楼|村|院|小区|中心|国际|豪庭|名苑|华府|雅苑|美墅|别墅|洋房|新城|新村|新苑))/);
    if (!nameM) continue;
    
    const name = nameM[1];
    
    // 均价
    const priceM = text.match(/(\d+(?:,\d+)?)\s*元\/㎡/);
    const avgPrice = priceM ? parseInt(priceM[1].replace(',', '')) : undefined;
    
    // 区域
    const districtM = text.match(/(福田|南山|罗湖|盐田|宝安|龙岗|龙华|坪山|光明|大鹏|朝阳|海淀|丰台|通州|浦东|黄浦|徐汇|静安|天河|越秀|荔湾|海珠)/);
    
    // 来源 URL
    const hrefM = itemHtml.match(/href="(https?:\/\/[^"]*anjuke[^"]*)"/);
    const sourceUrl = hrefM ? hrefM[1] : undefined;
    const sourceIdM = sourceUrl?.match(/\/(\d+)\//);
    
    results.push({
      name,
      cityId,
      cityName,
      districtName: districtM ? districtM[1] : undefined,
      avgPrice,
      sourceId: sourceIdM ? sourceIdM[1] : undefined,
      sourceUrl,
      source: 'anjuke',
    });
  }
  
  return results;
}

// ─── 数据库入库（楼盘基础信息） ───────────────────────────────────────────────

export async function importEstatesToDB(
  parsedEstates: ParsedEstate[],
  jobId: number,
): Promise<{ success: number; duplicate: number; buildingCount: number; unitCount: number }> {
  let success = 0;
  let duplicate = 0;
  let buildingCount = 0;
  let unitCount = 0;

  for (const estate of parsedEstates) {
    if (!estate.name || estate.name.length < 2) continue;

    // 楼盘去重：以楼盘名 + cityId 为唯一键
    const existing = await db
      .select({ id: estates.id })
      .from(estates)
      .where(and(eq(estates.name, estate.name), eq(estates.cityId, estate.cityId)))
      .limit(1);

    if (existing.length > 0) {
      duplicate++;
      continue;
    }

    try {
      // 插入楼盘
      const [inserted] = await (db.insert(estates) as any).values({
        name: estate.name,
        cityId: estate.cityId,
        districtId: null,
        address: estate.address,
        developer: estate.developer,
        propertyType: estate.propertyType || '住宅',
        buildYear: estate.buildYear,
        totalFloors: estate.totalFloors,
        totalUnits: estate.totalUnits,
        avgPrice: estate.avgPrice,
        tags: estate.tags ? JSON.stringify(estate.tags) : null,
        sourceId: estate.sourceId,
        sourceUrl: estate.sourceUrl,
        source: estate.source,
        crawlJobId: jobId,
      });

      const estateId = inserted?.insertId || inserted?.id;
      success++;

      // 插入楼栋（如果有）
      if (estate.buildings && estate.buildings.length > 0 && estateId) {
        for (const building of estate.buildings) {
          try {
            const [bInserted] = await (db.insert(buildings) as any).values({
              estateId,
              name: building.name,
              cityId: estate.cityId,
              totalFloors: building.totalFloors,
              totalUnits: building.totalUnits,
              buildYear: building.buildYear,
              propertyType: building.propertyType,
            });

            const buildingId = bInserted?.insertId || bInserted?.id;
            buildingCount++;

            // 插入房屋（如果有）
            if (building.units && building.units.length > 0 && buildingId) {
              for (const unit of building.units) {
                try {
                  await (db.insert(units) as any).values({
                    buildingId,
                    estateId,
                    cityId: estate.cityId,
                    unitNumber: unit.unitNumber,
                    floor: unit.floor,
                    buildArea: unit.area,
                    rooms: unit.rooms,
                    orientation: unit.orientation,
                    unitPrice: unit.unitPrice,
                    totalPrice: unit.totalPrice,
                    status: unit.status || 'unknown',
                  });
                  unitCount++;
                } catch {
                  // 忽略重复房屋
                }
              }
            }
          } catch {
            // 忽略重复楼栋
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Duplicate') || e.message?.includes('duplicate')) {
        duplicate++;
      }
    }
  }

  return { success, duplicate, buildingCount, unitCount };
}
