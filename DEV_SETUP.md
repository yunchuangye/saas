# gujia.app 本地开发环境说明

## 环境信息

| 组件 | 版本 | 端口 | 状态 |
|------|------|------|------|
| 前端 (Next.js) | 16.1.6 | 8720 | ✅ 运行中 |
| 后端 (Express+tRPC) | - | 8721 | ✅ 运行中 |
| MySQL | 8.0.x | 3306 | ✅ 运行中 |
| Redis | 6.0.x | 6379 | ✅ 运行中 |

## 目录结构

```
/home/ubuntu/saas/
├── frontend/          # Next.js 前端
├── backend/           # Express + tRPC 后端
├── database/          # 数据库脚本和备份
├── docs/              # 文档
├── logs/              # 运行日志（不提交 Git）
├── .env               # 环境变量配置（不提交 Git）
├── dev-start.sh       # 一键启动脚本
├── dev-stop.sh        # 一键停止脚本
└── sync-to-github.sh  # 同步到 GitHub
```

## 常用命令

### 启动服务
```bash
cd /home/ubuntu/saas
./dev-start.sh
```

### 停止服务
```bash
cd /home/ubuntu/saas
./dev-stop.sh
```

### 同步代码到 GitHub
```bash
cd /home/ubuntu/saas
./sync-to-github.sh "你的提交信息"
# 或自动生成提交信息
./sync-to-github.sh
```

### 查看日志
```bash
# 后端日志
tail -f /home/ubuntu/saas/logs/backend.log
# 前端日志
tail -f /home/ubuntu/saas/logs/frontend.log
```

### 手动启动（不使用脚本）
```bash
# 启动 MySQL
sudo service mysql start
# 启动 Redis
sudo service redis-server start
# 启动后端
cd /home/ubuntu/saas/backend
npx tsx server/index.ts
# 启动前端（新终端）
cd /home/ubuntu/saas/frontend
pnpm exec next dev -p 8720
```

## 数据库配置

- **数据库名**: gujia
- **用户名**: gujia
- **密码**: gujia_dev_2026
- **主机**: 127.0.0.1:3306

## 环境变量

配置文件位于 `/home/ubuntu/saas/.env`（已创建，不会提交到 Git）

## GitHub 仓库

- **地址**: https://github.com/yunchuangye/saas
- **分支**: main
- **用户名**: yunchuangye
