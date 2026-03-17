"""
安居客 解析器 - 使用 Scrapling 自适应选择器解析房源数据
支持移动端（m.anjuke.com）和 PC 端（anjuke.com）
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


def parse_anjuke_sold_list(html: str, city_name: str, city_id: int,
                            source_url: str) -> list[dict]:
    """
    解析安居客 成交案例列表页（移动端）
    URL: https://m.anjuke.com/sale/chengjiao/shenzhen/
    """
    page = Selector(html)
    results = []

    items = page.css('.list-item, .house-item, li.item')
    if not items:
        items = page.css('.property-item, .sale-item')

    for item in items:
        try:
            title_el = item.css('.house-title, .item-title, h3')
            title = title_el.css('::text').get('').strip() if title_el else ''

            estate_el = item.css('.community-name, .estate-name, .item-community')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else ''

            district_el = item.css('.item-area, .district, .location')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            area_el = item.css('.area, .house-area, .item-area-size')
            area = _clean_area(area_el.css('::text').get('') if area_el else '')

            room_el = item.css('.room-type, .huxing, .item-room')
            room_type = room_el.css('::text').get('').strip() if room_el else None

            price_el = item.css('.price-num, .total-price, .item-price strong')
            total_price = _clean_price(price_el.css('::text').get('') if price_el else '')

            unit_price_el = item.css('.unit-price, .price-per, .item-unit-price')
            unit_price = _clean_price(unit_price_el.css('::text').get('') if unit_price_el else '')

            deal_date_el = item.css('.deal-date, .sold-date, .item-date')
            deal_date_text = deal_date_el.css('::text').get('').strip() if deal_date_el else ''
            deal_date = deal_date_text[:10] if deal_date_text else None

            link_el = item.css('a[href]')
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
                'total_price': total_price,
                'unit_price': unit_price,
                'deal_date': deal_date,
                'data_type': 'sold_cases',
                'source': 'anjuke',
                'source_id': source_id,
                'source_url': href,
            })
        except Exception:
            continue

    return results


def parse_anjuke_listing_list(html: str, city_name: str, city_id: int,
                               source_url: str) -> list[dict]:
    """
    解析安居客 在售二手房列表页
    """
    page = Selector(html)
    results = []

    items = page.css('.list-item, .house-item, li.item, .property-item')

    for item in items:
        try:
            title_el = item.css('.house-title, .item-title, h3')
            title = title_el.css('::text').get('').strip() if title_el else ''

            estate_el = item.css('.community-name, .estate-name')
            estate_name = estate_el.css('::text').get('').strip() if estate_el else ''

            district_el = item.css('.item-area, .district')
            district_name = district_el.css('::text').get('').strip() if district_el else ''

            area_el = item.css('.area, .house-area')
            area = _clean_area(area_el.css('::text').get('') if area_el else '')

            room_el = item.css('.room-type, .huxing')
            room_type = room_el.css('::text').get('').strip() if room_el else None

            price_el = item.css('.price-num, .total-price strong')
            total_price = _clean_price(price_el.css('::text').get('') if price_el else '')

            unit_price_el = item.css('.unit-price, .price-per')
            unit_price = _clean_price(unit_price_el.css('::text').get('') if unit_price_el else '')

            link_el = item.css('a[href]')
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
                'total_price': total_price,
                'unit_price': unit_price,
                'data_type': 'listing',
                'source': 'anjuke',
                'source_id': source_id,
                'source_url': href,
            })
        except Exception:
            continue

    return results
