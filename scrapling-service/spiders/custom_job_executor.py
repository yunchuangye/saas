# -*- coding: utf-8 -*-
"""
通用自定义爬虫任务执行器
支持：多级页面采集、字段映射到数据库表、翻页、代理
"""
import time
import traceback
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from utils.db import write_log, get_db_connection


def _extract_fields(item_soup, fields: list) -> dict:
    """从 BeautifulSoup 节点中按字段配置提取数据"""
    extracted = {}
    for field in fields:
        selector = field.get("selector", "")
        if not selector:
            continue
        el = item_soup.select_one(selector)
        if el:
            if el.name in ("input", "select", "textarea"):
                extracted[field["name"]] = el.get("value", "").strip()
            else:
                extracted[field["name"]] = el.get_text(strip=True)
        else:
            extracted[field["name"]] = None
    return extracted


def _save_to_db(job_id: int, fields: list, data: dict):
    """将提取到的数据按字段映射写入对应的数据库表"""
    # 按目标表分组
    table_data: dict = {}
    for field in fields:
        fname = field.get("name")
        ttable = field.get("target_table")
        tcol = field.get("target_column")
        if not (fname and ttable and tcol):
            continue
        if data.get(fname) is None:
            continue
        if ttable not in table_data:
            table_data[ttable] = {}
        table_data[ttable][tcol] = data[fname]

    if not table_data:
        return

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        for table, row in table_data.items():
            if not row:
                continue
            cols = ", ".join(f"`{c}`" for c in row.keys())
            placeholders = ", ".join(["%s"] * len(row))
            sql = f"INSERT IGNORE INTO `{table}` ({cols}) VALUES ({placeholders})"
            cursor.execute(sql, list(row.values()))
        conn.commit()
        write_log(job_id, "info", f"已写入数据: {json.dumps(data, ensure_ascii=False)[:200]}")
    except Exception as e:
        conn.rollback()
        write_log(job_id, "error", f"写入数据库失败: {e} | 数据: {data}")
    finally:
        cursor.close()
        conn.close()


def _make_absolute_url(base_url: str, href: str) -> str:
    """将相对 URL 转换为绝对 URL"""
    if href.startswith("http"):
        return href
    return urljoin(base_url, href)


def execute_custom_job(job_id: int, config: dict, fetcher=None):
    """
    执行自定义采集任务。

    参数：
        job_id: 任务 ID（用于写日志）
        config: 采集配置字典，包含：
            - start_url: 起始 URL
            - list_item_selector: 列表项 CSS 选择器
            - fields: 字段映射列表
            - pagination_selector: 翻页按钮选择器（可选）
            - detail_page_link_selector: 详情页链接选择器（可选）
            - max_pages: 最大采集页数（默认 10）
            - delay: 请求延迟秒数（默认 2）
            - use_proxy: 是否使用代理（默认 False）
        fetcher: 可选的自定义 fetcher，默认使用 requests
    """
    start_url = config.get("start_url", "").strip()
    list_item_selector = config.get("list_item_selector", "").strip()
    fields = config.get("fields", [])
    pagination_selector = config.get("pagination_selector", "").strip()
    detail_page_link_selector = config.get("detail_page_link_selector", "").strip()
    max_pages = int(config.get("max_pages", 10))
    delay = float(config.get("delay", 2))

    if not start_url:
        raise ValueError("缺少 start_url 配置")
    if not list_item_selector:
        raise ValueError("缺少 list_item_selector 配置")
    if not fields:
        raise ValueError("缺少 fields 字段映射配置")

    # 默认使用 requests 作为 fetcher
    if fetcher is None:
        import requests

        session = requests.Session()
        session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "zh-CN,zh;q=0.9",
        })

        class _SimpleFetcher:
            def fetch(self, url):
                resp = session.get(url, timeout=30)
                resp.encoding = resp.apparent_encoding or "utf-8"
                return resp.text

        fetcher = _SimpleFetcher()

    # 主采集循环
    current_url = start_url
    page_count = 0
    total_saved = 0

    write_log(job_id, "info", f"自定义采集任务开始，起始 URL: {start_url}")

    while current_url and page_count < max_pages:
        page_count += 1
        write_log(job_id, "info", f"正在采集第 {page_count}/{max_pages} 页: {current_url}")

        try:
            html = fetcher.fetch(current_url)
            soup = BeautifulSoup(html, "html.parser")
            items = soup.select(list_item_selector)

            if not items:
                write_log(
                    job_id, "warning",
                    f"页面 {current_url} 未找到列表项 (选择器: {list_item_selector})，停止采集"
                )
                break

            write_log(job_id, "info", f"第 {page_count} 页找到 {len(items)} 条列表项")

            for item in items:
                # 1. 从列表项提取数据
                row_data = _extract_fields(item, fields)

                # 2. 如果配置了详情页，进入详情页补充数据
                if detail_page_link_selector:
                    link_el = item.select_one(detail_page_link_selector)
                    href = link_el.get("href") if link_el else None
                    if href:
                        detail_url = _make_absolute_url(current_url, href)
                        try:
                            detail_html = fetcher.fetch(detail_url)
                            detail_soup = BeautifulSoup(detail_html, "html.parser")
                            detail_data = _extract_fields(detail_soup, fields)
                            # 详情页数据优先覆盖列表页同名字段
                            for k, v in detail_data.items():
                                if v is not None:
                                    row_data[k] = v
                            time.sleep(delay)
                        except Exception as e:
                            write_log(job_id, "warning", f"详情页采集失败 {detail_url}: {e}")

                # 3. 写入数据库
                _save_to_db(job_id, fields, row_data)
                total_saved += 1

            # 4. 翻页
            if pagination_selector:
                next_el = soup.select_one(pagination_selector)
                if next_el:
                    next_href = next_el.get("href")
                    if next_href:
                        current_url = _make_absolute_url(current_url, next_href)
                    else:
                        current_url = None
                else:
                    current_url = None
            else:
                current_url = None

        except Exception as e:
            write_log(job_id, "error", f"采集页面 {current_url} 失败: {e}\n{traceback.format_exc()}")
            break

        if current_url:
            time.sleep(delay)

    write_log(job_id, "info", f"自定义采集任务完成，共写入 {total_saved} 条数据")
    return {"total_saved": total_saved, "pages_crawled": page_count}
