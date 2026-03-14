# 房地产估价 SaaS 平台 — 手工部署指南（MySQL 5.7 专版）

> **适用场景**：在本地或服务器上手工部署本平台，使用 **MySQL 5.7** 数据库环境。
> 本文档包含完整的环境搭建、数据库兼容性处理、前后端配置、服务启动及常见问题排查。

---

## 目录

1. [环境要求](#1-环境要求)
2. [获取代码](#2-获取代码)
3. [MySQL 5.7 数据库配置](#3-mysql-57-数据库配置)
4. [Redis 配置](#4-redis-配置)
5. [后端服务配置](#5-后端服务配置)
6. [前端服务配置](#6-前端服务配置)
7. [启动服务](#7-启动服务)
8. [验证部署](#8-验证部署)
9. [MySQL 5.7 与 8.0 兼容性差异说明](#9-mysql-57-与-80-兼容性差异说明)
10. [常见问题排查](#10-常见问题排查)
11. [测试账号](#11-测试账号)

---

## 1. 环境要求

请在部署前确认系统已安装以下软件，并满足版本要求：

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| **Node.js** | 18.0 | 20.x LTS | 后端 tsx 运行时要求 |
| **pnpm** | 8.0 | 9.x | 包管理器（可用 npm 替代） |
| **MySQL** | 5.7.8 | 5.7.44 | 需支持 JSON 数据类型（5.7.8+） |
| **Redis** | 5.0 | 6.x / 7.x | 用于 Session 缓存 |
| **Git** | 2.x | 最新版 | 拉取代码 |

**检查各软件版本：**

```bash
node -v          # 应输出 v18.x.x 或更高
pnpm -v          # 应输出 8.x.x 或更高
mysql --version  # 应输出 5.7.x
redis-cli --version
```

> **重要提示**：MySQL 5.7.8 以下版本不支持 JSON 数据类型，本项目多个表使用了 JSON 字段，**必须使用 5.7.8 及以上版本**。

---

## 2. 获取代码

```bash
# 克隆仓库到本地
git clone https://github.com/yunchuangye/saas.git

# 进入项目目录
cd saas
```

项目目录结构如下：

```
saas/
├── backend/          # Express + tRPC 后端
├── frontend/         # Next.js 16 前端
├── database/         # 数据库 SQL 文件
│   ├── gujia_full.sql           # 原始 MySQL 8.0 版本
│   ├── gujia_full_mysql57.sql   # MySQL 5.7 兼容版本（推荐使用）
│   ├── cities_districts.sql     # 城市区划数据
│   └── migrate_cases.sql        # cases 表补充字段迁移脚本
├── docs/             # 项目文档
├── start-dev.sh      # 一键启动脚本
└── sync.sh           # GitHub 同步脚本
```

---

## 3. MySQL 5.7 数据库配置

### 3.1 MySQL 5.7 与 8.0 的关键差异

本项目原始 SQL 基于 MySQL 8.0 导出，包含以下 5.7 不支持的语法，我们已在 `gujia_full_mysql57.sql` 中全部处理完毕：

| 问题类型 | MySQL 8.0 语法 | MySQL 5.7 替代方案 | 影响数量 |
|----------|---------------|-------------------|----------|
| **函数式默认值** | `DEFAULT (now())` | `DEFAULT CURRENT_TIMESTAMP` | 26 处 |
| **排序规则** | `utf8mb4_0900_ai_ci` | `utf8mb4_unicode_ci` | 如有则替换 |
| **版本注释** | `/*!50503 ...*/` | 直接语句 | 全部处理 |
| **整型显示宽度** | `int NOT NULL` | `int(11) NOT NULL` | 主键字段 |

### 3.2 启动 MySQL 服务

```bash
# Linux (systemd)
sudo systemctl start mysql
sudo systemctl enable mysql   # 设置开机自启

# Linux (service)
sudo service mysql start

# macOS (Homebrew)
brew services start mysql@5.7

# 验证服务状态
sudo systemctl status mysql
```

### 3.3 创建数据库和用户

以 root 身份登录 MySQL：

```bash
mysql -u root -p
```

执行以下 SQL 命令：

```sql
-- 创建数据库（使用 utf8mb4_unicode_ci，MySQL 5.7 完全支持）
CREATE DATABASE IF NOT EXISTS `gujia`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（请将密码替换为您自己的安全密码）
CREATE USER 'gujia'@'localhost' IDENTIFIED BY 'gujia123456';

-- 授予权限
GRANT ALL PRIVILEGES ON `gujia`.* TO 'gujia'@'localhost';
FLUSH PRIVILEGES;

-- 验证用户创建成功
SELECT User, Host FROM mysql.user WHERE User = 'gujia';

-- 退出
EXIT;
```

### 3.4 导入数据库结构与数据

**请务必使用 MySQL 5.7 专用版本的 SQL 文件：**

```bash
# 进入项目根目录
cd /path/to/saas

# 导入主数据库（含表结构和测试数据）
mysql -u gujia -p gujia < database/gujia_full_mysql57.sql

# 导入城市区划数据（可选，用于地址选择功能）
mysql -u gujia -p gujia < database/cities_districts.sql

# 执行 cases 表补充字段迁移（必须执行，用于自动估值功能）
mysql -u gujia -p gujia < database/migrate_cases.sql
```

> **注意**：如果您使用的是 `gujia_full.sql`（MySQL 8.0 原版），导入时会报错：
> `ERROR 1064: You have an error in your SQL syntax ... 'DEFAULT (now())'`
> 请改用 `gujia_full_mysql57.sql`。

### 3.5 验证数据库导入

```bash
mysql -u gujia -p gujia -e "SHOW TABLES;"
```

应显示以下 19 张表：

```
auto_valuations, bids, buildings, cases, cities, districts,
estates, messages, notifications, openclaw_configs, openclaw_tasks,
operation_logs, org_members, organizations, projects, report_files,
reports, units, users
```

---

## 4. Redis 配置

### 4.1 启动 Redis 服务

```bash
# Linux (systemd)
sudo systemctl start redis
sudo systemctl enable redis

# Linux (service)
sudo service redis-server start

# macOS (Homebrew)
brew services start redis

# 验证 Redis 运行
redis-cli ping
# 应返回: PONG
```

### 4.2 Redis 密码配置（可选）

如果您的 Redis 设置了密码，需要在后端 `.env` 中配置：

```bash
# 编辑 Redis 配置文件
sudo vim /etc/redis/redis.conf

# 找到 requirepass 行，取消注释并设置密码
requirepass your_redis_password

# 重启 Redis
sudo systemctl restart redis
```

---

## 5. 后端服务配置

### 5.1 安装依赖

```bash
cd backend
pnpm install

# 如果使用 npm
npm install
```

### 5.2 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
vim .env
```

`.env` 文件完整配置说明：

```env
# ── 数据库配置 ──────────────────────────────────────────────
DB_HOST=localhost          # 数据库主机地址
DB_PORT=3306               # MySQL 端口（默认 3306）
DB_USER=gujia              # 数据库用户名（第3步创建的）
DB_PASSWORD=gujia123456    # 数据库密码（请修改为您设置的密码）
DB_NAME=gujia              # 数据库名称

# ── Redis 配置 ──────────────────────────────────────────────
REDIS_HOST=localhost        # Redis 主机地址
REDIS_PORT=6379             # Redis 端口（默认 6379）
# REDIS_PASSWORD=           # Redis 密码（如有则取消注释）

# ── JWT 配置 ────────────────────────────────────────────────
# 重要：请修改为随机的长字符串，不要使用默认值
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# ── 服务端口 ────────────────────────────────────────────────
# 推荐使用非常用端口，避免与其他服务冲突
PORT=8721

# ── 环境标识 ────────────────────────────────────────────────
NODE_ENV=development        # 开发环境：development | 生产环境：production

# ── AI 功能配置（可选） ─────────────────────────────────────
# 如需使用 AI 估价分析功能，请填写 OpenAI API Key
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://api.openai.com/v1

# ── 文件存储（可选） ────────────────────────────────────────
# 如需使用文件上传功能，请配置 S3 兼容存储
# S3_BUCKET=your-bucket-name
# S3_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## 6. 前端服务配置

### 6.1 安装依赖

```bash
cd frontend
pnpm install

# 如果使用 npm
npm install
```

### 6.2 配置环境变量

```bash
# 创建前端环境变量文件
vim .env.local
```

`.env.local` 文件内容：

```env
# 后端 API 地址（必须与后端 .env 中的 PORT 保持一致）
NEXT_PUBLIC_BACKEND_URL=http://localhost:8721
```

> **注意**：如果后端部署在远程服务器，请将 `localhost:8721` 替换为实际的服务器 IP 或域名，例如：
> `NEXT_PUBLIC_BACKEND_URL=http://192.168.1.100:8721`

---

## 7. 启动服务

### 7.1 方式一：使用一键脚本（推荐）

项目提供了完整的一键启动脚本，自动处理所有启动步骤：

```bash
# 回到项目根目录
cd /path/to/saas

# 赋予执行权限（首次使用）
chmod +x start-dev.sh

# 开发模式启动（热重载，代码修改自动生效）
./start-dev.sh

# 仅编译，不启动服务
./start-dev.sh --mode build

# 生产模式启动（编译后以 node 运行）
./start-dev.sh --mode start

# 自定义端口
./start-dev.sh --port-fe 8720 --port-be 8721

# 跳过依赖安装（已安装过则可加速启动）
./start-dev.sh --skip-install

# 查看帮助
./start-dev.sh --help
```

### 7.2 方式二：手动分步启动

**第一步：启动后端**

```bash
cd backend

# 开发模式（支持热重载）
pnpm dev

# 或者后台运行（不阻塞终端）
nohup pnpm dev > ../logs/backend.log 2>&1 &
echo "后端 PID: $!"
```

**第二步：启动前端**（新开一个终端窗口）

```bash
cd frontend

# 开发模式，指定端口
pnpm dev --port 8720

# 或者后台运行
nohup pnpm dev --port 8720 > ../logs/frontend.log 2>&1 &
echo "前端 PID: $!"
```

### 7.3 查看运行日志

```bash
# 查看后端日志
tail -f logs/backend_latest.log

# 查看前端日志
tail -f logs/frontend_latest.log

# 查看编译日志
tail -f logs/build_latest.log
```

### 7.4 停止服务

```bash
# 如果使用一键脚本启动
kill $(cat /tmp/gujia-backend.pid) $(cat /tmp/gujia-frontend.pid)

# 如果手动启动，查找并终止进程
pkill -f "tsx.*server/index.ts"   # 停止后端
pkill -f "next dev"               # 停止前端开发服务
pkill -f "next start"             # 停止前端生产服务
```

---

## 8. 验证部署

### 8.1 验证后端

```bash
# 健康检查接口
curl http://localhost:8721/health
# 期望返回: {"status":"ok"}

# 测试登录接口
curl -X POST http://localhost:8721/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"username":"admin","password":"admin123456"}}'
# 期望返回包含 token 的 JSON
```

### 8.2 验证前端

在浏览器中打开：`http://localhost:8720`

应显示登录页面，使用测试账号登录后可进入对应角色的仪表盘。

### 8.3 运行自动化测试（可选）

项目提供了完整的 API 自动化测试脚本（99 个测试用例）：

```bash
cd /path/to/saas
python3 test/run_tests.py
# 期望输出：通过率 100% (99/99)
```

---

## 9. MySQL 5.7 与 8.0 兼容性差异说明

### 9.1 函数式默认值（最关键）

MySQL 8.0 支持在 `DEFAULT` 子句中使用函数表达式，而 MySQL 5.7 不支持：

```sql
-- MySQL 8.0 写法（5.7 会报错）
`created_at` timestamp NULL DEFAULT (now())

-- MySQL 5.7 兼容写法
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
```

本项目共有 **26 处**此类语法，已在 `gujia_full_mysql57.sql` 中全部替换。

### 9.2 JSON 数据类型

MySQL 5.7.8+ 支持 JSON 数据类型，本项目使用了 4 个 JSON 字段：

| 表名 | 字段名 | 用途 |
|------|--------|------|
| `auto_valuations` | `comparable_cases` | 可比案例数据 |
| `auto_valuations` | `report_data` | 估值报告数据 |
| `auto_valuations` | `llm_analysis` | AI 分析结果 |
| `projects` | `attachments` | 项目附件列表 |

> **注意**：如果您的 MySQL 版本低于 5.7.8，JSON 字段将无法创建，建议升级到 5.7.8+。

### 9.3 排序规则

MySQL 8.0 引入了 `utf8mb4_0900_ai_ci` 作为默认排序规则，MySQL 5.7 不支持。本项目使用的是 `utf8mb4_unicode_ci`，两个版本均支持，无需额外处理。

### 9.4 Drizzle ORM 配置

后端使用 Drizzle ORM 操作数据库，其 MySQL 方言对 5.7 和 8.0 均兼容。如果您在二次开发时需要修改数据库结构，请注意：

```typescript
// schema.ts 中定义时间戳字段时，使用以下写法（5.7/8.0 均兼容）
createdAt: timestamp('created_at').defaultNow(),

// 不要使用以下写法（会生成 DEFAULT (now()) 语法，5.7 不支持）
// createdAt: timestamp('created_at').default(sql`(now())`),
```

---

## 10. 常见问题排查

### 问题 1：导入 SQL 时报 `ERROR 1064: ... DEFAULT (now())`

**原因**：使用了 MySQL 8.0 原版 SQL 文件。

**解决**：改用 MySQL 5.7 兼容版本：
```bash
mysql -u gujia -p gujia < database/gujia_full_mysql57.sql
```

### 问题 2：后端启动报 `ER_ACCESS_DENIED_ERROR`

**原因**：数据库用户名或密码错误。

**解决**：检查 `backend/.env` 中的 `DB_USER` 和 `DB_PASSWORD` 是否与第 3.3 步创建的一致。

### 问题 3：后端启动报 `ECONNREFUSED` (Redis)

**原因**：Redis 服务未启动。

**解决**：
```bash
sudo service redis-server start
redis-cli ping  # 验证返回 PONG
```

### 问题 4：前端访问后端报 `CORS` 错误

**原因**：前端域名/端口未在后端 CORS 白名单中。

**解决**：检查 `backend/server/index.ts` 中的 CORS 配置，确保允许了前端的来源地址。

### 问题 5：`pnpm install` 失败

**原因**：Node.js 版本过低或网络问题。

**解决**：
```bash
# 检查 Node.js 版本
node -v  # 需要 v18+

# 使用国内镜像加速
pnpm install --registry https://registry.npmmirror.com
```

### 问题 6：自动估值功能报错

**原因**：`cases` 表缺少部分字段（历史数据库版本问题）。

**解决**：执行补充字段迁移脚本：
```bash
mysql -u gujia -p gujia < database/migrate_cases.sql
```

### 问题 7：前端页面空白或 500 错误

**原因**：前端无法连接后端 API。

**解决**：
1. 确认后端已启动并通过健康检查：`curl http://localhost:8721/health`
2. 检查 `frontend/.env.local` 中的 `NEXT_PUBLIC_BACKEND_URL` 是否正确
3. 查看前端日志：`tail -f logs/frontend_latest.log`

---

## 11. 测试账号

系统内置了以下测试账号，可用于验证各角色功能：

| 角色 | 用户名 | 密码 | 功能范围 |
|------|--------|------|----------|
| **系统管理员** | `admin` | `admin123456` | 用户管理、系统配置、数据统计 |
| **评估师** | `appraiser1` | `test123456` | 项目承接、报告出具、自动估值 |
| **银行员** | `bank1` | `test123456` | 项目发布、竞标管理、贷款评估 |
| **投资人** | `investor1` | `test123456` | 资产浏览、估值查询、投资分析 |
| **个人客户** | `customer1` | `test123456` | 房产估值、报告查看、邀请返佣 |

---

## 附录：快速命令参考

```bash
# 一键启动（开发模式）
./start-dev.sh

# 同步代码到 GitHub
./sync.sh "feat: 功能描述"

# 运行自动化测试
python3 test/run_tests.py

# 查看实时日志
tail -f logs/backend_latest.log
tail -f logs/frontend_latest.log

# 停止所有服务
kill $(cat /tmp/gujia-backend.pid) $(cat /tmp/gujia-frontend.pid)

# 重置数据库（谨慎操作）
mysql -u gujia -p -e "DROP DATABASE gujia; CREATE DATABASE gujia DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u gujia -p gujia < database/gujia_full_mysql57.sql
mysql -u gujia -p gujia < database/cities_districts.sql
mysql -u gujia -p gujia < database/migrate_cases.sql
```
