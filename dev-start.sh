#!/bin/bash
# ================================================================
# dev-start.sh — 本地开发环境一键启动脚本
# 用法：./dev-start.sh
# ================================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

log_info()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅  $*${RESET}"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️   $*${RESET}"; }
log_step()  { echo -e "${CYAN}[$(date '+%H:%M:%S')] ▶   $*${RESET}"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌  $*${RESET}"; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT_DIR/logs"

# ── 0. 加载环境变量 ──────────────────────────────────────────────
if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    source "$ROOT_DIR/.env"
    set +a
    log_info "已加载 .env 配置"
fi

# ── 1. 启动 MySQL ────────────────────────────────────────────────
log_step "启动 MySQL..."
sudo service mysql start 2>/dev/null || true
sleep 1
if sudo service mysql status 2>/dev/null | grep -q "active (running)"; then
    log_info "MySQL 运行中"
else
    log_warn "MySQL 启动失败，请检查"
fi

# ── 2. 启动 Redis ────────────────────────────────────────────────
log_step "启动 Redis..."
sudo service redis-server start 2>/dev/null || true
sleep 1
if redis-cli ping 2>/dev/null | grep -q "PONG"; then
    log_info "Redis 运行中"
else
    log_warn "Redis 启动失败，请检查"
fi

# ── 3. 停止旧进程 ────────────────────────────────────────────────
log_step "清理旧进程..."
kill $(lsof -ti:8721) 2>/dev/null || true
kill $(lsof -ti:8720) 2>/dev/null || true
sleep 2

# ── 4. 启动后端 ──────────────────────────────────────────────────
log_step "启动后端服务 (端口 8721)..."
cd "$ROOT_DIR/backend"
nohup npx tsx server/index.ts > "$ROOT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT_DIR/logs/backend.pid"
sleep 6

if curl -s http://localhost:8721/health | grep -q "ok"; then
    log_info "后端运行中 (PID: $BACKEND_PID) - http://localhost:8721"
else
    log_warn "后端可能未完全启动，查看日志: $ROOT_DIR/logs/backend.log"
    tail -20 "$ROOT_DIR/logs/backend.log"
fi

# ── 5. 启动前端 ──────────────────────────────────────────────────
log_step "启动前端服务 (端口 8720)..."
cd "$ROOT_DIR/frontend"
nohup pnpm exec next dev -p 8720 > "$ROOT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT_DIR/logs/frontend.pid"
sleep 12

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8720/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_info "前端运行中 (PID: $FRONTEND_PID) - http://localhost:8720"
else
    log_warn "前端可能未完全启动 (HTTP: $HTTP_CODE)，查看日志: $ROOT_DIR/logs/frontend.log"
fi

# ── 6. 汇总 ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  gujia.app 本地开发环境启动完成${RESET}"
echo -e "${GREEN}══════════════════════════════════════════════${RESET}"
echo -e "  前端地址: ${CYAN}http://localhost:8720${RESET}"
echo -e "  后端地址: ${CYAN}http://localhost:8721${RESET}"
echo -e "  健康检查: ${CYAN}http://localhost:8721/health${RESET}"
echo -e "  后端日志: ${CYAN}$ROOT_DIR/logs/backend.log${RESET}"
echo -e "  前端日志: ${CYAN}$ROOT_DIR/logs/frontend.log${RESET}"
echo ""
echo -e "  同步到 GitHub: ${YELLOW}./sync-to-github.sh \"提交信息\"${RESET}"
echo -e "  停止所有服务: ${YELLOW}./dev-stop.sh${RESET}"
echo -e "${GREEN}══════════════════════════════════════════════${RESET}"
