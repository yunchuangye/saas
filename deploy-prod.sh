#!/bin/bash
# ================================================================
# deploy-prod.sh — 生产环境一键部署脚本
# 用法：./deploy-prod.sh
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
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo -e "${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${CYAN}                 saas 生产环境一键部署脚本                      ${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}"

# 1. 环境检查
log_step "检查环境..."
if ! command -v pnpm &> /dev/null; then
    log_error "未安装 pnpm，请先执行: npm install -g pnpm"
    exit 1
fi
if ! command -v pm2 &> /dev/null; then
    log_error "未安装 pm2，请先执行: npm install -g pm2"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
    log_warn "未找到 backend/.env，将从 .env.example 复制"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    log_warn "请务必检查并修改 backend/.env 中的数据库配置！"
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    log_warn "未找到 frontend/.env.local，正在创建默认配置"
    echo "BACKEND_URL=http://localhost:8721" > "$FRONTEND_DIR/.env.local"
    log_warn "请务必修改 frontend/.env.local 中的 BACKEND_URL 为实际的后端域名！"
fi

# 2. 后端构建
log_step "开始构建后端..."
cd "$BACKEND_DIR"
log_info "安装后端依赖..."
pnpm install
log_info "编译后端代码..."
pnpm build
log_info "后端构建完成"

# 3. 前端构建
log_step "开始构建前端..."
cd "$FRONTEND_DIR"
log_info "安装前端依赖..."
pnpm install
log_info "编译前端代码 (这可能需要几分钟)..."
pnpm build
log_info "前端构建完成"

# 4. PM2 启动/重启
log_step "使用 PM2 启动/重启服务..."
cd "$ROOT_DIR"
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
pm2 save

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║              🎉 部署完成！                           ║${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║  服务已通过 PM2 在后台运行                           ║${RESET}"
echo -e "${BOLD}${GREEN}║  查看状态: pm2 status                                ║${RESET}"
echo -e "${BOLD}${GREEN}║  查看日志: pm2 logs                                  ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
