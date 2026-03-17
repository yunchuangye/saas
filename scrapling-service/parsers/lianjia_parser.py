"""
链家/贝壳 解析器 - 使用 Scrapling 自适应选择器解析房源数据
支持：链家(lianjia)、贝壳(beike)
"""
import re
from scrapling.parser import Selector


def _clean_price(text: str) -> float | None:
    """清洗价格字符串，返回万元为单位的浮点数"""
    if not text:
        return None
    text = re.sub(r'[^\d.]', '', text)
    try:
        return float(text)
    except ValueError:
        return None


def _clean_area(text: str) -> float | None:
    """清洗面积字符串，返回平方米"""
    if not text:
        return None
    m = re.search(r'[\d.]+', text)
    return float(m.group()) if m else None


def _parse_floor(text: str) -> tuple[int | None, int | None]:
    """解析楼层信息，返回 (floor_no, total_floors)"""
    if not text:
        return None, None
    m = re.search(r'(\d+)', text)
    floor_no = int(m.group(1)) if m else None
    m2 = re.search(r'共(\d+)层', text)
    total_floors = int(m2.group(1)) if m2 else None
    return floor_no, total_floors


def parse_lianjia_sold_list(html: str, city_name: str, city_id: int,
                             source_url: str, source: str = 'lianjia') -> list[dict]:
    """
    解析链家/贝壳 成交案例列表页
    URL 格式: https://sz.lianjia.com/chengjiao/pg1/
    """
    page = Selector(html)
    results = []

    # 链家和贝壳的列表容器选择器相同
    items = page.css('.listContent li, .list-wrap li.LOGCLICKDATA')
    if not items:
        # 尝试备用选择器
        items = page.css('li.sold-item, .house-lst li')

    for item in items:
        try:
            # 标题（房源名称）
            title_el = item.css('.title a, .house-title a')
            title = title_el.css('::text').get('').strip() if title_el else ''

            # 基本信息行（户型、面积、朝向、装修、楼层、年代）
            info_els = item.css('.address .houseInfo::text, .info-row::text')
            info_text = info_els.get('') if info_els else ''
            info_parts = [p.strip() for p in info_text.split('|') if p.strip()]

            room_type = info_parts[0] if len(info_parts) > 0 else None
            area = _clean_area(info_parts[1]) if len(info_parts) > 1 else None
            orientation = info_parts[2] if len(info_parts) > 2 else None
            decoration = info_parts[3] if len(info_parts) > 3 else None
            floor_text = info_parts[4] if len(info_parts) > 4 else ''
            floor_no, total_floors = _parse_floor(floor_text)

            # 小区名称
            estate_el = item.css('.positionInfo a:first-child, .community-name a')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else ''

            # 区域
            district_el = item.css('.positionInfo a:last-child, .district-name')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            # 成交总价（万元）
            total_price_el = item.css('.totalPrice span, .deal-price .price-num')
            total_price = _clean_price(total_price_el.css('::text').get('') if total_price_el else '')

            # 成交单价（元/平方米）
            unit_price_el = item.css('.unitPrice span, .unit-price span')
            unit_price_text = unit_price_el.css('::text').get('') if unit_price_el else ''
            unit_price = _clean_price(unit_price_text)

            # 成交日期
            deal_date_el = item.css('.dealDate, .deal-date')
            deal_date_text = deal_date_el.css('::text').get('').strip() if deal_date_el else ''
            deal_date = deal_date_text[:10] if deal_date_text else None

            # 来源 ID（从链接提取）
            link_el = item.css('.title a, .house-title a')
            href = link_el.attrib.get('href', '') if link_el else ''
            source_id = re.search(r'/(\d+)\.html', href)
            source_id = source_id.group(1) if source_id else None

            if not estate_name and not title:
                continue

            results.append({
                'city_id': city_id,
                'city_name': city_name,
                'district_name': district_name,
                'estate_name': estate_name,
                'raw_title': title,
                'room_type': room_type,
                'area': area,
                'orientation': orientation,
                'decoration': decoration,
                'floor_no': floor_no,
                'total_floors': total_floors,
                'total_price': total_price,
                'unit_price': unit_price,
                'deal_date': deal_date,
                'data_type': 'sold_cases',
                'source': source,
                'source_id': source_id,
                'source_url': f"https://{source}.com{href}" if href.startswith('/') else href,
            })
        except Exception:
            continue

    return results


def parse_lianjia_listing_list(html: str, city_name: str, city_id: int,
                                source_url: str, source: str = 'lianjia') -> list[dict]:
    """
    解析链家/贝壳 在售二手房列表页
    URL 格式: https://sz.lianjia.com/ershoufang/pg1/
    """
    page = Selector(html)
    results = []

    items = page.css('.sellListContent li.clear, .list-wrap li.LOGCLICKDATA')
    if not items:
        items = page.css('li.house-item, .house-lst li')

    for item in items:
        try:
            title_el = item.css('.title a, .house-title a')
            title = title_el.css('::text').get('').strip() if title_el else ''

            info_text = item.css('.houseInfo::text').get('') or ''
            info_parts = [p.strip() for p in info_text.split('|') if p.strip()]

            room_type = info_parts[0] if len(info_parts) > 0 else None
            area = _clean_area(info_parts[1]) if len(info_parts) > 1 else None
            orientation = info_parts[2] if len(info_parts) > 2 else None
            decoration = info_parts[3] if len(info_parts) > 3 else None
            floor_text = info_parts[4] if len(info_parts) > 4 else ''
            floor_no, total_floors = _parse_floor(floor_text)

            estate_el = item.css('.positionInfo a:first-child')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else ''

            district_el = item.css('.positionInfo a:last-child')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            total_price_el = item.css('.totalPrice span')
            total_price = _clean_price(total_price_el.css('::text').get('') if total_price_el else '')

            unit_price_el = item.css('.unitPrice span')
            unit_price = _clean_price(unit_price_el.css('::text').get('') if unit_price_el else '')

            link_el = item.css('.title a')
            href = link_el.attrib.get('href', '') if link_el else ''
            source_id = re.search(r'/(\d+)\.html', href)
            source_id = source_id.group(1) if source_id else None

            if not estate_name and not title:
                continue

            results.append({
                'city_id': city_id,
                'city_name': city_name,
                'district_name': district_name,
                'estate_name': estate_name,
                'raw_title': title,
                'room_type': room_type,
                'area': area,
                'orientation': orientation,
                'decoration': decoration,
                'floor_no': floor_no,
                'total_floors': total_floors,
                'total_price': total_price,
                'unit_price': unit_price,
                'data_type': 'listing',
                'source': source,
                'source_id': source_id,
                'source_url': f"https://{source}.com{href}" if href.startswith('/') else href,
            })
        except Exception:
            continue

    return results


def parse_lianjia_estate_list(html: str, city_name: str, city_id: int,
                               source_url: str) -> list[dict]:
    """
    解析链家 楼盘列表页
    URL 格式: https://sz.lianjia.com/xiaoqu/pg1/
    """
    page = Selector(html)
    results = []

    items = page.css('li.xiaoquListItem, .xq-list li')
    if not items:
        items = page.css('.listContent li')

    for item in items:
        try:
            name_el = item.css('.title a, .xq-name a')
            name = name_el.css('::text').get('').strip() if name_el else ''

            address_el = item.css('.positionInfo, .address')
            address = address_el.css('::text').get('').strip() if address_el else ''

            district_el = item.css('.positionInfo a:first-child')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            avg_price_el = item.css('.totalPrice span, .xiaoquUnitPrice')
            avg_price_text = avg_price_el.css('::text').get('') if avg_price_el else ''
            avg_price = _clean_price(avg_price_text)

            href = name_el.attrib.get('href', '') if name_el else ''

            if not name:
                continue

            results.append({
                'city_id': city_id,
                'city_name': city_name,
                'district_name': district_name,
                'name': name,
                'address': address,
                'avg_price': avg_price,
                'source': 'lianjia',
                'source_url': f"https://lianjia.com{href}" if href.startswith('/') else href,
            })
        except Exception:
            continue

    return results
