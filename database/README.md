# 数据库说明

## 基本信息

| 项目 | 值 |
|------|-----|
| 数据库名 | `gujia` |
| 字符集 | `utf8mb4` |
| 排序规则 | `utf8mb4_unicode_ci` |
| 最后更新 | 2026-03-15 |
| 数据库版本 | MySQL 8.0 |

## 连接配置

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=gujia
DB_PASSWORD=gujia_dev_2026
DB_NAME=gujia
```

## 文件说明

| 文件 | 说明 | 推荐 |
|------|------|------|
| `gujia_full_20260314.sql` | **最新完整备份**（2026-03-14）：26 张表结构 + 全量数据 | **推荐使用** |
| `gujia_full.sql` | 历史完整备份（初始版本，MySQL 8.0） | 备用 |
| `gujia_full_mysql57.sql` | MySQL 5.7 兼容版备份 | 备用 |
| `cities_districts.sql` | 城市/区域数据（可单独导入更新） | 单独使用 |
| `migrate_cases.sql` | 案例数据迁移脚本 | 单独使用 |

## 数据表清单

| 表名 | 说明 | 数据量 |
|------|------|--------|
| `users` | 系统用户（管理员、评估师、银行员等） | 5 条 |
| `organizations` | 机构组织（评估公司、银行、投资机构） | 3 条 |
| `org_members` | 机构成员关联 | 3 条 |
| `cities` | 城市基础数据（全国主要城市） | **45 条** |
| `districts` | 区/县数据（市辖区、县/县级市、新区） | **505 条** |
| `estates` | 楼盘/物业数据 | 10 条 |
| `buildings` | 楼栋数据 | 12 条 |
| `units` | 房屋单元数据 | 18 条 |
| `cases` | 历史成交案例（估价参考数据） | 53 条 |
| `auto_valuations` | 自动估价记录 | 3 条 |
| `projects` | 评估项目 | 0 条 |
| `reports` | 评估报告 | 0 条 |
| `report_files` | 报告文件 | 0 条 |
| `bids` | 竞价记录 | 0 条 |
| `messages` | 消息记录 | 0 条 |
| `notifications` | 通知记录 | 0 条 |
| `openclaw_configs` | OPENCLAW 爬虫配置 | 0 条 |
| `openclaw_tasks` | OPENCLAW 爬虫任务 | 0 条 |
| `operation_logs` | 操作日志 | 0 条 |
| `crawl_jobs` | 采集任务 | 0 条 |
| `crawl_logs` | 采集日志 | 0 条 |
| `crawl_alerts` | 采集告警 | 0 条 |
| `crawl_config` | 采集全局配置 | 0 条 |
| `crawl_proxies` | 代理 IP | 0 条 |
| `crawl_raw_data` | 采集原始数据 | 0 条 |
| `crawl_schedule_history` | 采集调度历史 | 0 条 |

## 城市数据覆盖范围

### 直辖市（4个）
北京、上海、天津、重庆

### 广东省（5个）
广州、深圳、东莞、佛山、珠海

### 江苏省（4个）
南京、苏州、无锡、南通

### 浙江省（4个）
杭州、宁波、温州、金华

### 山东省（3个）
济南、青岛、烟台

### 福建省（2个）
福州、厦门

### 辽宁省（2个）
沈阳、大连

### 其他省会及重要城市（21个）
成都、武汉、长沙、西安、合肥、南昌、郑州、石家庄、太原、哈尔滨、长春、南宁、昆明、贵阳、海口、呼和浩特、乌鲁木齐、兰州、银川、西宁、拉萨

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123456` | 系统管理员 |
| `appraiser1` | `test123456` | 评估师（中诚信房地产评估有限公司） |
| `bank1` | `test123456` | 银行员（中国建设银行北京分行） |
| `investor1` | `test123456` | 投资人 |
| `customer1` | `test123456` | 客户 |

## 快速初始化（推荐）

```bash
# 1. 创建数据库和用户
sudo mysql -u root -e "
CREATE DATABASE IF NOT EXISTS gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gujia'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'gujia_dev_2026';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'127.0.0.1';
FLUSH PRIVILEGES;"

# 2. 导入最新完整备份（推荐）
mysql -u gujia -pgujia_dev_2026 -h 127.0.0.1 gujia < database/gujia_full_20260314.sql
```

## 生成新备份

每次重要更新后，运行以下命令生成新备份：

```bash
mysqldump -u gujia -pgujia_dev_2026 -h 127.0.0.1 \
  --single-transaction --routines --triggers \
  --add-drop-table --default-character-set=utf8mb4 \
  gujia > database/gujia_full_$(date +%Y%m%d).sql
```
