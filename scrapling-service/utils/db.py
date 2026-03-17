"""
数据库工具模块 - 负责与 MySQL 数据库的所有交互
"""
import os
import json
import pymysql
import pymysql.cursors
from datetime import datetime
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(os.path.join(os.path.dirname(__file__), '../../backend/.env'))

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'gujia'),
    'password': os.getenv('DB_PASSWORD', 'gujia_dev_2026'),
    'database': os.getenv('DB_NAME', 'gujia'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': True,
}


def get_connection():
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)


def get_job(job_id: int) -> dict | None:
    """获取采集任务信息"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM crawl_jobs WHERE id = %s", (job_id,))
            return cursor.fetchone()
    finally:
        conn.close()


def update_job_status(job_id: int, status: str, **kwargs):
    """更新任务状态"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            fields = {'status': status, 'updated_at': datetime.now()}
            fields.update(kwargs)
            set_clause = ', '.join([f"`{k}` = %s" for k in fields.keys()])
            values = list(fields.values()) + [job_id]
            cursor.execute(f"UPDATE crawl_jobs SET {set_clause} WHERE id = %s", values)
    finally:
        conn.close()


def update_job_progress(job_id: int, progress: int, success_count: int,
                        fail_count: int, duplicate_count: int):
    """更新任务进度"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE crawl_jobs
                SET progress = %s, success_count = %s, fail_count = %s,
                    duplicate_count = %s, updated_at = %s
                WHERE id = %s
            """, (progress, success_count, fail_count, duplicate_count,
                  datetime.now(), job_id))
    finally:
        conn.close()


def write_log(job_id: int, level: str, message: str, url: str = None, count: int = 0):
    """写入采集日志"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO crawl_logs (job_id, level, message, url, count, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (job_id, level, message, url, count, datetime.now()))
    finally:
        conn.close()


def save_raw_data(job_id: int, source: str, data_type: str,
                  raw_data: dict, parsed_data: list, status: str = 'parsed'):
    """保存原始采集数据"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO crawl_raw_data (job_id, source, data_type, raw_data, parsed_data, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (job_id, source, data_type,
                  json.dumps(raw_data, ensure_ascii=False),
                  json.dumps(parsed_data, ensure_ascii=False),
                  status, datetime.now()))
    finally:
        conn.close()


def import_case_to_db(case: dict) -> str:
    """
    导入单条案例到 cases 表
    返回: 'inserted' | 'duplicate' | 'error'
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 检查重复（根据来源+来源ID）
            if case.get('source_id'):
                cursor.execute(
                    "SELECT id FROM cases WHERE source = %s AND source_id = %s",
                    (case.get('source'), case.get('source_id'))
                )
                if cursor.fetchone():
                    return 'duplicate'

            # 插入案例
            cursor.execute("""
                INSERT INTO cases (
                    city_id, district_name, estate_name, building_name, unit_no,
                    floor_no, total_floors, area, total_price, unit_price,
                    deal_date, listing_date, room_type, orientation, decoration,
                    property_type, source, source_id, source_url,
                    data_type, raw_title, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                case.get('city_id'), case.get('district_name'), case.get('estate_name'),
                case.get('building_name'), case.get('unit_no'),
                case.get('floor_no'), case.get('total_floors'),
                case.get('area'), case.get('total_price'), case.get('unit_price'),
                case.get('deal_date'), case.get('listing_date'),
                case.get('room_type'), case.get('orientation'), case.get('decoration'),
                case.get('property_type', '住宅'),
                case.get('source'), case.get('source_id'), case.get('source_url'),
                case.get('data_type', 'sold_cases'),
                case.get('raw_title'), datetime.now(), datetime.now()
            ))
            return 'inserted'
    except Exception as e:
        return f'error:{e}'
    finally:
        conn.close()


def import_estate_to_db(estate: dict) -> str:
    """
    导入单条楼盘到 estates 表
    返回: 'inserted' | 'duplicate' | 'error'
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 检查重复（根据城市+楼盘名+地址）
            cursor.execute(
                "SELECT id FROM estates WHERE city_id = %s AND name = %s",
                (estate.get('city_id'), estate.get('name'))
            )
            if cursor.fetchone():
                return 'duplicate'

            cursor.execute("""
                INSERT INTO estates (
                    city_id, district_id, name, address, developer,
                    avg_price, build_year, plot_ratio, green_rate,
                    total_units, property_type, source, source_url,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                estate.get('city_id'), estate.get('district_id'),
                estate.get('name'), estate.get('address'), estate.get('developer'),
                estate.get('avg_price'), estate.get('build_year'),
                estate.get('plot_ratio'), estate.get('green_rate'),
                estate.get('total_units'), estate.get('property_type', '住宅'),
                estate.get('source'), estate.get('source_url'),
                datetime.now(), datetime.now()
            ))
            return 'inserted'
    except Exception as e:
        return f'error:{e}'
    finally:
        conn.close()


def get_active_proxies() -> list:
    """获取可用代理列表"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT host, port, protocol, username, password
                FROM crawl_proxies
                WHERE status = 'active'
                ORDER BY avg_response_ms ASC
                LIMIT 50
            """)
            proxies = cursor.fetchall()
            result = []
            for p in proxies:
                if p['username']:
                    url = f"{p['protocol']}://{p['username']}:{p['password']}@{p['host']}:{p['port']}"
                else:
                    url = f"{p['protocol']}://{p['host']}:{p['port']}"
                result.append(url)
            return result
    finally:
        conn.close()
