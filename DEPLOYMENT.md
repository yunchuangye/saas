# GuJia.App 部署指南

本文档记录了 GuJia.App SaaS 平台的标准部署流程。由于生产服务器内存有限（1.9GB），无法在服务器上直接进行前端编译，因此采用**本地编译 -> 打包上传 -> 服务器解压运行**的部署模式。

## 1. 环境准备

### 1.1 生产服务器环境
- **操作系统**: Ubuntu / Debian / CentOS (当前为宝塔面板环境)
- **Node.js**: v18+ (推荐 v20)
- **数据库**: MySQL 8.0+
- **缓存**: Redis 6.0+
- **进程管理**: PM2
- **Web 服务器**: Nginx

### 1.2 域名与证书
- 主域名: `gujia.app` (前端)
- API 域名: `api.gujia.app` (后端)
- 城市子域名: `*.gujia.app` (如 `sz.gujia.app`)
- SSL 证书: 已配置 TrustAsia / Let's Encrypt 证书

## 2. 环境变量配置

在部署前，请确保环境变量配置正确。**严禁在生产环境的浏览器端暴露 `localhost` 地址**。

### 2.1 前端环境变量 (`frontend/.env.local`)
```env
# ============================================================
# gujia.app 前端配置 - 生产环境
# ============================================================
# 后端 API 地址（生产环境）
NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
```

### 2.2 后端环境变量 (`backend/.env`)
```env
# ============================================================
# gujia.app 后端配置文件 - 生产环境
# ============================================================
# 域名与公网地址配置（生产环境）
FRONTEND_URL=https://gujia.app
BACKEND_PUBLIC_URL=https://api.gujia.app

# 服务端口
PORT=8721
FRONTEND_PORT=8720

# 数据库配置（MySQL）
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=gujia
DB_PASSWORD=your_db_password
DB_NAME=gujia

# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT 鉴权密钥
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# CORS 跨域（生产环境允许的来源）
CORS_ORIGINS=https://gujia.app,https://www.gujia.app,https://sz.gujia.app,https://bj.gujia.app,https://sh.gujia.app,https://gz.gujia.app,https://api.gujia.app

# 运行环境
NODE_ENV=production
```

## 3. 部署流程

### 3.1 本地编译前端
在本地开发机上执行前端编译：
```bash
cd frontend
pnpm install
pnpm build
```

### 3.2 打包构建产物
将编译后的 `.next` 目录、`public` 目录以及必要的文件打包：
```bash
tar -czvf frontend-build.tar.gz .next public package.json pnpm-lock.yaml next.config.mjs proxy.ts
```

### 3.3 上传至服务器
使用 `scp` 或其他工具将打包文件上传至服务器：
```bash
scp frontend-build.tar.gz root@156.227.237.225:/www/wwwroot/gujia.app/frontend/
```

### 3.4 服务器端部署
登录服务器，解压并重启服务：
```bash
cd /www/wwwroot/gujia.app/frontend/
tar -xzvf frontend-build.tar.gz
pnpm install --prod
pm2 restart gujia-frontend
```

后端部署类似，更新代码后重启 PM2：
```bash
cd /www/wwwroot/gujia.app/backend/
pnpm install
pnpm build
pm2 restart gujia-backend
```

### 3.5 清理 Nginx 缓存（关键步骤）
由于 Nginx 配置了代理缓存，部署新版本后**必须**清理缓存，否则用户会加载到旧的 JS 文件导致页面白屏或报错：
```bash
rm -rf /www/server/nginx/proxy_cache_dir/*
nginx -s reload
```

## 4. 常见问题排查

### 4.1 前端请求一直连接 `localhost:8721`
**原因**: 前端编译时读取了错误的 `.env.local`，或者 Nginx 缓存了旧的编译产物。
**解决**: 
1. 检查本地 `frontend/.env.local` 中的 `NEXT_PUBLIC_BACKEND_URL` 是否为 `https://api.gujia.app`。
2. 重新执行 `pnpm build`。
3. 部署后务必执行清理 Nginx 缓存的命令。

### 4.2 验证码无法加载
**原因**: 验证码是通过 Next.js 的 API 路由 (`/api/captcha`) 在服务端转发到后端的。
**解决**: 确保 `frontend/next.config.mjs` 中的 `rewrites` 规则正确指向了后端的内部地址（通常是 `http://localhost:8721`，因为是在同一台服务器上内部调用）。

### 4.3 城市子域名 SEO 标题未生效
**原因**: 中文字符在 HTTP Header 中传输时未正确编码。
**解决**: 确保 `middleware.ts` (或 `proxy.ts`) 中对中文字符使用了 `encodeURIComponent` 进行编码，前端接收时使用 `decodeURIComponent` 解码。
