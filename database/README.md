# 数据库备份说明

## 最新备份（推荐使用）

| 文件 | 大小 | 日期 | 说明 |
|------|------|------|------|
| `gujia_full_20260322.sql.gz` | ~58MB | 2026-03-22 | **最新完整备份**，包含所有 52 张表及修复后的数据 |
| `gujia_clean_20260315.sql.gz` | ~58MB | 2026-03-15 | 历史备份（仅 27 张表，缺少 SaaS 模块相关表） |

> ⚠️ 数据库备份文件体积较大，**不随 Git 仓库提交**，请通过其他渠道（如对象存储、私有网盘）单独获取。

## 数据统计（2026-03-22）

| 表 | 记录数 | 说明 |
|----|--------|------|
| `estates`（楼盘） | 4,494 | 含深圳 4,484 个楼盘 |
| `buildings`（楼栋） | 34,324 | 含深圳 34,312 个楼栋 |
| `units`（房屋） | 2,174,274 | 含深圳 217 万套房屋 |
| `cases`（成交案例） | 若干 | 真实成交数据 |

## 导入方法

```bash
# 1. 创建数据库和用户（首次安装）
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'gujia'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'localhost';
FLUSH PRIVILEGES;
"

# 2. 导入最新完整备份
zcat gujia_full_20260322.sql.gz | mysql -u gujia -p'your_password' gujia
```

> 💡 使用一键安装脚本 `install.sh` 可自动完成上述所有步骤。

## 表结构说明

数据库共包含 52 张表，分为以下几类：

- **用户与权限**：`users`, `organizations`, `org_members`, `platform_admins`
- **业务核心**：`projects`, `bids`, `reports`, `work_sheets`, `seals`, `seal_applications`
- **房产数据**：`cities`, `districts`, `estates`, `buildings`, `units`, `cases`
- **SaaS 运营**：`subscription_plans`, `org_subscriptions`, `payment_orders`, `transactions`, `billing_records`
- **采集引擎**：`openclaw_configs`, `openclaw_tasks`, `crawl_jobs`, `crawl_logs`, `crawl_raw_data`
- **其他功能**：`notifications`, `messages`, `marketing_links`, `broker_listings`, `api_keys`

## 数据清理说明

原始数据库因多次批量导入存在大量重复数据，已通过以下脚本进行清理：

- 删除孤立 units（estate_id 不存在）：3,185,754 条
- 删除孤立 buildings（estate_id 不存在）：118,104 条
- 删除有效 units 内部重复（同楼栋同房号）：162,093 条
- 删除重复 buildings（同楼盘同名）：26 条

清理脚本：`dedup_units.py` / `dedup_step3.py`
