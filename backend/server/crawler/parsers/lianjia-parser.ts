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

/** 解析安居客移动端二手房列表页 (m.anjuke.com)
 * 页面为 Nuxt.js SSR 渲染，每页 60 条房源
 * 关键类名: cell-wrap / content-title / content-price / content-desc / house-avg-price
 */
export function parseAnjukeList(html: string, cityName: string, sourceUrl: string): ParsedCase[] {
  const results: ParsedCase[] = [];

  // 找到所有 cell-wrap 条目的位置
  const positions: number[] = [];
  const cellPattern = /class="cell-wrap/g;
  let pos: RegExpExecArray | null;
  while ((pos = cellPattern.exec(html)) !== null) {
    positions.push(pos.index);
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : start + 6000;
    const item = html.slice(start, end);

    try {
      // 提取房源 ID
      const idMatch = item.match(/\/sale\/(S\d+)\//);
      const sourceId = idMatch ? idMatch[1] : '';

      // 从 alt 属性提取小区名（格式："小区名户型面积价格二手房图片")
      const altMatch = item.match(/alt="([^"]+?)二手房图片"/);
      const altText = altMatch ? altMatch[1] : '';
      const communityMatch = altText.match(/^(.+?)(?:\d室\d厅|\d+㎡|\d+万)/);
      const community = (communityMatch ? communityMatch[1] : altText).trim();

      // 标题（房源描述）
      const titleMatch = item.match(/class="content-title"[^>]*>([\s\S]*?)<\/span>/);
      const title = titleMatch ? titleMatch[1].trim() : community;

      // 户型
      const roomsMatch = item.match(/(\d室\d厅)/);
      const rooms = roomsMatch ? roomsMatch[1] : '';

      // 面积
      const areaMatch = item.match(/([\d.]+)\s*㎡/);
      const area = areaMatch ? parseFloat(areaMatch[1]) : 0;

      // 朝向
      const orientMatch = item.match(/content-desc"[^>]*>\s*(东|南|西|北|东南|东北|西南|西北|南北)\s*</);
      const orientation = orientMatch ? orientMatch[1] : '';

      // 区域（取 desc-wrap-community 中最后两个 content-desc）
      const descSection = item.match(/class="desc-wrap-community"[^>]*>([\s\S]*?)<\/div>/);
      let districtName = '';
      if (descSection) {
        const descs = [...descSection[1].matchAll(/content-desc"[^>]*>\s*([^\s<]{2,6})\s*</g)];
        if (descs.length >= 2) districtName = descs[descs.length - 2][1];
      }

      // 总价（万）
      const priceMatch = item.match(/class="content-price"[^>]*>([\d.]+)<\/span>/);
      const totalPriceWan = priceMatch ? parseFloat(priceMatch[1]) : 0;
      const totalPrice = Math.round(totalPriceWan * 10000);

      // 单价
      const unitPriceMatch = item.match(/([\d,]+)元\/㎡/);
      const unitPrice = unitPriceMatch
        ? parseInt(unitPriceMatch[1].replace(/,/g, ''))
        : (area > 0 ? Math.round(totalPrice / area) : 0);

      // 过滤无效数据
      if (!community || totalPrice <= 0 || area <= 0) continue;

      results.push({
        source: 'anjuke',
        sourceId: sourceId || `anjuke_${Date.now()}_${i}`,
        title: title || community,
        address: `${districtName ? districtName + ' ' : ''}${community}`,
        community,
        totalPrice,
        unitPrice,
        area,
        rooms,
        floor: 0,
        totalFloor: 0,
        orientation,
        decoration: '',
        buildYear: 0,
        dealDate: new Date().toISOString().slice(0, 10),
        listingPrice: totalPrice,
        dealCycle: 0,
        cityName,
        districtName,
        sourceUrl,
      });
    } catch (e) {
      // 跳过解析失败的条目
    }
  }

  return results;
}
