#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳物业单元数据导入脚本
将 tb_Property.sql（SQL Server 格式，~247万条）导入到 gujia.units 表
按 楼盘(estates) → 楼栋(buildings) → 单元(units) 层级关联
采用流式读取 + 批量插入，避免内存溢出
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
SQL_FILE = '/home/ubuntu/upload/tb_Property_extracted/tb_Property.sql'
BATCH_SIZE = 2000   # 每批插入条数

# ── 朝向编码映射 ──────────────────────────────────────────────────
TOWARDS_MAP = {
    '0': '未知', '1': '东', '2': '南', '3': '西', '4': '北',
    '5': '东南', '6': '东北', '7': '西南', '8': '西北',
    '9': '南北', '10': '东西',
}

# ── 景观编码映射 ──────────────────────────────────────────────────
LANDSCAPE_MAP = {
    '0': '无', '1': '花园', '2': '城市', '4': '山景',
    '6': '江景', '8': '海景', '9': '湖景', '10': '内院',
    '11': '街景',
}

# ── PropertyType 编码 → 户型描述 ─────────────────────────────────
# 编码规律: 十位=室数, 个位=厅数 (如 31=3室1厅, 21=2室1厅)
# 超出规律的按数字范围分类
def decode_property_type(val):
    if val is None or str(val).strip() in ('', 'NULL', '0'):
        return None
    try:
        v = int(str(val).strip())
        if v <= 0:
            return None
        # 常见户型编码
        rooms = v // 10
        halls = v % 10
        if 1 <= rooms <= 6 and 0 <= halls <= 4:
            return f"{rooms}室{halls}厅"
        # 特殊编码
        special = {
            88: '商铺', 94: '办公', 97: '车位', 99: '其他',
            100: '商铺', 101: '办公', 110: '仓储',
        }
        return special.get(v, f'类型{v}')
    except:
        return None

# ── PropertyStructure 编码映射 ────────────────────────────────────
STRUCTURE_MAP = {
    '0': '未知', '1': '框架', '2': '砖混', '3': '砖木',
    '4': '钢混', '5': '钢结构', '6': '剪力墙', '7': '框剪',
}

# ── 工具函数 ──────────────────────────────────────────────────────
def clean_str(val):
    if val is None or str(val).strip() in ('', 'NULL'):
        return None
    return str(val).strip()

def parse_int(val):
    if val is None or str(val).strip() in ('', 'NULL'):
        return None
    try:
        return int(float(str(val).strip()))
    except:
        return None

def parse_float(val):
    if val is None or str(val).strip() in ('', 'NULL'):
        return None
    try:
        v = float(str(val).strip())
        return v if v > 0 else None
    except:
        return None

# ── 快速正则解析单行 ──────────────────────────────────────────────
# 字段: PropertyID(0), BuildingID(1), PropertyName(2), PropertyType(3),
#       PropertyStructure(4), Floor(5), PropertyNo(6), BuildArea(7),
#       Towards(8), Landscape(9), UnitPrice(10), TotalPrice(11),
#       Remark(12), PropertyUsage(13), IsConfirm(14), OldID(15), Deleted(16)

LINE_PATTERN = re.compile(
    r"VALUES \((\d+), (\d+), N'((?:[^']|'')*)', (\d+), (\d+|NULL), (-?\d+), N'((?:[^']|'')*)', "
    r"([\d.]+|NULL), (\d+|NULL), (\d+|NULL), ([\d.]+|NULL), ([\d.]+|NULL), "
    r"(N'(?:[^']|'')*'|NULL), (NULL|\d+), '[01]', \d+, '([01])',"
)

LINE_PATTERN2 = re.compile(
    r"VALUES \((\d+), (\d+), N'((?:[^']|'')*)', (\d+), (\d+|NULL), (-?\d+), N'((?:[^']|'')*)', "
    r"([\d.]+|NULL), (\d+|NULL), (\d+|NULL), ([\d.]+|NULL), ([\d.]+|NULL), "
    r"(?:N'(?:[^']|'')*'|NULL), (?:NULL|\d+), '[01]', \d+, '([01])',"
)

def parse_line_fast(line):
    """快速解析单行 INSERT 语句"""
    # 提取关键字段
    m = re.search(
        r"VALUES \((\d+), (\d+), N'((?:[^']|'')*)', (\d+), (\d+|NULL), (-?\d+), "
        r"N'((?:[^']|'')*)', ([\d.]+|NULL), (\d+|NULL), (\d+|NULL), "
        r"([\d.]+|NULL), ([\d.]+|NULL), (?:N'((?:[^']|'')*)'|NULL), "
        r"(?:NULL|\d+), '[01]', \d+, '([01])',",
        line
    )
    if not m:
        return None
    
    deleted = m.group(14)
    if deleted == '1':
        return None  # 跳过已删除
    
    property_id   = m.group(1)
    building_id   = m.group(2)
    property_name = m.group(3).replace("''", "'")
    prop_type     = m.group(4)
    prop_struct   = m.group(5)
    floor_val     = m.group(6)
    property_no   = m.group(7).replace("''", "'")
    build_area    = m.group(8)
    towards       = m.group(9)
    landscape     = m.group(10)
    unit_price    = m.group(11)
    total_price   = m.group(12)
    remark        = m.group(13)
    
    return {
        'property_id':   int(property_id),
        'building_id':   int(building_id),
        'property_name': property_name,
        'prop_type':     prop_type,
        'prop_struct':   prop_struct if prop_struct != 'NULL' else None,
        'floor':         parse_int(floor_val),
        'property_no':   clean_str(property_no),
        'build_area':    parse_float(build_area),
        'towards':       towards if towards != 'NULL' else None,
        'landscape':     landscape if landscape != 'NULL' else None,
        'unit_price':    parse_float(unit_price),
        'total_price':   parse_float(total_price),
        'remark':        remark,
    }

# ── 构建 BuildingID → (building.id, estate.id) 映射 ──────────────
def build_mapping():
    """从数据库加载 source_id(BuildingID) → (local_building_id, estate_id) 映射"""
    print("加载楼栋 ID 映射表...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.source_id, b.id, b.estate_id
        FROM buildings b
        JOIN estates e ON b.estate_id = e.id
        WHERE e.city_id = 6 AND b.source_id IS NOT NULL
    """)
    mapping = {}
    for src_id, local_id, estate_id in cursor.fetchall():
        mapping[src_id] = (local_id, estate_id)
    cursor.close()
    conn.close()
    print(f"映射表加载完成: {len(mapping):,} 条楼栋记录")
    return mapping

# ── 导入主逻辑 ────────────────────────────────────────────────────
def import_units(building_map):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # 优化 MySQL 导入性能
    cursor.execute("SET foreign_key_checks = 0")
    cursor.execute("SET unique_checks = 0")
    cursor.execute("SET sql_log_bin = 0")
    cursor.execute("SET GLOBAL innodb_flush_log_at_trx_commit = 2")
    
    INSERT_SQL = """
    INSERT INTO units (
        building_id, estate_id, unit_number,
        property_type, property_structure, property_no,
        floor, area, build_area,
        orientation, towards, landscape,
        unit_price, total_price, remark,
        source_id, source_building_id, created_at
    ) VALUES (
        %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s,
        %s, %s, NOW()
    )"""
    
    batch = []
    total_inserted = 0
    total_skipped = 0
    no_building = 0
    start_time = time.time()
    last_report = time.time()
    
    print(f"\n开始流式读取并导入...")
    
    with open(SQL_FILE, 'r', encoding='utf-8', errors='replace') as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line.startswith('INSERT INTO'):
                continue
            
            rec = parse_line_fast(line)
            if rec is None:
                total_skipped += 1
                continue
            
            # 查找本地楼栋 ID
            src_bid = rec['building_id']
            mapping = building_map.get(src_bid)
            if not mapping:
                no_building += 1
                total_skipped += 1
                continue
            
            local_building_id, estate_id = mapping
            
            # 字段转换
            property_type  = decode_property_type(rec['prop_type'])
            prop_structure = STRUCTURE_MAP.get(rec['prop_struct'], None)
            towards_text   = TOWARDS_MAP.get(rec['towards'], None)
            landscape_text = LANDSCAPE_MAP.get(rec['landscape'], None)
            
            # unit_number: 优先用 PropertyName，其次 PropertyNo
            unit_number = rec['property_name'] or rec['property_no'] or f"F{rec['floor']}"
            
            batch.append((
                local_building_id,
                estate_id,
                unit_number,
                property_type,
                prop_structure,
                rec['property_no'],
                rec['floor'],
                rec['build_area'],   # area = build_area
                rec['build_area'],   # build_area
                towards_text,        # orientation
                towards_text,        # towards
                landscape_text,
                rec['unit_price'],
                rec['total_price'],
                rec['remark'],
                rec['property_id'],
                src_bid,
            ))
            total_inserted += 1
            
            # 批量写入
            if len(batch) >= BATCH_SIZE:
                cursor.executemany(INSERT_SQL, batch)
                conn.commit()
                batch = []
            
            # 进度报告（每30秒）
            now = time.time()
            if now - last_report >= 30:
                elapsed = now - start_time
                rate = total_inserted / elapsed if elapsed > 0 else 0
                print(f"  已处理: {total_inserted:>8,} 条 | 跳过: {total_skipped:,} | "
                      f"速度: {rate:.0f}条/秒 | 耗时: {elapsed:.0f}s")
                last_report = now
    
    # 写入剩余批次
    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()
    
    cursor.execute("SET foreign_key_checks = 1")
    cursor.execute("SET unique_checks = 1")
    conn.commit()
    cursor.close()
    conn.close()
    
    elapsed = time.time() - start_time
    print(f"\n导入完成! 耗时: {elapsed:.1f}秒")
    print(f"无对应楼栋(BuildingID未找到): {no_building:,} 条")
    return total_inserted, total_skipped

# ── 统计结果 ──────────────────────────────────────────────────────
def print_stats():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # 各区统计
    cursor.execute("""
        SELECT d.name AS district_name, COUNT(*) AS unit_count
        FROM units u
        JOIN buildings b ON u.building_id = b.id
        JOIN estates e ON u.estate_id = e.id
        JOIN districts d ON e.district_id = d.id
        WHERE e.city_id = 6
        GROUP BY d.id, d.name
        ORDER BY COUNT(*) DESC
    """)
    district_stats = cursor.fetchall()
    
    # 总数
    cursor.execute("""
        SELECT COUNT(*) FROM units u
        JOIN estates e ON u.estate_id = e.id
        WHERE e.city_id = 6
    """)
    total = cursor.fetchone()[0]
    
    # 有单价数据
    cursor.execute("""
        SELECT COUNT(*) FROM units u
        JOIN estates e ON u.estate_id = e.id
        WHERE e.city_id = 6 AND u.unit_price IS NOT NULL
    """)
    with_price = cursor.fetchone()[0]
    
    # 户型分布
    cursor.execute("""
        SELECT u.property_type, COUNT(*) AS cnt
        FROM units u JOIN estates e ON u.estate_id = e.id
        WHERE e.city_id = 6 AND u.property_type IS NOT NULL
        GROUP BY u.property_type ORDER BY COUNT(*) DESC LIMIT 12
    """)
    type_stats = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("各区单元数量统计：")
    print(f"{'区名':<12} {'单元数量':>12}")
    print("-" * 27)
    for row in district_stats:
        print(f"{row[0]:<12} {row[1]:>12,}")
    print("-" * 27)
    print(f"{'深圳合计':<12} {total:>12,}")
    print(f"\n有单价数据: {with_price:,} 条 ({with_price/total*100:.1f}%)" if total > 0 else "")
    
    print(f"\n户型分布（前12）:")
    print(f"{'户型':<12} {'数量':>10}")
    print("-" * 25)
    for row in type_stats:
        print(f"{row[0]:<12} {row[1]:>10,}")
    print("=" * 60)

# ── 主程序 ────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("深圳物业单元数据导入工具")
    print(f"数据文件: {SQL_FILE}")
    print("=" * 60)
    
    # 1. 加载楼栋映射
    building_map = build_mapping()
    
    # 2. 清空旧数据
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        DELETE u FROM units u
        JOIN estates e ON u.estate_id = e.id
        WHERE e.city_id = 6
    """)
    deleted = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    print(f"已清空旧深圳单元数据: {deleted:,} 条")
    
    # 3. 导入
    inserted, skipped = import_units(building_map)
    
    # 4. 统计
    print_stats()

if __name__ == '__main__':
    main()
