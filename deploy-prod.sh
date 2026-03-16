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
BOLD='\033[1m'
RESET='\033[0m'

log_info()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅  $*${RESET}"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️   $*${RESET}"; }
log_step()  { echo -e "${CYAN}[$(date '+%H:%M:%S')] ▶   $*${RESET}"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌  $*${RESET}"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo ""
echo -e "${BOLD}${CYAN}================================================================${RESET}"
echo -e "${BOLD}${CYAN}                 saas 生产环境一键部署脚本                      ${RESET}"
echo -e "${BOLD}${CYAN}================================================================${RESET}"
echo ""

# ── 工具函数：查找可执行文件（兼容 nvm/n/系统 node 等各种安装方式）──────────
find_cmd() {
    local cmd="$1"
    # 先尝试 command -v
    if command -v "$cmd" &>/dev/null; then
        echo "$(command -v "$cmd")"
        return 0
    fi
    # 尝试常见全局 npm 安装路径
    local candidates=(
        "$(npm root -g 2>/dev/null)/../bin/$cmd"
        "/usr/local/bin/$cmd"
        "/usr/bin/$cmd"
        "$HOME/.npm-global/bin/$cmd"
        "$HOME/.nvm/versions/node/$(node --version 2>/dev/null)/bin/$cmd"
        "/root/.npm-global/bin/$cmd"
    )
    for c in "${candidates[@]}"; do
        if [ -x "$c" ]; then
            echo "$c"
            return 0
        fi
    done
    return 1
}

# ── STEP 1: 检查并安装 pnpm ─────────────────────────────────────
log_step "STEP 1 / 检查 pnpm..."
if ! PNPM_CMD=$(find_cmd pnpm); then
    log_warn "未找到 pnpm，正在安装..."
    npm install -g pnpm
    # 刷新 PATH
    export PATH="$(npm root -g)/../bin:$PATH"
    if ! PNPM_CMD=$(find_cmd pnpm); then
        log_error "pnpm 安装失败，请手动执行: npm install -g pnpm"
    fi
fi
log_info "pnpm 路径: $PNPM_CMD (版本: $($PNPM_CMD --version))"

# ── STEP 2: 检查并安装 pm2 ──────────────────────────────────────
log_step "STEP 2 / 检查 pm2..."
if ! PM2_CMD=$(find_cmd pm2); then
    log_warn "未找到 pm2，正在安装..."
    npm install -g pm2
    # 刷新 PATH（npm -g 安装后路径可能未在当前 shell 生效）
    export PATH="$(npm root -g)/../bin:$PATH"
    # 再次尝试查找
    if ! PM2_CMD=$(find_cmd pm2); then
        # 最后尝试直接用 node 执行 pm2
        PM2_BIN="$(npm root -g)/pm2/bin/pm2"
        if [ -f "$PM2_BIN" ]; then
            PM2_CMD="node $PM2_BIN"
        else
            log_error "pm2 安装失败，请手动执行: npm install -g pm2，然后重试"
        fi
    fi
fi
log_info "pm2 路径: $PM2_CMD"

# ── STEP 3: 检查配置文件 ────────────────────────────────────────
log_step "STEP 3 / 检查配置文件..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        log_warn "已从 .env.example 复制 backend/.env，请检查数据库配置是否正确！"
    else
        log_error "未找到 backend/.env，请手动创建"
    fi
else
    log_info "backend/.env 已存在"
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "BACKEND_URL=http://localhost:8721" > "$FRONTEND_DIR/.env.local"
    log_warn "已创建 frontend/.env.local（默认指向 localhost:8721）"
    log_warn "如需使用域名，请修改: BACKEND_URL=https://api.gujia.app"
else
    log_info "frontend/.env.local 已存在"
    BACKEND_URL_VAL=$(grep "^BACKEND_URL=" "$FRONTEND_DIR/.env.local" 2>/dev/null | cut -d= -f2 || echo "未设置")
    log_info "当前 BACKEND_URL = $BACKEND_URL_VAL"
fi

# ── STEP 4: 安装后端依赖并编译 ──────────────────────────────────
log_step "STEP 4 / 安装后端依赖..."
cd "$BACKEND_DIR"
$PNPM_CMD install
log_info "后端依赖安装完成"

log_step "STEP 4b / 编译后端 (tsc)..."
$PNPM_CMD build
log_info "后端编译完成 → dist/"

# ── STEP 5: 安装前端依赖并编译 ──────────────────────────────────
log_step "STEP 5 / 安装前端依赖..."
cd "$FRONTEND_DIR"
$PNPM_CMD install
log_info "前端依赖安装完成"

log_step "STEP 5b / 编译前端 (next build)，请稍候..."
$PNPM_CMD build
log_info "前端编译完成 → .next/"

# ── STEP 6: PM2 启动/重启服务 ───────────────────────────────────
log_step "STEP 6 / 使用 PM2 启动/重启服务..."
cd "$ROOT_DIR"

# 检查 ecosystem.config.js 是否存在
if [ ! -f "$ROOT_DIR/ecosystem.config.js" ]; then
    log_error "未找到 ecosystem.config.js，请确认文件存在"
fi

# 先尝试重启，如果进程不存在则启动
if $PM2_CMD list 2>/dev/null | grep -q "gujia-backend"; then
    log_step "检测到已有 PM2 进程，执行重启..."
    $PM2_CMD restart ecosystem.config.js
else
    log_step "首次启动 PM2 进程..."
    $PM2_CMD start ecosystem.config.js
fi

# 保存 PM2 进程列表（开机自启）
$PM2_CMD save
log_info "PM2 进程已保存，开机将自动启动"

# ── STEP 7: 验证服务状态 ────────────────────────────────────────
log_step "STEP 7 / 验证服务状态..."
sleep 5

BACKEND_PORT=$(grep "^PORT=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "8721")
BACKEND_OK=$(curl -s "http://localhost:${BACKEND_PORT}/health" 2>/dev/null | grep -c "ok" || echo "0")
if [ "$BACKEND_OK" = "1" ]; then
    log_info "后端服务正常 → http://localhost:${BACKEND_PORT}"
else
    log_warn "后端服务未响应，请查看日志: $PM2_CMD logs gujia-backend"
fi

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║                    🎉 部署完成！                             ║${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║  查看服务状态:  pm2 status                                   ║${RESET}"
echo -e "${BOLD}${GREEN}║  查看后端日志:  pm2 logs gujia-backend                       ║${RESET}"
echo -e "${BOLD}${GREEN}║  查看前端日志:  pm2 logs gujia-frontend                      ║${RESET}"
echo -e "${BOLD}${GREEN}║  重启所有服务:  pm2 restart all                              ║${RESET}"
echo -e "${BOLD}${GREEN}║  停止所有服务:  pm2 stop all                                 ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
