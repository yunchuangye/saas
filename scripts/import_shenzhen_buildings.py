#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳楼栋数据导入脚本
将 tb_Building.sql（SQL Server 格式）转换并导入到 gujia.buildings 表
通过 source_estate_id → estates.source_id 关联楼盘
"""

import re
import mysql.connector
from datetime import datetime
from collections import defaultdict

# ── 配置 ─────────────────────────────────────────────────────────
DB_CONFIG = {
    'host': '127.0.0.1', 'port': 3306,
    'user': 'gujia', 'password': 'gujia_dev_2026',
    'database': 'gujia', 'charset': 'utf8mb4',
}
SQL_FILE = '/home/ubuntu/upload/tb_Building.sql'

# BuildStructure 数值 → 文字
BUILD_STRUCTURE_MAP = {
    '0': '未知', '1': '砖混', '2': '框架', '3': '砖木',
    '4': '钢混', '6': '钢结构', '7': '剪力墙', '8': '框剪',
}

# BuildType 数值 → 文字
BUILD_TYPE_MAP = {
    '0': '未知', '1': '多层', '2': '小高层', '3': '高层',
    '4': '别墅', '5': '超高层',
}

# PropertyUsage 数值 → 物业类型
PROPERTY_USAGE_MAP = {
    '1':'住宅', '2':'商业', '3':'办公', '4':'商住', '6':'工业',
    '9':'车位', '21':'办公', '24':'工业', '25':'商业', '26':'住宅',
}

# ── 工具函数 ──────────────────────────────────────────────────────
def clean_str(val):
    if val is None or str(val).strip() in ('', 'NULL'):
        return None
    return str(val).strip()

def parse_date(val):
    if not val or str(val).strip() in ('', 'NULL'):
        return None
    m = re.match(r'(\d{4}-\d{2}-\d{2})', str(val).strip())
    if m:
        try:
            d = datetime.strptime(m.group(1), '%Y-%m-%d')
            if 1950 <= d.year <= 2030:
                return d.strftime('%Y-%m-%d')
        except:
            pass
    return None

def parse_int(val):
    if val is None or str(val).strip() in ('', 'NULL'):
        return None
    try:
        v = int(float(str(val).strip()))
        return v if v >= 0 else None
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

# ── 状态机解析 VALUES 字段 ────────────────────────────────────────
def parse_values(vals_str):
    fields = []
    i, n = 0, len(vals_str)
    while i < n:
        while i < n and vals_str[i] in (' ', '\t', '\n', '\r'): i += 1
        if i >= n: break
        if vals_str[i] == ',': i += 1; continue
        if i < n-1 and vals_str[i] == 'N' and vals_str[i+1] == "'":
            i += 2; s = []
            while i < n:
                if vals_str[i] == "'":
                    if i+1 < n and vals_str[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(vals_str[i]); i += 1
            fields.append(''.join(s))
        elif vals_str[i] == "'":
            i += 1; s = []
            while i < n:
                if vals_str[i] == "'":
                    if i+1 < n and vals_str[i+1] == "'": s.append("'"); i += 2
                    else: i += 1; break
                else: s.append(vals_str[i]); i += 1
            fields.append(''.join(s))
        elif vals_str[i:i+4] == 'NULL': fields.append(None); i += 4
        elif vals_str[i].isdigit() or vals_str[i] == '-':
            j = i
            while j < n and (vals_str[j].isdigit() or vals_str[j] in '.+-eE'): j += 1
            fields.append(vals_str[i:j].strip()); i = j
        else: i += 1
    return fields

# ── 解析 SQL 文件 ─────────────────────────────────────────────────
def parse_sql_file(filepath):
    print(f"读取文件: {filepath}")
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    stmts = content.split('\nGO\n')
    print(f"找到语句数: {len(stmts)}")

    # 字段顺序: BuildingID(0), EstateID(1), BuildingName(2), PropertyUsage(3),
    #           BuildingAlias(4), BuildStructure(5), BuildType(6), FloorAmount(7),
    #           FloorHight(8), SaleLicence(9), LicenceDate(10), ElevatorRate(11),
    #           UnitAmount(12), PropertyAmount(13), BuildingArea(14),
    #           CompletionDate(15), SaleDate(16), AveragePrice(17), AverageFloor(18),
    #           IsConfirm(19), OldID(20), Deleted(21), iautoid(22)

    records = []
    parsed = skipped = 0
    for stmt in stmts:
        stmt = stmt.strip()
        if not stmt.startswith('INSERT INTO'): continue
        m = re.search(r'VALUES \((.+)\);$', stmt, re.DOTALL)
        if not m: skipped += 1; continue
        fields = parse_values(m.group(1))
        if len(fields) < 22: skipped += 1; continue
        try:
            records.append({
                'building_id':    fields[0],
                'estate_id':      fields[1],      # 源系统 EstateID
                'building_name':  fields[2],
                'property_usage': str(fields[3]) if fields[3] else None,
                'building_alias': fields[4],
                'build_structure':str(fields[5]) if fields[5] else None,
                'build_type':     str(fields[6]) if fields[6] else None,
                'floor_amount':   parse_int(fields[7]),
                'floor_height':   parse_float(fields[8]),
                'sale_licence':   clean_str(fields[9]),
                'elevator_rate':  clean_str(fields[11]),
                'unit_amount':    parse_int(fields[12]),
                'property_amount':parse_int(fields[13]),
                'building_area':  parse_float(fields[14]),
                'completion_date':parse_date(fields[15]),
                'sale_date':      parse_date(fields[16]),
                'avg_price':      parse_float(fields[17]),
                'deleted':        fields[21],
            })
            parsed += 1
        except Exception as e:
            skipped += 1
    print(f"成功解析: {parsed} 条，跳过: {skipped} 条")
    return records

# ── 构建 EstateID → estate.id 映射表 ─────────────────────────────
def build_estate_id_map():
    """从 estates 表查询 source_id → id 的映射"""
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("SELECT source_id, id FROM estates WHERE city_id = 6 AND source_id IS NOT NULL")
    mapping = {row[0]: row[1] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    print(f"楼盘 ID 映射表: {len(mapping)} 条（深圳）")
    return mapping

# ── 导入数据库 ────────────────────────────────────────────────────
def import_to_db(records, estate_id_map):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    total_inserted = total_skipped = no_estate = 0

    INSERT_SQL = """
    INSERT INTO buildings (
        estate_id, name, property_type, alias,
        build_structure, build_type, floors, floor_height,
        unit_amount, total_units, building_area,
        completion_date, sale_date, avg_price,
        elevator_rate, sale_licence,
        source_id, source_estate_id, created_at
    ) VALUES (
        %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s,
        %s, %s, %s,
        %s, %s,
        %s, %s, NOW()
    )"""

    print(f"\n开始导入 {len(records)} 条楼栋记录...")
    batch = []
    BATCH_SIZE = 500

    for rec in records:
        # 跳过已删除
        if rec.get('deleted') == '1':
            total_skipped += 1; continue

        # 楼栋名不能为空
        building_name = clean_str(rec.get('building_name'))
        if not building_name:
            total_skipped += 1; continue

        # 通过源 EstateID 找到本地 estate_id
        src_estate_id = rec.get('estate_id')
        try:
            src_estate_id_int = int(src_estate_id) if src_estate_id else None
        except:
            src_estate_id_int = None

        local_estate_id = estate_id_map.get(src_estate_id_int) if src_estate_id_int else None
        if not local_estate_id:
            no_estate += 1
            total_skipped += 1
            continue

        # 字段转换
        property_type  = PROPERTY_USAGE_MAP.get(rec.get('property_usage'), '住宅')
        build_structure= BUILD_STRUCTURE_MAP.get(rec.get('build_structure'), None)
        build_type     = BUILD_TYPE_MAP.get(rec.get('build_type'), None)
        alias          = clean_str(rec.get('building_alias'))
        avg_price      = rec.get('avg_price')

        batch.append((
            local_estate_id,
            building_name,
            property_type,
            alias,
            build_structure,
            build_type,
            rec.get('floor_amount'),
            rec.get('floor_height'),
            rec.get('unit_amount'),
            rec.get('property_amount'),
            rec.get('building_area'),
            rec.get('completion_date'),
            rec.get('sale_date'),
            avg_price,
            rec.get('elevator_rate'),
            rec.get('sale_licence'),
            rec.get('building_id'),
            src_estate_id_int,
        ))
        total_inserted += 1

        if len(batch) >= BATCH_SIZE:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            batch = []

    if batch:
        cursor.executemany(INSERT_SQL, batch)
        conn.commit()

    cursor.close()
    conn.close()
    print(f"无对应楼盘(EstateID未找到): {no_estate} 条")
    return total_inserted, total_skipped

# ── 主程序 ────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("深圳楼栋数据导入工具")
    print("=" * 60)

    records = parse_sql_file(SQL_FILE)
    estate_id_map = build_estate_id_map()

    # 清空旧楼栋数据（深圳楼盘关联的）
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        DELETE b FROM buildings b
        INNER JOIN estates e ON b.estate_id = e.id
        WHERE e.city_id = 6
    """)
    deleted_count = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    print(f"已清空旧深圳楼栋数据: {deleted_count} 条")

    inserted, skipped = import_to_db(records, estate_id_map)

    # 验证结果
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.name AS district_name, COUNT(*) AS building_count
        FROM buildings b
        JOIN estates e ON b.estate_id = e.id
        JOIN districts d ON e.district_id = d.id
        WHERE e.city_id = 6
        GROUP BY d.id, d.name
        ORDER BY COUNT(*) DESC
    """)
    district_stats = cursor.fetchall()
    cursor.execute("""
        SELECT COUNT(*) FROM buildings b
        JOIN estates e ON b.estate_id = e.id
        WHERE e.city_id = 6
    """)
    total_in_db = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("导入完成！各区楼栋数量统计：")
    print(f"{'区名':<12} {'楼栋数量':>10}")
    print("-" * 25)
    for row in district_stats:
        print(f"{row[0]:<12} {row[1]:>10}")
    print("-" * 25)
    print(f"{'总计导入':<12} {inserted:>10}")
    print(f"{'数据库实际':<12} {total_in_db:>10}")
    print(f"{'跳过(删除/无效)':<12} {skipped:>10}")
    print("=" * 60)

if __name__ == '__main__':
    main()
