#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳楼盘完整数据链条全量导入脚本 v2
策略：全量导入所有 Deleted=0 的记录（不以 Property 链条过滤）
  - tb_Estate  Deleted=0 → 4,479 条全部导入
  - tb_Building Deleted=0 → 34,444 条全部导入
  - tb_Property Deleted=0 → 2,373,589 条全部导入
无单元数据的楼盘/楼栋保留，后期人工补充
"""

import re
import sys
import time
import mysql.connector
from collections import defaultdict

# ── 配置 ─────────────────────────────────────────────────────────
DB_CONFIG = {
    'host': '127.0.0.1', 'port': 3306,
    'user': 'root', 'password': 'root_import_2026',
    'database': 'gujia', 'charset': 'utf8mb4',
    'autocommit': False,
}

FILE_ESTATE    = '/home/ubuntu/upload/tb_Estate.sql'
FILE_BUILDING  = '/home/ubuntu/upload/tb_Building.sql'
FILE_PROPERTY  = '/home/ubuntu/upload/tb_Property_extracted/tb_Property.sql'
BATCH_SIZE     = 2000

SZ_CITY_ID = 6

# ── 区域识别 ──────────────────────────────────────────────────────
AREA_PREFIX_MAP = {
    '010101': 84,  # 罗湖区
    '010102': 85,  # 福田区
    '010103': 86,  # 南山区
    '010104': 89,  # 盐田区
    '010105': 88,  # 龙岗区
    '010106': 87,  # 宝安区
}
DISTRICT_KEYWORDS = [
    (93, ['大鹏', '葵涌', '南澳', '坝光']),
    (92, ['坪山', '坑梓', '碧岭', '石井', '龙田', '马峦']),
    (91, ['光明', '公明', '新湖', '玉塘', '凤凰', '马田']),
    (90, ['龙华', '观澜', '民治', '大浪', '福城', '清湖', '油松', '牛湖']),
]

def get_district_id(area_code, location):
    prefix6 = str(area_code)[:6] if area_code else ''
    base_did = AREA_PREFIX_MAP.get(prefix6)
    if base_did in (88, 87) and location:
        loc = str(location)
        for did, keywords in DISTRICT_KEYWORDS:
            for kw in keywords:
                if kw in loc:
                    return did
    return base_did

# ── 编码映射 ──────────────────────────────────────────────────────
TOWARDS_MAP = {
    '0': '未知', '1': '东', '2': '南', '3': '西', '4': '北',
    '5': '东南', '6': '东北', '7': '西南', '8': '西北',
    '9': '南北', '10': '东西',
}
LANDSCAPE_MAP = {
    '0': '无', '1': '花园', '2': '城市', '4': '山景',
    '6': '江景', '8': '海景', '9': '湖景', '10': '内院', '11': '街景',
}
STRUCTURE_MAP = {
    '0': '未知', '1': '框架', '2': '砖混', '3': '砖木',
    '4': '钢混', '5': '钢结构', '6': '剪力墙', '7': '框剪',
}
BUILD_TYPE_MAP = {
    '1': '多层', '2': '小高层', '3': '高层', '4': '别墅',
    '5': '超高层', '6': '洋房',
}

def decode_property_type(val):
    if not val or str(val).strip() in ('', 'NULL', '0', '0.0'):
        return None
    try:
        v = int(float(str(val).strip()))
        if v <= 0: return None
        special = {88: '商铺', 94: '办公', 97: '车位', 99: '其他',
                   100: '商铺', 101: '办公', 110: '仓储'}
        if v in special: return special[v]
        rooms = v // 10
        halls = v % 10
        if 1 <= rooms <= 6 and 0 <= halls <= 4:
            return f"{rooms}室{halls}厅"
        return f"类型{v}"
    except:
        return None

def clean(val):
    if val is None: return None
    s = str(val).strip()
    return None if s in ('', 'NULL') else s

def to_int(val):
    try: return int(float(str(val).strip()))
    except: return None

def to_float(val):
    try:
        v = float(str(val).strip())
        return v if v > 0 else None
    except: return None

def fmt_date(d):
    if not d: return None
    m = re.search(r'(\d{4}-\d{2}-\d{2})', str(d))
    return m.group(1) if m else None

# ── 解析 VALUES 字段 ──────────────────────────────────────────────
def parse_values(stmt):
    m = re.search(r'VALUES\s*\((.+)\)\s*;?\s*$', stmt, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1)
    fields = []
    i, n = 0, len(raw)
    while i < n:
        while i < n and raw[i] in (' ', '\t', '\n', '\r'): i += 1
        if i >= n: break
        if raw[i] == ',': i += 1; continue
        if i < n-1 and raw[i] == 'N' and raw[i+1] == "'":
            i += 2; s = []
            while i < n:
                if raw[i] == "'":
                    if i+1 < n and raw[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(raw[i]); i += 1
            fields.append(''.join(s))
        elif raw[i] == "'":
            i += 1; s = []
            while i < n:
                if raw[i] == "'":
                    if i+1 < n and raw[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(raw[i]); i += 1
            fields.append(''.join(s))
        elif raw[i:i+4].upper() == 'NULL':
            fields.append(None); i += 4
        elif raw[i].isdigit() or raw[i] == '-':
            j = i
            while j < n and (raw[j].isdigit() or raw[j] in '.+-eE'): j += 1
            fields.append(raw[i:j].strip()); i = j
        else:
            i += 1
    return fields

def is_deleted(stmt):
    m = re.search(r",\s*'([01])',\s*(?:NULL|\d+)\s*\)\s*;?\s*$", stmt, re.DOTALL)
    if m:
        return m.group(1) == '1'
    return False

def iter_statements(filepath):
    buf = []
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            if line.strip() == 'GO':
                stmt = ''.join(buf).strip()
                buf = []
                if stmt.startswith('INSERT INTO'):
                    yield stmt
            else:
                buf.append(line)
    if buf:
        stmt = ''.join(buf).strip()
        if stmt.startswith('INSERT INTO'):
            yield stmt

# ════════════════════════════════════════════════════════════════
# 第一步：全量导入 estates（所有 Deleted=0，共 4,479 条）
# ════════════════════════════════════════════════════════════════
def import_estates(conn):
    print("【第一步】全量导入 estates（所有 Deleted=0）...")
    cursor = conn.cursor()

    cursor.execute("DELETE FROM estates WHERE city_id = %s", (SZ_CITY_ID,))
    print(f"  已清空旧深圳楼盘: {cursor.rowcount:,} 条")
    conn.commit()

    INSERT_SQL = """
    INSERT INTO estates (
        city_id, district_id, name, pinyin, address,
        property_type, total_units, land_area, building_area,
        use_period, greening_rate, far, parking_amount, overview,
        sale_date, completion_date, source_id, area_code, created_at
    ) VALUES (
        %s,%s,%s,%s,%s,
        %s,%s,%s,%s,
        %s,%s,%s,%s,%s,
        %s,%s,%s,%s,NOW()
    )"""

    estate_source_to_local = {}
    batch = []
    imported = 0
    skipped_deleted = 0
    skipped_no_district = 0

    for stmt in iter_statements(FILE_ESTATE):
        if is_deleted(stmt):
            skipped_deleted += 1
            continue

        fields = parse_values(stmt)
        if not fields or len(fields) < 25:
            skipped_deleted += 1
            continue

        estate_id  = to_int(fields[0])
        area_code  = clean(fields[1])
        location   = clean(fields[6])
        name       = clean(fields[4]) or clean(fields[5]) or f"楼盘{estate_id}"
        pinyin     = clean(fields[24])
        prop_usage = clean(fields[18]) or clean(fields[2])
        total_units   = to_int(fields[13])
        land_area     = to_float(fields[9])
        building_area = to_float(fields[10])
        use_period    = to_int(fields[8])
        greening_rate = to_float(fields[15])
        far           = to_float(fields[16])
        parking_amount = to_int(fields[14])
        overview      = clean(fields[17])
        sale_date     = fmt_date(fields[19])
        completion_date = fmt_date(fields[20])

        district_id = get_district_id(area_code, location)
        if not district_id:
            skipped_no_district += 1
            continue

        batch.append((
            SZ_CITY_ID, district_id, name, pinyin, location,
            prop_usage, total_units, land_area, building_area,
            use_period, greening_rate, far, parking_amount, overview,
            sale_date, completion_date, estate_id, area_code,
        ))
        imported += 1

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            batch = []

    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()

    # 构建映射
    cursor.execute(
        "SELECT source_id, id FROM estates WHERE city_id=%s AND source_id IS NOT NULL",
        (SZ_CITY_ID,)
    )
    for src_id, local_id in cursor.fetchall():
        estate_source_to_local[src_id] = local_id

    cursor.close()
    print(f"  导入楼盘: {imported:,} 条")
    print(f"  跳过(Deleted=1或解析失败): {skipped_deleted:,} 条")
    print(f"  跳过(无法识别区域): {skipped_no_district:,} 条")
    return estate_source_to_local

# ════════════════════════════════════════════════════════════════
# 第二步：全量导入 buildings（所有 Deleted=0，共 34,444 条）
# ════════════════════════════════════════════════════════════════
def import_buildings(estate_map, conn):
    print("\n【第二步】全量导入 buildings（所有 Deleted=0）...")
    cursor = conn.cursor()

    cursor.execute("""
        DELETE b FROM buildings b
        JOIN estates e ON b.estate_id = e.id
        WHERE e.city_id = %s
    """, (SZ_CITY_ID,))
    print(f"  已清空旧深圳楼栋: {cursor.rowcount:,} 条")
    conn.commit()

    INSERT_SQL = """
    INSERT INTO buildings (
        estate_id, name, alias, floors, total_units, building_area,
        build_type, build_structure, floor_height, unit_amount,
        elevator_rate, avg_price, completion_date, sale_date,
        sale_licence, property_type, source_id, source_estate_id, created_at
    ) VALUES (
        %s,%s,%s,%s,%s,%s,
        %s,%s,%s,%s,
        %s,%s,%s,%s,
        %s,%s,%s,%s,NOW()
    )"""

    building_source_to_local = {}
    batch = []
    imported = 0
    skipped_deleted = 0
    skipped_no_estate = 0

    for stmt in iter_statements(FILE_BUILDING):
        if is_deleted(stmt):
            skipped_deleted += 1
            continue

        fields = parse_values(stmt)
        if not fields or len(fields) < 16:
            skipped_deleted += 1
            continue

        building_id      = to_int(fields[0])
        source_estate_id = to_int(fields[1])
        local_estate_id  = estate_map.get(source_estate_id)

        if not local_estate_id:
            skipped_no_estate += 1
            continue

        name          = clean(fields[2]) or f"楼栋{building_id}"
        alias         = clean(fields[3])
        build_type    = BUILD_TYPE_MAP.get(clean(fields[4]))
        floors        = to_int(fields[5])
        structure     = STRUCTURE_MAP.get(clean(fields[6]))
        total_units   = to_int(fields[7])
        building_area = to_float(fields[8])
        floor_height  = to_float(fields[9])
        if floor_height and floor_height > 99: floor_height = None
        unit_amount   = to_int(fields[10])
        elevator_rate = clean(fields[11])
        avg_price     = to_float(fields[12])
        completion_date = fmt_date(fields[13]) if len(fields) > 13 else None
        sale_date       = fmt_date(fields[14]) if len(fields) > 14 else None
        sale_licence    = clean(fields[15]) if len(fields) > 15 else None
        prop_usage      = clean(fields[16]) if len(fields) > 16 else None

        batch.append((
            local_estate_id, name, alias, floors, total_units, building_area,
            build_type, structure, floor_height, unit_amount,
            elevator_rate, avg_price, completion_date, sale_date,
            sale_licence, prop_usage, building_id, source_estate_id,
        ))
        imported += 1

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            batch = []

    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()

    # 构建映射
    cursor.execute("""
        SELECT b.source_id, b.id, b.estate_id
        FROM buildings b JOIN estates e ON b.estate_id=e.id
        WHERE e.city_id=%s AND b.source_id IS NOT NULL
    """, (SZ_CITY_ID,))
    for src_id, local_id, estate_id in cursor.fetchall():
        building_source_to_local[src_id] = (local_id, estate_id)

    cursor.close()
    print(f"  导入楼栋: {imported:,} 条")
    print(f"  跳过(Deleted=1或解析失败): {skipped_deleted:,} 条")
    print(f"  跳过(楼盘不存在/区域不匹配): {skipped_no_estate:,} 条")
    return building_source_to_local

# ════════════════════════════════════════════════════════════════
# 第三步：全量导入 units（所有 Deleted=0，约 237 万条）
# ════════════════════════════════════════════════════════════════
def import_units(building_map, conn):
    print("\n【第三步】全量导入 units（约237万条，请耐心等待）...")
    cursor = conn.cursor()
    cursor.execute("SET foreign_key_checks = 0")
    cursor.execute("SET unique_checks = 0")
    cursor.execute("SET GLOBAL innodb_flush_log_at_trx_commit = 2")

    cursor.execute("""
        DELETE u FROM units u
        JOIN estates e ON u.estate_id=e.id
        WHERE e.city_id=%s
    """, (SZ_CITY_ID,))
    print(f"  已清空旧深圳单元: {cursor.rowcount:,} 条")
    conn.commit()

    INSERT_SQL = """
    INSERT INTO units (
        building_id, estate_id, unit_number,
        property_type, property_structure, property_no,
        floor, area, build_area,
        orientation, towards, landscape,
        unit_price, total_price, remark,
        source_id, source_building_id, created_at
    ) VALUES (
        %s,%s,%s,
        %s,%s,%s,
        %s,%s,%s,
        %s,%s,%s,
        %s,%s,%s,
        %s,%s,NOW()
    )"""

    batch = []
    imported = 0
    skipped = 0
    no_building = 0
    start_time = time.time()
    last_report = time.time()

    for stmt in iter_statements(FILE_PROPERTY):
        if is_deleted(stmt):
            skipped += 1
            continue

        m = re.search(
            r"VALUES \((\d+),\s*(\d+),\s*N'((?:[^']|'')*)',\s*(\d+|NULL),\s*(\d+|NULL),\s*(-?\d+),\s*N'((?:[^']|'')*)',\s*([\d.]+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*([\d.]+|NULL),\s*([\d.]+|NULL),",
            stmt, re.DOTALL
        )
        if not m:
            skipped += 1
            continue

        src_bid = int(m.group(2))
        mapping = building_map.get(src_bid)
        if not mapping:
            no_building += 1
            skipped += 1
            continue

        local_bid, estate_id = mapping

        prop_id     = int(m.group(1))
        prop_name   = m.group(3).replace("''", "'")
        prop_type   = decode_property_type(m.group(4))
        prop_struct = STRUCTURE_MAP.get(m.group(5))
        floor_val   = to_int(m.group(6))
        prop_no     = m.group(7).replace("''", "'")
        build_area  = to_float(m.group(8))
        towards     = TOWARDS_MAP.get(m.group(9))
        landscape   = LANDSCAPE_MAP.get(m.group(10))
        unit_price  = to_float(m.group(11))
        total_price = to_float(m.group(12))

        unit_number = prop_name or prop_no or (f"{floor_val}F" if floor_val else f"P{prop_id}")

        batch.append((
            local_bid, estate_id, unit_number,
            prop_type, prop_struct, prop_no or None,
            floor_val, build_area, build_area,
            towards, towards, landscape,
            unit_price, total_price, None,
            prop_id, src_bid,
        ))
        imported += 1

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            batch = []

        now = time.time()
        if now - last_report >= 60:
            elapsed = now - start_time
            rate = imported / elapsed if elapsed > 0 else 0
            print(f"  进度: {imported:>9,} 条 | 速度: {rate:.0f}条/秒 | 耗时: {elapsed:.0f}s")
            last_report = now

    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()

    cursor.execute("SET foreign_key_checks = 1")
    cursor.execute("SET unique_checks = 1")
    conn.commit()
    cursor.close()

    elapsed = time.time() - start_time
    print(f"  导入单元: {imported:,} 条")
    print(f"  跳过(Deleted=1/解析失败): {skipped - no_building:,} 条")
    print(f"  跳过(楼栋不存在): {no_building:,} 条")
    print(f"  耗时: {elapsed:.1f}秒")
    return imported

# ════════════════════════════════════════════════════════════════
# 第四步：统计验证
# ════════════════════════════════════════════════════════════════
def print_stats(conn):
    cursor = conn.cursor()
    print("\n" + "=" * 65)
    print("各区完整数据链条统计")
    print("=" * 65)

    # 楼盘
    cursor.execute("""
        SELECT d.name, COUNT(e.id)
        FROM districts d JOIN estates e ON e.district_id=d.id
        WHERE e.city_id=%s GROUP BY d.id, d.name ORDER BY COUNT(e.id) DESC
    """, (SZ_CITY_ID,))
    estate_rows = {r[0]: r[1] for r in cursor.fetchall()}

    # 楼栋
    cursor.execute("""
        SELECT d.name, COUNT(b.id)
        FROM districts d JOIN estates e ON e.district_id=d.id
        JOIN buildings b ON b.estate_id=e.id
        WHERE e.city_id=%s GROUP BY d.id, d.name ORDER BY COUNT(b.id) DESC
    """, (SZ_CITY_ID,))
    building_rows = {r[0]: r[1] for r in cursor.fetchall()}

    # 单元
    cursor.execute("""
        SELECT d.name, COUNT(u.id)
        FROM districts d JOIN estates e ON e.district_id=d.id
        JOIN units u ON u.estate_id=e.id
        WHERE e.city_id=%s GROUP BY d.id, d.name ORDER BY COUNT(u.id) DESC
    """, (SZ_CITY_ID,))
    unit_rows = {r[0]: r[1] for r in cursor.fetchall()}

    all_districts = sorted(estate_rows.keys(), key=lambda x: estate_rows.get(x, 0), reverse=True)
    print(f"{'区名':<10} {'楼盘数':>8} {'楼栋数':>10} {'单元数':>12}")
    print("-" * 45)
    te = tb = tu = 0
    for d in all_districts:
        e = estate_rows.get(d, 0)
        b = building_rows.get(d, 0)
        u = unit_rows.get(d, 0)
        print(f"{d:<10} {e:>8,} {b:>10,} {u:>12,}")
        te += e; tb += b; tu += u
    print("-" * 45)
    print(f"{'深圳合计':<10} {te:>8,} {tb:>10,} {tu:>12,}")
    print("=" * 65)
    cursor.close()

# ════════════════════════════════════════════════════════════════
# 主程序
# ════════════════════════════════════════════════════════════════
def main():
    print("=" * 65)
    print("深圳楼盘全量数据链条导入工具 v2（全量 Deleted=0）")
    print("=" * 65)
    start = time.time()

    conn = mysql.connector.connect(**DB_CONFIG)

    estate_map   = import_estates(conn)
    building_map = import_buildings(estate_map, conn)
    import_units(building_map, conn)
    print_stats(conn)

    conn.close()
    print(f"\n总耗时: {time.time()-start:.1f}秒")
    print("导入完成！")

if __name__ == '__main__':
    main()
