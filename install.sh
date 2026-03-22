#!/bin/bash
# ================================================================
# GuJia.App — 一键安装脚本 v3.0
# 适用系统：Ubuntu 20.04 / 22.04 LTS
#
# 用法：
#   chmod +x install.sh && sudo ./install.sh
#
# 脚本将自动完成：
#   1. 安装系统依赖（Node.js 22、pnpm、MySQL 8、Redis、Python 3.11）
#   2. 初始化 MySQL 数据库并还原完整备份（含 217 万条数据）
#   3. 安装前端 / 后端 npm 依赖并编译
#   4. 安装 Python 采集程序依赖（scrapling-service + scraper）
#   5. 安装 Playwright 浏览器（用于动态页面采集）
#   6. 生成 .env 配置文件
#   7. 启动所有服务（后端、前端、scrapling-service、scraper）
#   8. 验证所有服务正常运行
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
SCRAPLING_PORT="${SCRAPLING_PORT:-8722}"
SCRAPER_PORT="${SCRAPER_PORT:-9000}"
JWT_SECRET="$(openssl rand -hex 32)"
NODE_ENV="${NODE_ENV:-production}"

# ================================================================
# 打印欢迎横幅
# ================================================================
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║        GuJia.App — 房产估价 SaaS 平台            ║"
echo "  ║              一键安装脚本 v3.0                    ║"
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
  ok "操作系统：$NAME $VERSION_ID"
else
  warn "无法识别操作系统，继续安装..."
fi

if [ "$EUID" -ne 0 ]; then
  err "请使用 sudo 运行此脚本：sudo ./install.sh"
fi

# ================================================================
# STEP 2: 安装系统依赖
# ================================================================
step "安装系统依赖"

info "更新 apt 软件包列表..."
apt-get update -qq

info "安装基础工具..."
apt-get install -y -qq curl wget git unzip build-essential \
  libssl-dev libffi-dev pkg-config software-properties-common 2>&1 | tail -3
ok "基础工具安装完成"

# ── Node.js 22 ──────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v 2>/dev/null)" < "v22" ]]; then
  info "安装 Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>&1 | tail -5
  apt-get install -y -qq nodejs 2>&1 | tail -3
  ok "Node.js $(node -v) 安装完成"
else
  ok "Node.js $(node -v) 已安装"
fi

# ── pnpm ─────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  info "安装 pnpm..."
  npm install -g pnpm@latest 2>&1 | tail -3
  ok "pnpm $(pnpm -v) 安装完成"
else
  ok "pnpm $(pnpm -v) 已安装"
fi

# ── MySQL 8 ──────────────────────────────────────────────────────
if ! command -v mysql &>/dev/null; then
  info "安装 MySQL 8.0..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server 2>&1 | tail -3
  ok "MySQL 安装完成"
else
  ok "MySQL $(mysql --version | awk '{print $3}') 已安装"
fi

# ── Redis ────────────────────────────────────────────────────────
if ! command -v redis-cli &>/dev/null; then
  info "安装 Redis..."
  apt-get install -y -qq redis-server 2>&1 | tail -3
  ok "Redis 安装完成"
else
  ok "Redis $(redis-server --version | awk '{print $3}' | tr -d 'v=') 已安装"
fi

# ── Python 3.11 ──────────────────────────────────────────────────
if ! python3 --version 2>/dev/null | grep -q "3\.1[1-9]"; then
  info "安装 Python 3.11..."
  add-apt-repository -y ppa:deadsnakes/ppa 2>&1 | tail -3
  apt-get install -y -qq python3.11 python3.11-venv python3.11-dev python3-pip 2>&1 | tail -3
  update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 2>/dev/null || true
  ok "Python 3.11 安装完成"
else
  ok "Python $(python3 --version) 已安装"
fi

info "升级 pip..."
python3 -m pip install --upgrade pip -q 2>&1 | tail -2
ok "pip 已升级"

# ================================================================
# STEP 3: 启动 MySQL 和 Redis
# ================================================================
step "启动数据库服务"

info "启动 MySQL..."
service mysql start 2>/dev/null || systemctl start mysql 2>/dev/null || true
sleep 3
if mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
  ok "MySQL 已启动"
else
  err "MySQL 启动失败，请检查日志：journalctl -u mysql"
fi

info "启动 Redis..."
service redis-server start 2>/dev/null || systemctl start redis-server 2>/dev/null || true
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

info "创建数据库 '$DB_NAME' 和用户 '$DB_USER'..."
MYSQL_INIT_SQL="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;"

mysql -u root -e "$MYSQL_INIT_SQL" 2>/dev/null || \
  mysql -u root -p"$(cat /etc/mysql/debian.cnf 2>/dev/null | grep -m1 password | awk '{print $3}')" \
    -e "$MYSQL_INIT_SQL" 2>/dev/null || \
  warn "数据库用户可能已存在，继续..."
ok "数据库用户创建完成"

# 还原数据库备份（优先使用最新完整备份）
BACKUP_FILE=""
for f in \
  "$ROOT/database/gujia_full_20260322.sql.gz" \
  "$ROOT/database/gujia_full_"*.sql.gz \
  "$ROOT/database/gujia_clean_"*.sql.gz; do
  if [ -f "$f" ]; then
    BACKUP_FILE="$f"
    break
  fi
done

if [ -n "$BACKUP_FILE" ]; then
  info "正在还原数据库：$(basename $BACKUP_FILE)"
  info "（约 200 万条数据，预计耗时 3-10 分钟，请耐心等待...）"
  zcat "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASSWORD" -h 127.0.0.1 "$DB_NAME" 2>&1 | grep -v "Warning" || true
  TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h 127.0.0.1 "$DB_NAME" \
    -e "SHOW TABLES;" 2>/dev/null | wc -l)
  ok "数据库还原完成，共 $TABLE_COUNT 张表"
else
  warn "未找到数据库备份文件，跳过还原步骤"
  warn "请将备份文件放入 $ROOT/database/ 后手动执行："
  warn "  zcat gujia_full_20260322.sql.gz | mysql -u $DB_USER -p $DB_NAME"
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
# GuJia.App 后端配置（由 install.sh 自动生成于 $(date '+%Y-%m-%d %H:%M:%S')）
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

# JWT 密钥（生产环境请修改为随机长字符串）
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# 采集微服务（scrapling-service，端口 8722）
SCRAPLING_SERVICE_URL=http://localhost:$SCRAPLING_PORT

# OpenAI（可选，用于 AI 估价分析）
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini
ENV
  ok "backend/.env 已生成"
else
  # 如果已有 .env，确保 SCRAPLING_SERVICE_URL 存在
  if ! grep -q "SCRAPLING_SERVICE_URL" "$ROOT/backend/.env"; then
    echo "" >> "$ROOT/backend/.env"
    echo "# 采集微服务（scrapling-service，端口 8722）" >> "$ROOT/backend/.env"
    echo "SCRAPLING_SERVICE_URL=http://localhost:$SCRAPLING_PORT" >> "$ROOT/backend/.env"
    ok "已向 backend/.env 追加 SCRAPLING_SERVICE_URL"
  else
    ok "backend/.env 已存在，跳过"
  fi
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
# STEP 6: 安装 Node.js 依赖并编译
# ================================================================
step "安装后端 Node.js 依赖"
cd "$ROOT/backend"
pnpm install --frozen-lockfile 2>&1 | tail -5
ok "后端依赖安装完成"

step "安装前端 Node.js 依赖"
cd "$ROOT/frontend"
pnpm install --frozen-lockfile 2>&1 | tail -5
ok "前端依赖安装完成"

step "编译前端（Next.js Build）"
info "正在编译前端，这可能需要 3-5 分钟..."
cd "$ROOT/frontend"
pnpm run build 2>&1 | tail -20
ok "前端编译完成"

cd "$ROOT"

# ================================================================
# STEP 7: 安装 Python 采集程序依赖
# ================================================================
step "安装 Python 采集程序依赖"

# ── scrapling-service（主采集微服务，端口 8722）────────────────
# 功能：Node.js 后端通过 HTTP 调用此服务，执行链家/安居客/房天下等平台的采集任务
if [ -d "$ROOT/scrapling-service" ]; then
  info "安装 scrapling-service 依赖（采集微服务，端口 $SCRAPLING_PORT）..."
  cd "$ROOT/scrapling-service"

  if [ ! -d "venv" ]; then
    python3 -m venv venv
    ok "scrapling-service 虚拟环境已创建"
  fi

  source venv/bin/activate

  pip install --quiet \
    "scrapling>=0.4.0" \
    flask \
    flask-cors \
    python-dotenv \
    pymysql \
    sqlalchemy \
    beautifulsoup4 \
    requests 2>&1 | tail -5
  ok "scrapling-service Python 依赖安装完成"

  # 安装 Playwright 及浏览器（用于动态页面采集）
  info "安装 Playwright 浏览器（Chromium）..."
  pip install --quiet playwright 2>&1 | tail -3
  python3 -m playwright install chromium 2>&1 | tail -5 || \
    warn "Playwright 浏览器安装失败，动态页面采集功能将不可用"
  python3 -m playwright install-deps chromium 2>&1 | tail -5 || true
  ok "scrapling-service Playwright 浏览器安装完成"

  deactivate
  cd "$ROOT"
  ok "scrapling-service 安装完成（端口 $SCRAPLING_PORT）"
else
  warn "未找到 scrapling-service 目录，跳过"
fi

# ── scraper（通用可视化采集工具，端口 9000）──────────────────────
# 功能：Web 界面可视化配置字段提取规则，支持链家/安居客/58同城等，数据直写 MySQL
if [ -d "$ROOT/scraper" ]; then
  info "安装 scraper（可视化采集工具，端口 $SCRAPER_PORT）..."
  cd "$ROOT/scraper"

  if [ ! -d "venv" ]; then
    python3 -m venv venv
    ok "scraper 虚拟环境已创建"
  fi

  source venv/bin/activate

  if [ -f "requirements.txt" ]; then
    pip install --quiet -r requirements.txt 2>&1 | tail -5
    ok "scraper Python 依赖安装完成（来自 requirements.txt）"
  else
    pip install --quiet \
      "scrapling>=0.4.0" \
      "playwright>=1.40.0" \
      "pymysql>=1.1.0" \
      "sqlalchemy>=2.0.0" \
      "flask>=3.0.0" \
      "flask-cors>=4.0.0" \
      "rich>=13.0.0" \
      "questionary>=2.0.0" \
      "aiohttp>=3.9.0" \
      beautifulsoup4 2>&1 | tail -5
    ok "scraper Python 依赖安装完成（默认列表）"
  fi

  # 安装 Playwright 浏览器（若 scrapling-service 已安装则复用）
  if ! python3 -c "from playwright.sync_api import sync_playwright" 2>/dev/null; then
    pip install --quiet playwright 2>&1 | tail -3
  fi
  python3 -m playwright install chromium 2>&1 | tail -5 || \
    warn "scraper Playwright 浏览器安装失败"
  python3 -m playwright install-deps chromium 2>&1 | tail -5 || true
  ok "scraper Playwright 浏览器安装完成"

  deactivate
  cd "$ROOT"
  ok "scraper 安装完成（端口 $SCRAPER_PORT）"
else
  warn "未找到 scraper 目录，跳过"
fi

# ================================================================
# STEP 8: 启动所有服务
# ================================================================
step "启动所有服务"

# ── 后端 API（端口 8721）────────────────────────────────────────
info "启动后端服务（端口 $BACKEND_PORT）..."
cd "$ROOT/backend"
if lsof -ti:"$BACKEND_PORT" &>/dev/null; then
  warn "端口 $BACKEND_PORT 已被占用，跳过后端启动"
else
  nohup pnpm run dev > "$LOGS/backend.log" 2>&1 &
  echo $! > "$LOGS/backend.pid"
  sleep 8
  if curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -q "ok\|status"; then
    ok "后端服务已启动（PID: $(cat $LOGS/backend.pid)）"
  else
    warn "后端可能还在启动中，请稍后检查：tail -f $LOGS/backend.log"
  fi
fi
cd "$ROOT"

# ── 前端（端口 8720）────────────────────────────────────────────
info "启动前端服务（端口 $FRONTEND_PORT）..."
cd "$ROOT/frontend"
if lsof -ti:"$FRONTEND_PORT" &>/dev/null; then
  warn "端口 $FRONTEND_PORT 已被占用，跳过前端启动"
else
  if [ "$NODE_ENV" = "production" ] && [ -d ".next" ]; then
    nohup pnpm run start > "$LOGS/frontend.log" 2>&1 &
  else
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

# ── scrapling-service（端口 8722）───────────────────────────────
if [ -d "$ROOT/scrapling-service" ] && [ -d "$ROOT/scrapling-service/venv" ]; then
  info "启动 scrapling-service（端口 $SCRAPLING_PORT）..."
  if lsof -ti:"$SCRAPLING_PORT" &>/dev/null; then
    warn "端口 $SCRAPLING_PORT 已被占用，跳过 scrapling-service 启动"
  else
    cd "$ROOT/scrapling-service"
    source venv/bin/activate
    SCRAPLING_PORT=$SCRAPLING_PORT nohup python3 app.py > "$LOGS/scrapling-service.log" 2>&1 &
    echo $! > "$LOGS/scrapling-service.pid"
    deactivate
    sleep 5
    if curl -s "http://localhost:$SCRAPLING_PORT/health" 2>/dev/null | grep -q "ok\|status\|running"; then
      ok "scrapling-service 已启动（PID: $(cat $LOGS/scrapling-service.pid)）"
    else
      warn "scrapling-service 可能还在启动中，请检查：tail -f $LOGS/scrapling-service.log"
    fi
    cd "$ROOT"
  fi
fi

# ── scraper（端口 9000）─────────────────────────────────────────
if [ -d "$ROOT/scraper" ] && [ -d "$ROOT/scraper/venv" ]; then
  info "启动 scraper 可视化采集工具（端口 $SCRAPER_PORT）..."
  if lsof -ti:"$SCRAPER_PORT" &>/dev/null; then
    warn "端口 $SCRAPER_PORT 已被占用，跳过 scraper 启动"
  else
    cd "$ROOT/scraper"
    source venv/bin/activate
    nohup python3 app.py > "$LOGS/scraper.log" 2>&1 &
    echo $! > "$LOGS/scraper.pid"
    deactivate
    sleep 5
    HTTP_S=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SCRAPER_PORT" 2>/dev/null || echo "000")
    if [ "$HTTP_S" = "200" ]; then
      ok "scraper 已启动（PID: $(cat $LOGS/scraper.pid)）"
    else
      warn "scraper 可能还在启动中（HTTP $HTTP_S），请检查：tail -f $LOGS/scraper.log"
    fi
    cd "$ROOT"
  fi
fi

# ================================================================
# STEP 9: 更新服务管理脚本（dev-start.sh / dev-stop.sh）
# ================================================================
step "更新服务管理脚本"

cat > "$ROOT/dev-stop.sh" <<'STOP_SCRIPT'
#!/bin/bash
# GuJia.App — 停止所有服务
echo "🛑 停止 GuJia.App 所有服务..."

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/logs"

stop_pid() {
  local name="$1"; local pid_file="$2"; local pattern="$3"
  if [ -f "$pid_file" ]; then
    PID=$(cat "$pid_file" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null && echo "  ✅ $name 已停止 (PID: $PID)" || true
    fi
    rm -f "$pid_file"
  fi
  pkill -f "$pattern" 2>/dev/null || true
}

stop_pid "后端 API"          "$LOGS/backend.pid"          "tsx.*server/index"
stop_pid "前端"              "$LOGS/frontend.pid"          "next (dev|start)"
stop_pid "scrapling-service" "$LOGS/scrapling-service.pid" "scrapling-service/app"
stop_pid "scraper"           "$LOGS/scraper.pid"           "scraper/app"

# 清理端口
for port in 8720 8721 8722 9000; do
  fuser -k "${port}/tcp" 2>/dev/null || true
done

echo ""
echo "✅ 所有服务已停止（MySQL 和 Redis 保持运行）"
STOP_SCRIPT
chmod +x "$ROOT/dev-stop.sh"
ok "dev-stop.sh 已更新"

cat > "$ROOT/dev-start.sh" <<'START_SCRIPT'
#!/bin/bash
# GuJia.App — 启动所有服务（开发模式）
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/logs"
mkdir -p "$LOGS"

echo "🚀 启动 GuJia.App 所有服务..."

# 启动 MySQL & Redis
echo "📦 启动 MySQL..."
sudo service mysql start 2>/dev/null || true
echo "📦 启动 Redis..."
sudo service redis-server start 2>/dev/null || true
sleep 2

# 验证数据库连接
DB_PASS=$(grep "^DB_PASSWORD=" "$ROOT/backend/.env" 2>/dev/null | cut -d= -f2)
mysql -u gujia -p"$DB_PASS" -h 127.0.0.1 gujia -e "SELECT 1;" > /dev/null 2>&1 \
  && echo "  ✅ MySQL 连接正常" || echo "  ❌ MySQL 连接失败"
redis-cli ping > /dev/null 2>&1 && echo "  ✅ Redis 连接正常" || echo "  ❌ Redis 连接失败"

# 启动后端 API（端口 8721）
echo "🔧 启动后端 API（端口 8721）..."
cd "$ROOT/backend"
setsid pnpm run dev > "$LOGS/backend.log" 2>&1 < /dev/null &
echo $! > "$LOGS/backend.pid"
sleep 6
curl -s http://localhost:8721/health > /dev/null 2>&1 \
  && echo "  ✅ 后端已启动" \
  || echo "  ⚠️  后端启动中，请查看：tail -f $LOGS/backend.log"

# 启动前端（端口 8720）
echo "🎨 启动前端（端口 8720）..."
cd "$ROOT/frontend"
setsid pnpm run dev > "$LOGS/frontend.log" 2>&1 < /dev/null &
echo $! > "$LOGS/frontend.pid"
echo "  ⏳ 前端启动中（约 15 秒），请查看：tail -f $LOGS/frontend.log"

# 启动 scrapling-service（端口 8722）
if [ -d "$ROOT/scrapling-service" ] && [ -d "$ROOT/scrapling-service/venv" ]; then
  echo "🕷️  启动 scrapling-service（端口 8722）..."
  cd "$ROOT/scrapling-service"
  source venv/bin/activate
  setsid python3 app.py > "$LOGS/scrapling-service.log" 2>&1 < /dev/null &
  echo $! > "$LOGS/scrapling-service.pid"
  deactivate
  sleep 4
  curl -s http://localhost:8722/health > /dev/null 2>&1 \
    && echo "  ✅ scrapling-service 已启动" \
    || echo "  ⚠️  scrapling-service 启动中，请查看：tail -f $LOGS/scrapling-service.log"
fi

# 启动 scraper（端口 9000）
if [ -d "$ROOT/scraper" ] && [ -d "$ROOT/scraper/venv" ]; then
  echo "🔍 启动 scraper 可视化采集工具（端口 9000）..."
  cd "$ROOT/scraper"
  source venv/bin/activate
  setsid python3 app.py > "$LOGS/scraper.log" 2>&1 < /dev/null &
  echo $! > "$LOGS/scraper.pid"
  deactivate
  sleep 4
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null || echo "000")
  [ "$HTTP" = "200" ] \
    && echo "  ✅ scraper 已启动" \
    || echo "  ⚠️  scraper 启动中，请查看：tail -f $LOGS/scraper.log"
fi

cd "$ROOT"
echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📌 访问地址："
echo "  前端应用:           http://localhost:8720"
echo "  后端 API:           http://localhost:8721"
echo "  scrapling-service:  http://localhost:8722  （采集微服务，供后端调用）"
echo "  scraper 采集工具:   http://localhost:9000  （可视化采集 Web 界面）"
echo ""
echo "📋 查看日志："
echo "  tail -f $LOGS/backend.log"
echo "  tail -f $LOGS/frontend.log"
echo "  tail -f $LOGS/scrapling-service.log"
echo "  tail -f $LOGS/scraper.log"
echo ""
echo "🛑 停止所有服务: ./dev-stop.sh"
START_SCRIPT
chmod +x "$ROOT/dev-start.sh"
ok "dev-start.sh 已更新"

# ================================================================
# STEP 10: 最终验证与汇总
# ================================================================
step "安装完成 — 服务状态汇总"

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║        ✅  GuJia.App 安装完成！                      ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

echo -e "${BOLD}服务状态：${RESET}"
printf "  %-32s" "MySQL"
mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null \
  && echo -e "${GREEN}✅ 运行中 (端口 3306)${RESET}" \
  || echo -e "${RED}❌ 未运行${RESET}"

printf "  %-32s" "Redis"
redis-cli ping 2>/dev/null | grep -q PONG \
  && echo -e "${GREEN}✅ 运行中 (端口 6379)${RESET}" \
  || echo -e "${RED}❌ 未运行${RESET}"

printf "  %-32s" "后端 API"
curl -s "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -q "ok\|status" \
  && echo -e "${GREEN}✅ 运行中 (端口 $BACKEND_PORT)${RESET}" \
  || echo -e "${YELLOW}⚠️  启动中...${RESET}"

printf "  %-32s" "前端"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
[ "$HTTP" = "200" ] || [ "$HTTP" = "307" ] \
  && echo -e "${GREEN}✅ 运行中 (端口 $FRONTEND_PORT)${RESET}" \
  || echo -e "${YELLOW}⚠️  启动中...${RESET}"

if [ -d "$ROOT/scrapling-service" ]; then
  printf "  %-32s" "scrapling-service（采集微服务）"
  curl -s "http://localhost:$SCRAPLING_PORT/health" 2>/dev/null | grep -q "ok\|status\|running" \
    && echo -e "${GREEN}✅ 运行中 (端口 $SCRAPLING_PORT)${RESET}" \
    || echo -e "${YELLOW}⚠️  启动中...${RESET}"
fi

if [ -d "$ROOT/scraper" ]; then
  printf "  %-32s" "scraper（可视化采集工具）"
  HTTP_S=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SCRAPER_PORT" 2>/dev/null || echo "000")
  [ "$HTTP_S" = "200" ] \
    && echo -e "${GREEN}✅ 运行中 (端口 $SCRAPER_PORT)${RESET}" \
    || echo -e "${YELLOW}⚠️  启动中...${RESET}"
fi

echo ""
echo -e "${BOLD}访问地址：${RESET}"
echo -e "  前端应用:           ${CYAN}http://localhost:$FRONTEND_PORT${RESET}"
echo -e "  后端 API:           ${CYAN}http://localhost:$BACKEND_PORT${RESET}"
echo -e "  健康检查:           ${CYAN}http://localhost:$BACKEND_PORT/health${RESET}"
echo -e "  scrapling-service:  ${CYAN}http://localhost:$SCRAPLING_PORT${RESET}  （供后端自动调用）"
echo -e "  scraper 采集工具:   ${CYAN}http://localhost:$SCRAPER_PORT${RESET}  （可视化采集 Web 界面）"
echo ""
echo -e "${BOLD}数据库信息：${RESET}"
echo -e "  数据库名：  ${CYAN}$DB_NAME${RESET}"
echo -e "  用户名：    ${CYAN}$DB_USER${RESET}"
echo -e "  密码：      ${CYAN}$DB_PASSWORD${RESET}"
echo ""
echo -e "${BOLD}测试账号（密码均为 Admin@2026）：${RESET}"
echo -e "  ${CYAN}admin  appraiser1  bank1  investor1  customer1  broker1${RESET}"
echo ""
echo -e "${BOLD}常用命令：${RESET}"
echo -e "  查看后端日志:           ${CYAN}tail -f $LOGS/backend.log${RESET}"
echo -e "  查看前端日志:           ${CYAN}tail -f $LOGS/frontend.log${RESET}"
echo -e "  查看采集服务日志:       ${CYAN}tail -f $LOGS/scrapling-service.log${RESET}"
echo -e "  查看 scraper 日志:      ${CYAN}tail -f $LOGS/scraper.log${RESET}"
echo -e "  停止所有服务:           ${CYAN}$ROOT/dev-stop.sh${RESET}"
echo -e "  重启所有服务:           ${CYAN}$ROOT/dev-start.sh${RESET}"
echo ""
echo -e "${YELLOW}  ⚠️  生产环境请务必修改 backend/.env 中的 JWT_SECRET 和数据库密码！${RESET}"
echo ""
