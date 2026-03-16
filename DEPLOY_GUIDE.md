# saas 项目服务器部署完整指南

本文档详细说明了如何在服务器（包括宝塔面板）上正确部署和配置 saas 项目，彻底解决前端无法启动、环境变量配置混乱等问题。

## 一、核心配置原理（必读）

在之前的更新中，我们**彻底重构了前端获取后端地址的逻辑**，解决了 `NEXT_PUBLIC_BACKEND_URL` 静态编译导致的问题。

### 1. 环境变量说明

现在，前端和后端**只需要一个核心环境变量**：`BACKEND_URL`。

- **前端**：在 `frontend/.env.local` 中配置 `BACKEND_URL`。Next.js 在**服务端渲染（SSR）时**会读取这个变量，并通过 `<script>` 标签内联注入到 HTML 的 `window.__BACKEND_URL__` 中。客户端 JS 直接从 `window` 读取，**完全不需要重新 build 即可生效**。
- **后端**：在 `backend/.env` 中配置 `FRONTEND_URL`（用于 CORS 跨域允许）和 `PORT`。

> **注意**：`NEXT_PUBLIC_BACKEND_URL` 仍然兼容，但推荐统一使用 `BACKEND_URL`。

### 2. 为什么宝塔 Node 网站配置前端会失败？

宝塔的 Node 项目管理器默认使用 `npm start` 或 `pm2` 启动项目，但 Next.js 项目有特殊要求：
1. 必须先执行 `npm run build`（或 `pnpm build`）生成 `.next` 目录。
2. 启动命令必须是 `next start`，并且需要指定端口。
3. 宝塔自动生成的启动脚本可能没有正确传递环境变量或端口参数。

---

## 二、标准部署方案（推荐）

最稳定、最可控的部署方式是使用 **PM2** 进行进程管理。项目根目录已经提供了 `ecosystem.config.js`。

### 步骤 1：准备配置文件

在服务器项目根目录下，手动创建/修改以下两个文件：

**1. `backend/.env`**
```ini
# 后端运行端口
PORT=8721
# 允许跨域的前端地址（你的前端域名）
FRONTEND_URL=https://gujia.app
# 数据库配置
DATABASE_URL=mysql://用户名:密码@127.0.0.1:3306/数据库名
# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**2. `frontend/.env.local`**
```ini
# 后端 API 地址（你的后端域名）
BACKEND_URL=https://api.gujia.app
```

### 步骤 2：安装依赖并构建

在项目根目录执行：

```bash
# 1. 安装全局工具
npm install -g pnpm pm2

# 2. 安装后端依赖并编译
cd backend
pnpm install
pnpm build

# 3. 安装前端依赖并编译
cd ../frontend
pnpm install
pnpm build
cd ..
```

### 步骤 3：使用 PM2 启动服务

在项目根目录（包含 `ecosystem.config.js` 的目录）执行：

```bash
# 启动所有服务（前端 8720，后端 8721）
pm2 start ecosystem.config.js

# 保存 PM2 状态，开机自启
pm2 save
pm2 startup
```

---

## 三、宝塔面板部署方案

如果你必须使用宝塔的 "Node 项目" 功能，请严格按照以下步骤操作：

### 1. 后端部署 (backend)
1. **项目目录**：选择 `/www/wwwroot/你的目录/backend`
2. **启动选项**：选择 `自定义命令`
3. **启动命令**：`pnpm start` （确保 `backend/package.json` 中有 `"start": "node dist/server/index.js"`）
4. **端口**：填写 `8721`
5. **环境变量**：无需在宝塔填，直接在 `backend/.env` 文件中写好即可。
6. **注意**：启动前必须在终端进入 `backend` 目录执行过 `pnpm install` 和 `pnpm build`（即 `tsc` 编译出 `dist` 目录）。

### 2. 前端部署 (frontend)
1. **项目目录**：选择 `/www/wwwroot/你的目录/frontend`
2. **启动选项**：选择 `自定义命令`
3. **启动命令**：`pnpm start` （确保 `frontend/package.json` 中有 `"start": "next start --port 8720"`）
4. **端口**：填写 `8720`
5. **环境变量**：无需在宝塔填，直接在 `frontend/.env.local` 文件中写好 `BACKEND_URL=https://api.gujia.app`。
6. **注意**：启动前必须在终端进入 `frontend` 目录执行过 `pnpm install` 和 `pnpm build`（生成 `.next` 目录）。

---

## 四、关于 `start-dev.sh` 的说明

`start-dev.sh` 主要是为**本地开发**设计的。虽然它提供了 `--mode start` 选项，但它有以下局限性：
1. 它会强制覆盖 `frontend/.env.local`，写入 `NEXT_PUBLIC_BACKEND_URL=http://localhost:8721`，这在服务器上是**错误**的（会导致浏览器去请求用户本地的 8721 端口）。
2. 它使用 `nohup` 后台运行，不如 PM2 稳定，且没有开机自启功能。

**结论**：在服务器生产环境中，**不要使用 `start-dev.sh`**。请使用上述的 PM2 方案或宝塔方案。

---

## 五、一键部署脚本 (生产环境专用)

为了方便服务器部署，我们提供了一个专用于生产环境的部署脚本 `deploy-prod.sh`。

### 使用方法：

1. 确保已经配置好 `backend/.env` 和 `frontend/.env.local`。
2. 在项目根目录执行：

```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

该脚本会自动完成：安装依赖 -> 编译后端 -> 编译前端 -> 使用 PM2 启动/重启服务。
