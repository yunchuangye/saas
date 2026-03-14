#!/bin/bash
# ================================================================
# gujia.app — 一键编译 & 启动脚本
#
# 用法：
#   ./start-dev.sh                        # 开发模式（热重载，默认）
#   ./start-dev.sh --mode build           # 仅编译生产包，不启动
#   ./start-dev.sh --mode start           # 编译 + 生产模式启动
#   ./start-dev.sh --mode dev             # 开发模式（热重载）
#   ./start-dev.sh --port-fe 8720 --port-be 8721
#   ./start-dev.sh --skip-install         # 跳过 pnpm install
#   ./start-dev.sh --skip-typecheck       # 跳过 TS 类型检查
#   ./start-dev.sh --no-color             # 禁用彩色输出
#   ./start-dev.sh --help                 # 显示帮助
# ================================================================

set -euo pipefail

# ── 颜色定义 ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

# ── 默认配置 ────────────────────────────────────────────────────
FRONTEND_PORT=8720
BACKEND_PORT=8721
MODE="dev"          # dev | build | start
SKIP_INSTALL=0
SKIP_TYPECHECK=0

# ── 路径定义 ────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend_${TIMESTAMP}.log"
FRONTEND_LOG="$LOG_DIR/frontend_${TIMESTAMP}.log"
BUILD_LOG="$LOG_DIR/build_${TIMESTAMP}.log"
LATEST_BACKEND_LOG="$LOG_DIR/backend_latest.log"
LATEST_FRONTEND_LOG="$LOG_DIR/frontend_latest.log"
LATEST_BUILD_LOG="$LOG_DIR/build_latest.log"

# ── 工具函数 ────────────────────────────────────────────────────
ts()       { date '+%H:%M:%S'; }
log_info() { echo -e "${GREEN}[$(ts)] ✅  $*${RESET}"; }
log_warn() { echo -e "${YELLOW}[$(ts)] ⚠️   $*${RESET}"; }
log_err()  { echo -e "${RED}[$(ts)] ❌  $*${RESET}"; }
log_step() { echo -e "${CYAN}[$(ts)] ▶   $*${RESET}"; }
log_sec()  {
  echo ""
  echo -e "${BOLD}${BLUE}══════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${BLUE}  $*${RESET}"
  echo -e "${BOLD}${BLUE}══════════════════════════════════════════════${RESET}"
}

TIMER_START=0
timer_start() { TIMER_START=$(date +%s); }
timer_end()   {
  local e; e=$(date +%s)
  local s=$(( e - TIMER_START ))
  local m=$(( s / 60 ))
  local r=$(( s % 60 ))
  if [[ $m -gt 0 ]]; then
    echo "${m}分${r}秒"
  else
    echo "${r}秒"
  fi
}

rotate_logs() {
  local pat="$1"
  local keep=10
  local old
  old=$(ls -t "$LOG_DIR"/${pat}_*.log 2>/dev/null | tail -n +$((keep+1)) || true)
  if [[ -n "$old" ]]; then
    echo "$old" | xargs rm -f || true
  fi
}

setup_log_links() {
  ln -sf "$BACKEND_LOG"  "$LATEST_BACKEND_LOG"
  ln -sf "$FRONTEND_LOG" "$LATEST_FRONTEND_LOG"
  ln -sf "$BUILD_LOG"    "$LATEST_BUILD_LOG"
  rotate_logs "backend"
  rotate_logs "frontend"
  rotate_logs "build"
}

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    log_err "命令未找到: $1，请先安装"
    exit 1
  fi
}

show_error_summary() {
  local logfile="$1"
  local title="$2"
  echo ""
  echo -e "${RED}┌─── ${title} 错误摘要（最后30行）─────────────────────┐${RESET}"
  tail -30 "$logfile" 2>/dev/null | sed "s/^/${RED}│ ${RESET}/"
  echo -e "${RED}└────────────────────────────────────────────────────┘${RESET}"
  echo -e "  ${YELLOW}完整日志: $logfile${RESET}"
}

show_help() {
  echo ""
  echo -e "${BOLD}gujia.app 一键编译 & 启动脚本${RESET}"
  echo ""
  echo "用法: ./start-dev.sh [选项]"
  echo ""
  echo "选项:"
  echo "  --mode <模式>        运行模式: dev(默认) | build | start"
  echo "  --port-fe <端口>     前端端口（默认: 8720）"
  echo "  --port-be <端口>     后端端口（默认: 8721）"
  echo "  --skip-install       跳过 pnpm install 依赖安装"
  echo "  --skip-typecheck     跳过 TypeScript 类型检查"
  echo "  --no-color           禁用彩色输出"
  echo "  --help               显示此帮助"
  echo ""
  echo "模式说明:"
  echo "  dev    开发模式：tsx watch + next dev，代码修改自动生效（默认）"
  echo "  build  仅编译：后端 tsc + 前端 next build，不启动服务"
  echo "  start  编译后启动：完整编译后以生产模式运行"
  echo ""
  echo "日志目录: $LOG_DIR"
  echo "  build_latest.log    — 编译日志（含 TS 类型检查）"
  echo "  backend_latest.log  — 后端运行日志"
  echo "  frontend_latest.log — 前端运行日志"
  echo ""
}

# ── 解析参数 ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)           MODE="$2"; shift 2 ;;
    --port-fe)        FRONTEND_PORT="$2"; shift 2 ;;
    --port-be)        BACKEND_PORT="$2"; shift 2 ;;
    --skip-install)   SKIP_INSTALL=1; shift ;;
    --skip-typecheck) SKIP_TYPECHECK=1; shift ;;
    --no-color)
      RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; MAGENTA=""; BOLD=""; RESET=""
      shift ;;
    --help|-h) show_help; exit 0 ;;
    *)
      log_err "未知参数: $1"
      show_help
      exit 1 ;;
  esac
done

if [[ "$MODE" != "dev" && "$MODE" != "build" && "$MODE" != "start" ]]; then
  log_err "--mode 只支持 dev | build | start"
  exit 1
fi

# ── Banner ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║         gujia.app  一键编译 & 启动脚本               ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}运行模式:${RESET}  ${CYAN}$MODE${RESET}"
echo -e "  ${BOLD}前端端口:${RESET}  ${CYAN}$FRONTEND_PORT${RESET}"
echo -e "  ${BOLD}后端端口:${RESET}  ${CYAN}$BACKEND_PORT${RESET}"
echo -e "  ${BOLD}日志目录:${RESET}  ${CYAN}$LOG_DIR${RESET}"
echo -e "  ${BOLD}启动时间:${RESET}  ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${RESET}"
echo ""

# 初始化日志文件
setup_log_links
for f in "$BUILD_LOG" "$BACKEND_LOG" "$FRONTEND_LOG"; do
  {
    echo "================================================================"
    echo "  gujia.app 日志 — $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  模式: $MODE | 前端: $FRONTEND_PORT | 后端: $BACKEND_PORT"
    echo "================================================================"
    echo ""
  } >> "$f"
done

# ── STEP 1: 检查环境 ────────────────────────────────────────────
log_sec "STEP 1 / 检查运行环境"
require_cmd node
require_cmd pnpm
require_cmd mysql
require_cmd redis-cli
log_info "Node.js: $(node --version)"
log_info "pnpm:    v$(pnpm --version)"

# ── STEP 2: 同步端口配置 ────────────────────────────────────────
log_sec "STEP 2 / 同步端口配置"

if [ -f "$BACKEND_DIR/.env" ]; then
  sed -i "s/^PORT=.*/PORT=$BACKEND_PORT/" "$BACKEND_DIR/.env"
else
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  sed -i "s/^PORT=.*/PORT=$BACKEND_PORT/" "$BACKEND_DIR/.env"
fi

{
  echo "# 由 start-dev.sh 自动生成 — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:$BACKEND_PORT"
} > "$FRONTEND_DIR/.env.local"

log_info "backend/.env        → PORT=$BACKEND_PORT"
log_info "frontend/.env.local → NEXT_PUBLIC_BACKEND_URL=http://localhost:$BACKEND_PORT"

# ── STEP 3: 安装依赖 ────────────────────────────────────────────
if [[ $SKIP_INSTALL -eq 0 ]]; then
  log_sec "STEP 3 / 安装项目依赖"

  log_step "安装后端依赖 (pnpm install)..."
  timer_start
  cd "$BACKEND_DIR"
  if pnpm install >> "$BUILD_LOG" 2>&1; then
    log_info "后端依赖安装完成（耗时 $(timer_end)）"
  else
    log_err "后端依赖安装失败"
    show_error_summary "$BUILD_LOG" "后端依赖安装"
    exit 1
  fi

  log_step "安装前端依赖 (pnpm install)..."
  timer_start
  cd "$FRONTEND_DIR"
  if pnpm install >> "$BUILD_LOG" 2>&1; then
    log_info "前端依赖安装完成（耗时 $(timer_end)）"
  else
    log_err "前端依赖安装失败"
    show_error_summary "$BUILD_LOG" "前端依赖安装"
    exit 1
  fi
else
  log_sec "STEP 3 / 安装依赖（已跳过 --skip-install）"
  log_warn "跳过 pnpm install"
fi

# ── STEP 4: TypeScript 类型检查 ─────────────────────────────────
if [[ $SKIP_TYPECHECK -eq 0 ]]; then
  log_sec "STEP 4 / TypeScript 类型检查"

  log_step "检查后端类型 (tsc --noEmit)..."
  timer_start
  cd "$BACKEND_DIR"
  echo "" >> "$BUILD_LOG"
  echo "=== 后端 TypeScript 类型检查 $(date '+%H:%M:%S') ===" >> "$BUILD_LOG"
  if ./node_modules/.bin/tsc --noEmit >> "$BUILD_LOG" 2>&1; then
    log_info "后端类型检查通过（耗时 $(timer_end)）"
  else
    ERR_CNT=$(grep -c "error TS" "$BUILD_LOG" 2>/dev/null || echo "?")
    log_err "后端类型检查发现 ${ERR_CNT} 个错误"
    show_error_summary "$BUILD_LOG" "后端 TypeScript"
    echo -e "\n  ${YELLOW}提示：可用 --skip-typecheck 跳过类型检查强制启动${RESET}"
    exit 1
  fi

  log_step "检查前端类型 (tsc --noEmit)..."
  timer_start
  cd "$FRONTEND_DIR"
  echo "" >> "$BUILD_LOG"
  echo "=== 前端 TypeScript 类型检查 $(date '+%H:%M:%S') ===" >> "$BUILD_LOG"
  if ./node_modules/.bin/tsc --noEmit >> "$BUILD_LOG" 2>&1; then
    log_info "前端类型检查通过（耗时 $(timer_end)）"
  else
    ERR_CNT=$(grep -c "error TS" "$BUILD_LOG" 2>/dev/null || echo "?")
    log_err "前端类型检查发现 ${ERR_CNT} 个错误"
    show_error_summary "$BUILD_LOG" "前端 TypeScript"
    echo -e "\n  ${YELLOW}提示：可用 --skip-typecheck 跳过类型检查强制启动${RESET}"
    exit 1
  fi
else
  log_sec "STEP 4 / TypeScript 类型检查（已跳过 --skip-typecheck）"
  log_warn "跳过类型检查"
fi

# ── STEP 5: 编译生产包（build / start 模式）─────────────────────
if [[ "$MODE" == "build" || "$MODE" == "start" ]]; then
  log_sec "STEP 5 / 编译生产包"

  # 5a. 后端编译
  log_step "编译后端 (tsc → dist/)..."
  timer_start
  cd "$BACKEND_DIR"
  echo "" >> "$BUILD_LOG"
  echo "=== 后端编译 $(date '+%H:%M:%S') ===" >> "$BUILD_LOG"
  if ./node_modules/.bin/tsc \
      --outDir dist \
      --declaration false \
      --sourceMap true \
      --noEmit false \
      >> "$BUILD_LOG" 2>&1; then
    log_info "后端编译成功（耗时 $(timer_end)）→ dist/"
  else
    log_err "后端编译失败"
    show_error_summary "$BUILD_LOG" "后端编译"
    exit 1
  fi

  # 5b. 前端编译
  log_step "编译前端 (next build)，请稍候..."
  timer_start
  cd "$FRONTEND_DIR"
  echo "" >> "$BUILD_LOG"
  echo "=== 前端编译 $(date '+%H:%M:%S') ===" >> "$BUILD_LOG"

  # 实时显示关键编译进度（同时写入日志）
  if ./node_modules/.bin/next build 2>&1 | tee -a "$BUILD_LOG" | \
      grep --line-buffered -E "Compiling|Compiled|Route|Page|error|warn|Creating|Generating|✓|✗" | \
      while IFS= read -r line; do
        echo -e "  ${CYAN}│${RESET} $line"
      done; then
    log_info "前端编译成功（耗时 $(timer_end)）→ .next/"
  else
    log_err "前端编译失败"
    show_error_summary "$BUILD_LOG" "前端 next build"
    exit 1
  fi

  # 编译产物摘要
  echo ""
  echo -e "${BOLD}  编译产物摘要:${RESET}"
  if [[ -d "$FRONTEND_DIR/.next" ]]; then
    echo -e "    前端 .next/   ${GREEN}$(du -sh "$FRONTEND_DIR/.next" 2>/dev/null | cut -f1)${RESET}"
  fi
  if [[ -d "$BACKEND_DIR/dist" ]]; then
    echo -e "    后端 dist/    ${GREEN}$(du -sh "$BACKEND_DIR/dist" 2>/dev/null | cut -f1)${RESET}"
  fi
  echo -e "    编译日志      ${GREEN}$LATEST_BUILD_LOG${RESET}"

  # build 模式：编译完成后退出
  if [[ "$MODE" == "build" ]]; then
    echo ""
    echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${GREEN}║              🎉 编译完成！                           ║${RESET}"
    echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════╣${RESET}"
    echo -e "${BOLD}${GREEN}║  前端产物: frontend/.next/                           ║${RESET}"
    echo -e "${BOLD}${GREEN}║  后端产物: backend/dist/                             ║${RESET}"
    echo -e "${BOLD}${GREEN}║  编译日志: logs/build_latest.log                     ║${RESET}"
    echo -e "${BOLD}${GREEN}║                                                      ║${RESET}"
    echo -e "${BOLD}${GREEN}║  启动生产服务: ./start-dev.sh --mode start           ║${RESET}"
    echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
    echo ""
    exit 0
  fi
else
  log_sec "STEP 5 / 编译（开发模式跳过，使用热重载）"
  log_info "开发模式无需预编译，代码修改自动生效"
fi

# ── STEP 6: 启动基础服务 ────────────────────────────────────────
log_sec "STEP 6 / 启动基础服务（MySQL + Redis）"

log_step "启动 MySQL..."
sudo service mysql start >> "$BUILD_LOG" 2>&1 || true
sleep 1

log_step "启动 Redis..."
sudo service redis-server start >> "$BUILD_LOG" 2>&1 || \
  redis-server --daemonize yes >> "$BUILD_LOG" 2>&1 || true
sleep 1

MYSQL_OK=$(mysql -u gujia -pgujia123456 -e "SELECT 1" 2>/dev/null | grep -c "1" || echo "0")
REDIS_OK=$(redis-cli ping 2>/dev/null | grep -c "PONG" || echo "0")

if [[ "$MYSQL_OK" == "1" ]]; then
  log_info "MySQL  运行正常"
else
  log_err "MySQL  连接失败"
  echo -e "  ${YELLOW}手动启动: sudo service mysql start${RESET}"
fi

if [[ "$REDIS_OK" == "1" ]]; then
  log_info "Redis  运行正常"
else
  log_err "Redis  连接失败"
  echo -e "  ${YELLOW}手动启动: sudo service redis-server start${RESET}"
fi

# ── STEP 7: 清理旧进程 ──────────────────────────────────────────
log_sec "STEP 7 / 清理旧进程"

log_step "停止旧服务进程..."
pkill -f "tsx.*server/index.ts" 2>/dev/null || true
pkill -f "next dev"              2>/dev/null || true
pkill -f "next start"            2>/dev/null || true
pkill -f "next-server"           2>/dev/null || true
sleep 2

for PORT_NUM in $FRONTEND_PORT $BACKEND_PORT; do
  PIDS=$(lsof -ti tcp:"$PORT_NUM" 2>/dev/null || true)
  if [[ -n "$PIDS" ]]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    log_warn "强制释放端口 $PORT_NUM"
  fi
done
sleep 1
log_info "旧进程清理完成"

# ── STEP 8: 启动后端 ────────────────────────────────────────────
log_sec "STEP 8 / 启动后端服务（端口 $BACKEND_PORT）"

cd "$BACKEND_DIR"

if [[ "$MODE" == "start" ]]; then
  log_step "生产模式启动后端 (node dist/server/index.js)..."
  nohup node dist/server/index.js >> "$BACKEND_LOG" 2>&1 < /dev/null &
else
  log_step "开发模式启动后端 (tsx watch server/index.ts)..."
  nohup ./node_modules/.bin/tsx watch server/index.ts >> "$BACKEND_LOG" 2>&1 < /dev/null &
fi

BACKEND_PID=$!
echo $BACKEND_PID > /tmp/gujia-backend.pid
log_info "后端进程 PID: $BACKEND_PID"
log_info "后端日志:     $LATEST_BACKEND_LOG"

# 等待后端就绪（最多 20 秒）
log_step "等待后端就绪..."
HEALTH="0"
for i in $(seq 1 20); do
  sleep 1
  HEALTH=$(curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -c "ok" || echo "0")
  if [[ "$HEALTH" == "1" ]]; then
    break
  fi
  if (( i % 5 == 0 )); then
    log_step "仍在等待后端... (${i}s)"
  fi
done

if [[ "$HEALTH" == "1" ]]; then
  log_info "后端启动成功 → http://localhost:$BACKEND_PORT"
  log_info "健康检查     → http://localhost:$BACKEND_PORT/health"
else
  log_err "后端启动超时（20秒）"
  show_error_summary "$BACKEND_LOG" "后端启动"
  exit 1
fi

# ── STEP 9: 启动前端 ────────────────────────────────────────────
log_sec "STEP 9 / 启动前端服务（端口 $FRONTEND_PORT）"

cd "$FRONTEND_DIR"

if [[ "$MODE" == "start" ]]; then
  log_step "生产模式启动前端 (next start)..."
  nohup ./node_modules/.bin/next start --port "$FRONTEND_PORT" >> "$FRONTEND_LOG" 2>&1 < /dev/null &
else
  log_step "开发模式启动前端 (next dev)..."
  nohup ./node_modules/.bin/next dev --port "$FRONTEND_PORT" >> "$FRONTEND_LOG" 2>&1 < /dev/null &
fi

FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/gujia-frontend.pid
log_info "前端进程 PID: $FRONTEND_PID"
log_info "前端日志:     $LATEST_FRONTEND_LOG"

# 等待前端就绪（最多 30 秒）
log_step "等待前端就绪..."
FE_STATUS="0"
for i in $(seq 1 30); do
  sleep 1
  FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "0")
  if [[ "$FE_STATUS" == "200" ]]; then
    break
  fi
  if (( i % 5 == 0 )); then
    log_step "仍在等待前端... (${i}s)"
  fi
done

if [[ "$FE_STATUS" == "200" ]]; then
  log_info "前端启动成功 → http://localhost:$FRONTEND_PORT"
else
  log_err "前端启动超时（30秒），HTTP 状态: $FE_STATUS"
  show_error_summary "$FRONTEND_LOG" "前端启动"
  exit 1
fi

# ── STEP 10: 汇总信息 ───────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║                  🎉 启动完成！                           ║${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  运行模式:  ${CYAN}${MODE}${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  前端地址:  ${CYAN}http://localhost:${FRONTEND_PORT}${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  后端地址:  ${CYAN}http://localhost:${BACKEND_PORT}${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  健康检查:  ${CYAN}http://localhost:${BACKEND_PORT}/health${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  前端 PID:  ${CYAN}${FRONTEND_PID}${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  后端 PID:  ${CYAN}${BACKEND_PID}${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  测试账号:  admin      / admin123456"
echo -e "${BOLD}${GREEN}║${RESET}             appraiser1 / test123456"
echo -e "${BOLD}${GREEN}║${RESET}             bank1      / test123456"
echo -e "${BOLD}${GREEN}║${RESET}             investor1  / test123456"
echo -e "${BOLD}${GREEN}║${RESET}             customer1  / test123456"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  日志文件:"
echo -e "${BOLD}${GREEN}║${RESET}    编译: ${YELLOW}logs/build_latest.log${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    后端: ${YELLOW}logs/backend_latest.log${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    前端: ${YELLOW}logs/frontend_latest.log${RESET}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  常用命令:"
echo -e "${BOLD}${GREEN}║${RESET}    实时后端日志: ${CYAN}tail -f logs/backend_latest.log${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    实时前端日志: ${CYAN}tail -f logs/frontend_latest.log${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    运行测试:     ${CYAN}python3 test/run_tests.py${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    同步GitHub:   ${CYAN}./sync.sh \"feat: 功能描述\"${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}    停止服务:     ${CYAN}kill \$(cat /tmp/gujia-backend.pid) \$(cat /tmp/gujia-frontend.pid)${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
