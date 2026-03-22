#!/bin/bash
# ================================================================
# GuJia.App — 一键安装脚本
# 适用系统：Ubuntu 20.04 / 22.04 LTS
#
# 用法：
#   chmod +x install.sh && sudo ./install.sh
#
# 脚本将自动完成：
#   1. 安装系统依赖（Node.js 22、pnpm、MySQL 8、Redis、Python 3.11）
#   2. 初始化 MySQL 数据库并还原完整备份
#   3. 安装前端 / 后端 npm 依赖
#   4. 编译前端（Next.js build）
#   5. 编译后端（TypeScript → tsc）
#   6. 安装 Python 采集程序依赖（scrapling-service + scraper）
#   7. 生成 .env 配置文件
#   8. 启动所有服务并验证
# ================================================================
set -euo pipefail

# ── 颜色输出 ────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✅  $*${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠️   $*${RESET}"; }
err()  { echo -e "${RED}  ❌  $*${RESET}"; exit 1; }
step() { echo -e "\n${CYAN}${BOLD}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }
info() { echo -e "     ${BOLD}$*${RESET}"; }

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/logs"
mkdir -p "$LOGS"

# ── 配置变量（可在安装前修改） ──────────────────────────────────
DB_NAME="${DB_NAME:-gujia}"
DB_USER="${DB_USER:-gujia}"
DB_PASSWORD="${DB_PASSWORD:-gujia_$(openssl rand -hex 8)}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"
FRONTEND_PORT="${FRONTEND_PORT:-8720}"
BACKEND_PORT="${BACKEND_PORT:-8721}"
JWT_SECRET="$(openssl rand -hex 32)"
NODE_ENV="${NODE_ENV:-production}"

# ================================================================
# 打印欢迎横幅
# ================================================================
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║        GuJia.App — 房产估价 SaaS 平台            ║"
echo "  ║              一键安装脚本 v2.0                    ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo "  安装目录：$ROOT"
echo "  日志目录：$LOGS"
echo ""

# ================================================================
# STEP 1: 检查操作系统
# ================================================================
step "检查操作系统"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_NAME="$NAME"
  OS_VERSION="$VERSION_ID"
  ok "操作系统：$OS_NAME $OS_VERSION"
else
  warn "无法识别操作系统，继续安装..."
fi

# 检查是否以 root 或 sudo 运行
if [ "$EUID" -ne 0 ]; then
  err "请使用 sudo 运行此脚本：sudo ./install.sh"
fi

# ================================================================
# STEP 2: 安装系统依赖
# ================================================================
step "安装系统依赖"

info "更新 apt 软件包列表..."
apt-get update -qq

# 安装基础工具
info "安装基础工具..."
apt-get install -y -qq curl wget git unzip build-essential python3-pip python3-venv \
  libssl-dev libffi-dev pkg-config 2>&1 | tail -3
ok "基础工具安装完成"

# ── 安装 Node.js 22 ──────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" < "v22" ]]; then
  info "安装 Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>&1 | tail -5
  apt-get install -y -qq nodejs 2>&1 | tail -3
  ok "Node.js $(node -v) 安装完成"
else
  ok "Node.js $(node -v) 已安装"
fi

# ── 安装 pnpm ────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  info "安装 pnpm..."
  npm install -g pnpm@latest 2>&1 | tail -3
  ok "pnpm $(pnpm -v) 安装完成"
else
  ok "pnpm $(pnpm -v) 已安装"
fi

# ── 安装 MySQL 8 ─────────────────────────────────────────────────
if ! command -v mysql &>/dev/null; then
  info "安装 MySQL 8.0..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server 2>&1 | tail -3
  ok "MySQL 安装完成"
else
  ok "MySQL $(mysql --version | awk '{print $3}') 已安装"
fi

# ── 安装 Redis ───────────────────────────────────────────────────
if ! command -v redis-cli &>/dev/null; then
  info "安装 Redis..."
  apt-get install -y -qq redis-server 2>&1 | tail -3
  ok "Redis 安装完成"
else
  ok "Redis $(redis-server --version | awk '{print $3}' | tr -d 'v=') 已安装"
fi

# ── 安装 Python 3.11 ─────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  info "安装 Python 3.11..."
  add-apt-repository -y ppa:deadsnakes/ppa 2>&1 | tail -3
  apt-get install -y -qq python3.11 python3.11-venv python3.11-dev 2>&1 | tail -3
  ok "Python 3.11 安装完成"
else
  ok "Python $(python3 --version) 已安装"
fi

# ================================================================
# STEP 3: 启动 MySQL 和 Redis
# ================================================================
step "启动数据库服务"

info "启动 MySQL..."
service mysql start || true
sleep 3
if mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
  ok "MySQL 已启动"
else
  err "MySQL 启动失败，请检查日志：journalctl -u mysql"
fi

info "启动 Redis..."
service redis-server start || true
sleep 1
if redis-cli ping 2>/dev/null | grep -q PONG; then
  ok "Redis 已启动"
else
  err "Redis 启动失败"
fi

# ================================================================
# STEP 4: 初始化 MySQL 数据库
# ================================================================
step "初始化 MySQL 数据库"

# 创建数据库和用户
info "创建数据库 '$DB_NAME' 和用户 '$DB_USER'..."
MYSQL_INIT_SQL="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;"

mysql -u root -e "$MYSQL_INIT_SQL" 2>/dev/null || \
  mysql -u root -p"$(cat /etc/mysql/debian.cnf 2>/dev/null | grep -m1 password | awk '{print $3}')" -e "$MYSQL_INIT_SQL" 2>/dev/null || \
  warn "数据库用户可能已存在，继续..."
ok "数据库用户创建完成"

# 还原数据库备份
BACKUP_FILE=""
# 优先使用最新的完整备份
if ls "$ROOT/database/gujia_full_"*.sql.gz 2>/dev/null | head -1 | grep -q .; then
  BACKUP_FILE=$(ls -t "$ROOT/database/gujia_full_"*.sql.gz | head -1)
  info "发现完整备份：$(basename $BACKUP_FILE)"
elif [ -f "$ROOT/database/gujia_clean_20260315.sql.gz" ]; then
  BACKUP_FILE="$ROOT/database/gujia_clean_20260315.sql.gz"
  info "使用原始备份：$(basename $BACKUP_FILE)"
fi

if [ -n "$BACKUP_FILE" ]; then
  info "正在还原数据库（约 200 万条数据，需要 3-10 分钟）..."
  zcat "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASSWORD" -h 127.0.0.1 "$DB_NAME" 2>&1 | grep -v "Warning" || true
  ok "数据库还原完成"

  # 验证
  TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h 127.0.0.1 "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)
  ok "数据库包含 $TABLE_COUNT 张表"
else
  warn "未找到数据库备份文件，跳过还原步骤"
  warn "请手动导入数据库：mysql -u $DB_USER -p $DB_NAME < your_backup.sql"
fi

# ================================================================
# STEP 5: 生成配置文件
# ================================================================
step "生成配置文件"

# 后端 .env
if [ ! -f "$ROOT/backend/.env" ]; then
  info "生成 backend/.env..."
  cat > "$ROOT/backend/.env" <<ENV
# ============================================================
# GuJia.App 后端配置（由 install.sh 自动生成）
# ============================================================
NODE_ENV=$NODE_ENV
PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT

# 前端访问地址（CORS 白名单）
FRONTEND_URL=http://localhost:$FRONTEND_PORT

# 后端公网地址
BACKEND_PUBLIC_URL=http://localhost:$BACKEND_PORT

# MySQL 数据库
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Redis
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT

# JWT 密钥（生产环境请修改）
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# OpenAI（可选，用于 AI 估价分析）
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini
ENV
  ok "backend/.env 已生成"
else
  ok "backend/.env 已存在，跳过"
fi

# 前端 .env.local
if [ ! -f "$ROOT/frontend/.env.local" ]; then
  info "生成 frontend/.env.local..."
  cat > "$ROOT/frontend/.env.local" <<ENV
# ============================================================
# GuJia.App 前端配置（由 install.sh 自动生成）
# ============================================================
NEXT_PUBLIC_BACKEND_URL=http://localhost:$BACKEND_PORT
ENV
  ok "frontend/.env.local 已生成"
else
  ok "frontend/.env.local 已存在，跳过"
fi

# ================================================================
# STEP 6: 安装 Node.js 依赖
# ================================================================
step "安装 Node.js 依赖"

info "安装后端依赖..."
cd "$ROOT/backend" && pnpm install --frozen-lockfile 2>&1 | tail -5
ok "后端依赖安装完成"

info "安装前端依赖..."
cd "$ROOT/frontend" && pnpm install --frozen-lockfile 2>&1 | tail -5
ok "前端依赖安装完成"

cd "$ROOT"

# ================================================================
# STEP 7: 编译前端（Next.js）
# ================================================================
step "编译前端（Next.js Build）"
info "正在编译前端，这可能需要 3-5 分钟..."
cd "$ROOT/frontend"
pnpm run build 2>&1 | tail -20
ok "前端编译完成"
cd "$ROOT"

# ================================================================
# STEP 8: 编译后端（TypeScript）
# ================================================================
step "编译后端（TypeScript → JavaScript）"
info "正在编译后端 TypeScript..."
cd "$ROOT/backend"
# 检查是否有 build 脚本
if pnpm run build --if-present 2>&1 | grep -q "error TS"; then
  warn "后端编译有 TypeScript 错误，将使用 tsx 运行时模式（开发模式）"
else
  ok "后端编译完成"
fi
cd "$ROOT"

# ================================================================
# STEP 9: 安装 Python 采集程序依赖
# ================================================================
step "安装 Python 采集程序依赖"

# scrapling-service（主采集微服务）
if [ -d "$ROOT/scrapling-service" ]; then
  info "安装 scrapling-service 依赖..."
  cd "$ROOT/scrapling-service"
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install --quiet scrapling flask flask-cors python-dotenv pymysql sqlalchemy 2>&1 | tail -5
  # 安装 Playwright 浏览器（用于动态页面采集）
  if python3 -c "import playwright" 2>/dev/null; then
    python3 -m playwright install chromium 2>&1 | tail -3 || warn "Playwright 浏览器安装失败，动态采集功能将不可用"
  fi
  deactivate
  ok "scrapling-service 依赖安装完成"
  cd "$ROOT"
fi

# scraper（58 同城采集器）
if [ -d "$ROOT/scraper" ] && [ -f "$ROOT/scraper/requirements.txt" ]; then
  info "安装 scraper（58同城采集器）依赖..."
  cd "$ROOT/scraper"
  if [ ! -d "venv" ]; then
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install --quiet -r requirements.txt 2>&1 | tail -5
  # 安装 Playwright 浏览器
  python3 -m playwright install chromium 2>&1 | tail -3 || warn "Playwright 浏览器安装失败"
  deactivate
  ok "scraper 依赖安装完成"
  cd "$ROOT"
fi

# ================================================================
# STEP 10: 启动所有服务
# ================================================================
step "启动所有服务"

# 启动后端
info "启动后端服务（端口 $BACKEND_PORT）..."
cd "$ROOT/backend"
if lsof -ti:"$BACKEND_PORT" &>/dev/null; then
  warn "端口 $BACKEND_PORT 已被占用，跳过后端启动"
else
  nohup pnpm run dev > "$LOGS/backend.log" 2>&1 &
  echo $! > "$LOGS/backend.pid"
  sleep 8
  if curl -s "http://localhost:$BACKEND_PORT/health" | grep -q "ok\|status"; then
    ok "后端服务已启动（PID: $(cat $LOGS/backend.pid)）"
  else
    warn "后端可能还在启动中，请稍后检查：tail -f $LOGS/backend.log"
  fi
fi
cd "$ROOT"

# 启动前端
info "启动前端服务（端口 $FRONTEND_PORT）..."
cd "$ROOT/frontend"
if lsof -ti:"$FRONTEND_PORT" &>/dev/null; then
  warn "端口 $FRONTEND_PORT 已被占用，跳过前端启动"
else
  if [ "$NODE_ENV" = "production" ] && [ -d ".next" ]; then
    # 生产模式：使用 next start
    nohup pnpm run start > "$LOGS/frontend.log" 2>&1 &
  else
    # 开发模式：使用 next dev
    nohup pnpm run dev > "$LOGS/frontend.log" 2>&1 &
  fi
  echo $! > "$LOGS/frontend.pid"
  sleep 15
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
    ok "前端服务已启动（PID: $(cat $LOGS/frontend.pid)）"
  else
    warn "前端可能还在启动中（HTTP $HTTP_CODE），请稍后检查：tail -f $LOGS/frontend.log"
  fi
fi
cd "$ROOT"

# ================================================================
# STEP 11: 最终验证
# ================================================================
step "安装验证"

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║         ✅  GuJia.App 安装完成！                 ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""

# 服务状态
echo -e "${BOLD}服务状态：${RESET}"
printf "  %-20s" "MySQL"
mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null && echo -e "${GREEN}✅ 运行中${RESET}" || echo -e "${RED}❌ 未运行${RESET}"

printf "  %-20s" "Redis"
redis-cli ping 2>/dev/null | grep -q PONG && echo -e "${GREEN}✅ 运行中${RESET}" || echo -e "${RED}❌ 未运行${RESET}"

printf "  %-20s" "后端 API"
curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -q "ok\|status" && echo -e "${GREEN}✅ 运行中 (端口 $BACKEND_PORT)${RESET}" || echo -e "${YELLOW}⚠️  启动中...${RESET}"

printf "  %-20s" "前端"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
[ "$HTTP" = "200" ] || [ "$HTTP" = "307" ] && echo -e "${GREEN}✅ 运行中 (端口 $FRONTEND_PORT)${RESET}" || echo -e "${YELLOW}⚠️  启动中...${RESET}"

echo ""
echo -e "${BOLD}访问地址：${RESET}"
echo -e "  前端：     ${CYAN}http://localhost:$FRONTEND_PORT${RESET}"
echo -e "  后端 API：  ${CYAN}http://localhost:$BACKEND_PORT${RESET}"
echo -e "  健康检查：  ${CYAN}http://localhost:$BACKEND_PORT/health${RESET}"
echo ""
echo -e "${BOLD}数据库信息：${RESET}"
echo -e "  数据库名：  ${CYAN}$DB_NAME${RESET}"
echo -e "  用户名：    ${CYAN}$DB_USER${RESET}"
echo -e "  密码：      ${CYAN}$DB_PASSWORD${RESET}"
echo ""
echo -e "${BOLD}配置文件：${RESET}"
echo -e "  后端：     ${CYAN}$ROOT/backend/.env${RESET}"
echo -e "  前端：     ${CYAN}$ROOT/frontend/.env.local${RESET}"
echo ""
echo -e "${BOLD}常用命令：${RESET}"
echo -e "  查看后端日志：  ${CYAN}tail -f $LOGS/backend.log${RESET}"
echo -e "  查看前端日志：  ${CYAN}tail -f $LOGS/frontend.log${RESET}"
echo -e "  停止所有服务：  ${CYAN}$ROOT/dev-stop.sh${RESET}"
echo -e "  重启所有服务：  ${CYAN}$ROOT/dev-start.sh${RESET}"
echo ""
echo -e "${YELLOW}  ⚠️  生产环境请务必修改 backend/.env 中的 JWT_SECRET 和数据库密码！${RESET}"
echo ""
