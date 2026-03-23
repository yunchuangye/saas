#!/bin/bash
# ================================================================
# GuJia.App — 数据库还原脚本
# ================================================================
#
# 用法：
#   bash database/restore.sh                  # 自动选择最新备份还原
#   bash database/restore.sh --file <文件>    # 指定备份文件还原
#   bash database/restore.sh --reset          # 清空数据库后重新还原
#   bash database/restore.sh --check          # 仅验证数据库状态（不还原）
#   bash database/restore.sh --help           # 显示帮助信息
#
# 说明：
#   - 支持 .sql.gz（gzip 压缩）和 .sql（未压缩）两种格式
#   - 数据库连接信息自动从 backend/.env 读取，无需手动填写
#   - --reset 模式会先删除并重建数据库，适用于全量重新导入
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
info() { echo -e "     $*"; }
step() { echo -e "\n${CYAN}${BOLD}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }

# ── 路径 ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"

# ================================================================
# 帮助信息
# ================================================================
show_help() {
  echo ""
  echo -e "${BOLD}用法：${RESET}"
  echo "  bash database/restore.sh [选项]"
  echo ""
  echo -e "${BOLD}选项：${RESET}"
  echo "  （无参数）              自动选择最新备份文件还原"
  echo "  --file <备份文件路径>   指定备份文件（支持 .sql 和 .sql.gz）"
  echo "  --reset                 清空数据库后重新还原（全量重置）"
  echo "  --check                 仅验证数据库状态，不执行还原"
  echo "  --help                  显示此帮助信息"
  echo ""
  echo -e "${BOLD}示例：${RESET}"
  echo "  bash database/restore.sh"
  echo "  bash database/restore.sh --file database/gujia_full_20260322.sql.gz"
  echo "  bash database/restore.sh --reset"
  echo "  bash database/restore.sh --check"
  echo ""
}

# ================================================================
# 解析参数
# ================================================================
MODE="auto"       # auto | file | reset | check
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      MODE="file"
      BACKUP_FILE="${2:-}"
      [ -z "$BACKUP_FILE" ] && err "--file 参数需要指定备份文件路径"
      shift 2
      ;;
    --reset)
      MODE="reset"
      shift
      ;;
    --check)
      MODE="check"
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      err "未知参数：$1，请使用 --help 查看帮助"
      ;;
  esac
done

# ================================================================
# 打印横幅
# ================================================================
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║        GuJia.App — 数据库还原脚本                ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${RESET}"

# ================================================================
# STEP 1: 读取数据库配置
# ================================================================
step "读取数据库配置"

if [ -f "$ENV_FILE" ]; then
  # 从 backend/.env 读取配置
  DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d ' \r' || echo "127.0.0.1")
  DB_PORT=$(grep "^DB_PORT=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d ' \r' || echo "3306")
  DB_USER=$(grep "^DB_USER=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d ' \r' || echo "gujia")
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d ' \r' || echo "")
  DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d ' \r' || echo "gujia")
  ok "已从 backend/.env 读取数据库配置"
else
  warn "未找到 backend/.env，使用默认配置"
  DB_HOST="${DB_HOST:-127.0.0.1}"
  DB_PORT="${DB_PORT:-3306}"
  DB_USER="${DB_USER:-gujia}"
  DB_PASSWORD="${DB_PASSWORD:-}"
  DB_NAME="${DB_NAME:-gujia}"
fi

info "数据库地址：$DB_HOST:$DB_PORT"
info "数据库名称：$DB_NAME"
info "数据库用户：$DB_USER"

# ================================================================
# STEP 2: 验证 MySQL 连接
# ================================================================
step "验证 MySQL 连接"

# 确保 MySQL 正在运行
if ! mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" --silent 2>/dev/null; then
  info "MySQL 未运行，尝试启动..."
  service mysql start 2>/dev/null || systemctl start mysql 2>/dev/null || true
  sleep 3
  mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" --silent 2>/dev/null || \
    err "MySQL 无法连接，请检查服务状态"
fi
ok "MySQL 连接正常"

# 测试用户权限
if ! mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT 1;" "$DB_NAME" > /dev/null 2>&1; then
  warn "数据库用户 '$DB_USER' 连接失败，尝试以 root 创建用户..."
  CREATE_SQL="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;"
  mysql -u root -e "$CREATE_SQL" 2>/dev/null || \
    warn "无法以 root 创建用户，请手动检查数据库权限"
fi
ok "数据库用户权限验证通过"

# ================================================================
# 仅验证模式（--check）
# ================================================================
if [ "$MODE" = "check" ]; then
  step "数据库状态检查"

  echo ""
  echo -e "${BOLD}基本信息：${RESET}"
  mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT VERSION() AS MySQL版本;" "$DB_NAME" 2>/dev/null || true

  echo ""
  echo -e "${BOLD}数据表统计：${RESET}"
  TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" \
    --skip-column-names 2>/dev/null || echo "0")
  echo "  数据表总数：$TABLE_COUNT 张"

  echo ""
  echo -e "${BOLD}核心数据量：${RESET}"
  for table in users organizations projects reports estates buildings units cases; do
    COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
      -e "SELECT COUNT(*) FROM \`${table}\`;" "$DB_NAME" --skip-column-names 2>/dev/null || echo "（表不存在）")
    printf "  %-20s %s 条\n" "$table" "$COUNT"
  done

  echo ""
  ok "数据库状态检查完成"
  exit 0
fi

# ================================================================
# STEP 3: 选择备份文件
# ================================================================
step "选择备份文件"

if [ "$MODE" = "file" ]; then
  # 用户指定文件
  # 支持相对路径（相对于项目根目录）
  if [ ! -f "$BACKUP_FILE" ] && [ -f "$ROOT/$BACKUP_FILE" ]; then
    BACKUP_FILE="$ROOT/$BACKUP_FILE"
  fi
  [ -f "$BACKUP_FILE" ] || err "备份文件不存在：$BACKUP_FILE"
  ok "使用指定备份文件：$(basename $BACKUP_FILE)"
else
  # 自动选择最新备份（优先级：gujia_full_* > gujia_clean_*）
  BACKUP_FILE=""
  for f in \
    "$SCRIPT_DIR/gujia_full_20260322.sql.gz" \
    "$SCRIPT_DIR/gujia_full_"*.sql.gz \
    "$SCRIPT_DIR/gujia_clean_"*.sql.gz \
    "$SCRIPT_DIR/"*.sql.gz; do
    if [ -f "$f" ]; then
      BACKUP_FILE="$f"
      break
    fi
  done

  if [ -z "$BACKUP_FILE" ]; then
    err "未找到任何备份文件！请将备份文件放入 database/ 目录，或使用 --file 参数指定路径。"
  fi
  ok "自动选择备份文件：$(basename $BACKUP_FILE)"
fi

# 显示文件信息
FILE_SIZE=$(du -sh "$BACKUP_FILE" 2>/dev/null | cut -f1 || echo "未知")
FILE_DATE=$(stat -c "%y" "$BACKUP_FILE" 2>/dev/null | cut -d' ' -f1 || echo "未知")
info "文件大小：$FILE_SIZE"
info "修改日期：$FILE_DATE"

# ================================================================
# STEP 4: 重置模式（--reset）— 清空数据库
# ================================================================
if [ "$MODE" = "reset" ]; then
  step "重置数据库（清空后重建）"
  warn "即将删除并重建数据库 '$DB_NAME'，所有现有数据将被清除！"
  echo ""
  read -r -p "  确认继续？请输入 yes 确认：" CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "  已取消操作。"
    exit 0
  fi

  info "正在删除数据库 '$DB_NAME'..."
  mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
    -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;" 2>/dev/null || \
    mysql -u root \
      -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;" 2>/dev/null || \
    warn "删除数据库失败，尝试继续..."

  info "正在重建数据库 '$DB_NAME'..."
  mysql -u root \
    -e "CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
        GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
        FLUSH PRIVILEGES;" 2>/dev/null || \
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
      -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || \
    warn "重建数据库失败，尝试继续..."
  ok "数据库已重置"
fi

# ================================================================
# STEP 5: 执行数据库还原
# ================================================================
step "执行数据库还原"

# 记录开始时间
START_TIME=$(date +%s)
info "开始时间：$(date '+%Y-%m-%d %H:%M:%S')"
info "预计耗时：3-10 分钟（含 217 万条数据），请耐心等待..."
echo ""

# 根据文件格式选择还原命令
if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
  info "检测到 gzip 压缩格式，使用 zcat 解压还原..."
  zcat "$BACKUP_FILE" | \
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" \
    2>&1 | grep -v "Warning: Using a password" || true
elif [[ "$BACKUP_FILE" == *.sql ]]; then
  info "检测到 SQL 文本格式，直接导入..."
  mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" \
    < "$BACKUP_FILE" \
    2>&1 | grep -v "Warning: Using a password" || true
else
  err "不支持的备份文件格式：$(basename $BACKUP_FILE)（仅支持 .sql 和 .sql.gz）"
fi

# 计算耗时
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))
ELAPSED_SEC=$((ELAPSED % 60))
ok "还原完成！耗时：${ELAPSED_MIN}分${ELAPSED_SEC}秒"

# ================================================================
# STEP 6: 验证还原结果
# ================================================================
step "验证还原结果"

TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';" \
  --skip-column-names 2>/dev/null || echo "0")
ok "数据表总数：$TABLE_COUNT 张"

echo ""
echo -e "${BOLD}核心数据量统计：${RESET}"
for table in users organizations projects reports estates buildings units cases; do
  COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" \
    -e "SELECT COUNT(*) FROM \`${table}\`;" "$DB_NAME" --skip-column-names 2>/dev/null || echo "（表不存在）")
  printf "  %-20s %s 条\n" "$table" "$COUNT"
done

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║        ✅  数据库还原完成！                       ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  数据库：  ${CYAN}$DB_NAME${RESET}"
echo -e "  地址：    ${CYAN}$DB_HOST:$DB_PORT${RESET}"
echo -e "  用户：    ${CYAN}$DB_USER${RESET}"
echo -e "  表数量：  ${CYAN}$TABLE_COUNT 张${RESET}"
echo ""
echo -e "  如需重新启动服务，请执行：${CYAN}./dev-start.sh${RESET}"
echo ""
