# gujia.app — 房地产估价平台 SaaS 系统

> 专业的房地产估价 B2B SaaS 平台，支持评估公司、银行机构、投资机构、个人客户和运营管理五种角色。

## 项目结构

```
saas/
├── frontend/   # Next.js 前端（TypeScript + Tailwind CSS + shadcn/ui）
└── backend/    # Express + tRPC 后端（MySQL + Redis + S3）
```

## 技术栈

### Frontend (`/frontend`)
- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **图表**: Recharts
- **表单**: React Hook Form + Zod

### Backend (`/backend`)
- **框架**: Express 4 + tRPC 11
- **语言**: TypeScript 5
- **数据库**: MySQL（Drizzle ORM）+ Redis（ioredis）
- **文件存储**: S3（AWS SDK）
- **AI**: LLM 智能分析（报告审核、估价分析、市场预测）
- **认证**: Manus OAuth + JWT

## 核心功能

| 模块 | 功能 |
| :--- | :--- |
| **多角色权限** | 5 种角色独立仪表盘，评估公司/银行/投资机构可开设组织 |
| **项目管理** | 评估需求发布、竞价系统、项目分配、状态追踪 |
| **报告管理** | 报告创建/编辑/审核/归档，LLM 智能审核 |
| **自动估价** | 案例比较法 + LLM 辅助，输出估价区间与置信度 |
| **OpenClaw** | 房产数据爬取任务管理，数据同步到案例库 |
| **数据目录** | 城市/楼盘/楼栋/房屋/案例 CRUD，AI 案例清洗 |
| **文件存储** | S3 存储报告 PDF、勘察照片、产权文件 |
| **Redis 缓存** | 仪表盘统计、城市数据、估价结果缓存加速 |

## 快速开始

### Backend
```bash
cd backend
pnpm install
# 配置环境变量（DATABASE_URL, REDIS_URL 等）
pnpm dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 数据库表（共 19 张）

`users` · `organizations` · `org_members` · `projects` · `bids` · `reports` · `report_files` · `notifications` · `messages` · `cities` · `estates` · `buildings` · `units` · `cases` · `auto_valuations` · `openclaw_configs` · `openclaw_tasks` · `operation_logs`

## API 路由

后端通过 tRPC 提供类型安全的 API，主要路由模块：

`auth` · `org` · `projects` · `bids` · `reports` · `notifications` · `messages` · `directory` · `valuation` · `openclaw` · `dashboard`

---

*由 Manus AI 生成 · 2026-03-13*
