/**
 * 链家/贝壳 二手房成交案例解析器
 * 数据来源：链家网 chengjiao（成交）页面
 */
import { parsePrice, parseArea, parseFloor, normalizeOrientation, normalizeDecoration } from '../utils/helpers';

export interface ParsedCase {
  source: string;
  sourceId: string;
  title: string;
  address: string;
  community: string; // 小区/楼盘名
  totalPrice: number; // 总价（元）
  unitPrice: number; // 单价（元/㎡）
  area: number; // 建筑面积（㎡）
  rooms: string; // 户型，如 '3室2厅'
  floor: number; // 楼层
  totalFloor: number; // 总楼层
  orientation: string; // 朝向
  decoration: string; // 装修
  buildYear: number; // 建成年份
  dealDate: string; // 成交日期 YYYY-MM-DD
  listingPrice: number; // 挂牌价（元）
  dealCycle: number; // 成交周期（天）
  cityName: string;
  districtName: string;
  sourceUrl: string;
}

/** 解析链家成交列表页 HTML */
export function parseLianjiaList(html: string, cityName: string, sourceUrl: string): ParsedCase[] {
  const results: ParsedCase[] = [];

  // 匹配每个成交房源条目
  const itemPattern = /<li[^>]*class="[^"]*clear[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let match;

  while ((match = itemPattern.exec(html)) !== null) {
    try {
      const item = match[1];

      // 提取标题和链接
      const titleMatch = item.match(/class="title"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      const title = titleMatch ? titleMatch[2].trim() : '';
      const detailUrl = titleMatch ? titleMatch[1] : '';
      const sourceId = detailUrl.match(/\/(\d+)\.html/)?.[1] ?? '';

      // 提取小区名
      const communityMatch = item.match(/class="positionInfo"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
      const community = communityMatch ? communityMatch[1].trim() : '';

      // 提取地区
      const districtMatch = item.match(/class="positionInfo"[^>]*>[\s\S]*?<a[^>]*>[^<]+<\/a>\s*-\s*([^<\s]+)/);
      const districtName = districtMatch ? districtMatch[1].trim() : '';

      // 提取房屋信息（面积、户型、楼层、朝向、装修）
      const houseInfoMatch = item.match(/class="houseInfo"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)/);
      const houseInfo = houseInfoMatch ? houseInfoMatch[0].replace(/<[^>]+>/g, '|') : '';
      const infoParts = houseInfo.split('|').map(s => s.trim()).filter(Boolean);

      const rooms = infoParts[0] ?? '';
      const area = parseArea(infoParts[1] ?? '');
      const orientation = normalizeOrientation(infoParts[2] ?? '');
      const decoration = normalizeDecoration(infoParts[3] ?? '');
      const floorInfo = parseFloor(infoParts[4] ?? '');

      // 提取成交价格
      const totalPriceMatch = item.match(/class="totalPrice[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\d.]+)<\/span>/);
      const totalPriceWan = totalPriceMatch ? parseFloat(totalPriceMatch[1]) : 0;
      const totalPrice = Math.round(totalPriceWan * 10000);

      // 提取单价
      const unitPriceMatch = item.match(/class="unitPrice[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\d,]+)<\/span>/);
      const unitPrice = unitPriceMatch ? parseInt(unitPriceMatch[1].replace(/,/g, '')) : (area > 0 ? Math.round(totalPrice / area) : 0);

      // 提取成交日期
      const dealDateMatch = item.match(/成交时间[：:]\s*([\d-]+)/);
      const dealDate = dealDateMatch ? dealDateMatch[1] : '';

      // 提取成交周期
      const dealCycleMatch = item.match(/成交周期[：:]\s*(\d+)/);
      const dealCycle = dealCycleMatch ? parseInt(dealCycleMatch[1]) : 0;

      // 提取挂牌价
      const listingPriceMatch = item.match(/挂牌价[：:]\s*([\d.]+)\s*万/);
      const listingPrice = listingPriceMatch ? Math.round(parseFloat(listingPriceMatch[1]) * 10000) : 0;

      if (title && totalPrice > 0 && area > 0) {
        results.push({
          source: 'lianjia',
          sourceId,
          title,
          address: community,
          community,
          totalPrice,
          unitPrice,
          area,
          rooms,
          floor: floorInfo.floor,
          totalFloor: floorInfo.totalFloor,
          orientation,
          decoration,
          buildYear: 0,
          dealDate,
          listingPrice,
          dealCycle,
          cityName,
          districtName,
          sourceUrl: detailUrl || sourceUrl,
        });
      }
    } catch (e) {
      // 跳过解析失败的条目
    }
  }

  return results;
}

/** 解析安居客二手房列表页 */
export function parseAnjukeList(html: string, cityName: string, sourceUrl: string): ParsedCase[] {
  const results: ParsedCase[] = [];

  // 安居客列表项匹配
  const itemPattern = /<div[^>]*class="[^"]*property[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let match;

  while ((match = itemPattern.exec(html)) !== null) {
    try {
      const item = match[1];

      const titleMatch = item.match(/<span[^>]*class="[^"]*property-content-title[^"]*"[^>]*>([^<]+)<\/span>/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      const priceMatch = item.match(/<span[^>]*class="[^"]*property-price-total[^"]*"[^>]*>([\d.]+)<\/span>/);
      const totalPrice = priceMatch ? Math.round(parseFloat(priceMatch[1]) * 10000) : 0;

      const unitPriceMatch = item.match(/<span[^>]*class="[^"]*property-price-average[^"]*"[^>]*>([\d,]+)<\/span>/);
      const unitPrice = unitPriceMatch ? parseInt(unitPriceMatch[1].replace(/,/g, '')) : 0;

      const areaMatch = item.match(/([\d.]+)\s*㎡/);
      const area = areaMatch ? parseFloat(areaMatch[1]) : 0;

      const roomsMatch = item.match(/(\d室\d厅)/);
      const rooms = roomsMatch ? roomsMatch[1] : '';

      if (title && totalPrice > 0) {
        results.push({
          source: 'anjuke',
          sourceId: Math.random().toString(36).slice(2),
          title,
          address: title,
          community: title,
          totalPrice,
          unitPrice,
          area,
          rooms,
          floor: 0,
          totalFloor: 0,
          orientation: '',
          decoration: '',
          buildYear: 0,
          dealDate: new Date().toISOString().slice(0, 10),
          listingPrice: totalPrice,
          dealCycle: 0,
          cityName,
          districtName: '',
          sourceUrl,
        });
      }
    } catch (e) {
      // 跳过
    }
  }

  return results;
}
