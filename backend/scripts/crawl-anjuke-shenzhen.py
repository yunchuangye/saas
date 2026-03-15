#!/usr/bin/env python3
"""
安居客深圳二手房采集脚本
- 使用 Playwright 模拟真实移动端浏览器
- 访问 m.anjuke.com（移动端，反爬较弱）
- 采集深圳二手房数据并写入 MySQL cases 表
- 支持楼盘名去重
"""
import asyncio
import re
import json
import random
import time
import sys
import logging
from datetime import datetime
import pymysql
from playwright.async_api import async_playwright

# ─── 配置 ───────────────────────────────────────────────
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'gujia',
    'password': 'gujia_dev_2026',
    'database': 'gujia',
    'charset': 'utf8mb4',
}
CITY_ID = 2          # 深圳 cityId
DISTRICT_ID = None   # None = 全深圳
MAX_PAGES = 10       # 采集页数
PAGE_SIZE = 20       # 每页房源数（移动端）
DELAY_MIN = 3.0      # 翻页最小延时（秒）
DELAY_MAX = 6.0      # 翻页最大延时（秒）

# ─── 日志 ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/home/ubuntu/saas/logs/anjuke-crawl.log', encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)

# ─── 解析函数 ─────────────────────────────────────────────
def parse_anjuke_items(html: str) -> list[dict]:
    """从安居客移动端 HTML 中提取房源列表"""
    items = re.findall(r'<li[^>]*class="[^"]*item[^"]*"[^>]*>(.*?)</li>', html, re.DOTALL)
    results = []
    for item_html in items:
        if '室' not in item_html or '万' not in item_html:
            continue
        text = re.sub(r'<[^>]+>', ' ', item_html)
        text = re.sub(r'\s+', ' ', text).strip()
        
        result = {}
        
        # 房源标题（小区名）
        title_m = re.search(
            r'([^\s，,]{2,25}(?:花园|苑|园|里|庭|城|府|轩|阁|居|家|湾|台|广场|公寓|大厦|楼|村|院|小区|中心|国际|豪庭|名苑|华府|雅苑|美墅|别墅|洋房|新城|新村|新苑|新区|新盘|东方|西区|南区|北区|碧桂园|万科|保利|恒大|龙湖|中海|招商|华润|绿地|金地|世茂|融创|旭辉|中骏|越秀|富力|雅居乐|佳兆业|星河|卓越|深业|华侨城|华发|深铁|城建|振业|天健|京基|鸿荣源))',
            text
        )
        if title_m:
            result['community'] = title_m.group(1).strip()
        else:
            # 备用：取第一个中文词组
            cn_m = re.search(r'[\u4e00-\u9fa5]{3,20}', text)
            if cn_m:
                result['community'] = cn_m.group(0)
        
        # 户型
        room_m = re.search(r'(\d+)室(\d+)厅(\d+)卫', text)
        if room_m:
            result['rooms'] = f"{room_m.group(1)}室{room_m.group(2)}厅{room_m.group(3)}卫"
        else:
            room_m2 = re.search(r'(\d+)室(\d+)厅', text)
            if room_m2:
                result['rooms'] = f"{room_m2.group(1)}室{room_m2.group(2)}厅"
        
        # 面积（优先"建筑面积XXX㎡"，其次"XXX㎡"）
        area_m = re.search(r'建筑面积\s*(\d+(?:\.\d+)?)㎡', text)
        if not area_m:
            area_m = re.search(r'(\d+(?:\.\d+)?)\s*㎡', text)
        if area_m:
            result['area'] = float(area_m.group(1))
        
        # 总价（万）
        price_m = re.search(r'(\d+(?:\.\d+)?)\s*万', text)
        if price_m:
            result['total_price'] = float(price_m.group(1))
        
        # 单价（元/㎡）
        unit_m = re.search(r'单价\s*(\d+)\s*元/㎡', text)
        if unit_m:
            result['unit_price'] = int(unit_m.group(1))
        elif result.get('area') and result.get('total_price'):
            # 自动计算单价
            result['unit_price'] = int(result['total_price'] * 10000 / result['area'])
        
        # 楼层
        floor_m = re.search(r'(高|中|低)楼层\s*[/（(]?\s*共(\d+)层', text)
        if floor_m:
            result['floor'] = f"{floor_m.group(1)}楼层/共{floor_m.group(2)}层"
        
        # 朝向
        orient_m = re.search(r'朝([东南西北]{1,4})', text)
        if orient_m:
            result['orientation'] = orient_m.group(1)
        
        # 装修
        decor_m = re.search(r'(精装|简装|毛坯|豪装|中装|清水)', text)
        if decor_m:
            result['decoration'] = decor_m.group(1)
        
        # 建成年份
        year_m = re.search(r'(\d{4})\s*年建成', text)
        if year_m:
            result['build_year'] = int(year_m.group(1))
        
        # 区域（深圳各区）
        district_m = re.search(
            r'(福田|南山|罗湖|盐田|宝安|龙岗|龙华|坪山|光明|大鹏|坑梓|坪地|葵涌|南澳)',
            text
        )
        if district_m:
            result['district'] = district_m.group(1)
        
        # 地铁信息
        metro_m = re.search(r'距(\d+号线[^\s，,]{2,15}站)\s*(\d+)米', text)
        if metro_m:
            result['metro'] = f"{metro_m.group(1)} {metro_m.group(2)}米"
        
        # 来源 URL（从 href 提取）
        href_m = re.search(r'href="(https?://[^"]*anjuke[^"]*)"', item_html)
        if href_m:
            result['source_url'] = href_m.group(1)
        
        # 只保留有效数据（至少有面积和价格）
        if result.get('area') and result.get('total_price'):
            results.append(result)
    
    return results


# ─── 数据库操作 ────────────────────────────────────────────
def get_existing_communities(conn) -> set:
    """获取数据库中已存在的小区名（去重基准）"""
    with conn.cursor() as cur:
        cur.execute("SELECT DISTINCT community FROM cases WHERE community IS NOT NULL AND community != ''")
        rows = cur.fetchall()
    return {r[0] for r in rows}


def insert_cases(conn, cases: list[dict], source: str = 'anjuke') -> tuple[int, int]:
    """批量插入案例，返回 (新增数, 跳过数)"""
    existing = get_existing_communities(conn)
    inserted = 0
    skipped = 0
    
    with conn.cursor() as cur:
        for case in cases:
            community = case.get('community', '')
            if not community:
                skipped += 1
                continue
            
            # 楼盘名去重
            if community in existing:
                skipped += 1
                log.debug(f"  跳过重复楼盘: {community}")
                continue
            
            # 计算单价
            unit_price = case.get('unit_price')
            if not unit_price and case.get('area') and case.get('total_price'):
                unit_price = int(case['total_price'] * 10000 / case['area'])
            
            try:
                cur.execute("""
                    INSERT INTO cases (
                        city_id, community, rooms, area, total_price, unit_price,
                        floor, orientation, decoration, build_year,
                        source_url, source, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, NOW(), NOW()
                    )
                """, (
                    CITY_ID,
                    community,
                    case.get('rooms'),
                    case.get('area'),
                    case.get('total_price'),
                    unit_price,
                    case.get('floor'),
                    case.get('orientation'),
                    case.get('decoration'),
                    case.get('build_year'),
                    case.get('source_url'),
                    source,
                ))
                existing.add(community)  # 防止同批次重复
                inserted += 1
                log.info(f"  ✅ 新增: {community} {case.get('rooms','?')} {case.get('area','?')}㎡ {case.get('total_price','?')}万")
            except Exception as e:
                log.warning(f"  ❌ 插入失败 {community}: {e}")
                skipped += 1
    
    conn.commit()
    return inserted, skipped


# ─── 主采集逻辑 ────────────────────────────────────────────
async def crawl_anjuke_shenzhen(max_pages: int = MAX_PAGES):
    """使用 Playwright 采集安居客深圳二手房"""
    log.info(f"🚀 开始采集安居客深圳二手房，计划采集 {max_pages} 页")
    
    # 连接数据库
    conn = pymysql.connect(**DB_CONFIG)
    log.info(f"✅ 数据库连接成功")
    
    total_inserted = 0
    total_skipped = 0
    total_parsed = 0
    
    async with async_playwright() as p:
        # 启动浏览器（模拟 iPhone，移动端反爬较弱）
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        )
        
        # 创建移动端 context
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            locale='zh-CN',
            timezone_id='Asia/Shanghai',
            extra_http_headers={
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        )
        
        # 注入反检测脚本
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
            window.chrome = { runtime: {} };
        """)
        
        page = await context.new_page()
        
        # 先访问主页建立 Cookie
        log.info("📱 访问安居客主页建立 Cookie...")
        try:
            await page.goto("https://m.anjuke.com/", wait_until='domcontentloaded', timeout=15000)
            await asyncio.sleep(random.uniform(2, 3))
        except Exception as e:
            log.warning(f"主页访问失败（忽略）: {e}")
        
        # 逐页采集
        for page_num in range(1, max_pages + 1):
            if page_num == 1:
                url = "https://m.anjuke.com/sz/sale/"
            else:
                url = f"https://m.anjuke.com/sz/sale/?page={page_num}"
            
            log.info(f"\n📄 第 {page_num}/{max_pages} 页: {url}")
            
            try:
                await page.goto(url, wait_until='domcontentloaded', timeout=20000)
                await asyncio.sleep(random.uniform(1.5, 2.5))
                
                # 滚动页面触发懒加载
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                await asyncio.sleep(0.5)
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(1)
                
                # 获取页面 HTML
                html = await page.content()
                
                # 检查是否被拦截
                blocked_keywords = ['验证码', 'captcha', 'verify', '人机验证', '安全验证', '请完成验证']
                is_blocked = any(kw in html.lower() for kw in blocked_keywords)
                
                if is_blocked:
                    log.warning(f"  ⚠️ 第 {page_num} 页被拦截，尝试等待后重试...")
                    await asyncio.sleep(random.uniform(8, 12))
                    html = await page.content()
                    is_blocked = any(kw in html.lower() for kw in blocked_keywords)
                    if is_blocked:
                        log.error(f"  ❌ 第 {page_num} 页持续被拦截，停止采集")
                        break
                
                # 解析房源
                items = parse_anjuke_items(html)
                log.info(f"  解析到 {len(items)} 条有效房源")
                total_parsed += len(items)
                
                if not items:
                    log.warning(f"  ⚠️ 第 {page_num} 页无数据，可能已到末页")
                    # 保存 HTML 供调试
                    with open(f'/tmp/anjuke_page{page_num}.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    log.info(f"  HTML 已保存到 /tmp/anjuke_page{page_num}.html")
                    if page_num > 2:
                        break
                    continue
                
                # 写入数据库
                ins, skip = insert_cases(conn, items)
                total_inserted += ins
                total_skipped += skip
                log.info(f"  📊 本页: 新增 {ins} 条，跳过 {skip} 条（重复）")
                
            except Exception as e:
                log.error(f"  ❌ 第 {page_num} 页采集失败: {e}")
                await asyncio.sleep(5)
                continue
            
            # 翻页延时（模拟人工操作）
            if page_num < max_pages:
                delay = random.uniform(DELAY_MIN, DELAY_MAX)
                log.info(f"  ⏳ 等待 {delay:.1f}s 后翻页...")
                await asyncio.sleep(delay)
        
        await browser.close()
    
    conn.close()
    
    log.info(f"\n{'='*50}")
    log.info(f"✅ 采集完成！")
    log.info(f"   解析房源: {total_parsed} 条")
    log.info(f"   新增入库: {total_inserted} 条")
    log.info(f"   跳过重复: {total_skipped} 条")
    log.info(f"{'='*50}")
    
    return {
        'parsed': total_parsed,
        'inserted': total_inserted,
        'skipped': total_skipped,
    }


if __name__ == '__main__':
    pages = int(sys.argv[1]) if len(sys.argv) > 1 else MAX_PAGES
    result = asyncio.run(crawl_anjuke_shenzhen(pages))
    print(json.dumps(result, ensure_ascii=False))
