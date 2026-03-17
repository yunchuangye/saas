#!/bin/bash
# 本地开发启动脚本
set -e

echo "🚀 启动本地开发环境..."

# 启动 MySQL
sudo service mysql start 2>/dev/null || true
echo "✅ MySQL 已启动"

# 启动 Redis
sudo service redis-server start 2>/dev/null || redis-server --daemonize yes 2>/dev/null || true
echo "✅ Redis 已启动"

# 停止旧进程
fuser -k 8721/tcp 2>/dev/null || true
fuser -k 8720/tcp 2>/dev/null || true
sleep 1

# 启动后端
cd /home/ubuntu/saas/backend
PORT=8721 npx tsx server/index.ts > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端启动中 (PID: $BACKEND_PID)..."

# 等待后端就绪
sleep 5

# 启动前端
cd /home/ubuntu/saas/frontend
npx next dev --port 8720 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端启动中 (PID: $FRONTEND_PID)..."

sleep 5

echo ""
echo "🎉 本地开发环境已就绪！"
echo "   前端: http://localhost:8720"
echo "   后端: http://localhost:8721"
echo "   健康检查: http://localhost:8721/health"
echo "   验证码接口: http://localhost:8721/api/captcha"
echo ""
echo "   默认管理员: admin / admin123456"
echo ""
echo "📝 日志文件:"
echo "   后端: /tmp/backend.log"
echo "   前端: /tmp/frontend.log"
