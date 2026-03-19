#!/bin/bash
# ============================================================
# gujia.app 代码同步到 GitHub 脚本
# 用法: ./sync-to-github.sh "提交信息"
#       ./sync-to-github.sh        (自动生成提交信息)
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 获取提交信息
COMMIT_MSG="${1:-}"
if [ -z "$COMMIT_MSG" ]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MSG="chore: 代码更新 $TIMESTAMP"
fi

echo "🔄 同步代码到 GitHub..."
echo "📝 提交信息: $COMMIT_MSG"
echo ""

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  没有需要提交的变更"
    exit 0
fi

# 显示变更文件
echo "📋 变更文件列表："
git status --short
echo ""

# 添加所有变更（排除 .gitignore 中的文件）
git add -A

# 提交
git commit -m "$COMMIT_MSG"

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 代码已成功同步到 GitHub！"
echo "🔗 仓库地址: https://github.com/yunchuangye/saas"
