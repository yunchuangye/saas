#!/bin/bash
# ================================================================
# dev-stop.sh — 停止本地开发环境所有服务
# ================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${YELLOW}[$(date '+%H:%M:%S')] 停止所有开发服务...${RESET}"

# 停止后端
if [ -f "$ROOT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$ROOT_DIR/logs/backend.pid")
    kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✅ 后端已停止 (PID: $BACKEND_PID)${RESET}" || true
    rm -f "$ROOT_DIR/logs/backend.pid"
fi

# 停止前端
if [ -f "$ROOT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$ROOT_DIR/logs/frontend.pid")
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✅ 前端已停止 (PID: $FRONTEND_PID)${RESET}" || true
    rm -f "$ROOT_DIR/logs/frontend.pid"
fi

# 强制清理端口
kill $(lsof -ti:8721) 2>/dev/null || true
kill $(lsof -ti:8720) 2>/dev/null || true

echo -e "${GREEN}[$(date '+%H:%M:%S')] 所有服务已停止${RESET}"
