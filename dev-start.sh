#!/bin/bash
# ============================================================
# gujia.app 本地开发环境一键启动脚本
# ============================================================

echo "🚀 启动 gujia.app 开发环境..."

# 启动 MySQL
echo "📦 启动 MySQL..."
sudo service mysql start 2>/dev/null
sleep 1

# 启动 Redis
echo "📦 启动 Redis..."
sudo service redis-server start 2>/dev/null
sleep 1

# 创建日志目录
mkdir -p /home/ubuntu/saas/logs

# 启动后端
echo "🔧 启动后端服务 (端口 8721)..."
cd /home/ubuntu/saas/backend
pnpm run dev > /home/ubuntu/saas/logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 5

# 启动前端
echo "🎨 启动前端服务 (端口 8720)..."
cd /home/ubuntu/saas/frontend
pnpm run dev > /home/ubuntu/saas/logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📡 访问地址："
echo "   前端: http://localhost:8720"
echo "   后端: http://localhost:8721"
echo "   健康检查: http://localhost:8721/health"
echo ""
echo "🔑 管理员账号："
echo "   用户名: admin"
echo "   密码: admin123456"
echo ""
echo "📋 查看日志："
echo "   后端: tail -f /home/ubuntu/saas/logs/backend.log"
echo "   前端: tail -f /home/ubuntu/saas/logs/frontend.log"
