# 数据库备份说明

## 最新备份（清理后）

| 文件 | 大小 | 日期 | 说明 |
|------|------|------|------|
| `gujia_clean_20260315.sql.gz` | ~58MB | 2026-03-15 | 去重清理后的完整数据库备份 |

## 数据统计（清理后）

| 表 | 记录数 | 说明 |
|----|--------|------|
| estates（楼盘） | 4,494 | 含深圳 4,484 个楼盘 |
| buildings（楼栋） | 34,324 | 含深圳 34,312 个楼栋 |
| units（房屋） | 2,174,274 | 含深圳 217 万套房屋 |
| cities（城市） | 见 cities_districts.sql | |
| districts（区域） | 见 cities_districts.sql | |

## 导入方法

```bash
# 1. 创建数据库和用户（首次）
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gujia'@'localhost' IDENTIFIED BY 'gujia_dev_2026';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'localhost';
FLUSH PRIVILEGES;
"

# 2. 导入数据
gunzip -c gujia_clean_20260315.sql.gz | mysql -u gujia -pgujia_dev_2026 gujia
```

## 去重说明

原始数据库（gujia_full_20260315.sql.gz）因多次批量导入存在大量重复数据：
- 删除孤立 units（estate_id 不存在）：3,185,754 条
- 删除孤立 buildings（estate_id 不存在）：118,104 条
- 删除有效 units 内部重复（同楼栋同房号）：162,093 条
- 删除重复 buildings（同楼盘同名）：26 条

去重脚本：`dedup_units.py` / `dedup_step3.py`
