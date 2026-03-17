"""
通用解析器 - 支持房天下(fang)、乐有家(leyoujia)、深圳房地产信息平台(szfdc) 等
"""
import re
from scrapling.parser import Selector


def _clean_price(text: str) -> float | None:
    if not text:
        return None
    text = re.sub(r'[^\d.]', '', text)
    try:
        return float(text)
    except ValueError:
        return None


def _clean_area(text: str) -> float | None:
    if not text:
        return None
    m = re.search(r'[\d.]+', text)
    return float(m.group()) if m else None


def parse_fang_sold_list(html: str, city_name: str, city_id: int,
                          source_url: str) -> list[dict]:
    """解析房天下 成交案例列表"""
    page = Selector(html)
    results = []

    items = page.css('.shop_list .list_dl, .house-item, .newhouse_loupan_list li')

    for item in items:
        try:
            title_el = item.css('.tit a, h3 a, .house-title a')
            title = title_el.css('::text').get('').strip() if title_el else ''

            estate_el = item.css('.community, .estate-name, .xq-name')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else title

            district_el = item.css('.area, .district, .region')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            area_el = item.css('.area-num, .house-area, .mj')
            area = _clean_area(area_el.css('::text').get('') if area_el else '')

            room_el = item.css('.room, .huxing, .room-type')
            room_type = room_el.css('::text').get('').strip() if room_el else None

            price_el = item.css('.price strong, .total-price, .price-num')
            total_price = _clean_price(price_el.css('::text').get('') if price_el else '')

            unit_price_el = item.css('.unit-price, .price-per, .dj')
            unit_price = _clean_price(unit_price_el.css('::text').get('') if unit_price_el else '')

            deal_date_el = item.css('.deal-date, .sold-date, .time')
            deal_date_text = deal_date_el.css('::text').get('').strip() if deal_date_el else ''
            deal_date = deal_date_text[:10] if deal_date_text else None

            link_el = item.css('a[href]')
            href = link_el.attrib.get('href', '') if link_el else ''
            source_id = re.search(r'(\d{6,})', href)
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
                'total_price': total_price,
                'unit_price': unit_price,
                'deal_date': deal_date,
                'data_type': 'sold_cases',
                'source': 'fang',
                'source_id': source_id,
                'source_url': href,
            })
        except Exception:
            continue

    return results


def parse_leyoujia_sold_list(html: str, city_name: str, city_id: int,
                              source_url: str) -> list[dict]:
    """解析乐有家 成交案例列表"""
    page = Selector(html)
    results = []

    items = page.css('.house-list li, .list-item, .house-item')

    for item in items:
        try:
            title_el = item.css('.house-title a, .title a, h3 a')
            title = title_el.css('::text').get('').strip() if title_el else ''

            estate_el = item.css('.community-name, .estate-name, .xq-name')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else ''

            district_el = item.css('.district, .area, .location')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            area_el = item.css('.area, .house-area')
            area = _clean_area(area_el.css('::text').get('') if area_el else '')

            room_el = item.css('.room-type, .huxing')
            room_type = room_el.css('::text').get('').strip() if room_el else None

            price_el = item.css('.total-price strong, .price-num, .price strong')
            total_price = _clean_price(price_el.css('::text').get('') if price_el else '')

            unit_price_el = item.css('.unit-price, .price-per')
            unit_price = _clean_price(unit_price_el.css('::text').get('') if unit_price_el else '')

            deal_date_el = item.css('.deal-date, .sold-date')
            deal_date_text = deal_date_el.css('::text').get('').strip() if deal_date_el else ''
            deal_date = deal_date_text[:10] if deal_date_text else None

            link_el = item.css('a[href]')
            href = link_el.attrib.get('href', '') if link_el else ''
            source_id = re.search(r'(\d{6,})', href)
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
                'total_price': total_price,
                'unit_price': unit_price,
                'deal_date': deal_date,
                'data_type': 'sold_cases',
                'source': 'leyoujia',
                'source_id': source_id,
                'source_url': href,
            })
        except Exception:
            continue

    return results


def parse_szfdc_estate_list(html: str, city_name: str, city_id: int,
                             source_url: str) -> list[dict]:
    """解析深圳房地产信息平台 楼盘列表"""
    page = Selector(html)
    results = []

    items = page.css('table.list tr, .project-list li, .estate-item')

    for item in items:
        try:
            name_el = item.css('td:nth-child(2) a, .project-name a, .estate-name a')
            name = name_el.css('::text').get('').strip() if name_el else ''

            district_el = item.css('td:nth-child(3), .district, .area')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            address_el = item.css('td:nth-child(4), .address')
            address = address_el.css('::text').get('').strip() if address_el else ''

            developer_el = item.css('td:nth-child(5), .developer')
            developer = developer_el.css('::text').get('').strip() if developer_el else ''

            price_el = item.css('td:nth-child(6), .avg-price, .price')
            avg_price = _clean_price(price_el.css('::text').get('') if price_el else '')

            href = name_el.attrib.get('href', '') if name_el else ''

            if not name:
                continue

            results.append({
                'city_id': city_id,
                'city_name': city_name,
                'district_name': district_name,
                'name': name,
                'address': address,
                'developer': developer,
                'avg_price': avg_price,
                'source': 'szfdc',
                'source_url': href,
            })
        except Exception:
            continue

    return results
