# GuJia.App — 房地产估价 SaaS 平台

> 专业的房地产估价 B2B SaaS 平台，支持评估公司、银行机构、投资机构、个人客户和运营管理五种角色，内置 AI 估价分析与海量数据采集引擎。

## 🌟 核心特性

- **多角色权限体系**：5 种角色独立仪表盘，评估公司/银行/投资机构可开设组织并管理成员。
- **项目与订单管理**：评估需求发布、智能竞价系统、项目分配、全流程状态追踪。
- **在线报告与数字印章**：报告在线创建、编辑、三级审核、归档，支持 LLM 智能审核与数字印章管理。
- **AI 智能估价**：基于案例比较法 + GPT-4o 辅助分析，输出精准估价区间与置信度。
- **OpenClaw 采集引擎**：内置房产数据爬取任务管理，实时同步全网真实案例（已包含 217 万条深圳房产数据）。
- **SaaS 订阅与工作台**：完善的租户隔离、套餐订阅、用量统计及财务对账功能。

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5
- **UI 组件**: shadcn/ui + Tailwind CSS 4
- **状态管理 & 数据获取**: React Query + tRPC Client
- **图表与可视化**: Recharts

### 后端 (Backend)
- **框架**: Node.js 22 + Express 4 + tRPC 11
- **语言**: TypeScript 5
- **数据库**: MySQL 8.0 (Drizzle ORM)
- **缓存**: Redis 6.0 (ioredis)
- **AI 引擎**: 兼容 OpenAI API (GPT-4o)

### 采集微服务 (Crawler)
- **核心**: Python 3.11 + Scrapling + Playwright
- **调度**: 基于 Redis 的分布式任务队列与 Cron 定时调度

## 🚀 快速部署

本项目提供了一键部署脚本，支持在 Ubuntu 20.04 / 22.04 LTS 环境下快速完成所有服务的安装与启动。

### 1. 准备环境
确保您的服务器满足以下最低配置：
- 操作系统：Ubuntu 20.04 / 22.04 LTS
- 内存：>= 4GB（推荐 8GB，因为包含 200万+ 数据库记录）
- 磁盘：>= 40GB

### 2. 执行一键安装脚本
获取源码后，在项目根目录执行：

```bash
chmod +x install.sh
sudo ./install.sh
```

该脚本将自动完成：
1. 安装系统依赖（Node.js 22、pnpm、MySQL 8、Redis、Python 3.11）
2. 初始化 MySQL 数据库并还原完整备份（包含 217 万条数据）
3. 安装前端 / 后端 npm 依赖
4. 编译前端（Next.js build）和后端
5. 安装 Python 采集程序依赖
6. 生成配置文件（`.env`）并启动所有服务

### 3. 访问服务
安装完成后，您可以通过以下地址访问服务：
- **前端地址**: `http://<您的服务器IP>:8720`
- **后端 API**: `http://<您的服务器IP>:8721`

### 4. 测试账号
系统内置了以下测试账号（密码均为 `Admin@2026`）：
- 系统管理员：`admin`
- 评估师：`appraiser1`
- 银行客户：`bank1`
- 投资机构：`investor1`
- 个人客户：`customer1`
- 渠道经纪人：`broker1`

## 📂 目录结构

```text
saas/
├── frontend/             # Next.js 16 前端应用
├── backend/              # Express + tRPC 后端服务
├── database/             # 数据库初始化脚本与备份文件
├── scraper/              # Python 爬虫脚本（58同城等）
├── scrapling-service/    # Python 采集微服务
├── install.sh            # 生产环境一键安装脚本
├── dev-start.sh          # 开发环境一键启动脚本
└── dev-stop.sh           # 开发环境一键停止脚本
```

## ⚙️ 手动开发环境配置

如果您希望进行本地开发，请参考以下步骤：

1. 启动 MySQL 和 Redis 服务。
2. 复制 `.env.example` 文件并配置环境变量：
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. 使用一键启动脚本启动开发服务器：
   ```bash
   ./dev-start.sh
   ```
4. 停止开发服务器：
   ```bash
   ./dev-stop.sh
   ```

## 📝 数据库结构

系统包含 51 张数据表，涵盖了 SaaS 平台的核心业务流：
- **用户与权限**: `users`, `organizations`, `org_members`, `roles`, `permissions`
- **业务核心**: `projects`, `bids`, `reports`, `work_sheets`, `seals`
- **房产数据**: `cities`, `districts`, `estates`, `buildings`, `units`, `cases`
- **SaaS 运营**: `subscriptions`, `plans`, `orders`, `invoices`
- **采集引擎**: `openclaw_configs`, `openclaw_tasks`, `crawler_logs`

---
*© 2026 GuJia.App Team. All rights reserved.*
