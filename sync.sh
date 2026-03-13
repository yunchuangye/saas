#!/bin/bash
# ============================================================
# gujia.app — 代码同步到 GitHub 脚本
# 用法：./sync.sh "提交说明"
# ============================================================

set -e

COMMIT_MSG="${1:-"chore: update code $(date '+%Y-%m-%d %H:%M:%S')"}"

echo "🔄 开始同步代码到 GitHub..."
echo "📝 提交信息：$COMMIT_MSG"
echo ""

cd "$(dirname "$0")"

# 拉取最新代码（避免冲突）
echo "⬇️  拉取远程最新代码..."
git pull origin main --rebase 2>&1 || {
  echo "⚠️  拉取失败，请手动解决冲突后重试"
  exit 1
}

# 添加所有变更
echo "📦 添加变更文件..."
git add -A

# 检查是否有变更
if git diff --cached --quiet; then
  echo "✅ 没有需要提交的变更"
  exit 0
fi

# 显示变更文件
echo "📋 变更文件列表："
git diff --cached --name-status
echo ""

# 提交
echo "💾 提交变更..."
git commit -m "$COMMIT_MSG"

# 推送到 GitHub
echo "⬆️  推送到 GitHub..."
git push origin main

echo ""
echo "✅ 同步完成！代码已推送到 GitHub"
echo "🔗 https://github.com/yunchuangye/saas"
