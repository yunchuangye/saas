import {
  Building2,
  Landmark,
  Users,
  Settings,
  FileText,
  ClipboardCheck,
  BarChart3,
  FolderOpen,
  Send,
  Award,
  UserCheck,
  Briefcase,
  Home,
  TrendingUp,
  Bell,
  MessageSquare,
  Calendar,
  MapPin,
  Building,
  Layers,
  DoorOpen,
  Bot,
  Calculator,
  Database,
  Megaphone,
  Sparkles,
  GitCompare,
  ShieldAlert,
  Newspaper,
  BellRing,
  Stamp,
  BookOpen,
  ListChecks,
  AlertTriangle,
  CreditCard,
  Key,
  Globe,
  Image,
  Users2,
  Download,
  Palette,
  BellDot,
  Wallet,
  ArrowRightLeft,
  Share2,
  Link2,
  type LucideIcon,
} from "lucide-react"

export type UserRole = "appraiser" | "bank" | "investor" | "customer" | "admin" | "broker"

export interface RoleConfig {
  id: UserRole
  name: string
  description: string
  icon: LucideIcon
  color: string
  dashboardPath: string
}

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  children?: NavItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const roles: RoleConfig[] = [
  {
    id: "appraiser",
    name: "评估公司",
    description: "项目管理、报告编制、质量审核",
    icon: Building2,
    color: "bg-chart-1",
    dashboardPath: "/dashboard/appraiser",
  },
  {
    id: "bank",
    name: "银行机构",
    description: "需求发起、竞价管理、项目跟踪",
    icon: Landmark,
    color: "bg-chart-2",
    dashboardPath: "/dashboard/bank",
  },
  {
    id: "investor",
    name: "投资机构",
    description: "资产评估、投资分析、项目管理",
    icon: TrendingUp,
    color: "bg-chart-5",
    dashboardPath: "/dashboard/investor",
  },
  {
    id: "customer",
    name: "个人客户",
    description: "评估申请、进度查询、报告下载",
    icon: Users,
    color: "bg-chart-3",
    dashboardPath: "/dashboard/customer",
  },
  {
    id: "admin",
    name: "运营管理",
    description: "系统配置、用户管理、数据分析",
    icon: Settings,
    color: "bg-chart-4",
    dashboardPath: "/dashboard/admin",
  },
  {
    id: "broker",
    name: "经纪机构",
    description: "房源管理、二手房交易、客源跟进",
    icon: Building,
    color: "bg-chart-2",
    dashboardPath: "/dashboard/broker",
  },
]

export const navigationConfig: Record<UserRole, NavSection[]> = {
  broker: [
    {
      title: "工作台",
      items: [
        { title: "首页", href: "/dashboard/broker", icon: Home },
        { title: "数据统计", href: "/dashboard/broker/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "团队管理",
      items: [
        { title: "员工账户", href: "/dashboard/broker/team", icon: Users },
      ],
    },
    {
      title: "房源管理",
      items: [
        { title: "全部房源", href: "/dashboard/broker/listings", icon: Building2, badge: 0 },
        { title: "发布房源", href: "/dashboard/broker/listings/new", icon: Send },
      ],
    },
    {
      title: "客源管理",
      items: [
        { title: "客户列表", href: "/dashboard/broker/clients", icon: Users2 },
        { title: "带看预约", href: "/dashboard/broker/viewings", icon: Calendar },
      ],
    },
    {
      title: "二手房交易",
      items: [
        { title: "交易管理", href: "/dashboard/broker/transactions", icon: ArrowRightLeft, badge: 0 },
        { title: "发起交易", href: "/dashboard/broker/transactions/new", icon: Send },
      ],
    },
    {
      title: "估价服务",
      items: [
        { title: "发起估价", href: "/dashboard/broker/demand/new", icon: Calculator },
        { title: "估价项目", href: "/dashboard/broker/projects", icon: FolderOpen },
        { title: "估价报告", href: "/dashboard/broker/reports", icon: FileText },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "分享链接", href: "/dashboard/broker/marketing/links", icon: Link2 },
        { title: "营销活动", href: "/dashboard/broker/marketing/campaigns", icon: Megaphone },
        { title: "线索管理", href: "/dashboard/broker/marketing/leads", icon: Users2 },
        { title: "我的微站", href: "/dashboard/broker/marketing/website", icon: Globe },
      ],
    },
    {
      title: "订阅与计费",
      items: [
        { title: "订阅计划", href: "/dashboard/org/billing", icon: CreditCard },
        { title: "订阅支付", href: "/dashboard/org/payment", icon: Wallet },
        { title: "API 密钥", href: "/dashboard/org/api-keys", icon: Key },
      ],
    },
    {
      title: "账号设置",
      items: [
        { title: "品牌定制", href: "/dashboard/org/branding", icon: Palette },
        { title: "通知设置", href: "/dashboard/settings/notifications", icon: BellDot },
        { title: "数据导出", href: "/dashboard/exports", icon: Download },
      ],
    },
  ],
  appraiser: [
    {
      title: "工作台",
      items: [
        { title: "首页", href: "/dashboard/appraiser", icon: Home },
        { title: "数据概览", href: "/dashboard/appraiser/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "团队管理",
      items: [
        { title: "员工账户", href: "/dashboard/appraiser/team", icon: Users },
      ],
    },
    {
      title: "项目管理",
      items: [
        { title: "全部项目", href: "/dashboard/appraiser/projects", icon: FolderOpen, badge: 12 },
        { title: "竞价项目", href: "/dashboard/appraiser/bidding", icon: TrendingUp, badge: 3 },
        { title: "进行中", href: "/dashboard/appraiser/projects/active", icon: ClipboardCheck },
        { title: "已完成", href: "/dashboard/appraiser/projects/completed", icon: Award },
      ],
    },
    {
      title: "报告管理",
      items: [
        { title: "估价记录", href: "/dashboard/appraiser/valuation", icon: Calculator },
        { title: "报告编制", href: "/dashboard/appraiser/reports/edit", icon: FileText },
        { title: "审核管理", href: "/dashboard/appraiser/reports/review", icon: UserCheck, badge: 5 },
        { title: "报告归档", href: "/dashboard/appraiser/reports/archive", icon: Briefcase },
      ],
    },
    {
      title: "合规工具",
      items: [
        { title: "三级审核", href: "/dashboard/appraiser/reports/three-level-review", icon: ListChecks },
        { title: "工作底稿", href: "/dashboard/appraiser/work-sheets", icon: BookOpen },
        { title: "签章管理", href: "/dashboard/appraiser/seals", icon: Stamp },
        { title: "批量估价", href: "/dashboard/appraiser/batch-valuation", icon: Calculator },
      ],
    },
    {
      title: "消息通知",
      items: [
        { title: "系统通知", href: "/dashboard/appraiser/notifications", icon: Bell, badge: 8 },
        { title: "消息中心", href: "/dashboard/appraiser/messages", icon: MessageSquare },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "营销中心", href: "/dashboard/appraiser/sales", icon: Megaphone },
        { title: "我的微站", href: "/dashboard/appraiser/marketing/website", icon: Globe },
        { title: "海报生成", href: "/dashboard/appraiser/marketing/poster", icon: Image },
        { title: "营销活动", href: "/dashboard/appraiser/marketing/campaigns", icon: Megaphone },
        { title: "线索管理", href: "/dashboard/appraiser/marketing/leads", icon: Users2 },
      ],
    },
    {
      title: "订阅与计费",
      items: [
        { title: "订阅计划", href: "/dashboard/org/billing", icon: CreditCard },
        { title: "订阅支付", href: "/dashboard/org/payment", icon: Wallet },
        { title: "API 密钒", href: "/dashboard/org/api-keys", icon: Key },
      ],
    },
    {
      title: "账号设置",
      items: [
        { title: "品牌定制", href: "/dashboard/org/branding", icon: Palette },
        { title: "通知设置", href: "/dashboard/settings/notifications", icon: BellDot },
        { title: "数据导出", href: "/dashboard/exports", icon: Download },
      ],
    },
  ],
  bank: [
    {
      title: "工作台",
      items: [
        { title: "首页", href: "/dashboard/bank", icon: Home },
        { title: "数据统计", href: "/dashboard/bank/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "团队管理",
      items: [
        { title: "员工账户", href: "/dashboard/bank/team", icon: Users },
      ],
    },
    {
      title: "需求管理",
      items: [
        { title: "发起需求", href: "/dashboard/bank/demand/new", icon: Send },
        { title: "竞价项目", href: "/dashboard/bank/bidding", icon: TrendingUp, badge: 6 },
        { title: "中标项目", href: "/dashboard/bank/projects/awarded", icon: Award },
      ],
    },
    {
      title: "项目跟踪",
      items: [
        { title: "自动估价", href: "/dashboard/bank/valuation", icon: Calculator },
        { title: "全部项目", href: "/dashboard/bank/projects", icon: FolderOpen },
        { title: "进行中", href: "/dashboard/bank/projects/active", icon: ClipboardCheck, badge: 15 },
        { title: "已完成", href: "/dashboard/bank/projects/completed", icon: Briefcase },
      ],
    },
    {
      title: "报告中心",
      items: [
        { title: "估价记录", href: "/dashboard/bank/reports/auto-valuation", icon: Calculator },
        { title: "报告审核", href: "/dashboard/bank/reports/review", icon: FileText, badge: 4 },
        { title: "报告归档", href: "/dashboard/bank/reports/archive", icon: UserCheck },
      ],
    },
    {
      title: "订阅与计费",
      items: [
        { title: "订阅计划", href: "/dashboard/org/billing", icon: CreditCard },
        { title: "订阅支付", href: "/dashboard/org/payment", icon: Wallet },
        { title: "API 密钒", href: "/dashboard/org/api-keys", icon: Key },
      ],
    },
    {
      title: "账号设置",
      items: [
        { title: "品牌定制", href: "/dashboard/org/branding", icon: Palette },
        { title: "通知设置", href: "/dashboard/settings/notifications", icon: BellDot },
        { title: "数据导出", href: "/dashboard/exports", icon: Download },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "营销中心", href: "/dashboard/bank/sales", icon: Megaphone },
      ],
    },
  ],
  investor: [
    {
      title: "工作台",
      items: [
        { title: "首页", href: "/dashboard/investor", icon: Home },
        { title: "数据统计", href: "/dashboard/investor/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "团队管理",
      items: [
        { title: "员工账户", href: "/dashboard/investor/team", icon: Users },
      ],
    },
    {
      title: "需求管理",
      items: [
        { title: "发起需求", href: "/dashboard/investor/demand/new", icon: Send },
        { title: "竞价项目", href: "/dashboard/investor/bidding", icon: TrendingUp, badge: 6 },
        { title: "中标项目", href: "/dashboard/investor/projects/awarded", icon: Award },
      ],
    },
    {
      title: "项目跟踪",
      items: [
        { title: "自动估价", href: "/dashboard/investor/valuation", icon: Calculator },
        { title: "全部项目", href: "/dashboard/investor/projects", icon: FolderOpen },
        { title: "进行中", href: "/dashboard/investor/projects/active", icon: ClipboardCheck, badge: 15 },
        { title: "已完成", href: "/dashboard/investor/projects/completed", icon: Briefcase },
      ],
    },
    {
      title: "报告中心",
      items: [
        { title: "估价记录", href: "/dashboard/investor/reports/auto-valuation", icon: Calculator },
        { title: "报告审核", href: "/dashboard/investor/reports/review", icon: FileText, badge: 4 },
        { title: "报告归档", href: "/dashboard/investor/reports/archive", icon: UserCheck },
      ],
    },
    {
      title: "订阅与计费",
      items: [
        { title: "订阅计划", href: "/dashboard/org/billing", icon: CreditCard },
        { title: "订阅支付", href: "/dashboard/org/payment", icon: Wallet },
        { title: "API 密钒", href: "/dashboard/org/api-keys", icon: Key },
      ],
    },
    {
      title: "账号设置",
      items: [
        { title: "品牌定制", href: "/dashboard/org/branding", icon: Palette },
        { title: "通知设置", href: "/dashboard/settings/notifications", icon: BellDot },
        { title: "数据导出", href: "/dashboard/exports", icon: Download },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "营销中心", href: "/dashboard/investor/sales", icon: Megaphone },
      ],
    },
  ],
  customer: [
    {
      title: "工作台",
      items: [
        { title: "首页", href: "/dashboard/customer", icon: Home },
      ],
    },
    {
      title: "评估服务",
      items: [
        { title: "申请评估", href: "/dashboard/customer/apply", icon: Send },
        { title: "我的申请", href: "/dashboard/customer/applications", icon: FolderOpen, badge: 2 },
        { title: "进度查询", href: "/dashboard/customer/progress", icon: ClipboardCheck },
      ],
    },
    {
      title: "报告管理",
      items: [
        { title: "我的报告", href: "/dashboard/customer/reports", icon: FileText },
        { title: "报告下载", href: "/dashboard/customer/downloads", icon: Briefcase },
      ],
    },
    {
      title: "消息",
      items: [
        { title: "通知消息", href: "/dashboard/customer/notifications", icon: Bell, badge: 3 },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "邀请赚钱", href: "/dashboard/customer/sales", icon: Megaphone },
      ],
    },
  ],
  admin: [
    {
      title: "控制台",
      items: [
        { title: "首页", href: "/dashboard/admin", icon: Home },
        { title: "数据分析", href: "/dashboard/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "用户管理",
      items: [
        { title: "评估公司", href: "/dashboard/admin/users/appraisers", icon: Building2 },
        { title: "银行机构", href: "/dashboard/admin/users/banks", icon: Landmark },
        { title: "投资机构", href: "/dashboard/admin/users/investors", icon: TrendingUp },
        { title: "经纪机构", href: "/dashboard/admin/users/brokers", icon: Building },
        { title: "个人用户", href: "/dashboard/admin/users/customers", icon: Users },
      ],
    },
    {
      title: "业务管理",
      items: [
        { title: "项目监控", href: "/dashboard/admin/projects", icon: FolderOpen },
        { title: "报告审核", href: "/dashboard/admin/reports", icon: FileText, badge: 7 },
        { title: "竞价管理", href: "/dashboard/admin/bidding", icon: TrendingUp },
        { title: "自动估价", href: "/dashboard/admin/auto-valuation", icon: Calculator, badge: 5 },
      ],
    },
    {
      title: "数据管理",
      items: [
        { title: "城市管理", href: "/dashboard/admin/directory/cities", icon: MapPin },
        { title: "楼盘管理", href: "/dashboard/admin/directory/estates", icon: Building },
        { title: "楼栋管理", href: "/dashboard/admin/directory/buildings", icon: Layers },
        { title: "房屋管理", href: "/dashboard/admin/directory/units", icon: DoorOpen },
        { title: "案例管理", href: "/dashboard/admin/directory/cases", icon: Database },
                { title: "数据采集", href: "/dashboard/admin/crawler", icon: Bot, children: [
          { title: "采集任务", href: "/dashboard/admin/crawler", icon: Bot },
          { title: "采集模板", href: "/dashboard/admin/crawler/templates", icon: FileText },
        ] },
        {
          title: "OpenClaw AI",
          href: "/dashboard/admin/directory/cases",
          icon: Bot,
          children: [
            { title: "AI 智能采集", href: "/dashboard/admin/directory/cases/ai-collect", icon: Database },
            { title: "AI 数据清洗", href: "/dashboard/admin/directory/cases/ai-clean", icon: Sparkles },
            { title: "AI 价格预测", href: "/dashboard/admin/directory/cases/ai-predict", icon: TrendingUp },
            { title: "AI 案例匹配", href: "/dashboard/admin/directory/cases/ai-match", icon: GitCompare },
            { title: "AI 异常检测", href: "/dashboard/admin/directory/cases/ai-anomaly", icon: ShieldAlert },
            { title: "AI 批量估值", href: "/dashboard/admin/directory/cases/ai-batch", icon: Calculator },
          ],
        },
      ],
    },
    {
      title: "内容管理",
      items: [
        { title: "新闻管理", href: "/dashboard/admin/news", icon: Newspaper },
        { title: "通知管理", href: "/dashboard/admin/notifications", icon: BellRing },
      ],
    },
    {
      title: "风控工具",
      items: [
        { title: "签章审核", href: "/dashboard/admin/seals", icon: Stamp },
        { title: "偏离度预警", href: "/dashboard/admin/valuation-alerts", icon: AlertTriangle },
        { title: "SaaS 订阅", href: "/dashboard/org/billing", icon: CreditCard },
        { title: "导出管理", href: "/dashboard/admin/exports", icon: Download },
      ],
    },
    {
      title: "平台设置",
      items: [
        { title: "通知设置", href: "/dashboard/settings/notifications", icon: BellDot },
      ],
    },
    {
      title: "营销推广",
      items: [
        { title: "推广活动", href: "/dashboard/admin/sales/campaigns", icon: Megaphone },
        { title: "邀请管理", href: "/dashboard/admin/sales/invites", icon: Send },
        { title: "线索管理", href: "/dashboard/admin/sales/leads", icon: Users },
      ],
    },
    {
      title: "系统设置",
      items: [
        { title: "系统配置", href: "/dashboard/admin/settings", icon: Settings },
        { title: "OPENCLAW设置", href: "/dashboard/admin/settings/openclaw", icon: Bot },
        { title: "操作日志", href: "/dashboard/admin/logs", icon: Calendar },
      ],
    },
  ],
}

export function getRoleConfig(role: UserRole): RoleConfig {
  return roles.find((r) => r.id === role) || roles[0]
}

export function getNavigation(role: UserRole): NavSection[] {
  return navigationConfig[role] || []
}
