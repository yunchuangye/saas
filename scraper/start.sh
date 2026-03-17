#!/bin/bash
# 通用网页采集软件 - 启动脚本

echo "========================================"
echo "  通用网页采集软件 v1.0"
echo "  基于 Scrapling + Playwright + Flask"
echo "========================================"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误：未找到 Python3，请先安装"
    exit 1
fi

# 安装依赖
echo "检查依赖..."
pip3 install -r requirements.txt -q

# 安装 Playwright 浏览器
echo "检查 Playwright 浏览器..."
playwright install chromium --quiet 2>/dev/null || true

# 启动服务
echo ""
echo "启动服务..."
echo "访问地址：http://localhost:9000"
echo "按 Ctrl+C 停止"
echo ""
python3 app.py
