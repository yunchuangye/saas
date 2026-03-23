#!/usr/bin/env python3
"""
从 gujia_full_20260322.sql.gz 提取深圳市（city_id=6）的楼盘/楼栋/房屋数据，
将 city_id 映射为当前数据库中深圳的 id=190，并导入主表和分片表。
"""

import gzip
import re
import mysql.connector
import sys
import time

# 数据库连接配置
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'gujia',
    'password': 'gujia_dev_2026',
    'database': 'gujia',
    'charset': 'utf8mb4',
    'unix_socket': '/var/run/mysqld/mysqld.sock',
    'allow_local_infile': True,
}

BACKUP_FILE = '/home/ubuntu/saas/database/gujia_full_20260322.sql.gz'
SRC_CITY_ID = 6      # 备份中深圳的 city_id
DST_CITY_ID = 190    # 当前数据库中深圳的 city_id

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def parse_values_line(line):
    """解析 INSERT INTO `table` VALUES (...),(...),...; 行，返回 values 字符串列表"""
    # 去掉行尾分号和换行
    line = line.rstrip(';\n').strip()
    # 找到 VALUES 后面的内容
    m = re.search(r'VALUES\s+(.+)$', line, re.DOTALL)
    if not m:
        return []
    values_str = m.group(1)
    return values_str

def extract_shenzhen_estates(backup_file):
    """提取深圳楼盘数据，返回 (old_id -> new_record) 映射"""
    print("正在提取深圳楼盘数据 (city_id=6)...")
    estates = []  # [(old_id, name, pinyin, district_id, address, developer, build_year, property_type, total_units, land_area, building_area, use_period, greening_rate, far, parking_amount, overview, is_selling, sale_date, completion_date, source_id, area_code, is_active, created_at)]
    
    with gzip.open(backup_file, 'rt', encoding='utf8', errors='replace') as f:
        for line in f:
            if not line.startswith('INSERT INTO `estates`'):
                continue
            # 用 Python 解析每条记录
            values_str = parse_values_line(line)
            if not values_str:
                continue
            # 逐个解析记录
            pos = 0
            while pos < len(values_str):
                if values_str[pos] != '(':
                    pos += 1
                    continue
                # 找到匹配的右括号
                depth = 0
                start = pos
                in_str = False
                escape = False
                for i in range(pos, len(values_str)):
                    c = values_str[i]
                    if escape:
                        escape = False
                        continue
                    if c == '\\' and in_str:
                        escape = True
                        continue
                    if c == "'" and not escape:
                        in_str = not in_str
                        continue
                    if not in_str:
                        if c == '(':
                            depth += 1
                        elif c == ')':
                            depth -= 1
                            if depth == 0:
                                record_str = values_str[start+1:i]
                                # 解析这条记录的字段
                                fields = parse_record_fields(record_str)
                                if fields and len(fields) >= 4:
                                    try:
                                        city_id = int(fields[3]) if fields[3] != 'NULL' else None
                                        if city_id == SRC_CITY_ID:
                                            estates.append(fields)
                                    except (ValueError, IndexError):
                                        pass
                                pos = i + 1
                                break
                else:
                    break
    
    print(f"  提取到 {len(estates)} 条深圳楼盘记录")
    return estates

def parse_record_fields(record_str):
    """解析单条记录的字段值，返回字符串列表"""
    fields = []
    pos = 0
    s = record_str.strip()
    while pos <= len(s):
        if pos == len(s):
            break
        c = s[pos]
        if c == "'":
            # 字符串字段
            end = pos + 1
            result = []
            while end < len(s):
                if s[end] == '\\':
                    result.append(s[end:end+2])
                    end += 2
                elif s[end] == "'":
                    end += 1
                    break
                else:
                    result.append(s[end])
                    end += 1
            fields.append("'" + ''.join(result) + "'")
            pos = end
            # 跳过逗号
            if pos < len(s) and s[pos] == ',':
                pos += 1
        elif s[pos:pos+4] == 'NULL':
            fields.append('NULL')
            pos += 4
            if pos < len(s) and s[pos] == ',':
                pos += 1
        else:
            # 数字或其他
            end = pos
            while end < len(s) and s[end] != ',':
                end += 1
            fields.append(s[pos:end].strip())
            pos = end
            if pos < len(s) and s[pos] == ',':
                pos += 1
    return fields

def insert_estates(conn, estates):
    """插入楼盘数据到 estates 主表，返回 old_id -> new_id 映射"""
    cursor = conn.cursor()
    old_to_new = {}  # old estate id -> new estate id
    
    print(f"正在插入 {len(estates)} 条楼盘数据...")
    
    # 先清除之前的深圳示例数据（city_id=190）
    cursor.execute("DELETE FROM estates WHERE city_id = %s", (DST_CITY_ID,))
    deleted = cursor.rowcount
    print(f"  清除旧深圳楼盘数据: {deleted} 条")
    conn.commit()
    
    batch = []
    batch_size = 500
    inserted = 0
    
    for fields in estates:
        # fields 顺序: id, name, pinyin, city_id, district_id, address, developer, build_year, 
        #              property_type, total_units, land_area, building_area, use_period, greening_rate,
        #              far, parking_amount, overview, is_selling, sale_date, completion_date,
        #              source_id, area_code, is_active, created_at
        old_id = int(fields[0])
        name = fields[1]
        pinyin = fields[2]
        # city_id 替换为 DST_CITY_ID
        district_id = fields[4]
        address = fields[5]
        developer = fields[6]
        build_year = fields[7]
        property_type = fields[8]
        total_units = fields[9]
        land_area = fields[10]
        building_area = fields[11]
        use_period = fields[12]
        greening_rate = fields[13]
        far = fields[14]
        parking_amount = fields[15]
        overview = fields[16]
        is_selling = fields[17]
        sale_date = fields[18]
        completion_date = fields[19]
        source_id = fields[20]
        area_code = fields[21]
        is_active = fields[22]
        created_at = fields[23]
        
        def f(v):
            if v == 'NULL': return None
            if v.startswith("'") and v.endswith("'"):
                # 处理转义
                inner = v[1:-1]
                inner = inner.replace("\\'", "'").replace('\\\\', '\\').replace('\\n', '\n').replace('\\r', '\r').replace('\\t', '\t')
                return inner
            try: return int(v)
            except:
                try: return float(v)
                except: return v
        
        batch.append((
            f(name), f(pinyin), DST_CITY_ID, f(district_id), f(address), f(developer),
            f(build_year), f(property_type), f(total_units), f(land_area), f(building_area),
            f(use_period), f(greening_rate), f(far), f(parking_amount), f(overview),
            f(is_selling), f(sale_date), f(completion_date), f(source_id), f(area_code),
            f(is_active), f(created_at), old_id
        ))
        
        if len(batch) >= batch_size:
            sql = """INSERT INTO estates 
                (name, pinyin, city_id, district_id, address, developer, build_year, property_type,
                 total_units, land_area, building_area, use_period, greening_rate, far, parking_amount,
                 overview, is_selling, sale_date, completion_date, source_id, area_code, is_active, created_at, source_id)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE name=name"""
            # 使用正确的 SQL（不重复 source_id）
            sql = """INSERT INTO estates 
                (name, pinyin, city_id, district_id, address, developer, build_year, property_type,
                 total_units, land_area, building_area, use_period, greening_rate, far, parking_amount,
                 overview, is_selling, sale_date, completion_date, source_id, area_code, is_active, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
            # 去掉最后一个 old_id
            batch_data = [b[:-1] for b in batch]
            cursor.executemany(sql, batch_data)
            # 获取插入的 ID 范围
            last_id = cursor.lastrowid
            first_id = last_id - len(batch) + 1
            for i, b in enumerate(batch):
                old_to_new[b[-1]] = first_id + i
            conn.commit()
            inserted += len(batch)
            print(f"  已插入 {inserted}/{len(estates)} 条楼盘...", end='\r')
            batch = []
    
    if batch:
        sql = """INSERT INTO estates 
            (name, pinyin, city_id, district_id, address, developer, build_year, property_type,
             total_units, land_area, building_area, use_period, greening_rate, far, parking_amount,
             overview, is_selling, sale_date, completion_date, source_id, area_code, is_active, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        batch_data = [b[:-1] for b in batch]
        cursor.executemany(sql, batch_data)
        last_id = cursor.lastrowid
        first_id = last_id - len(batch) + 1
        for i, b in enumerate(batch):
            old_to_new[b[-1]] = first_id + i
        conn.commit()
        inserted += len(batch)
    
    print(f"\n  楼盘插入完成: {inserted} 条")
    cursor.close()
    return old_to_new

def extract_and_insert_buildings(backup_file, conn, estate_id_map):
    """提取并插入深圳楼栋数据"""
    print("正在提取深圳楼栋数据...")
    cursor = conn.cursor()
    
    # 清除旧的深圳楼栋数据（通过 estate_id 关联）
    if estate_id_map:
        new_estate_ids = list(estate_id_map.values())
        # 分批删除
        for i in range(0, len(new_estate_ids), 1000):
            batch = new_estate_ids[i:i+1000]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM buildings WHERE estate_id IN ({placeholders})", batch)
        conn.commit()
        print(f"  清除旧深圳楼栋数据完成")
    
    old_estate_ids = set(estate_id_map.keys())
    buildings = []
    old_building_id_to_new = {}
    
    with gzip.open(backup_file, 'rt', encoding='utf8', errors='replace') as f:
        for line in f:
            if not line.startswith('INSERT INTO `buildings`'):
                continue
            values_str = parse_values_line(line)
            if not values_str:
                continue
            pos = 0
            while pos < len(values_str):
                if values_str[pos] != '(':
                    pos += 1
                    continue
                depth = 0
                in_str = False
                escape = False
                for i in range(pos, len(values_str)):
                    c = values_str[i]
                    if escape:
                        escape = False
                        continue
                    if c == '\\' and in_str:
                        escape = True
                        continue
                    if c == "'" and not escape:
                        in_str = not in_str
                        continue
                    if not in_str:
                        if c == '(':
                            depth += 1
                        elif c == ')':
                            depth -= 1
                            if depth == 0:
                                record_str = values_str[pos+1:i]
                                fields = parse_record_fields(record_str)
                                # buildings: id, estate_id, name, property_type, alias, build_structure, build_type,
                                #            floors, floor_height, unit_amount, total_units, building_area,
                                #            completion_date, sale_date, avg_price, elevator_rate, sale_licence,
                                #            source_id, source_estate_id, units_per_floor, build_year, created_at
                                if fields and len(fields) >= 2:
                                    try:
                                        old_estate_id = int(fields[1]) if fields[1] != 'NULL' else None
                                        if old_estate_id in old_estate_ids:
                                            buildings.append(fields)
                                    except (ValueError, IndexError):
                                        pass
                                pos = i + 1
                                break
                else:
                    break
    
    print(f"  提取到 {len(buildings)} 条楼栋记录")
    
    # 批量插入
    batch = []
    batch_size = 500
    inserted = 0
    
    def f(v):
        if v == 'NULL': return None
        if v.startswith("'") and v.endswith("'"):
            inner = v[1:-1]
            inner = inner.replace("\\'", "'").replace('\\\\', '\\').replace('\\n', '\n').replace('\\r', '\r').replace('\\t', '\t')
            return inner
        try: return int(v)
        except:
            try: return float(v)
            except: return v
    
    for fields in buildings:
        old_id = int(fields[0])
        old_estate_id = int(fields[1])
        new_estate_id = estate_id_map.get(old_estate_id)
        if not new_estate_id:
            continue
        
        batch.append((
            new_estate_id, f(fields[2]), f(fields[3]), f(fields[4]), f(fields[5]), f(fields[6]),
            f(fields[7]), f(fields[8]), f(fields[9]), f(fields[10]), f(fields[11]),
            f(fields[12]), f(fields[13]), f(fields[14]), f(fields[15]), f(fields[16]),
            f(fields[17]), f(fields[18]), f(fields[19]), f(fields[20]), f(fields[21]),
            old_id  # 用于记录映射
        ))
        
        if len(batch) >= batch_size:
            sql = """INSERT INTO buildings 
                (estate_id, name, property_type, alias, build_structure, build_type,
                 floors, floor_height, unit_amount, total_units, building_area,
                 completion_date, sale_date, avg_price, elevator_rate, sale_licence,
                 source_id, source_estate_id, units_per_floor, build_year, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
            batch_data = [b[:-1] for b in batch]
            cursor.executemany(sql, batch_data)
            last_id = cursor.lastrowid
            first_id = last_id - len(batch) + 1
            for i, b in enumerate(batch):
                old_building_id_to_new[b[-1]] = first_id + i
            conn.commit()
            inserted += len(batch)
            print(f"  已插入 {inserted}/{len(buildings)} 条楼栋...", end='\r')
            batch = []
    
    if batch:
        sql = """INSERT INTO buildings 
            (estate_id, name, property_type, alias, build_structure, build_type,
             floors, floor_height, unit_amount, total_units, building_area,
             completion_date, sale_date, avg_price, elevator_rate, sale_licence,
             source_id, source_estate_id, units_per_floor, build_year, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        batch_data = [b[:-1] for b in batch]
        cursor.executemany(sql, batch_data)
        last_id = cursor.lastrowid
        first_id = last_id - len(batch) + 1
        for i, b in enumerate(batch):
            old_building_id_to_new[b[-1]] = first_id + i
        conn.commit()
        inserted += len(batch)
    
    print(f"\n  楼栋插入完成: {inserted} 条")
    cursor.close()
    return old_building_id_to_new

def extract_and_insert_units(backup_file, conn, estate_id_map, building_id_map):
    """提取并插入深圳房屋数据"""
    print("正在提取深圳房屋数据（数据量较大，请耐心等待）...")
    cursor = conn.cursor()
    
    old_estate_ids = set(estate_id_map.keys())
    old_building_ids = set(building_id_map.keys())
    
    # 清除旧的深圳房屋数据
    if estate_id_map:
        new_estate_ids = list(estate_id_map.values())
        for i in range(0, len(new_estate_ids), 1000):
            batch = new_estate_ids[i:i+1000]
            placeholders = ','.join(['%s'] * len(batch))
            cursor.execute(f"DELETE FROM units WHERE estate_id IN ({placeholders})", batch)
        conn.commit()
        print(f"  清除旧深圳房屋数据完成")
    
    batch = []
    batch_size = 1000
    inserted = 0
    skipped = 0
    
    def f(v):
        if v == 'NULL': return None
        if v.startswith("'") and v.endswith("'"):
            inner = v[1:-1]
            inner = inner.replace("\\'", "'").replace('\\\\', '\\').replace('\\n', '\n').replace('\\r', '\r').replace('\\t', '\t')
            return inner
        try: return int(v)
        except:
            try: return float(v)
            except: return v
    
    with gzip.open(backup_file, 'rt', encoding='utf8', errors='replace') as f_gz:
        for line in f_gz:
            if not line.startswith('INSERT INTO `units`'):
                continue
            values_str = parse_values_line(line)
            if not values_str:
                continue
            pos = 0
            while pos < len(values_str):
                if values_str[pos] != '(':
                    pos += 1
                    continue
                depth = 0
                in_str = False
                escape = False
                for i in range(pos, len(values_str)):
                    c = values_str[i]
                    if escape:
                        escape = False
                        continue
                    if c == '\\' and in_str:
                        escape = True
                        continue
                    if c == "'" and not escape:
                        in_str = not in_str
                        continue
                    if not in_str:
                        if c == '(':
                            depth += 1
                        elif c == ')':
                            depth -= 1
                            if depth == 0:
                                record_str = values_str[pos+1:i]
                                fields = parse_record_fields(record_str)
                                # units: id, building_id, estate_id, unit_number, property_type, property_structure,
                                #        property_no, floor, area, build_area, rooms, bathrooms, orientation,
                                #        towards, landscape, unit_price, total_price, remark, source_id,
                                #        source_building_id, created_at
                                if fields and len(fields) >= 3:
                                    try:
                                        old_building_id = int(fields[1]) if fields[1] != 'NULL' else None
                                        old_estate_id = int(fields[2]) if fields[2] != 'NULL' else None
                                        if old_estate_id in old_estate_ids:
                                            new_building_id = building_id_map.get(old_building_id)
                                            new_estate_id = estate_id_map.get(old_estate_id)
                                            if new_building_id and new_estate_id:
                                                batch.append((
                                                    new_building_id, new_estate_id,
                                                    f(fields[3]), f(fields[4]), f(fields[5]),
                                                    f(fields[6]), f(fields[7]), f(fields[8]),
                                                    f(fields[9]), f(fields[10]), f(fields[11]),
                                                    f(fields[12]), f(fields[13]), f(fields[14]),
                                                    f(fields[15]), f(fields[16]), f(fields[17]),
                                                    f(fields[18]), f(fields[19]), f(fields[20])
                                                ))
                                            else:
                                                skipped += 1
                                    except (ValueError, IndexError):
                                        pass
                                pos = i + 1
                                break
                else:
                    break
                
                if len(batch) >= batch_size:
                    sql = """INSERT INTO units 
                        (building_id, estate_id, unit_number, property_type, property_structure,
                         property_no, floor, area, build_area, rooms, bathrooms, orientation,
                         towards, landscape, unit_price, total_price, remark, source_id,
                         source_building_id, created_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
                    cursor.executemany(sql, batch)
                    conn.commit()
                    inserted += len(batch)
                    print(f"  已插入 {inserted} 条房屋（跳过 {skipped} 条）...", end='\r')
                    batch = []
    
    if batch:
        sql = """INSERT INTO units 
            (building_id, estate_id, unit_number, property_type, property_structure,
             property_no, floor, area, build_area, rooms, bathrooms, orientation,
             towards, landscape, unit_price, total_price, remark, source_id,
             source_building_id, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.executemany(sql, batch)
        conn.commit()
        inserted += len(batch)
    
    print(f"\n  房屋插入完成: {inserted} 条（跳过 {skipped} 条）")
    cursor.close()
    return inserted

def main():
    print("=" * 60)
    print("深圳市数据恢复脚本")
    print(f"备份文件: {BACKUP_FILE}")
    print(f"源 city_id: {SRC_CITY_ID} -> 目标 city_id: {DST_CITY_ID}")
    print("=" * 60)
    
    conn = get_connection()
    print("数据库连接成功")
    
    # 1. 提取并插入楼盘
    estates = extract_shenzhen_estates(BACKUP_FILE)
    estate_id_map = insert_estates(conn, estates)
    print(f"楼盘 ID 映射: {len(estate_id_map)} 条")
    
    # 2. 提取并插入楼栋
    building_id_map = extract_and_insert_buildings(BACKUP_FILE, conn, estate_id_map)
    print(f"楼栋 ID 映射: {len(building_id_map)} 条")
    
    # 3. 提取并插入房屋
    units_count = extract_and_insert_units(BACKUP_FILE, conn, estate_id_map, building_id_map)
    
    # 4. 同步到分片表
    print("\n正在同步楼盘到分片表...")
    cursor = conn.cursor()
    shard = DST_CITY_ID % 8
    cursor.execute(f"DELETE FROM estates_{shard} WHERE city_id = %s", (DST_CITY_ID,))
    cursor.execute(f"""
        INSERT INTO estates_{shard} 
        SELECT * FROM estates WHERE city_id = %s
    """, (DST_CITY_ID,))
    conn.commit()
    print(f"  楼盘分片表 estates_{shard} 同步完成")
    
    # 验证
    cursor.execute("SELECT COUNT(*) FROM estates WHERE city_id = %s", (DST_CITY_ID,))
    estate_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM buildings WHERE estate_id IN (SELECT id FROM estates WHERE city_id = %s)", (DST_CITY_ID,))
    building_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM units WHERE estate_id IN (SELECT id FROM estates WHERE city_id = %s)", (DST_CITY_ID,))
    unit_count = cursor.fetchone()[0]
    
    print("\n" + "=" * 60)
    print("恢复完成！数据统计：")
    print(f"  楼盘 (estates):  {estate_count:,} 条")
    print(f"  楼栋 (buildings): {building_count:,} 条")
    print(f"  房屋 (units):    {unit_count:,} 条")
    print("=" * 60)
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
