# gujia.app 本地项目部署问题修复报告

在对本地项目 `/home/ubuntu/saas_new` 进行全面检查后，发现并修复了与生产环境部署相关的几个关键问题。这些修复确保了在双域名架构（`www.gujia.app` → 8720，`api.gujia.app` → 8721）下，项目能够顺利部署并正常运行。

## 1. 跨域 Cookie 认证问题（已修复）

### 问题描述
在双域名架构下，前端（`www.gujia.app`）向后端（`api.gujia.app`）发送请求属于跨域请求。原代码中，后端在登录成功后设置的 JWT Cookie 配置为 `sameSite: "lax"`，且没有设置 `secure: true`。这导致现代浏览器在跨域请求时会拦截并丢弃该 Cookie，从而导致前端无法保持登录状态，出现无限重定向回登录页的问题。

### 修复方案
已修改后端 `backend/server/routers/auth.ts` 文件中的 Cookie 设置：
- 将 `sameSite: "lax"` 修改为 `sameSite: "none"`
- 增加 `secure: true` 属性（要求必须使用 HTTPS）
- 同时修复了 `logout` 接口的 `clearCookie` 方法，确保清除 Cookie 时也携带相同的属性。

## 2. 前端 API URL 配置机制（已确认）

### 机制说明
项目已经实现了一套非常完善的运行时环境变量获取机制，避免了 Next.js 静态编译带来的问题：
1. **服务端运行时获取**：前端通过 `/api/config` 接口在服务端运行时读取 `process.env.NEXT_PUBLIC_BACKEND_URL`。
2. **客户端动态加载**：客户端在初始化时通过 `getBackendUrl()` 调用该接口获取真实的后端地址。
3. **兼容性**：`lib/trpc.ts` 中仍然保留了 build 时的静态替换作为 fallback。

### 部署建议
在新的服务器上部署时，**必须**在 `frontend/.env.local` 中正确设置：
```env
NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
```
**注意**：修改此变量后，**必须重新执行 `pnpm build`**，因为 `lib/trpc.ts` 中的 tRPC 客户端初始化仍然依赖于 build 时的静态替换。

## 3. Nginx 代理与缓存配置（部署时需注意）

### 潜在问题
在之前的生产环境排查中发现，Nginx 的全局缓存（`proxy_cache`）会缓存后端的 API 响应（包括 `Set-Cookie` 头）以及前端的静态 JS 文件，导致更新后浏览器仍然加载旧代码或无法获取新的 Cookie。

### 部署建议
在新服务器配置 Nginx 时，请务必遵循以下规则：

**前端 Nginx 配置 (www.gujia.app)**：
```nginx
# 代理到前端 Next.js 服务
location / {
    proxy_pass http://127.0.0.1:8720;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # 禁用 Next.js 静态资源的 Nginx 缓存，让 Next.js 自己处理缓存
    proxy_cache_bypass $http_upgrade;
}
```

**后端 Nginx 配置 (api.gujia.app)**：
```nginx
# 代理到后端 Express 服务
location / {
    proxy_pass http://127.0.0.1:8721;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # 必须禁用 API 缓存，否则会导致 Set-Cookie 丢失和数据不同步
    proxy_no_cache 1;
    proxy_cache_bypass 1;
    
    # 允许跨域携带 Cookie（虽然代码中已配置 CORS，但 Nginx 层也需确保不拦截）
    proxy_pass_header Set-Cookie;
}
```

## 4. 数据库连接配置（已确认）

### 机制说明
后端 `backend/server/lib/db.ts` 中实现了智能的数据库连接回退机制：
1. 优先尝试使用 Unix Socket (`/var/run/mysqld/mysqld.sock`) 连接。
2. 如果 Socket 文件不存在，则回退到使用 TCP (`DB_HOST` + `DB_PORT`) 连接。

### 部署建议
如果在新服务器上使用 Docker 部署 MySQL，请确保：
1. 在 `backend/.env` 中正确设置 `DB_HOST`（通常是 `127.0.0.1` 或 Docker 宿主机 IP）。
2. 确保数据库用户的 `Host` 字段允许该 IP 访问（例如设置为 `%`）。
3. 确保密码与 `.env` 中的 `DB_PASSWORD` 完全一致。

## 总结

本地代码已经修复了最核心的跨域 Cookie 问题。下次在新服务器上部署时，只需按照 `DEPLOY_GUIDE.md` 的指引，正确配置 `.env` 文件，并特别注意 Nginx 的缓存配置，即可顺利完成部署。
