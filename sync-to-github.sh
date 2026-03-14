#!/bin/bash
# ================================================================
# sync-to-github.sh — 一键同步代码到 GitHub
# 用法：
#   ./sync-to-github.sh                    # 自动生成提交信息
#   ./sync-to-github.sh "你的提交信息"     # 自定义提交信息
# ================================================================

set -e

REPO_DIR="/home/ubuntu/saas"
cd "$REPO_DIR"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${GREEN}[$(date '+%H:%M:%S')] 开始同步代码到 GitHub...${RESET}"

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] 没有需要提交的变更${RESET}"
    exit 0
fi

# 显示变更文件
echo -e "${YELLOW}[$(date '+%H:%M:%S')] 变更文件列表：${RESET}"
git status --short

# 添加所有变更
git add -A

# 生成提交信息
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
else
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    CHANGED_FILES=$(git diff --cached --name-only | head -5 | tr '\n' ', ' | sed 's/,$//')
    COMMIT_MSG="feat: 更新代码 - ${TIMESTAMP} [${CHANGED_FILES}]"
fi

# 提交
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}[$(date '+%H:%M:%S')] 已提交: $COMMIT_MSG${RESET}"

# 推送到 GitHub
echo -e "${YELLOW}[$(date '+%H:%M:%S')] 推送到 GitHub...${RESET}"
git push origin main
echo -e "${GREEN}[$(date '+%H:%M:%S')] 同步完成！${RESET}"
echo -e "${GREEN}[$(date '+%H:%M:%S')] GitHub 仓库: https://github.com/yunchuangye/saas${RESET}"
