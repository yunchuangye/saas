#!/bin/bash
# ============================================================
# GuJia.App 自动化部署脚本 (本地编译 -> 打包 -> 上传 -> 部署)
# 
# 适用场景：服务器内存较小（如 1.9GB），无法在服务器上直接执行 pnpm build
# 包含服务：前端 (Next.js)、后端 (Express)、采集服务 (Flask/FastAPI)
# ============================================================

set -e

# --- 配置区域 ---
SERVER_USER="root"
SERVER_IP="156.227.237.225"
SERVER_DIR="/www/wwwroot/gujia.app"
SSH_PORT="22"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 开始执行 GuJia.App 自动化部署流程...${NC}\n"

# 1. 本地编译前端
echo -e "${YELLOW}📦 [1/6] 正在本地编译前端 (Next.js)...${NC}"
cd frontend
pnpm install
pnpm build
cd ..
echo -e "${GREEN}✅ 前端编译完成！${NC}\n"

# 2. 本地编译后端
echo -e "${YELLOW}📦 [2/6] 正在本地编译后端 (Express)...${NC}"
cd backend
pnpm install
pnpm build
cd ..
echo -e "${GREEN}✅ 后端编译完成！${NC}\n"

# 3. 打包构建产物
echo -e "${YELLOW}🗜️  [3/6] 正在打包所有服务文件...${NC}"
TAR_FILE="gujia-deploy-$(date +%Y%m%d%H%M%S).tar.gz"

# 排除不需要上传的文件（如 node_modules, .git, 本地日志等）
tar -czvf $TAR_FILE \
  --exclude="frontend/node_modules" \
  --exclude="backend/node_modules" \
  --exclude="scraper/node_modules" \
  --exclude="scraper/venv" \
  --exclude="scrapling-service/venv" \
  --exclude="valuation-service/venv" \
  --exclude="database" \
  --exclude=".git" \
  --exclude="logs/*.log" \
  --exclude="backend/uploads/*" \
  frontend/.next \
  frontend/public \
  frontend/package.json \
  frontend/pnpm-lock.yaml \
  frontend/next.config.mjs \
  frontend/proxy.ts \
  backend/dist \
  backend/package.json \
  backend/pnpm-lock.yaml \
  backend/drizzle.config.ts \
  scraper \
  scrapling-service \
  valuation-service \
  ecosystem.config.js \
  package.json \
  pnpm-workspace.yaml \
  > /dev/null

echo -e "${GREEN}✅ 打包完成：$TAR_FILE${NC}\n"

# 4. 上传至服务器
echo -e "${YELLOW}📤 [4/6] 正在上传打包文件至服务器 ($SERVER_IP)...${NC}"
scp -P $SSH_PORT $TAR_FILE $SERVER_USER@$SERVER_IP:$SERVER_DIR/
echo -e "${GREEN}✅ 上传完成！${NC}\n"

# 5. 服务器端部署与重启
echo -e "${YELLOW}⚙️  [5/6] 正在服务器上解压并重启服务...${NC}"
ssh -p $SSH_PORT $SERVER_USER@$SERVER_IP << EOF
  set -e
  cd $SERVER_DIR
  
  echo "解压文件..."
  tar -xzvf $TAR_FILE > /dev/null
  
  echo "安装前端生产依赖..."
  cd frontend
  pnpm install --prod
  cd ..
  
  echo "安装后端生产依赖..."
  cd backend
  pnpm install --prod
  cd ..
  
  echo "安装 Python 采集服务依赖..."
  if command -v pip3 &> /dev/null; then
    pip3 install -r scrapling-service/requirements.txt -q || true
    pip3 install -r scraper/requirements.txt -q || true
    pip3 install -r valuation-service/requirements.txt -q || true
  fi
  
  echo "重启 PM2 服务..."
  # 确保 ecosystem.config.js 中配置了所有服务（前端、后端、Python服务）
  pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
  pm2 save
  
  echo "清理上传的压缩包..."
  rm -f $TAR_FILE
EOF
echo -e "${GREEN}✅ 服务器部署与重启完成！${NC}\n"

# 6. 清理 Nginx 缓存
echo -e "${YELLOW}🧹 [6/6] 正在清理 Nginx 代理缓存...${NC}"
ssh -p $SSH_PORT $SERVER_USER@$SERVER_IP << EOF
  rm -rf /www/server/nginx/proxy_cache_dir/*
  nginx -s reload
EOF
echo -e "${GREEN}✅ Nginx 缓存清理完成！${NC}\n"

# 清理本地打包文件
rm -f $TAR_FILE

echo -e "${CYAN}🎉 部署流程全部执行完毕！${NC}"
echo -e "请访问 https://gujia.app 检查服务状态。"
