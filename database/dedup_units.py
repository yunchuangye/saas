#!/usr/bin/env python3.11
"""
units 表去重脚本
策略：
  1. 分批删除孤立 units（estate_id 不存在于 estates 表）
  2. 分批删除孤立 buildings（estate_id 不存在于 estates 表）
  3. 删除有效 units 中 building_id+unit_number 重复的记录（保留 MIN id）
  4. 删除重复 buildings（同楼盘同名，保留 MIN id）
"""

import pymysql
import time
import sys

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'gujia',
    'password': 'gujia_dev_2026',
    'database': 'gujia',
    'connect_timeout': 60,
    'read_timeout': 3600,
    'write_timeout': 3600,
    'autocommit': True,
}

def get_conn():
    return pymysql.connect(**DB_CONFIG)

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def count_table(conn, table, where=''):
    with conn.cursor() as cur:
        sql = f"SELECT COUNT(*) FROM {table}"
        if where:
            sql += f" WHERE {where}"
        cur.execute(sql)
        return cur.fetchone()[0]

def main():
    log("=== 开始 units 表去重 ===")

    # ── 步骤0：清理前统计 ──────────────────────────────────────────
    conn = get_conn()
    units_before = count_table(conn, 'units')
    buildings_before = count_table(conn, 'buildings')
    estates_count = count_table(conn, 'estates')
    log(f"清理前: units={units_before:,}, buildings={buildings_before:,}, estates={estates_count:,}")
    conn.close()

    # ── 步骤1：分批删除孤立 units ──────────────────────────────────
    log("步骤1: 删除孤立 units（estate_id 不存在于 estates 表）...")
    total_deleted = 0
    batch_size = 200000
    batch_num = 0

    while True:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM units
                    WHERE estate_id NOT IN (SELECT id FROM estates)
                    LIMIT %s
                """, (batch_size,))
                deleted = cur.rowcount
        finally:
            conn.close()

        if deleted == 0:
            break
        total_deleted += deleted
        batch_num += 1
        log(f"  批次{batch_num}: 删除 {deleted:,} 条，累计 {total_deleted:,} 条")
        time.sleep(0.5)  # 短暂休眠，避免 I/O 过载

    log(f"步骤1完成: 共删除孤立 units {total_deleted:,} 条")

    # ── 步骤2：分批删除孤立 buildings ──────────────────────────────
    log("步骤2: 删除孤立 buildings（estate_id 不存在于 estates 表）...")
    total_deleted = 0
    batch_num = 0

    while True:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM buildings
                    WHERE estate_id NOT IN (SELECT id FROM estates)
                    LIMIT 50000
                """)
                deleted = cur.rowcount
        finally:
            conn.close()

        if deleted == 0:
            break
        total_deleted += deleted
        batch_num += 1
        log(f"  批次{batch_num}: 删除 {deleted:,} 条，累计 {total_deleted:,} 条")
        time.sleep(0.2)

    log(f"步骤2完成: 共删除孤立 buildings {total_deleted:,} 条")

    # ── 步骤3：删除有效 units 中 building_id+unit_number 重复记录 ──
    log("步骤3: 删除有效 units 内部重复（保留每组 MIN id）...")
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 创建临时表存储需要保留的 id
            log("  创建临时表 keep_unit_ids...")
            cur.execute("DROP TABLE IF EXISTS _keep_unit_ids")
            cur.execute("""
                CREATE TABLE _keep_unit_ids AS
                SELECT MIN(id) AS keep_id
                FROM units
                GROUP BY building_id, unit_number
            """)
            keep_count = count_table(conn, '_keep_unit_ids')
            log(f"  需要保留的唯一 units: {keep_count:,} 条")
    finally:
        conn.close()

    # 分批删除重复记录
    total_deleted = 0
    batch_num = 0
    while True:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM units
                    WHERE id NOT IN (SELECT keep_id FROM _keep_unit_ids)
                    LIMIT 200000
                """)
                deleted = cur.rowcount
        finally:
            conn.close()

        if deleted == 0:
            break
        total_deleted += deleted
        batch_num += 1
        log(f"  批次{batch_num}: 删除 {deleted:,} 条，累计 {total_deleted:,} 条")
        time.sleep(0.5)

    # 清理临时表
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS _keep_unit_ids")
    conn.close()
    log(f"步骤3完成: 共删除重复 units {total_deleted:,} 条")

    # ── 步骤4：删除重复 buildings（同楼盘同名，保留 MIN id）─────────
    log("步骤4: 删除重复 buildings（同楼盘同名，保留 MIN id）...")
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS _keep_building_ids")
            cur.execute("""
                CREATE TABLE _keep_building_ids AS
                SELECT MIN(id) AS keep_id
                FROM buildings
                GROUP BY estate_id, name
            """)
            keep_count = count_table(conn, '_keep_building_ids')
            log(f"  需要保留的唯一 buildings: {keep_count:,} 条")

            cur.execute("""
                DELETE FROM buildings
                WHERE id NOT IN (SELECT keep_id FROM _keep_building_ids)
            """)
            deleted = cur.rowcount
            cur.execute("DROP TABLE IF EXISTS _keep_building_ids")
    finally:
        conn.close()
    log(f"步骤4完成: 共删除重复 buildings {deleted:,} 条")

    # ── 步骤5：最终统计 ────────────────────────────────────────────
    conn = get_conn()
    units_after = count_table(conn, 'units')
    buildings_after = count_table(conn, 'buildings')
    estates_after = count_table(conn, 'estates')

    # 验证：孤立记录
    orphan_units = count_table(conn, 'units',
        "estate_id NOT IN (SELECT id FROM estates)")
    orphan_buildings = count_table(conn, 'buildings',
        "estate_id NOT IN (SELECT id FROM estates)")

    # 验证：重复记录（用抽样方式快速验证）
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*) FROM (
                SELECT building_id, unit_number, COUNT(*) AS cnt
                FROM units
                GROUP BY building_id, unit_number
                HAVING COUNT(*) > 1
                LIMIT 1
            ) t
        """)
        has_dup = cur.fetchone()[0]
    conn.close()

    log("=== 去重完成 ===")
    log(f"estates: {estates_after:,}（未变动）")
    log(f"buildings: {buildings_before:,} → {buildings_after:,}（减少 {buildings_before - buildings_after:,} 条）")
    log(f"units:    {units_before:,} → {units_after:,}（减少 {units_before - units_after:,} 条）")
    log(f"验证 - 孤立 units: {orphan_units}（应为 0）")
    log(f"验证 - 孤立 buildings: {orphan_buildings}（应为 0）")
    log(f"验证 - 重复 units: {'存在' if has_dup else '无'}（应为 无）")

if __name__ == '__main__':
    # 安装 pymysql
    import subprocess
    subprocess.run(['sudo', 'pip3', 'install', 'pymysql', '-q'], check=True)
    import pymysql
    main()
