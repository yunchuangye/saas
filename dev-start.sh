#!/bin/bash
# ============================================================
# gujia.app 本地开发环境一键启动脚本
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "🚀 启动 gujia.app 本地开发环境..."

# 启动 MySQL
echo "📦 启动 MySQL..."
sudo service mysql start 2>/dev/null || true
sleep 1

# 启动 Redis
echo "📦 启动 Redis..."
sudo service redis-server start 2>/dev/null || true
sleep 1

# 验证数据库连接
echo "🔍 验证数据库连接..."
mysql -u gujia -pgujia_dev_2026 -h 127.0.0.1 gujia -e "SELECT 1;" > /dev/null 2>&1 && echo "  ✅ MySQL 连接正常" || echo "  ❌ MySQL 连接失败"
redis-cli ping > /dev/null 2>&1 && echo "  ✅ Redis 连接正常" || echo "  ❌ Redis 连接失败"

# 启动后端
echo "🔧 启动后端服务 (端口 8721)..."
cd "$PROJECT_DIR/backend"
setsid pnpm run dev > "$LOG_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 5
if curl -s http://localhost:8721/health > /dev/null 2>&1; then
    echo "  ✅ 后端启动成功"
else
    echo "  ⚠️  后端可能还在启动中，请查看日志: tail -f $LOG_DIR/backend.log"
fi

# 启动前端
echo "🎨 启动前端服务 (端口 8720)..."
cd "$PROJECT_DIR/frontend"
setsid pnpm run dev > "$LOG_DIR/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📌 访问地址："
echo "  前端: http://localhost:8720"
echo "  后端: http://localhost:8721"
echo "  健康检查: http://localhost:8721/health"
echo ""
echo "📋 查看日志："
echo "  tail -f $LOG_DIR/backend.log"
echo "  tail -f $LOG_DIR/frontend.log"
echo ""
echo "🛑 停止服务: ./dev-stop.sh"
