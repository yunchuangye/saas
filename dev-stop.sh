#!/bin/bash
# ============================================================
# gujia.app 本地开发环境一键停止脚本
# ============================================================

echo "🛑 停止 gujia.app 本地开发环境..."

# 停止后端（tsx watch server/index.ts）
echo "停止后端服务..."
pkill -f "tsx watch server/index.ts" 2>/dev/null && echo "  ✅ 后端已停止" || echo "  ℹ️  后端未在运行"

# 停止前端（next dev）
echo "停止前端服务..."
pkill -f "next dev" 2>/dev/null && echo "  ✅ 前端已停止" || echo "  ℹ️  前端未在运行"

# 停止占用端口的进程
fuser -k 8720/tcp 2>/dev/null || true
fuser -k 8721/tcp 2>/dev/null || true

echo ""
echo "✅ 所有服务已停止"
echo "   MySQL 和 Redis 保持运行（如需停止请手动执行）"
