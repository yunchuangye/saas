#!/usr/bin/env python3
"""
58同城 深圳二手房 专用采集脚本
==============================
功能：
  - 采集 58同城深圳二手房列表页（支持多页翻页）
  - 自动提取：小区名、地址、户型、面积、楼层、朝向、装修、建年、总价、单价、来源链接
  - 自动通过 community 名称匹配 estates.estate_id
  - 写入 MySQL gujia 数据库的 cases 表（自动去重）
  - 支持 Cookie 注入绕过反爬（首次需在浏览器登录 58同城）

使用方法：
  pip install playwright pymysql beautifulsoup4
  playwright install chromium
  python3 58_scraper.py

配置：修改下方 CONFIG 字典
"""

import asyncio
import re
import time
import json
import logging
from datetime import datetime
from urllib.parse import urljoin

import pymysql
import pymysql.cursors
from bs4 import BeautifulSoup

# ── 日志配置 ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('58_scraper.log', encoding='utf-8')
    ]
)
log = logging.getLogger(__name__)

# ── 采集配置 ──────────────────────────────────────────────
CONFIG = {
    # 目标城市（修改前缀即可切换城市，如 bj=北京, sh=上海, gz=广州）
    "city_prefix": "sz",
    "start_url": "https://sz.58.com/ershoufang/",
    "max_pages": 5,           # 最多采集页数（建议不超过 10 页，避免被封）
    "delay": 3.0,             # 每页延迟秒数
    "headless": False,        # False=显示浏览器窗口（方便手动处理验证码）
    "source_name": "58同城",
    # MySQL 连接
    "db": {
        "host": "localhost",
        "port": 3306,
        "user": "gujia",
        "password": "gujia123456",
        "db": "gujia",
        "charset": "utf8mb4",
    },
    # Cookie 文件路径（可选，用于绕过登录验证）
    "cookie_file": "58_cookies.json",
}

# ── CSS 选择器（58同城二手房列表页）──────────────────────
SELECTORS = {
    # 列表项容器（两种可能的 class 名）
    "list_item": "ul.house-list-wrap > li.list-item, section.list > div.property",
    # 各字段选择器（相对于列表项容器）
    "community":   ".property-content-title-name, .house-title a",
    "address":     ".property-content-info-comm-address, .house-comm-address",
    "info_texts":  ".property-content-info-text, .house-info span",
    "total_price": ".property-price-total, .price-total",
    "unit_price":  ".property-price-average, .price-average",
    "source_url":  "a.property-content-title, a.house-title",
    # 下一页按钮
    "next_page":   "a.next, .pager a[rel='next'], .pagination a.next",
}


# ── 数据库操作 ────────────────────────────────────────────
def get_db_conn():
    return pymysql.connect(
        cursorclass=pymysql.cursors.DictCursor,
        **CONFIG["db"]
    )


def resolve_estate_id(conn, community: str) -> int | None:
    """通过小区名匹配 estates.name，返回 estate_id（精确→模糊→反包含）"""
    if not community:
        return None
    with conn.cursor() as cur:
        # 1. 精确匹配
        cur.execute("SELECT id FROM estates WHERE name = %s LIMIT 1", (community,))
        row = cur.fetchone()
        if row:
            return row["id"]
        # 2. 数据库名包含采集名（如 "碧桂园翡翠湾" 包含 "翡翠湾"）
        cur.execute("SELECT id FROM estates WHERE name LIKE %s LIMIT 1", (f"%{community}%",))
        row = cur.fetchone()
        if row:
            return row["id"]
        # 3. 采集名包含数据库名（如 "阳光花园二期" 包含 "阳光花园"）
        cur.execute("SELECT id, name FROM estates WHERE %s LIKE CONCAT('%%', name, '%%') LIMIT 1", (community,))
        row = cur.fetchone()
        if row:
            return row["id"]
    return None


def upsert_case(conn, data: dict) -> tuple[bool, str]:
    """插入案例，按 source_url 去重"""
    # 去重检查
    if data.get("source_url"):
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM cases WHERE source_url = %s LIMIT 1", (data["source_url"],))
            if cur.fetchone():
                return False, "重复(source_url)"

    # 自动匹配 estate_id
    if data.get("community") and not data.get("estate_id"):
        eid = resolve_estate_id(conn, data["community"])
        if eid:
            data["estate_id"] = eid
            log.info(f"  ✅ 匹配楼盘: {data['community']} → estate_id={eid}")
        else:
            log.info(f"  ⚠️  未匹配楼盘: {data['community']}")

    # 过滤只保留 cases 表已有字段
    CASES_COLS = {
        "city_id", "estate_id", "building_id", "unit_id", "address", "area",
        "floor", "total_floors", "orientation", "property_type", "transaction_type",
        "price", "unit_price", "total_price", "listing_price", "rooms_str",
        "decoration", "build_year", "deal_date", "transaction_date", "deal_cycle",
        "community", "district", "sub_district", "city", "source", "source_id",
        "source_url", "is_verified", "is_anomaly", "remark"
    }
    row = {k: v for k, v in data.items() if k in CASES_COLS and v is not None and v != ""}

    if not row:
        return False, "无有效字段"

    cols = ", ".join(f"`{k}`" for k in row)
    placeholders = ", ".join(["%s"] * len(row))
    try:
        with conn.cursor() as cur:
            cur.execute(f"INSERT INTO `cases` ({cols}) VALUES ({placeholders})", list(row.values()))
        conn.commit()
        return True, "OK"
    except Exception as e:
        conn.rollback()
        return False, str(e)


# ── 数据清洗 ──────────────────────────────────────────────
def clean_price(text: str, is_unit_price=False) -> int | None:
    """价格清洗：万元→元"""
    if not text:
        return None
    text = text.strip()
    m = re.search(r'([\d\.]+)', text)
    if not m:
        return None
    val = float(m.group(1))
    if is_unit_price:
        return int(val)  # 单价已经是元/㎡
    # 总价：如果包含"万"或数值<1000，认为是万元单位
    if "万" in text or val < 10000:
        return int(val * 10000)
    return int(val)


def clean_area(text: str) -> float | None:
    if not text:
        return None
    m = re.search(r'([\d\.]+)', text)
    return float(m.group(1)) if m else None


def clean_floor(text: str) -> int | None:
    if not text:
        return None
    m = re.search(r'(\d+)', text)
    return int(m.group(1)) if m else None


def clean_year(text: str) -> int | None:
    if not text:
        return None
    m = re.search(r'(19|20)\d{2}', text)
    return int(m.group()) if m else None


# ── 页面解析 ──────────────────────────────────────────────
def parse_list_page(html: str, base_url: str) -> list[dict]:
    """解析列表页，返回案例数据列表"""
    soup = BeautifulSoup(html, 'html.parser')
    items = []

    # 尝试多种列表容器选择器
    containers = (
        soup.select("ul.house-list-wrap > li.list-item") or
        soup.select("section.list > div.property") or
        soup.select("ul.house-list > li") or
        soup.select("div.list-wrap li")
    )

    log.info(f"  找到 {len(containers)} 条房源")

    for el in containers:
        data = {
            "transaction_type": "sale",
            "source": CONFIG["source_name"],
        }

        # 小区名
        for sel in [".property-content-title-name", ".house-title a", ".title a"]:
            node = el.select_one(sel)
            if node:
                data["community"] = node.get_text(strip=True)
                break

        # 地址
        for sel in [".property-content-info-comm-address", ".house-comm-address", ".comm-address"]:
            node = el.select_one(sel)
            if node:
                data["address"] = node.get_text(strip=True)
                break

        # 房屋信息文本（户型/面积/楼层/朝向/装修/建年）
        info_texts = []
        for sel in [".property-content-info-text", ".house-info span", ".info span"]:
            nodes = el.select(sel)
            if nodes:
                info_texts = [n.get_text(strip=True) for n in nodes]
                break

        # 也尝试从整体 info 文本中提取
        if not info_texts:
            for sel in [".property-content-info", ".house-info"]:
                node = el.select_one(sel)
                if node:
                    info_texts = [t.strip() for t in node.get_text("|", strip=True).split("|") if t.strip()]
                    break

        for i, txt in enumerate(info_texts):
            if re.search(r'\d+室', txt):
                data["rooms_str"] = txt
            elif re.search(r'[\d\.]+平', txt):
                data["area"] = clean_area(txt)
            elif re.search(r'层|楼层', txt):
                data["floor"] = clean_floor(txt)
            elif re.search(r'东|西|南|北|朝', txt):
                data["orientation"] = txt
            elif re.search(r'精装|简装|毛坯|豪装|中装', txt):
                data["decoration"] = txt
            elif re.search(r'(19|20)\d{2}年?建', txt):
                data["build_year"] = clean_year(txt)

        # 总价
        for sel in [".property-price-total", ".price-total", ".price .num", ".total-price"]:
            node = el.select_one(sel)
            if node:
                data["total_price"] = clean_price(node.get_text(strip=True))
                break

        # 单价
        for sel in [".property-price-average", ".price-average", ".unit-price", ".price .unit"]:
            node = el.select_one(sel)
            if node:
                data["unit_price"] = clean_price(node.get_text(strip=True), is_unit_price=True)
                break

        # 来源链接
        for sel in ["a.property-content-title", "a.house-title", "a.title", "a[href*='ershoufang']"]:
            node = el.select_one(sel)
            if node and node.get("href"):
                href = node["href"]
                if not href.startswith("http"):
                    href = urljoin(base_url, href)
                data["source_url"] = href
                # 提取 source_id
                m = re.search(r'/(\d+)\.htm', href)
                if m:
                    data["source_id"] = m.group(1)
                break

        if data.get("community") or data.get("source_url"):
            items.append(data)

    return items


def get_next_page_url(html: str, current_url: str) -> str | None:
    """提取下一页 URL"""
    soup = BeautifulSoup(html, 'html.parser')
    for sel in ["a.next", ".pager a[rel='next']", ".pagination a.next", "a:contains('下一页')"]:
        try:
            node = soup.select_one(sel)
            if node and node.get("href"):
                href = node["href"]
                if not href.startswith("http"):
                    href = urljoin(current_url, href)
                return href
        except Exception:
            pass
    # 58同城翻页规律：/ershoufang/pn2/
    m = re.search(r'/pn(\d+)/', current_url)
    if m:
        next_pn = int(m.group(1)) + 1
        return re.sub(r'/pn\d+/', f'/pn{next_pn}/', current_url)
    else:
        # 第一页没有 pn，插入 pn2
        return re.sub(r'(ershoufang/)', r'\1pn2/', current_url)


# ── 主采集逻辑 ────────────────────────────────────────────
async def scrape():
    from playwright.async_api import async_playwright

    conn = get_db_conn()
    log.info("✅ 数据库连接成功")

    total_saved = 0
    total_dup = 0
    current_url = CONFIG["start_url"]

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=CONFIG["headless"],
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 768},
            locale="zh-CN",
        )

        # 加载 Cookie（如果存在）
        import os
        if os.path.exists(CONFIG["cookie_file"]):
            with open(CONFIG["cookie_file"]) as f:
                cookies = json.load(f)
            await context.add_cookies(cookies)
            log.info(f"✅ 已加载 Cookie: {CONFIG['cookie_file']}")

        page = await context.new_page()
        # 隐藏 webdriver 特征
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        for page_num in range(1, CONFIG["max_pages"] + 1):
            log.info(f"\n📄 第 {page_num} 页: {current_url}")
            try:
                await page.goto(current_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(2)

                # 检测验证码
                title = await page.title()
                if "验证" in title or "安全" in title:
                    log.warning("⚠️  检测到验证码页面！请在浏览器中手动完成验证...")
                    if not CONFIG["headless"]:
                        log.info("等待 30 秒，请手动完成验证...")
                        await asyncio.sleep(30)
                    else:
                        log.error("无头模式无法处理验证码，停止采集")
                        break

                # 等待列表加载
                try:
                    await page.wait_for_selector(
                        ".house-list-wrap, section.list, .list-wrap",
                        timeout=10000
                    )
                except Exception:
                    log.warning("  等待列表超时，尝试直接解析...")

                html = await page.content()

                # 保存 Cookie（供下次使用）
                cookies = await context.cookies()
                with open(CONFIG["cookie_file"], "w") as f:
                    json.dump(cookies, f, ensure_ascii=False, indent=2)

                # 解析数据
                items = parse_list_page(html, current_url)

                if not items:
                    log.warning("  未找到房源数据，可能被反爬或页面结构变化")
                    # 保存 HTML 供调试
                    with open(f"/tmp/58_page_{page_num}.html", "w") as f:
                        f.write(html)
                    log.info(f"  已保存 HTML 到 /tmp/58_page_{page_num}.html")
                    break

                # 写库
                page_saved = 0
                for item in items:
                    ok, msg = upsert_case(conn, item)
                    if ok:
                        total_saved += 1
                        page_saved += 1
                        log.info(f"  ✅ 入库: {item.get('community', '?')} {item.get('total_price', '?')}元")
                    else:
                        total_dup += 1
                        log.debug(f"  ⏭  跳过: {msg}")

                log.info(f"  本页入库 {page_saved} 条，跳过 {len(items)-page_saved} 条")

                # 翻页
                next_url = get_next_page_url(html, current_url)
                if not next_url or next_url == current_url:
                    log.info("已到最后一页")
                    break
                current_url = next_url

                # 延迟
                await asyncio.sleep(CONFIG["delay"])

            except Exception as e:
                log.error(f"  ❌ 第 {page_num} 页出错: {e}")
                break

        await browser.close()

    conn.close()
    log.info(f"\n🎉 采集完成！共入库 {total_saved} 条，跳过重复 {total_dup} 条")


if __name__ == "__main__":
    asyncio.run(scrape())
