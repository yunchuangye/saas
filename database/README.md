# 数据库说明

## 基本信息

| 项目 | 值 |
|------|-----|
| 数据库名 | `gujia` |
| 字符集 | `utf8mb4` |
| 排序规则 | `utf8mb4_unicode_ci` |
| 导出时间 | 2026-03-13 |
| 导出版本 | MySQL 8.0 |

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
| `cities` | 城市基础数据 | 5 条 |
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

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123456` | 系统管理员 |
| `appraiser1` | `test123456` | 评估师（中诚信房地产评估有限公司） |
| `bank1` | `test123456` | 银行员（中国建设银行北京分行） |
| `investor1` | `test123456` | 投资人 |
| `customer1` | `test123456` | 客户 |

## 导入方法

```bash
# 1. 创建数据库和用户
sudo mysql -u root -e "
CREATE DATABASE IF NOT EXISTS gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gujia'@'localhost' IDENTIFIED BY 'gujia123456';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'localhost';
FLUSH PRIVILEGES;
"

# 2. 导入数据
mysql -u gujia -pgujia123456 gujia < database/gujia_full.sql
```

## 测试数据说明

### 城市数据
北京、上海、广州、深圳、杭州（5个城市）

### 楼盘数据（北京朝阳区为主）
万科俊园（WKJY）、中海寰宇天下（ZHHY）、保利中央公园（BLZYGZ）、
龙湖长楹天街（LLCYTJ）、金地格林小城（JDGLXC）等 10 个楼盘

### 历史成交案例
53 条近 18 个月的成交案例，覆盖北京主要楼盘，用于自动估价算法的参考数据

### 机构数据
- 中诚信房地产评估有限公司（评估公司）
- 中国建设银行北京分行（银行机构）
- 国泰君安资产管理有限公司（投资机构）
