#!/bin/bash
# ============================================================
# gujia.app — 本地开发环境启动脚本
# 用法：./start-dev.sh
# ============================================================

echo "🚀 启动 gujia.app 本地开发环境..."
echo ""

# 启动 MySQL
echo "🗄️  启动 MySQL..."
sudo service mysql start
sleep 1

# 启动 Redis
echo "📦 启动 Redis..."
sudo service redis-server start 2>/dev/null || redis-server --daemonize yes 2>/dev/null || true
sleep 1

# 验证服务
MYSQL_OK=$(mysql -u gujia -pgujia123456 -e "SELECT 1" 2>/dev/null | grep -c "1" || echo "0")
REDIS_OK=$(redis-cli ping 2>/dev/null | grep -c "PONG" || echo "0")

if [ "$MYSQL_OK" = "1" ]; then
  echo "✅ MySQL 运行正常"
else
  echo "❌ MySQL 连接失败，请检查配置"
fi

if [ "$REDIS_OK" = "1" ]; then
  echo "✅ Redis 运行正常"
else
  echo "❌ Redis 连接失败，请检查配置"
fi

echo ""

# 停止旧进程
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 1

# 启动后端
echo "⚙️  启动后端服务 (端口 3001)..."
cd /home/ubuntu/saas/backend
npx tsx server/index.ts > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

sleep 4

# 验证后端
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null | grep -c "ok" || echo "0")
if [ "$HEALTH" = "1" ]; then
  echo "✅ 后端服务启动成功 → http://localhost:3001"
else
  echo "❌ 后端服务启动失败，查看日志: cat /tmp/backend.log"
fi

# 启动前端
echo "🌐 启动前端服务 (端口 3000)..."
cd /home/ubuntu/saas/frontend
npx next dev -p 3000 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

sleep 6

# 验证前端
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "0")
if [ "$FRONTEND_OK" = "200" ]; then
  echo "✅ 前端服务启动成功 → http://localhost:3000"
else
  echo "❌ 前端服务启动失败，查看日志: cat /tmp/frontend.log"
fi

echo ""
echo "============================================"
echo "🎉 开发环境启动完成！"
echo "============================================"
echo "  前端:   http://localhost:3000"
echo "  后端:   http://localhost:3001"
echo "  健康:   http://localhost:3001/health"
echo ""
echo "  默认账号: admin / admin123456"
echo "  测试账号: appraiser1 / test123456"
echo "            bank1 / test123456"
echo "            investor1 / test123456"
echo "            customer1 / test123456"
echo ""
echo "  日志文件:"
echo "    后端: /tmp/backend.log"
echo "    前端: /tmp/frontend.log"
echo "============================================"
echo ""
echo "  同步代码到 GitHub:"
echo "    ./sync.sh \"feat: 你的功能描述\""
echo "============================================"
