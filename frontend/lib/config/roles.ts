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
  type LucideIcon,
} from "lucide-react"

export type UserRole = "appraiser" | "bank" | "investor" | "customer" | "admin"

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
]

export const navigationConfig: Record<UserRole, NavSection[]> = {
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
