#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳楼盘完整数据链条导入脚本
以 tb_Property(Deleted=0) 为基准，反推关联 tb_Building 和 tb_Estate
全量导入：estates → buildings → units
使用 GO 分隔符正确解析多行记录（含换行符的 Overview 等字段）
使用 MySQL root 用户以获得最高权限
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

# ── 深圳城市 ID ───────────────────────────────────────────────────
SZ_CITY_ID = 6

# ── 区域识别（AreaCode → district_id）────────────────────────────
AREA_PREFIX_MAP = {
    '010101': 84,  # 罗湖区
    '010102': 85,  # 福田区
    '010103': 86,  # 南山区
    '010104': 89,  # 盐田区
    '010105': 88,  # 龙岗区（含坪山/大鹏，后续按地址细分）
    '010106': 87,  # 宝安区（含龙华/光明，后续按地址细分）
}

DISTRICT_NAME_MAP = {
    84: '罗湖区', 85: '福田区', 86: '南山区', 87: '宝安区',
    88: '龙岗区', 89: '盐田区', 90: '龙华区', 91: '光明区',
    92: '坪山区', 93: '大鹏新区',
}

# 地址关键词识别（优先级从高到低）
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

# ── 解析 VALUES 字段（支持多行） ──────────────────────────────────
def parse_values(stmt):
    """从 INSERT 语句中提取 VALUES 后的字段列表"""
    m = re.search(r'VALUES\s*\((.+)\)\s*;?\s*$', stmt, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1)
    
    fields = []
    i, n = 0, len(raw)
    while i < n:
        # 跳过空白和逗号
        while i < n and raw[i] in (' ', '\t', '\n', '\r'): i += 1
        if i >= n: break
        if raw[i] == ',': i += 1; continue
        
        # N'...' 字符串
        if i < n-1 and raw[i] == 'N' and raw[i+1] == "'":
            i += 2; s = []
            while i < n:
                if raw[i] == "'":
                    if i+1 < n and raw[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(raw[i]); i += 1
            fields.append(''.join(s))
        # '...' 字符串
        elif raw[i] == "'":
            i += 1; s = []
            while i < n:
                if raw[i] == "'":
                    if i+1 < n and raw[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(raw[i]); i += 1
            fields.append(''.join(s))
        # NULL
        elif raw[i:i+4].upper() == 'NULL':
            fields.append(None); i += 4
        # 数字
        elif raw[i].isdigit() or raw[i] == '-':
            j = i
            while j < n and (raw[j].isdigit() or raw[j] in '.+-eE'): j += 1
            fields.append(raw[i:j].strip()); i = j
        else:
            i += 1
    return fields

# ── 判断 Deleted ──────────────────────────────────────────────────
def is_deleted(stmt):
    m = re.search(r",\s*'([01])',\s*(?:NULL|\d+)\s*\)\s*;?\s*$", stmt, re.DOTALL)
    if m:
        return m.group(1) == '1'
    return False  # 解析失败时默认保留

# ── 流式 GO 分割读取 ──────────────────────────────────────────────
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
# 第一步：扫描 Property，收集有效 BuildingID 集合
# ════════════════════════════════════════════════════════════════
def collect_valid_building_ids():
    print("【第一步】扫描 tb_Property，收集有效 BuildingID...")
    valid_bids = set()
    total = 0
    for stmt in iter_statements(FILE_PROPERTY):
        if is_deleted(stmt): continue
        m = re.search(r"VALUES \(\d+,\s*(\d+),", stmt)
        if m:
            valid_bids.add(int(m.group(1)))
            total += 1
    print(f"  有效 Property 记录: {total:,}")
    print(f"  涉及唯一 BuildingID: {len(valid_bids):,}")
    return valid_bids, total

# ════════════════════════════════════════════════════════════════
# 第二步：导入 estates（以有效 Building→Estate 链条为准）
# ════════════════════════════════════════════════════════════════
def import_estates(valid_bids, conn):
    print("\n【第二步】导入 estates...")
    cursor = conn.cursor()
    
    # 先从 Building 中找出有效 EstateID
    print("  从 tb_Building 中反推有效 EstateID...")
    valid_estate_ids = set()
    for stmt in iter_statements(FILE_BUILDING):
        if is_deleted(stmt): continue
        m = re.search(r"VALUES \((\d+),\s*(\d+),", stmt)
        if m:
            bid = int(m.group(1))
            eid = int(m.group(2))
            if bid in valid_bids:
                valid_estate_ids.add(eid)
    print(f"  有效 EstateID: {len(valid_estate_ids):,}")
    
    # 清空深圳楼盘
    cursor.execute("DELETE FROM estates WHERE city_id = %s", (SZ_CITY_ID,))
    print(f"  已清空旧深圳楼盘: {cursor.rowcount:,} 条")
    conn.commit()
    
    # tb_Estate 字段索引（0-based）
    # 0:EstateID, 1:AreaCode, 2:PropertyUsage, 3:BuildType, 4:EstateName
    # 5:AdvName, 6:Location, 7:LandYear, 8:UsePeriod, 9:LandArea
    # 10:BuildingArea, 11:SalableArea, 12:BuildingAmount, 13:PropertyAmount
    # 14:ParkingAmount, 15:GreeningRate, 16:FAR, 17:Overview
    # 18:PlanningFunction, 19:SaleDate, 20:CompletionDate, 21:IntakePeriod
    # 22:SalesOfficeTel, 23:IsSaling, 24:ProjectAbbreviation, 25:AdvAbbreviation
    # 26:IsConfirm, 27:OldID, 28:Deleted, 29:iautoid
    
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
    
    # source_id → local_id 映射（用于后续 buildings 关联）
    estate_source_to_local = {}
    
    batch = []
    imported = 0
    skipped = 0
    
    for stmt in iter_statements(FILE_ESTATE):
        if is_deleted(stmt):
            skipped += 1
            continue
        
        fields = parse_values(stmt)
        if not fields or len(fields) < 25:
            skipped += 1
            continue
        
        estate_id = to_int(fields[0])
        if estate_id not in valid_estate_ids:
            skipped += 1
            continue
        
        area_code  = clean(fields[1])
        location   = clean(fields[6])
        name       = clean(fields[4]) or clean(fields[5]) or f"楼盘{estate_id}"
        pinyin     = clean(fields[24])
        prop_usage = clean(fields[18]) or clean(fields[2])
        total_units = to_int(fields[13])
        land_area   = to_float(fields[9])
        building_area = to_float(fields[10])
        use_period  = to_int(fields[8])
        greening_rate = to_float(fields[15])
        far         = to_float(fields[16])
        parking_amount = to_int(fields[14])
        overview    = clean(fields[17])
        sale_date   = clean(fields[19])
        completion_date = clean(fields[20])
        
        district_id = get_district_id(area_code, location)
        if not district_id:
            skipped += 1
            continue
        
        # 日期格式处理
        def fmt_date(d):
            if not d: return None
            m = re.search(r'(\d{4}-\d{2}-\d{2})', str(d))
            return m.group(1) if m else None
        
        batch.append((
            SZ_CITY_ID, district_id, name, pinyin, location,
            prop_usage, total_units, land_area, building_area,
            use_period, greening_rate, far, parking_amount, overview,
            fmt_date(sale_date), fmt_date(completion_date),
            estate_id, area_code,
        ))
        imported += 1
        
        if len(batch) >= BATCH_SIZE:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            batch = []
    
    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()
    
    # 构建 source_id → local_id 映射
    cursor.execute("SELECT source_id, id FROM estates WHERE city_id = %s AND source_id IS NOT NULL", (SZ_CITY_ID,))
    for src_id, local_id in cursor.fetchall():
        estate_source_to_local[src_id] = local_id
    
    cursor.close()
    print(f"  导入楼盘: {imported:,} 条，跳过: {skipped:,} 条")
    return estate_source_to_local

# ════════════════════════════════════════════════════════════════
# 第三步：导入 buildings
# ════════════════════════════════════════════════════════════════
def import_buildings(valid_bids, estate_map, conn):
    print("\n【第三步】导入 buildings...")
    cursor = conn.cursor()
    
    # 清空深圳楼栋
    cursor.execute("""
        DELETE b FROM buildings b
        JOIN estates e ON b.estate_id = e.id
        WHERE e.city_id = %s
    """, (SZ_CITY_ID,))
    print(f"  已清空旧深圳楼栋: {cursor.rowcount:,} 条")
    conn.commit()
    
    # tb_Building 字段（0-based）
    # 0:BuildingID, 1:EstateID, 2:BuildingName, 3:BuildingAlias
    # 4:BuildType, 5:Floors, 6:BuildStructure, 7:PropertyAmount
    # 8:BuildingArea, 9:FloorHight, 10:UnitAmount, 11:ElevatorRate
    # 12:AveragePrice, 13:CompletionDate, 14:SaleDate, 15:SaleLicence
    # 16:PropertyUsage, 17:IsConfirm, 18:OldID, 19:Deleted, 20:iautoid
    
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
    skipped = 0
    no_estate = 0
    
    for stmt in iter_statements(FILE_BUILDING):
        if is_deleted(stmt):
            skipped += 1
            continue
        
        fields = parse_values(stmt)
        if not fields or len(fields) < 16:
            skipped += 1
            continue
        
        building_id = to_int(fields[0])
        if building_id not in valid_bids:
            skipped += 1
            continue
        
        source_estate_id = to_int(fields[1])
        local_estate_id  = estate_map.get(source_estate_id)
        if not local_estate_id:
            no_estate += 1
            skipped += 1
            continue
        
        name      = clean(fields[2]) or f"楼栋{building_id}"
        alias     = clean(fields[3])
        build_type = BUILD_TYPE_MAP.get(clean(fields[4]))
        floors    = to_int(fields[5])
        structure = STRUCTURE_MAP.get(clean(fields[6]))
        total_units = to_int(fields[7])
        building_area = to_float(fields[8])
        floor_height  = to_float(fields[9])
        if floor_height and floor_height > 99: floor_height = None  # 过滤异常值
        unit_amount   = to_int(fields[10])
        elevator_rate = clean(fields[11])
        avg_price     = to_float(fields[12])
        
        def fmt_date(d):
            if not d: return None
            m = re.search(r'(\d{4}-\d{2}-\d{2})', str(d))
            return m.group(1) if m else None
        
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
    
    # 构建 source_id → local_id 映射
    cursor.execute("""
        SELECT b.source_id, b.id, b.estate_id
        FROM buildings b JOIN estates e ON b.estate_id=e.id
        WHERE e.city_id=%s AND b.source_id IS NOT NULL
    """, (SZ_CITY_ID,))
    for src_id, local_id, estate_id in cursor.fetchall():
        building_source_to_local[src_id] = (local_id, estate_id)
    
    cursor.close()
    print(f"  导入楼栋: {imported:,} 条，跳过: {skipped:,} 条（无对应楼盘: {no_estate:,}）")
    return building_source_to_local

# ════════════════════════════════════════════════════════════════
# 第四步：导入 units（流式，批量）
# ════════════════════════════════════════════════════════════════
def import_units(building_map, conn):
    print("\n【第四步】导入 units（约237万条有效记录，请耐心等待）...")
    cursor = conn.cursor()
    cursor.execute("SET foreign_key_checks = 0")
    cursor.execute("SET unique_checks = 0")
    cursor.execute("SET GLOBAL innodb_flush_log_at_trx_commit = 2")
    
    # 清空深圳单元
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
    
    # tb_Property 字段（0-based）
    # 0:PropertyID, 1:BuildingID, 2:PropertyName, 3:PropertyType
    # 4:PropertyStructure, 5:Floor, 6:PropertyNo, 7:BuildArea
    # 8:Towards, 9:Landscape, 10:UnitPrice, 11:TotalPrice
    # 12:Remark, 13:PropertyUsage, 14:IsConfirm, 15:OldID, 16:Deleted, 17:iautoid
    
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
        
        # 快速提取关键字段（避免全量 parse_values 的开销）
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
        
        prop_id    = int(m.group(1))
        prop_name  = m.group(3).replace("''", "'")
        prop_type  = decode_property_type(m.group(4))
        prop_struct = STRUCTURE_MAP.get(m.group(5))
        floor_val  = to_int(m.group(6))
        prop_no    = m.group(7).replace("''", "'")
        build_area = to_float(m.group(8))
        towards    = TOWARDS_MAP.get(m.group(9))
        landscape  = LANDSCAPE_MAP.get(m.group(10))
        unit_price = to_float(m.group(11))
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
    print(f"  导入单元: {imported:,} 条，跳过: {skipped:,} 条（无楼栋: {no_building:,}）")
    print(f"  耗时: {elapsed:.1f}秒")
    return imported

# ════════════════════════════════════════════════════════════════
# 第五步：统计验证
# ════════════════════════════════════════════════════════════════
def print_stats(conn):
    cursor = conn.cursor()
    print("\n" + "=" * 65)
    print("各区完整数据链条统计")
    print("=" * 65)
    
    cursor.execute("""
        SELECT d.name,
               COUNT(DISTINCT e.id) AS 楼盘数,
               COUNT(DISTINCT b.id) AS 楼栋数,
               COUNT(u.id)          AS 单元数
        FROM districts d
        JOIN estates e  ON e.district_id=d.id AND e.city_id=%s
        LEFT JOIN buildings b ON b.estate_id=e.id
        LEFT JOIN units u     ON u.estate_id=e.id
        GROUP BY d.id, d.name
        ORDER BY COUNT(u.id) DESC
    """, (SZ_CITY_ID,))
    
    rows = cursor.fetchall()
    print(f"{'区名':<10} {'楼盘数':>8} {'楼栋数':>10} {'单元数':>12}")
    print("-" * 45)
    total_e = total_b = total_u = 0
    for row in rows:
        print(f"{row[0]:<10} {row[1]:>8,} {row[2]:>10,} {row[3]:>12,}")
        total_e += row[1]; total_b += row[2]; total_u += row[3]
    print("-" * 45)
    print(f"{'深圳合计':<10} {total_e:>8,} {total_b:>10,} {total_u:>12,}")
    
    # 数据完整性
    cursor.execute("""
        SELECT
            SUM(u.unit_price IS NOT NULL) AS 有单价,
            SUM(u.build_area IS NOT NULL) AS 有面积,
            SUM(u.towards IS NOT NULL) AS 有朝向,
            COUNT(*) AS 总数
        FROM units u JOIN estates e ON u.estate_id=e.id WHERE e.city_id=%s
    """, (SZ_CITY_ID,))
    r = cursor.fetchone()
    if r and r[3]:
        print(f"\n数据完整性（共 {r[3]:,} 条单元）：")
        print(f"  有单价: {r[0]:,} ({r[0]/r[3]*100:.1f}%)")
        print(f"  有面积: {r[1]:,} ({r[1]/r[3]*100:.1f}%)")
        print(f"  有朝向: {r[2]:,} ({r[2]/r[3]*100:.1f}%)")
    
    # 户型分布
    cursor.execute("""
        SELECT u.property_type, COUNT(*) AS cnt
        FROM units u JOIN estates e ON u.estate_id=e.id
        WHERE e.city_id=%s AND u.property_type IS NOT NULL
        GROUP BY u.property_type ORDER BY cnt DESC LIMIT 12
    """, (SZ_CITY_ID,))
    print(f"\n主要户型分布（前12）：")
    for row in cursor.fetchall():
        print(f"  {row[0]:<12}: {row[1]:>10,}")
    
    cursor.close()
    print("=" * 65)

# ════════════════════════════════════════════════════════════════
# 主程序
# ════════════════════════════════════════════════════════════════
def main():
    print("=" * 65)
    print("深圳楼盘完整数据链条导入工具（GO分割法·全量有效数据）")
    print("=" * 65)
    start = time.time()
    
    conn = mysql.connector.connect(**DB_CONFIG)
    
    # 第一步：收集有效 BuildingID
    valid_bids, total_prop = collect_valid_building_ids()
    
    # 第二步：导入 estates
    estate_map = import_estates(valid_bids, conn)
    
    # 第三步：导入 buildings
    building_map = import_buildings(valid_bids, estate_map, conn)
    
    # 第四步：导入 units
    import_units(building_map, conn)
    
    # 第五步：统计
    print_stats(conn)
    
    conn.close()
    print(f"\n总耗时: {time.time()-start:.1f}秒")

if __name__ == '__main__':
    main()
