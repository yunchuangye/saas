"""
数据库访问模块
============================================================
连接 gujia 主库，按 city_id % SHARD_COUNT 路由到对应分表，
查询周边成交案例数据供估价引擎使用。
"""

import os
import logging
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── 配置 ────────────────────────────────────────────────────
SHARD_COUNT = int(os.getenv("SHARD_COUNT", "8"))
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", "3306")),
    "user":     os.getenv("DB_USER", "gujia"),
    "password": os.getenv("DB_PASSWORD", "gujia_dev_2026"),
    "database": os.getenv("DB_NAME", "gujia"),
    "charset":  "utf8mb4",
    "use_pure": True,
}

# 如果 socket 文件存在，优先使用 socket 连接（本地开发）
_socket = os.getenv("DB_SOCKET", "/var/run/mysqld/mysqld.sock")
if os.path.exists(_socket):
    DB_CONFIG["unix_socket"] = _socket
    DB_CONFIG.pop("host", None)
    DB_CONFIG.pop("port", None)

# 连接池（单例）
_pool: Optional[pooling.MySQLConnectionPool] = None


def get_pool() -> pooling.MySQLConnectionPool:
    """获取数据库连接池（懒加载单例）"""
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="valuation_pool",
            pool_size=5,
            pool_reset_session=True,
            **DB_CONFIG,
        )
        logger.info("数据库连接池已初始化")
    return _pool


@contextmanager
def get_connection():
    """获取数据库连接的上下文管理器"""
    conn = get_pool().get_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_shard_table(base_table: str, city_id: int) -> str:
    """
    根据 city_id 计算分表名。
    与 shard-db.ts 的 getShardTableName 保持一致。

    Args:
        base_table: 基础表名（如 "cases"）
        city_id: 城市 ID

    Returns:
        物理表名（如 "cases_6"）
    """
    suffix = city_id % SHARD_COUNT
    return f"{base_table}_{suffix}"


def fetch_nearby_cases(
    city_id: int,
    geohash_prefixes: List[str],
    limit: int = 200,
    min_date: Optional[str] = None,
    transaction_type: str = "sale",
) -> List[Dict[str, Any]]:
    """
    从分表中检索周边成交案例。

    Args:
        city_id: 城市 ID（用于路由到对应分表）
        geohash_prefixes: GeoHash 前缀列表（用于 LIKE 搜索）
        limit: 最大返回数量
        min_date: 最早成交日期（ISO 格式，如 "2023-01-01"）
        transaction_type: 交易类型（"sale" 或 "rent"）

    Returns:
        案例列表，每条包含：id, area, floor, total_floors,
        unit_price, total_price, deal_date, community,
        rooms, build_year, latitude, longitude, geohash
    """
    table = get_shard_table("cases", city_id)

    # 构建 GeoHash LIKE 条件（多个前缀取并集）
    like_conditions = " OR ".join([f"geohash LIKE %s" for _ in geohash_prefixes])
    params: List[Any] = [f"{p}%" for p in geohash_prefixes]

    where_parts = [
        f"city_id = %s",
        f"transaction_type = %s",
        f"unit_price > 0",
        f"area > 0",
        f"({like_conditions})",
    ]
    params = [city_id, transaction_type] + params

    if min_date:
        where_parts.append("deal_date >= %s")
        params.append(min_date)

    where_clause = " AND ".join(where_parts)
    sql = f"""
        SELECT
            id,
            area,
            floor,
            total_floors,
            unit_price,
            total_price,
            deal_date,
            community,
            rooms,
            build_year,
            latitude,
            longitude,
            geohash,
            DATEDIFF(CURDATE(), deal_date) AS days_ago
        FROM `{table}`
        WHERE {where_clause}
        ORDER BY deal_date DESC
        LIMIT %s
    """
    params.append(limit)

    try:
        with get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            cursor.close()
            return rows
    except Exception as e:
        logger.error(f"查询分表 {table} 失败: {e}")
        return []


def fetch_city_market_stats(city_id: int) -> Dict[str, Any]:
    """
    查询城市整体市场统计数据（用于估价修正）。

    Returns:
        包含均价、涨跌幅等统计信息的字典
    """
    table = get_shard_table("cases", city_id)
    sql = f"""
        SELECT
            COUNT(*) AS total_cases,
            AVG(unit_price) AS avg_unit_price,
            STDDEV(unit_price) AS std_unit_price,
            MIN(unit_price) AS min_unit_price,
            MAX(unit_price) AS max_unit_price,
            AVG(area) AS avg_area,
            -- 近3个月均价（市场趋势）
            AVG(CASE WHEN deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                     THEN unit_price END) AS recent_3m_avg,
            -- 近12个月均价
            AVG(CASE WHEN deal_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                     THEN unit_price END) AS recent_12m_avg
        FROM `{table}`
        WHERE city_id = %s
          AND transaction_type = 'sale'
          AND unit_price > 0
          AND deal_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
    """
    try:
        with get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, [city_id])
            row = cursor.fetchone()
            cursor.close()
            return row or {}
    except Exception as e:
        logger.error(f"查询城市统计失败: {e}")
        return {}


def fetch_estate_info(city_id: int, estate_id: Optional[int] = None,
                      community: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    查询楼盘基础信息（用于特征增强）。
    """
    table = get_shard_table("estates", city_id)
    if estate_id:
        sql = f"SELECT * FROM `{table}` WHERE id = %s AND city_id = %s LIMIT 1"
        params = [estate_id, city_id]
    elif community:
        sql = f"SELECT * FROM `{table}` WHERE name LIKE %s AND city_id = %s LIMIT 1"
        params = [f"%{community}%", city_id]
    else:
        return None

    try:
        with get_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params)
            row = cursor.fetchone()
            cursor.close()
            return row
    except Exception as e:
        logger.error(f"查询楼盘信息失败: {e}")
        return None


def health_check() -> Dict[str, Any]:
    """数据库健康检查"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()

        # 检查分表是否存在
        missing = []
        with get_connection() as conn:
            cursor = conn.cursor()
            for i in range(SHARD_COUNT):
                try:
                    cursor.execute(f"SELECT 1 FROM `cases_{i}` LIMIT 1")
                    cursor.fetchone()
                except Exception:
                    missing.append(f"cases_{i}")
            cursor.close()

        return {
            "status": "ok" if not missing else "degraded",
            "shard_count": SHARD_COUNT,
            "missing_tables": missing,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
