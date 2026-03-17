# `gujia.app` SaaS 项目生产环境部署指南

**版本**: 1.0.0
**更新日期**: 2026-03-17
**作者**: Manus AI

---

本文档为 `gujia.app` SaaS 项目提供了一份完整、详细的生产环境部署指南。指南基于 PM2 进程管理器，确保服务的稳定性和高可用性，并详细说明了环境变量的配置方法，以支持独立域名（如 `gujia.app` 和 `api.gujia.app`）的部署模式。

## 1. 部署架构概览

生产环境采用前后端分离的经典架构，通过 Nginx 作为反向代理，将不同域名或路径的请求转发至对应的后端服务。PM2 负责管理 Node.js 进程，确保在应用崩溃或服务器重启后能够自动恢复。

| 组件 | 建议端口 | 进程管理器 | 生产启动命令 |
|---|---|---|---|
| **后端 (Express)** | `8721` | PM2 | `npx tsx server/index.ts` |
| **前端 (Next.js)** | `8720` | PM2 | `next start -p 8720` |
| **数据库** | `3306` | Systemd | `systemctl start mysql` |
| **缓存** | `6379` | Systemd | `systemctl start redis-server` |
| **反向代理** | `80/443` | Systemd | `systemctl start nginx` |

## 2. 环境准备

在开始部署之前，请确保您的服务器满足以下基本要求。

### 2.1. 系统依赖

- **操作系统**: Ubuntu 22.04 LTS 或其他主流 Linux 发行版
- **Node.js**: `v22.x` 或更高版本 (推荐使用 `nvm` 管理)
- **pnpm**: `v10.x` 或更高版本
- **PM2**: 最新稳定版
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.0 或更高版本
- **Web 服务器**: Nginx

### 2.2. 基础软件安装

```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装 Nginx, MySQL, Redis
sudo apt-get install -y nginx mysql-server redis-server

# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 安装 pnpm 和 pm2
npm install -g pnpm pm2
```

## 3. 数据库配置

### 3.1. 创建数据库和用户

首先，为 `gujia.app` 创建专用的 MySQL 数据库和用户，并授予相应权限。

```sql
-- 登录 MySQL
sudo mysql

-- 创建数据库
CREATE DATABASE gujia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权（请将 'your_strong_password' 替换为强密码）
CREATE USER 'gujia'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON gujia.* TO 'gujia'@'localhost';

-- 刷新权限并退出
FLUSH PRIVILEGES;
EXIT;
```

### 3.2. 导入数据

项目包含初始的城市区域数据和大量的房产样本数据。您需要按顺序导入它们。

```bash
# 切换到项目根目录
cd /path/to/your/saas

# 1. 导入城市区域数据
mysql -u gujia -p'your_strong_password' gujia < database/cities_districts.sql

# 2. 使用 Drizzle Kit 推送表结构（确保 .env 文件已配置）
cd backend
pnpm db:push
cd ..

# 3. 导入完整的样本数据（文件较大，后台执行）
gunzip < database/gujia_clean_20260315.sql.gz | mysql -u gujia -p'your_strong_password' gujia
```

## 4. 环境变量配置

环境变量是部署的核心。您需要在**后端**和**前端**目录分别创建 `.env` 和 `.env.local` 文件，并填入生产环境的配置。**这些文件不应提交到 Git 仓库。**

### 4.1. 后端配置 (`/path/to/your/saas/backend/.env`)

复制 `backend/.env.example` 并重命名为 `.env`，然后修改以下关键配置：

```ini
# ==========================
# gujia.app 后端生产环境配置
# ==========================

# 运行环境
NODE_ENV=production

# 服务端口
PORT=8721

# 【重要】前端域名 (用于 CORS 白名单)
# 如果有多个前端域名，用英文逗号分隔
FRONTEND_URL=https://gujia.app

# 【重要】后端 API 公网地址
BACKEND_PUBLIC_URL=https://api.gujia.app

# 【重要】数据库连接信息
DB_HOST=localhost
DB_PORT=3306
DB_USER=gujia
DB_PASSWORD=your_strong_password # 替换为您创建的数据库密码
DB_NAME=gujia

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password # 如果 Redis 设置了密码

# 【重要】JWT 密钥 (务必修改为随机长字符串)
JWT_SECRET=generate_a_very_long_and_random_secret_string_here
JWT_EXPIRES_IN=7d

# 可选：CORS 高级配置 (如果 FRONTEND_URL 不够用)
# CORS_ORIGINS=https://gujia.app,https://www.gujia.app
```

### 4.2. 前端配置 (`/path/to/your/saas/frontend/.env.local`)

复制 `frontend/.env.example` 并重命名为 `.env.local`，然后修改配置：

```ini
# ==========================
# gujia.app 前端生产环境配置
# ==========================

# 【重要】后端 API 地址
# 这个地址是浏览器中 JS 代码调用的地址
NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
```

## 5. 构建与启动

项目提供了 `deploy-prod.sh` 脚本来自动化大部分部署流程，包括安装依赖、编译代码和启动服务。

### 5.1. 使用部署脚本 (推荐)

在项目根目录执行一键部署脚本：

```bash
# 确保脚本有执行权限
chmod +x deploy-prod.sh

# 执行部署
./deploy-prod.sh
```

该脚本会自动完成以下工作：
1. 检查 `pnpm` 和 `pm2` 是否安装。
2. 检查 `.env` 配置文件是否存在。
3. 安装前后端的所有 `npm` 依赖。
4. 编译后端 TypeScript 代码到 `dist/` 目录。
5. 构建前端 Next.js 应用到 `.next/` 目录。
6. 使用 `ecosystem.config.js` 启动或重启 PM2 进程。

### 5.2. 手动部署步骤

如果您希望手动控制部署过程，可以按以下步骤操作：

```bash
# 1. 安装后端依赖并编译
cd /path/to/your/saas/backend
pnpm install
pnpm build

# 2. 安装前端依赖并编译
cd ../frontend
pnpm install
pnpm build

# 3. 使用 PM2 启动服务
cd ..
pm2 start ecosystem.config.js
```

### 5.3. PM2 常用命令

| 命令 | 描述 |
|---|---|
| `pm2 status` | 查看所有服务状态 |
| `pm2 logs gujia-backend` | 查看后端日志 |
| `pm2 logs gujia-frontend` | 查看前端日志 |
| `pm2 restart all` | 重启所有服务 |
| `pm2 stop all` | 停止所有服务 |
| `pm2 startup` | 创建开机自启脚本 |
| `pm2 save` | 保存当前进程列表，以便开机恢复 |

## 6. Nginx 反向代理配置

最后一步是配置 Nginx，将公网域名代理到本地运行的服务端口。

在 `/etc/nginx/sites-available/` 目录下创建 `gujia.app.conf` 文件：

```nginx
# /etc/nginx/sites-available/gujia.app.conf

# 后端服务 (api.gujia.app)
server {
    listen 80;
    server_name api.gujia.app;

    # 建议配置 SSL 证书，将 HTTP 重定向到 HTTPS
    # listen 443 ssl;
    # ssl_certificate /path/to/your/fullchain.pem;
    # ssl_certificate_key /path/to/your/privkey.pem;

    location / {
        proxy_pass http://localhost:8721;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 前端服务 (gujia.app)
server {
    listen 80;
    server_name gujia.app www.gujia.app;

    # 建议配置 SSL 证书
    # listen 443 ssl;
    # ssl_certificate /path/to/your/fullchain.pem;
    # ssl_certificate_key /path/to/your/privkey.pem;

    location / {
        proxy_pass http://localhost:8720;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

创建配置文件后，启用它并重启 Nginx：

```bash
# 创建软链接到 sites-enabled
sudo ln -s /etc/nginx/sites-available/gujia.app.conf /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

至此，您的 `gujia.app` SaaS 应用已成功部署到生产环境。
