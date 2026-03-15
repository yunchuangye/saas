#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳楼盘数据导入脚本 v2
将 tb_Estate.sql（SQL Server 格式）转换并导入到 gujia.estates 表
支持深圳全部10个区精确识别（含龙华、坪山、光明、大鹏新区）
"""

import re
import sys
import mysql.connector
from datetime import datetime
from collections import defaultdict

# ── 配置 ─────────────────────────────────────────────────────────
DB_CONFIG = {
    'host': '127.0.0.1', 'port': 3306,
    'user': 'gujia', 'password': 'gujia_dev_2026',
    'database': 'gujia', 'charset': 'utf8mb4',
}
SQL_FILE = '/home/ubuntu/upload/tb_Estate.sql'
SHENZHEN_CITY_ID = 6

# ── 深圳区信息（district_id 来自 districts 表）────────────────────
DISTRICTS = {
    '罗湖区':  {'id': 84, 'kw': ['罗湖']},
    '福田区':  {'id': 85, 'kw': ['福田', '华强', '莲花', '景田', '车公庙', '梅林', '沙头']},
    '南山区':  {'id': 86, 'kw': ['南山', '蛇口', '西丽', '粤海', '桃源', '招商', '华侨城']},
    '盐田区':  {'id': 89, 'kw': ['盐田', '沙头角', '梅沙', '盐港']},
    '宝安区':  {'id': 87, 'kw': ['宝安', '西乡', '沙井', '松岗', '新桥', '福永', '石岩', '航城']},
    '龙岗区':  {'id': 88, 'kw': ['龙岗', '布吉', '横岗', '平湖', '坂田', '南湾', '吉华', '园山', '龙城']},
    '龙华区':  {'id': 90, 'kw': ['龙华', '观澜', '民治', '大浪', '福城', '清湖', '龙胜', '观城']},
    '坪山区':  {'id': 91, 'kw': ['坪山', '坑梓', '碧岭', '石井', '龙田', '马峦']},
    '光明区':  {'id': 92, 'kw': ['光明', '公明', '新湖', '玉塘', '凤凰', '马田', '光明新区']},
    '大鹏新区':{'id': 93, 'kw': ['大鹏', '葵涌', '南澳', '坝光']},
}

# AreaCode 前6位 → 默认区（当关键词无法识别时的兜底）
AREA_CODE_DEFAULT = {
    '010101': '罗湖区',
    '010102': '福田区',
    '010103': '南山区',
    '010104': '盐田区',
    '010105': '龙岗区',   # 含坪山、大鹏
    '010106': '宝安区',   # 含龙华、光明
}

# PropertyUsage 数值 → 物业类型
PROPERTY_USAGE_MAP = {
    1:'住宅', 2:'商业', 3:'办公', 8:'酒店', 10:'工业',
    13:'仓储', 14:'工业厂房', 15:'商住', 16:'综合', 19:'车位',
    21:'办公', 23:'商业', 24:'工业', 25:'商业', 26:'住宅',
    27:'综合', 28:'商业', 30:'工业', 31:'住宅', 33:'综合',
    35:'商业', 36:'工业', 0:'其他',
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
            if 1980 <= d.year <= 2030:
                return d.strftime('%Y-%m-%d')
        except:
            pass
    return None

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

def identify_district(area_code, estate_name, location):
    """智能识别深圳区：先按地址/楼盘名关键词，再按 AreaCode 默认值"""
    text = (location or '') + (estate_name or '')
    # 按关键词优先级匹配（龙华、坪山、光明、大鹏优先，避免被宝安/龙岗吞并）
    priority_order = ['大鹏新区', '坪山区', '光明区', '龙华区', '盐田区',
                      '南山区', '福田区', '罗湖区', '龙岗区', '宝安区']
    for dname in priority_order:
        for kw in DISTRICTS[dname]['kw']:
            if kw in text:
                return dname, DISTRICTS[dname]['id']
    # 兜底：按 AreaCode 前6位
    default_name = AREA_CODE_DEFAULT.get(area_code[:6] if area_code else '', '宝安区')
    return default_name, DISTRICTS[default_name]['id']

def get_property_type(usage_val, planning_func):
    pf = clean_str(planning_func)
    if pf and not re.match(r'^\d', pf):
        types = [t.strip() for t in pf.split(',') if t.strip()]
        if types:
            return types[0]
    if usage_val is not None:
        return PROPERTY_USAGE_MAP.get(usage_val, '其他')
    return '住宅'

# ── 状态机解析 VALUES 字段 ────────────────────────────────────────
def parse_values(vals_str):
    fields = []
    i, n = 0, len(vals_str)
    while i < n:
        while i < n and vals_str[i] in (' ', '\t', '\n', '\r'):
            i += 1
        if i >= n:
            break
        if vals_str[i] == ',':
            i += 1
            continue
        if i < n-1 and vals_str[i] == 'N' and vals_str[i+1] == "'":
            i += 2
            s = []
            while i < n:
                if vals_str[i] == "'":
                    if i+1 < n and vals_str[i+1] == "'":
                        s.append("'"); i += 2
                    else:
                        i += 1; break
                else:
                    s.append(vals_str[i]); i += 1
            fields.append(''.join(s))
        elif vals_str[i] == "'":
            i += 1
            s = []
            while i < n:
                if vals_str[i] == "'":
                    if i+1 < n and vals_str[i+1] == "'":
                        s.append("'"); i += 2
                    else:
                        i += 1; break
                else:
                    s.append(vals_str[i]); i += 1
            fields.append(''.join(s))
        elif vals_str[i:i+4] == 'NULL':
            fields.append(None); i += 4
        elif vals_str[i].isdigit() or vals_str[i] == '-':
            j = i
            while j < n and (vals_str[j].isdigit() or vals_str[j] in '.+-eE'):
                j += 1
            fields.append(vals_str[i:j].strip()); i = j
        else:
            i += 1
    return fields

# ── 解析 SQL 文件 ─────────────────────────────────────────────────
def parse_sql_file(filepath):
    print(f"读取文件: {filepath}")
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    stmts = content.split('\nGO\n')
    print(f"找到语句数: {len(stmts)}")

    records = []
    parsed = skipped = 0
    for stmt in stmts:
        stmt = stmt.strip()
        if not stmt.startswith('INSERT INTO'):
            continue
        m = re.search(r'VALUES \((.+)\);$', stmt, re.DOTALL)
        if not m:
            skipped += 1; continue
        fields = parse_values(m.group(1))
        if len(fields) < 29:
            skipped += 1; continue
        try:
            records.append({
                'estate_id':      parse_int(fields[0]),
                'area_code':      fields[1],
                'property_usage': parse_int(fields[2]),
                'estate_name':    fields[4],
                'location':       fields[6],
                'use_period':     parse_int(fields[8]),
                'land_area':      parse_float(fields[9]),
                'building_area':  parse_float(fields[10]),
                'property_amount':parse_int(fields[13]),
                'parking_amount': parse_int(fields[14]),
                'greening_rate':  parse_float(fields[15]),
                'far':            parse_float(fields[16]),
                'overview':       fields[17],
                'planning_func':  fields[18],
                'sale_date':      parse_date(fields[19]),
                'completion_date':parse_date(fields[20]),
                'is_saling':      fields[23],
                'proj_abbr':      fields[24],
                'deleted':        fields[28],
            })
            parsed += 1
        except Exception as e:
            skipped += 1
    print(f"成功解析: {parsed} 条，跳过: {skipped} 条")
    return records

# ── 导入数据库 ────────────────────────────────────────────────────
def import_to_db(records):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    district_stats = defaultdict(int)
    total_inserted = total_skipped = 0

    INSERT_SQL = """
    INSERT INTO estates (
        name, pinyin, city_id, district_id, address,
        property_type, total_units, land_area, building_area,
        use_period, greening_rate, far, parking_amount,
        overview, is_selling, sale_date, completion_date,
        source_id, area_code, is_active, created_at
    ) VALUES (
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, 1, NOW()
    )"""

    print(f"\n开始导入 {len(records)} 条记录...")
    for rec in records:
        if rec.get('deleted') == '1':
            total_skipped += 1; continue
        estate_name = clean_str(rec.get('estate_name'))
        if not estate_name:
            total_skipped += 1; continue

        area_code  = rec.get('area_code', '')
        location   = clean_str(rec.get('location'))
        district_name, district_id = identify_district(area_code, estate_name, location)
        property_type = get_property_type(rec.get('property_usage'), clean_str(rec.get('planning_func')))
        address = location or f'深圳市{district_name}'
        pinyin  = clean_str(rec.get('proj_abbr'))
        is_selling = 1 if rec.get('is_saling') == '1' else 0

        try:
            cursor.execute(INSERT_SQL, (
                estate_name, pinyin, SHENZHEN_CITY_ID, district_id, address,
                property_type, rec.get('property_amount'),
                rec.get('land_area'), rec.get('building_area'),
                rec.get('use_period'), rec.get('greening_rate'), rec.get('far'),
                rec.get('parking_amount'), clean_str(rec.get('overview')),
                is_selling, rec.get('sale_date'), rec.get('completion_date'),
                rec.get('estate_id'), area_code,
            ))
            district_stats[district_name] += 1
            total_inserted += 1
        except mysql.connector.Error as e:
            total_skipped += 1
            if e.errno != 1062:
                print(f"  插入错误 [{estate_name}]: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    return total_inserted, total_skipped, district_stats

# ── 主程序 ────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("深圳楼盘数据导入工具 v2（支持全10区）")
    print("=" * 60)

    records = parse_sql_file(SQL_FILE)

    # 先清空深圳楼盘数据（重新导入）
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM estates WHERE city_id = %s", (SHENZHEN_CITY_ID,))
    deleted_count = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    print(f"\n已清空旧深圳楼盘数据: {deleted_count} 条")

    inserted, skipped, stats = import_to_db(records)

    print("\n" + "=" * 60)
    print("导入完成！各区楼盘数量统计：")
    print(f"{'区名':<12} {'导入数量':>10}")
    print("-" * 25)
    order = ['罗湖区','福田区','南山区','盐田区','宝安区','龙岗区','龙华区','坪山区','光明区','大鹏新区']
    grand_total = 0
    for name in order:
        cnt = stats.get(name, 0)
        print(f"{name:<12} {cnt:>10}")
        grand_total += cnt
    print("-" * 25)
    print(f"{'总计导入':<12} {grand_total:>10}")
    print(f"{'跳过(删除/无效)':<12} {skipped:>10}")
    print("=" * 60)

if __name__ == '__main__':
    main()
