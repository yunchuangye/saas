#!/usr/bin/env python3.11
"""
步骤3+4：删除有效 units 内部重复 + 删除重复 buildings
使用 LEFT JOIN 方式，比 NOT IN 快 10x+
"""

import pymysql
import time

DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'gujia',
    'password': 'gujia_dev_2026',
    'database': 'gujia',
    'connect_timeout': 60,
    'read_timeout': 7200,
    'write_timeout': 7200,
    'autocommit': True,
}

def get_conn():
    return pymysql.connect(**DB_CONFIG)

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def main():
    log("=== 步骤3: 删除有效 units 内部重复（LEFT JOIN 方式）===")

    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM units")
        before = cur.fetchone()[0]
    conn.close()
    log(f"当前 units 数量: {before:,}")

    # ── 方法：先给 _keep_unit_ids 加索引，再用 LEFT JOIN 删除 ──────
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 检查临时表是否已存在（上次被中断）
            cur.execute("SHOW TABLES LIKE '_keep_unit_ids'")
            if cur.fetchone():
                log("  _keep_unit_ids 已存在，直接使用")
            else:
                log("  创建 _keep_unit_ids 临时表...")
                cur.execute("""
                    CREATE TABLE _keep_unit_ids AS
                    SELECT MIN(id) AS keep_id
                    FROM units
                    GROUP BY building_id, unit_number
                """)
                log("  临时表创建完成")

            # 给临时表加主键索引，加速 JOIN
            log("  给临时表添加主键索引...")
            try:
                cur.execute("ALTER TABLE _keep_unit_ids ADD PRIMARY KEY (keep_id)")
                log("  索引添加完成")
            except Exception as e:
                log(f"  索引可能已存在: {e}")

            cur.execute("SELECT COUNT(*) FROM _keep_unit_ids")
            keep_count = cur.fetchone()[0]
            log(f"  需要保留的唯一 units: {keep_count:,} 条")
    finally:
        conn.close()

    # ── 分批 LEFT JOIN 删除重复记录 ──────────────────────────────────
    log("  开始分批 LEFT JOIN 删除重复记录...")
    total_deleted = 0
    batch_num = 0
    batch_size = 100000

    while True:
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                # 先找出一批需要删除的 id
                cur.execute(f"""
                    SELECT u.id FROM units u
                    LEFT JOIN _keep_unit_ids k ON u.id = k.keep_id
                    WHERE k.keep_id IS NULL
                    LIMIT {batch_size}
                """)
                ids = [row[0] for row in cur.fetchall()]
                if not ids:
                    break
                # 再删除这批 id
                placeholders = ','.join(['%s'] * len(ids))
                cur.execute(f"DELETE FROM units WHERE id IN ({placeholders})", ids)
                deleted = cur.rowcount
        finally:
            try:
                conn.close()
            except:
                pass

        total_deleted += deleted
        batch_num += 1
        log(f"  批次{batch_num}: 删除 {deleted:,} 条，累计 {total_deleted:,} 条")
        time.sleep(0.3)

    # 清理临时表
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS _keep_unit_ids")
    conn.close()
    log(f"步骤3完成: 共删除重复 units {total_deleted:,} 条")

    # ── 步骤4：删除重复 buildings ─────────────────────────────────────
    log("=== 步骤4: 删除重复 buildings（同楼盘同名，保留 MIN id）===")
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
            try:
                cur.execute("ALTER TABLE _keep_building_ids ADD PRIMARY KEY (keep_id)")
            except:
                pass

            cur.execute("SELECT COUNT(*) FROM _keep_building_ids")
            keep_count = cur.fetchone()[0]
            log(f"  需要保留的唯一 buildings: {keep_count:,} 条")

            cur.execute("""
                DELETE b FROM buildings b
                LEFT JOIN _keep_building_ids k ON b.id = k.keep_id
                WHERE k.keep_id IS NULL
            """)
            deleted = cur.rowcount
            cur.execute("DROP TABLE IF EXISTS _keep_building_ids")
    finally:
        conn.close()
    log(f"步骤4完成: 共删除重复 buildings {deleted:,} 条")

    # ── 最终统计 ──────────────────────────────────────────────────────
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM units")
        units_after = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM buildings")
        buildings_after = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM estates")
        estates_after = cur.fetchone()[0]

        # 验证孤立记录
        cur.execute("SELECT COUNT(*) FROM units u WHERE NOT EXISTS (SELECT 1 FROM estates e WHERE e.id = u.estate_id)")
        orphan_units = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM buildings b WHERE NOT EXISTS (SELECT 1 FROM estates e WHERE e.id = b.estate_id)")
        orphan_buildings = cur.fetchone()[0]

        # 验证重复（快速验证）
        cur.execute("""
            SELECT COUNT(*) FROM (
                SELECT building_id, unit_number FROM units
                GROUP BY building_id, unit_number
                HAVING COUNT(*) > 1
                LIMIT 1
            ) t
        """)
        has_dup = cur.fetchone()[0]
    conn.close()

    log("=== 去重全部完成 ===")
    log(f"estates:   {estates_after:,}（未变动）")
    log(f"buildings: {buildings_after:,}")
    log(f"units:     {before:,} → {units_after:,}（减少 {before - units_after:,} 条）")
    log(f"验证 - 孤立 units:     {orphan_units}（应为 0）")
    log(f"验证 - 孤立 buildings: {orphan_buildings}（应为 0）")
    log(f"验证 - 重复 units:     {'存在' if has_dup else '无'}（应为 无）")

if __name__ == '__main__':
    main()
