#!/bin/bash
# ============================================================
# gujia.app — 本地开发环境一键启动脚本
# 用法：./start-dev.sh [--port-fe <端口>] [--port-be <端口>]
# 示例：./start-dev.sh
#       ./start-dev.sh --port-fe 8720 --port-be 8721
# ============================================================

set -e

# ── 默认端口（不常用端口，避开 3000/3001/8080 等）──────────
FRONTEND_PORT=8720
BACKEND_PORT=8721

# ── 解析命令行参数 ──────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port-fe) FRONTEND_PORT="$2"; shift 2 ;;
    --port-be) BACKEND_PORT="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         gujia.app 本地开发环境启动脚本               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  前端端口: $FRONTEND_PORT"
echo "  后端端口: $BACKEND_PORT"
echo ""

# ── 1. 同步端口配置到环境文件 ───────────────────────────────
echo "⚙️  同步端口配置..."

# 更新 backend/.env
if [ -f "$BACKEND_DIR/.env" ]; then
  sed -i "s/^PORT=.*/PORT=$BACKEND_PORT/" "$BACKEND_DIR/.env"
else
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  sed -i "s/^PORT=.*/PORT=$BACKEND_PORT/" "$BACKEND_DIR/.env"
fi

# 更新 frontend/.env.local
cat > "$FRONTEND_DIR/.env.local" <<EOF
# 后端 API 地址（由 start-dev.sh 自动生成）
NEXT_PUBLIC_BACKEND_URL=http://localhost:$BACKEND_PORT
EOF

echo "   ✅ backend/.env         → PORT=$BACKEND_PORT"
echo "   ✅ frontend/.env.local  → NEXT_PUBLIC_BACKEND_URL=http://localhost:$BACKEND_PORT"
echo ""

# ── 2. 启动基础服务 ─────────────────────────────────────────
echo "🗄️  启动 MySQL..."
sudo service mysql start > /dev/null 2>&1 || true
sleep 1

echo "📦 启动 Redis..."
sudo service redis-server start > /dev/null 2>&1 || redis-server --daemonize yes > /dev/null 2>&1 || true
sleep 1

# 验证基础服务
MYSQL_OK=$(mysql -u gujia -pgujia123456 -e "SELECT 1" 2>/dev/null | grep -c "1" || echo "0")
REDIS_OK=$(redis-cli ping 2>/dev/null | grep -c "PONG" || echo "0")

[ "$MYSQL_OK" = "1" ] && echo "   ✅ MySQL  运行正常" || echo "   ❌ MySQL  连接失败，请检查配置"
[ "$REDIS_OK" = "1" ] && echo "   ✅ Redis  运行正常" || echo "   ❌ Redis  连接失败，请检查配置"
echo ""

# ── 3. 停止旧进程 ───────────────────────────────────────────
echo "🛑 停止旧服务进程..."
pkill -f "tsx.*server/index.ts" 2>/dev/null || true
pkill -f "next dev"              2>/dev/null || true
pkill -f "next-server"           2>/dev/null || true
sleep 2

# 释放端口（如有残留）
for PORT_NUM in $FRONTEND_PORT $BACKEND_PORT; do
  PIDS=$(lsof -ti tcp:$PORT_NUM 2>/dev/null || true)
  [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null || true
done
sleep 1

# ── 4. 启动后端 ─────────────────────────────────────────────
echo "⚙️  启动后端服务 (端口 $BACKEND_PORT)..."
cd "$BACKEND_DIR"
nohup ./node_modules/.bin/tsx watch server/index.ts \
  > /tmp/gujia-backend.log 2>&1 < /dev/null &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

# 等待后端就绪（最多 15 秒）
for i in $(seq 1 15); do
  sleep 1
  HEALTH=$(curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -c "ok" || echo "0")
  [ "$HEALTH" = "1" ] && break
done

if [ "$HEALTH" = "1" ]; then
  echo "   ✅ 后端服务启动成功 → http://localhost:$BACKEND_PORT"
else
  echo "   ❌ 后端服务启动失败，查看日志: cat /tmp/gujia-backend.log"
fi
echo ""

# ── 5. 启动前端 ─────────────────────────────────────────────
echo "🌐 启动前端服务 (端口 $FRONTEND_PORT)..."
cd "$FRONTEND_DIR"
nohup ./node_modules/.bin/next dev --port "$FRONTEND_PORT" \
  > /tmp/gujia-frontend.log 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

# 等待前端就绪（最多 20 秒）
for i in $(seq 1 20); do
  sleep 1
  FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "0")
  [ "$FE_STATUS" = "200" ] && break
done

if [ "$FE_STATUS" = "200" ]; then
  echo "   ✅ 前端服务启动成功 → http://localhost:$FRONTEND_PORT"
else
  echo "   ❌ 前端服务启动失败，查看日志: cat /tmp/gujia-frontend.log"
fi
echo ""

# ── 6. 汇总信息 ─────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗"
echo "║                  🎉 启动完成！                       ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  前端地址:  http://localhost:$FRONTEND_PORT                  ║"
echo "║  后端地址:  http://localhost:$BACKEND_PORT                  ║"
echo "║  健康检查:  http://localhost:$BACKEND_PORT/health           ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  默认账号:  admin / admin123456                      ║"
echo "║  测试账号:  appraiser1 / test123456                  ║"
echo "║             bank1      / test123456                  ║"
echo "║             investor1  / test123456                  ║"
echo "║             customer1  / test123456                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  日志文件:                                           ║"
echo "║    后端: /tmp/gujia-backend.log                      ║"
echo "║    前端: /tmp/gujia-frontend.log                     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  同步代码到 GitHub:                                  ║"
echo "║    ./sync.sh \"feat: 你的功能描述\"                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
