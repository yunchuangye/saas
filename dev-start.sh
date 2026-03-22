#!/bin/bash
# ============================================================
# gujia.app 本地开发环境一键启动脚本
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "🚀 启动 gujia.app 本地开发环境..."

# 启动 MySQL（兼容有/无 systemd 环境）
echo "📦 启动 MySQL..."
if sudo service mysql start 2>/dev/null; then
    echo "  ✅ MySQL 服务启动"
elif sudo mysqld_safe --daemonize 2>/dev/null; then
    sleep 3
    echo "  ✅ MySQL 守护进程启动"
else
    echo "  ⚠️  MySQL 可能已在运行"
fi
sleep 1

# 启动 Redis（兼容有/无 systemd 环境）
echo "📦 启动 Redis..."
if sudo service redis-server start 2>/dev/null; then
    echo "  ✅ Redis 服务启动"
elif sudo redis-server --daemonize yes --logfile /var/log/redis/redis-server.log 2>/dev/null; then
    sleep 1
    echo "  ✅ Redis 守护进程启动"
else
    echo "  ⚠️  Redis 可能已在运行"
fi
sleep 1

# 验证数据库连接
echo "🔍 验证数据库连接..."
mysql -u gujia -pgujia_dev_2026 -h 127.0.0.1 gujia -e "SELECT 1;" > /dev/null 2>&1 && echo "  ✅ MySQL 连接正常" || echo "  ❌ MySQL 连接失败"
redis-cli ping > /dev/null 2>&1 && echo "  ✅ Redis 连接正常" || echo "  ❌ Redis 连接失败"

# 停止已有的后端进程
if ss -tlnp 2>/dev/null | grep -q ':8721'; then
    echo "  ⚠️  端口 8721 已占用，尝试停止旧进程..."
    kill $(ss -tlnp | grep ':8721' | grep -oP 'pid=\K[0-9]+') 2>/dev/null || true
    sleep 2
fi

# 停止已有的前端进程
if ss -tlnp 2>/dev/null | grep -q ':8720'; then
    echo "  ⚠️  端口 8720 已占用，尝试停止旧进程..."
    kill $(ss -tlnp | grep ':8720' | grep -oP 'pid=\K[0-9]+') 2>/dev/null || true
    sleep 2
fi

# 启动后端
echo "🔧 启动后端服务 (端口 8721)..."
cd "$PROJECT_DIR/backend"
setsid pnpm run dev >> "$LOG_DIR/backend.log" 2>&1 < /dev/null &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 8
if curl -s http://localhost:8721/health > /dev/null 2>&1; then
    echo "  ✅ 后端启动成功"
else
    echo "  ⚠️  后端可能还在启动中，请查看日志: tail -f $LOG_DIR/backend.log"
fi

# 启动前端
echo "🎨 启动前端服务 (端口 8720)..."
cd "$PROJECT_DIR/frontend"
setsid pnpm run dev >> "$LOG_DIR/frontend.log" 2>&1 < /dev/null &
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
