"""
Scrapling 任务执行器
负责根据任务配置调度采集引擎、解析数据、写入数据库
"""
import json
from datetime import datetime

from utils.db import (
    get_job, update_job_status, update_job_progress,
    write_log, save_raw_data, import_case_to_db, import_estate_to_db
)
from utils.url_generator import generate_urls
from spiders.scrapling_engine import ScraplingEngine
from parsers.lianjia_parser import (
    parse_lianjia_sold_list, parse_lianjia_listing_list, parse_lianjia_estate_list
)
from parsers.anjuke_parser import parse_anjuke_sold_list, parse_anjuke_listing_list
from parsers.general_parser import (
    parse_fang_sold_list, parse_leyoujia_sold_list, parse_szfdc_estate_list
)


# 解析器路由表
PARSER_MAP = {
    ('lianjia', 'sold_cases'): parse_lianjia_sold_list,
    ('lianjia', 'listing'): parse_lianjia_listing_list,
    ('lianjia', 'estate_info'): parse_lianjia_estate_list,
    ('beike', 'sold_cases'): lambda html, cn, ci, url: parse_lianjia_sold_list(html, cn, ci, url, 'beike'),
    ('beike', 'listing'): lambda html, cn, ci, url: parse_lianjia_listing_list(html, cn, ci, url, 'beike'),
    ('anjuke', 'sold_cases'): parse_anjuke_sold_list,
    ('anjuke', 'listing'): parse_anjuke_listing_list,
    ('fang', 'sold_cases'): parse_fang_sold_list,
    ('leyoujia', 'sold_cases'): parse_leyoujia_sold_list,
    ('szfdc', 'estate_info'): parse_szfdc_estate_list,
}

# 需要使用 StealthyFetcher 的数据源（有强力反爬）
STEALTH_SOURCES = {'lianjia', 'beike'}


def execute_job(job_id: int) -> dict:
    """
    执行采集任务（主入口）
    返回执行结果统计
    """
    job = get_job(job_id)
    if not job:
        raise ValueError(f'任务 {job_id} 不存在')

    source = job.get('source', 'lianjia')
    data_type = job.get('data_type', 'sold_cases')
    city_name = job.get('city_name', '深圳')
    city_id = job.get('city_id', 6)
    district_name = job.get('district_name', '')
    max_pages = job.get('max_pages', 10)
    concurrency = job.get('concurrency', 3)
    delay_min = job.get('delay_min', 2000)
    delay_max = job.get('delay_max', 5000)

    # 更新任务状态为运行中
    update_job_status(job_id, 'running',
                      started_at=datetime.now(),
                      progress=0,
                      success_count=0,
                      fail_count=0,
                      duplicate_count=0,
                      error_message=None)

    write_log(job_id, 'info',
              f'[Scrapling] 开始采集 | 来源:{source} | 类型:{data_type} | '
              f'城市:{city_name} | 计划:{max_pages}页 | 并发:{concurrency}')

    # 生成采集 URL
    urls = generate_urls(source, data_type, city_name, district_name, max_pages)
    if not urls:
        write_log(job_id, 'error', f'无法为 {source}/{data_type} 生成采集 URL')
        update_job_status(job_id, 'failed', error_message='无法生成采集 URL')
        return {'success': 0, 'failed': 0, 'duplicate': 0}

    write_log(job_id, 'info', f'生成 {len(urls)} 个采集 URL')
    update_job_status(job_id, 'running', total_count=len(urls) * 30)

    # 获取解析器
    parser = PARSER_MAP.get((source, data_type))
    if not parser:
        write_log(job_id, 'error', f'不支持的采集组合: {source}/{data_type}')
        update_job_status(job_id, 'failed', error_message=f'不支持的采集组合: {source}/{data_type}')
        return {'success': 0, 'failed': 0, 'duplicate': 0}

    # 是否使用隐秘模式
    use_stealth = source in STEALTH_SOURCES

    # 初始化采集引擎
    engine = ScraplingEngine(
        job_id=job_id,
        use_stealth=use_stealth,
        concurrency=concurrency,
        delay_min=delay_min,
        delay_max=delay_max,
    )

    # 统计计数器
    total_success = 0
    total_fail = 0
    total_duplicate = 0
    processed_pages = 0
    total_pages = len(urls)

    def handle_page(done: int, total: int, result: dict):
        nonlocal total_success, total_fail, total_duplicate, processed_pages
        processed_pages += 1
        progress = min(int((processed_pages / total_pages) * 100), 99)

        url = result.get('url', '')
        error = result.get('error')
        html = result.get('html', '')

        if error:
            total_fail += 1
            write_log(job_id, 'error', f'页面采集失败: {error}', url)
        elif html:
            try:
                # 使用 Scrapling 解析器解析 HTML
                parsed_items = parser(html, city_name, city_id, url)

                if parsed_items:
                    # 保存原始数据
                    save_raw_data(
                        job_id, source, data_type,
                        {'url': url, 'html_length': len(html)},
                        parsed_items
                    )

                    # 导入到目标数据库表
                    page_success = 0
                    page_duplicate = 0
                    for item in parsed_items:
                        if data_type == 'estate_info':
                            result_status = import_estate_to_db(item)
                        else:
                            result_status = import_case_to_db(item)

                        if result_status == 'inserted':
                            page_success += 1
                        elif result_status == 'duplicate':
                            page_duplicate += 1

                    total_success += page_success
                    total_duplicate += page_duplicate

                    type_label = '楼盘' if data_type == 'estate_info' else \
                                 ('成交案例' if data_type == 'sold_cases' else '在售房源')
                    write_log(job_id, 'success',
                              f'页面解析完成：新增{type_label} {page_success} 条，重复 {page_duplicate} 条',
                              url, page_success)
                else:
                    write_log(job_id, 'warn',
                              f'页面解析结果为空（可能触发反爬或页面结构变化）', url)
            except Exception as e:
                total_fail += 1
                write_log(job_id, 'error', f'页面解析异常: {str(e)[:200]}', url)
        else:
            write_log(job_id, 'warn', '页面返回空内容', url)

        # 更新进度
        update_job_progress(job_id, progress, total_success, total_fail, total_duplicate)

    # 执行并发采集
    engine.crawl_pages(urls, handle_page)

    # 任务完成
    type_label = '楼盘' if data_type == 'estate_info' else \
                 ('成交案例' if data_type == 'sold_cases' else '在售房源')
    write_log(job_id, 'success',
              f'[Scrapling] 任务完成！新增{type_label} {total_success} 条，'
              f'重复 {total_duplicate} 条，{total_fail} 个页面失败')

    update_job_status(job_id, 'completed',
                      progress=100,
                      success_count=total_success,
                      fail_count=total_fail,
                      duplicate_count=total_duplicate,
                      completed_at=datetime.now())

    return {
        'success': total_success,
        'failed': total_fail,
        'duplicate': total_duplicate,
    }
