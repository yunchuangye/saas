#!/bin/bash
# ================================================================
# GuJia.App — 统一管理脚本
# 用法：
#   ./setup.sh init          # 首次初始化：安装依赖、配置数据库、启动服务
#   ./setup.sh start         # 启动所有服务（MySQL、Redis、后端、前端）
#   ./setup.sh stop          # 停止所有服务
#   ./setup.sh restart       # 重启所有服务
#   ./setup.sh status        # 查看服务运行状态
#   ./setup.sh sync [msg]    # 同步代码到 GitHub（可选提交说明）
#   ./setup.sh logs [svc]    # 查看日志（svc: backend|frontend，默认 backend）
#   ./setup.sh db            # 进入 MySQL 交互终端
#   ./setup.sh help          # 显示帮助信息
# ================================================================

set -e

# ── 颜色输出 ────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✅  $*${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠️   $*${RESET}"; }
err()  { echo -e "${RED}  ❌  $*${RESET}"; }
step() { echo -e "${CYAN}${BOLD}▶ $*${RESET}"; }
info() { echo -e "     $*"; }

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/logs"
mkdir -p "$LOGS"

# ── 加载 .env ───────────────────────────────────────────────────
load_env() {
  if [ -f "$ROOT/.env" ]; then
    set -a; source "$ROOT/.env"; set +a
  fi
  # 默认值
  DB_HOST="${DB_HOST:-127.0.0.1}"
  DB_PORT="${DB_PORT:-3306}"
  DB_USER="${DB_USER:-gujia}"
  DB_PASSWORD="${DB_PASSWORD:-gujia_dev_2026}"
  DB_NAME="${DB_NAME:-gujia}"
  REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
  REDIS_PORT="${REDIS_PORT:-6379}"
  FRONTEND_PORT="${FRONTEND_PORT:-8720}"
  BACKEND_PORT="${BACKEND_PORT:-8721}"
}

# ── 启动 MySQL ──────────────────────────────────────────────────
start_mysql() {
  if sudo service mysql status &>/dev/null; then
    ok "MySQL 已在运行"
  else
    step "启动 MySQL..."
    sudo service mysql start
    sleep 2
    ok "MySQL 已启动"
  fi
}

# ── 启动 Redis ──────────────────────────────────────────────────
start_redis() {
  if redis-cli ping &>/dev/null; then
    ok "Redis 已在运行"
  else
    step "启动 Redis..."
    sudo service redis-server start
    sleep 1
    ok "Redis 已启动"
  fi
}

# ── 启动后端 ────────────────────────────────────────────────────
start_backend() {
  if lsof -ti:"$BACKEND_PORT" &>/dev/null; then
    ok "后端已在运行（端口 $BACKEND_PORT）"
    return
  fi
  step "启动后端服务（端口 $BACKEND_PORT）..."
  cd "$ROOT/backend"
  PORT="$BACKEND_PORT" nohup pnpm exec tsx server/index.ts \
    > "$LOGS/backend.log" 2>&1 &
  echo $! > "$LOGS/backend.pid"
  sleep 6
  if curl -sf "http://localhost:$BACKEND_PORT/health" &>/dev/null; then
    ok "后端启动成功"
  else
    err "后端启动失败，请查看日志：./setup.sh logs backend"
    exit 1
  fi
  cd "$ROOT"
}

# ── 启动前端 ────────────────────────────────────────────────────
start_frontend() {
  if lsof -ti:"$FRONTEND_PORT" &>/dev/null; then
    ok "前端已在运行（端口 $FRONTEND_PORT）"
    return
  fi
  step "启动前端服务（端口 $FRONTEND_PORT）..."
  cd "$ROOT/frontend"
  PORT="$FRONTEND_PORT" nohup pnpm exec next dev -p "$FRONTEND_PORT" \
    > "$LOGS/frontend.log" 2>&1 &
  echo $! > "$LOGS/frontend.pid"
  ok "前端已在后台启动，首次编译约需 30 秒"
  cd "$ROOT"
}

# ── 停止服务 ────────────────────────────────────────────────────
stop_service() {
  local name="$1" port="$2" pidfile="$LOGS/${1}.pid"
  if [ -f "$pidfile" ]; then
    local pid; pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null && ok "已停止 $name（PID $pid）"
    fi
    rm -f "$pidfile"
  fi
  # 兜底：按端口杀进程
  local pids; pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    ok "已释放端口 $port（$name）"
  fi
}

# ================================================================
# 命令：init — 首次初始化
# ================================================================
cmd_init() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║     GuJia.App 环境初始化             ║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}"
  echo ""

  load_env

  # 1. 检查 Node.js / pnpm
  step "检查运行时环境..."
  node -v &>/dev/null && ok "Node.js $(node -v)" || { err "未找到 Node.js，请先安装"; exit 1; }
  pnpm -v &>/dev/null && ok "pnpm $(pnpm -v)"   || { err "未找到 pnpm，请先安装"; exit 1; }

  # 2. 安装依赖
  step "安装后端依赖..."
  cd "$ROOT/backend" && pnpm install --frozen-lockfile 2>&1 | tail -3
  ok "后端依赖安装完成"

  step "安装前端依赖..."
  cd "$ROOT/frontend" && pnpm install --frozen-lockfile 2>&1 | tail -3
  ok "前端依赖安装完成"
  cd "$ROOT"

  # 3. 生成 .env 文件（如不存在）
  step "检查环境变量配置..."
  if [ ! -f "$ROOT/backend/.env" ]; then
    if [ -f "$ROOT/backend/.env.example" ]; then
      cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
      warn "已从 .env.example 生成 backend/.env，请按需修改"
    fi
  else
    ok "backend/.env 已存在"
  fi
  if [ ! -f "$ROOT/frontend/.env.local" ]; then
    if [ -f "$ROOT/frontend/.env.example" ]; then
      cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env.local"
      warn "已从 .env.example 生成 frontend/.env.local，请按需修改"
    fi
  else
    ok "frontend/.env.local 已存在"
  fi

  # 4. 启动服务
  start_mysql
  start_redis
  start_backend
  start_frontend

  echo ""
  ok "初始化完成！"
  info "前端地址：http://localhost:$FRONTEND_PORT"
  info "后端地址：http://localhost:$BACKEND_PORT"
  info "日志目录：$LOGS/"
  echo ""
}

# ================================================================
# 命令：start — 启动所有服务
# ================================================================
cmd_start() {
  echo ""
  step "启动 GuJia.App 所有服务..."
  load_env
  start_mysql
  start_redis
  start_backend
  start_frontend
  echo ""
  ok "所有服务已启动"
  info "前端：http://localhost:$FRONTEND_PORT"
  info "后端：http://localhost:$BACKEND_PORT"
  echo ""
}

# ================================================================
# 命令：stop — 停止所有服务
# ================================================================
cmd_stop() {
  echo ""
  load_env
  step "停止 GuJia.App 所有服务..."
  stop_service "backend"  "$BACKEND_PORT"
  stop_service "frontend" "$FRONTEND_PORT"
  echo ""
  ok "所有服务已停止（MySQL 和 Redis 保持运行）"
  echo ""
}

# ================================================================
# 命令：restart — 重启所有服务
# ================================================================
cmd_restart() {
  cmd_stop
  sleep 2
  cmd_start
}

# ================================================================
# 命令：status — 查看服务状态
# ================================================================
cmd_status() {
  load_env
  echo ""
  echo -e "${BOLD}  GuJia.App 服务状态${RESET}"
  echo "  ─────────────────────────────────────"

  # MySQL
  if sudo service mysql status &>/dev/null; then
    ok "MySQL        运行中（端口 3306）"
  else
    err "MySQL        未运行"
  fi

  # Redis
  if redis-cli ping &>/dev/null; then
    ok "Redis        运行中（端口 6379）"
  else
    err "Redis        未运行"
  fi

  # 后端
  if curl -sf "http://localhost:$BACKEND_PORT/health" &>/dev/null; then
    ok "后端 API     运行中（端口 $BACKEND_PORT）"
  else
    err "后端 API     未运行（端口 $BACKEND_PORT）"
  fi

  # 前端
  local fe_code; fe_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
  if [ "$fe_code" != "000" ]; then
    ok "前端 UI      运行中（端口 $FRONTEND_PORT，HTTP $fe_code）"
  else
    err "前端 UI      未运行（端口 $FRONTEND_PORT）"
  fi

  echo ""
}

# ================================================================
# 命令：sync — 同步代码到 GitHub
# ================================================================
cmd_sync() {
  local msg="${1:-"chore: update $(date '+%Y-%m-%d %H:%M:%S')"}"
  cd "$ROOT"

  step "同步代码到 GitHub..."

  if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
    warn "没有需要提交的变更"
    exit 0
  fi

  echo ""
  info "变更文件："
  git status --short
  echo ""

  git add -A
  git commit -m "$msg"
  git push origin main

  echo ""
  ok "代码已同步到 GitHub"
  info "提交信息：$msg"
  info "仓库地址：$(git remote get-url origin)"
  echo ""
}

# ================================================================
# 命令：logs — 查看日志
# ================================================================
cmd_logs() {
  local svc="${1:-backend}"
  local logfile="$LOGS/${svc}.log"
  if [ ! -f "$logfile" ]; then
    err "日志文件不存在：$logfile"
    exit 1
  fi
  step "实时查看 $svc 日志（Ctrl+C 退出）..."
  tail -f "$logfile"
}

# ================================================================
# 命令：db — 进入 MySQL 终端
# ================================================================
cmd_db() {
  load_env
  step "连接 MySQL 数据库（$DB_NAME）..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
}

# ================================================================
# 命令：help — 显示帮助
# ================================================================
cmd_help() {
  echo ""
  echo -e "${BOLD}GuJia.App 统一管理脚本${RESET}"
  echo ""
  echo "用法：./setup.sh <命令> [参数]"
  echo ""
  echo -e "${BOLD}命令列表：${RESET}"
  printf "  %-18s %s\n" "init"          "首次初始化：安装依赖、配置环境、启动服务"
  printf "  %-18s %s\n" "start"         "启动所有服务（MySQL、Redis、后端、前端）"
  printf "  %-18s %s\n" "stop"          "停止后端和前端服务"
  printf "  %-18s %s\n" "restart"       "重启所有服务"
  printf "  %-18s %s\n" "status"        "查看各服务运行状态"
  printf "  %-18s %s\n" "sync [msg]"    "提交并推送代码到 GitHub"
  printf "  %-18s %s\n" "logs [svc]"    "实时查看日志（svc: backend|frontend）"
  printf "  %-18s %s\n" "db"            "进入 MySQL 交互终端"
  printf "  %-18s %s\n" "help"          "显示此帮助信息"
  echo ""
  echo -e "${BOLD}示例：${RESET}"
  echo "  ./setup.sh init"
  echo "  ./setup.sh start"
  echo "  ./setup.sh sync \"feat: 新增楼盘搜索功能\""
  echo "  ./setup.sh logs frontend"
  echo ""
}

# ================================================================
# 入口
# ================================================================
case "${1:-help}" in
  init)    cmd_init ;;
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  sync)    cmd_sync "${2:-}" ;;
  logs)    cmd_logs "${2:-backend}" ;;
  db)      cmd_db ;;
  help|*)  cmd_help ;;
esac
