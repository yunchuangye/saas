# 宝塔面板部署与自启动配置指南

本文档详细说明了如何在宝塔面板中部署 gujia.app 项目，并配置 PM2 实现服务器重启后的自动启动。

## 1. 环境变量配置

在启动项目之前，必须正确配置环境变量。

### 1.1 后端配置 (`backend/.env`)

复制 `backend/.env.example` 为 `backend/.env`，并修改以下关键配置：

```env
# 前端访问域名（用于 CORS 白名单）
FRONTEND_URL=https://gujia.app

# 后端 API 公网地址（前端调用后端接口时使用的地址）
BACKEND_PUBLIC_URL=https://api.gujia.app

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=gujia
DB_PASSWORD=您的数据库密码
DB_NAME=gujia

# JWT 鉴权密钥（务必修改为随机长字符串）
JWT_SECRET=您的随机密钥
```

### 1.2 前端配置 (`frontend/.env.local`)

复制 `frontend/.env.example` 为 `frontend/.env.local`，并修改后端 API 地址：

```env
# 生产环境（独立后端域名）
NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
```

## 2. 宝塔面板 PM2 部署与自启动

项目根目录已提供 `ecosystem.config.js` 文件，可直接使用 PM2 管理前后端服务。

### 2.1 安装 PM2 管理器

1. 登录宝塔面板。
2. 点击左侧菜单的 **软件商店**。
3. 搜索 **PM2管理器** 并点击安装。

### 2.2 编译项目

在终端中进入项目根目录，执行以下命令编译前后端代码：

```bash
# 安装依赖
pnpm install

# 编译后端
cd backend
pnpm run build
cd ..

# 编译前端
cd frontend
pnpm run build
cd ..
```

### 2.3 使用 PM2 启动服务

在项目根目录执行以下命令启动服务：

```bash
# 使用 ecosystem.config.js 启动前后端服务
pm2 start ecosystem.config.js

# 保存当前 PM2 进程列表（关键步骤，用于开机自启）
pm2 save

# 设置 PM2 开机自启
pm2 startup
```

执行 `pm2 startup` 后，终端会输出一行命令（类似于 `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root/.pm2`），请复制并执行该命令以完成自启动配置。

### 2.4 在宝塔面板中查看状态

1. 打开 **PM2管理器**。
2. 您应该能看到 `gujia-backend` 和 `gujia-frontend` 两个项目正在运行。
3. 可以在此界面查看日志、重启或停止服务。

## 3. Nginx 反向代理配置

在宝塔面板中配置网站的反向代理，将域名请求转发到本地端口。

### 3.1 前端站点配置 (gujia.app)

1. 在宝塔面板中添加站点 `gujia.app`。
2. 配置 SSL 证书。
3. 在站点设置中，点击 **反向代理** -> **添加反向代理**。
4. 目标 URL 填写：`http://127.0.0.1:8720`。
5. 提交保存。

### 3.2 后端站点配置 (api.gujia.app)

1. 在宝塔面板中添加站点 `api.gujia.app`。
2. 配置 SSL 证书。
3. 在站点设置中，点击 **反向代理** -> **添加反向代理**。
4. 目标 URL 填写：`http://127.0.0.1:8721`。
5. 提交保存。

## 4. 常见问题排查

### 4.1 前端提示 "Failed to fetch"

- **原因**：前端无法连接到后端 API，通常是 CORS 或域名配置错误。
- **解决**：
  1. 检查 `frontend/.env.local` 中的 `NEXT_PUBLIC_BACKEND_URL` 是否正确指向后端公网地址。
  2. 检查 `backend/.env` 中的 `FRONTEND_URL` 是否包含前端的实际访问域名。
  3. 确保后端的反向代理配置正确，且防火墙放行了相关端口（如果直接通过端口访问）。

### 4.2 数据库连接失败

- **原因**：MySQL 密码错误或权限不足。
- **解决**：检查 `backend/.env` 中的数据库配置，确保与宝塔面板中创建的数据库信息一致。

### 4.3 服务重启后未自动启动

- **原因**：未正确保存 PM2 状态或未配置开机自启。
- **解决**：重新执行 `pm2 save` 和 `pm2 startup` 命令。
