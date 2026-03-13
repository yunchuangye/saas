# 数据库说明

## 基本信息

| 项目 | 值 |
|------|-----|
| 数据库名 | `gujia` |
| 字符集 | `utf8mb4` |
| 排序规则 | `utf8mb4_unicode_ci` |
| 最后更新 | 2026-03-13 |
| 数据库版本 | MySQL 8.0 |

## 连接配置

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=gujia
DB_PASSWORD=gujia123456
DB_NAME=gujia
```

## 数据表清单

| 表名 | 说明 | 数据量 |
|------|------|--------|
| `users` | 系统用户（管理员、评估师、银行员等） | 5 条 |
| `organizations` | 机构组织（评估公司、银行、投资机构） | 3 条 |
| `org_members` | 机构成员关联 | 3 条 |
| `cities` | 城市基础数据（全国主要城市） | **45 条** |
| `districts` | 区/县数据（市辖区、县/县级市、新区） | **505 条** |
| `estates` | 楼盘/物业数据（含拼音首字母） | 10 条 |
| `buildings` | 楼栋数据 | 12 条 |
| `units` | 房屋单元数据 | 18 条 |
| `cases` | 历史成交案例（估价参考数据） | 53 条 |
| `auto_valuations` | 自动估价记录 | 1 条 |
| `projects` | 评估项目 | 0 条 |
| `reports` | 评估报告 | 0 条 |
| `report_files` | 报告文件 | 0 条 |
| `bids` | 竞价记录 | 0 条 |
| `messages` | 消息记录 | 0 条 |
| `notifications` | 通知记录 | 0 条 |
| `openclaw_configs` | OPENCLAW 爬虫配置 | 0 条 |
| `openclaw_tasks` | OPENCLAW 爬虫任务 | 0 条 |
| `operation_logs` | 操作日志 | 0 条 |

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

## districts 表字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | int | 主键 |
| `city_id` | int | 所属城市 ID（关联 cities.id） |
| `name` | varchar(100) | 区/县名称 |
| `code` | varchar(20) | 行政区划代码 |
| `type` | varchar(20) | 类型：`district`=市辖区，`county`=县/县级市，`new_area`=新区 |
| `is_active` | tinyint | 是否启用 |

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123456` | 系统管理员 |
| `appraiser1` | `test123456` | 评估师（中诚信房地产评估有限公司） |
| `bank1` | `test123456` | 银行员（中国建设银行北京分行） |
| `investor1` | `test123456` | 投资人 |
| `customer1` | `test123456` | 客户 |

## 快速导入方法

```bash
# 1. 创建数据库和用户
sudo mysql -u root -e "
CREATE DATABASE IF NOT EXISTS gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gujia'@'localhost' IDENTIFIED BY 'gujia123456';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'localhost';
FLUSH PRIVILEGES;
"

# 2. 导入完整数据（含城市+区县）
mysql -u gujia -pgujia123456 gujia < database/gujia_full.sql
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `gujia_full.sql` | 完整数据库导出（含所有表结构和数据） |
| `cities_districts.sql` | 仅城市和区县数据（可单独导入更新） |
