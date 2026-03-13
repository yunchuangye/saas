"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Play, Pause, Trash2, Eye, Plus, RefreshCw, Database, Activity,
  CheckCircle, XCircle, Clock, Shield, Bell, Settings, RotateCcw,
  AlertTriangle, Wifi, Server, TrendingUp, Globe, Zap, List,
  CheckCircle2, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";

// ─── 常量 ──────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  lianjia: "链家", beike: "贝壳找房", anjuke: "安居客",
  fang58: "58同城", custom: "自定义",
};
const SOURCE_COLORS: Record<string, string> = {
  lianjia: "#3b82f6", beike: "#10b981", anjuke: "#f59e0b",
  fang58: "#ef4444", custom: "#8b5cf6", unknown: "#6b7280",
};
const DATA_TYPE_LABELS: Record<string, string> = {
  sold_cases: "二手房成交案例", listing: "在售挂牌房源", estate_info: "楼盘基础信息",
};
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "待执行", color: "bg-gray-100 text-gray-700",    dot: "bg-gray-400" },
  running:   { label: "采集中", color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500 animate-pulse" },
  paused:    { label: "已暂停", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  failed:    { label: "失败",   color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};
const CRON_PRESETS = [
  { label: "每天凌晨2点", value: "0 2 * * *" },
  { label: "每天凌晨3点", value: "0 3 * * *" },
  { label: "每天早上6点", value: "0 6 * * *" },
  { label: "每6小时一次", value: "0 */6 * * *" },
  { label: "每12小时一次", value: "0 */12 * * *" },
  { label: "每周一凌晨2点", value: "0 2 * * 1" },
  { label: "每月1日凌晨2点", value: "0 2 1 * *" },
];

// ─── 默认表单 ─────────────────────────────────────────────────
const defaultForm = {
  name: "", source: "lianjia", dataType: "sold_cases",
  cityId: undefined as number | undefined, cityName: "", districtName: "",
  keyword: "", maxPages: 10, concurrency: 2, delayMin: 2000, delayMax: 5000,
  useProxy: false, scheduleType: "manual", cronExpression: "",
};

export default function CrawlerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [proxyForm, setProxyForm] = useState({ text: "", protocol: "http", provider: "" });
  const [form, setForm] = useState({ ...defaultForm });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [jobPage, setJobPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [proxyPage, setProxyPage] = useState(1);

  // ─── 数据查询 ───────────────────────────────────────────────
  const { data: stats, refetch: refetchStats } =
    trpc.crawl.getDashboardStats.useQuery(undefined, { refetchInterval: 20000 });
  const { data: jobsData, refetch: refetchJobs } =
    trpc.crawl.listJobs.useQuery({ page: jobPage, pageSize: 15, status: statusFilter });
  const { data: alerts, refetch: refetchAlerts } =
    trpc.crawl.listAlerts.useQuery({ unreadOnly: false, limit: 30 });
  const { data: proxiesData, refetch: refetchProxies } =
    trpc.crawl.listProxies.useQuery({ page: proxyPage, pageSize: 20 });
  const { data: citiesData } = trpc.crawl.getCities.useQuery();

  const jobs = jobsData?.jobs ?? [];
  const proxies = proxiesData?.proxies ?? [];

  const refetchAll = () => { refetchStats(); refetchJobs(); refetchAlerts(); refetchProxies(); };

  // ─── Mutations ──────────────────────────────────────────────
  const createJob = trpc.crawl.createJob.useMutation({
    onSuccess: () => { toast.success("任务创建成功"); setCreateOpen(false); setForm({ ...defaultForm }); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const startJob = trpc.crawl.startJob.useMutation({
    onSuccess: () => { toast.success("任务已加入队列"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const pauseJob = trpc.crawl.pauseJob.useMutation({
    onSuccess: () => { toast.success("任务已暂停"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const restartJob = trpc.crawl.restartJob.useMutation({
    onSuccess: () => { toast.success("任务已重启"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteJob = trpc.crawl.deleteJob.useMutation({
    onSuccess: () => { toast.success("任务已删除"); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const batchOp = trpc.crawl.batchOperation.useMutation({
    onSuccess: (d) => { toast.success(d.message); setSelectedIds([]); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const importProxies = trpc.crawl.importProxies.useMutation({
    onSuccess: (d) => { toast.success(d.message); setProxyOpen(false); refetchProxies(); },
    onError: (e) => toast.error(e.message),
  });
  const testProxy = trpc.crawl.testProxy.useMutation({
    onSuccess: (d) => { toast[d.success ? 'success' : 'error'](d.message); refetchProxies(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProxy = trpc.crawl.deleteProxy.useMutation({
    onSuccess: () => { toast.success("代理已删除"); refetchProxies(); },
    onError: (e) => toast.error(e.message),
  });
  const markRead = trpc.crawl.markAlertRead.useMutation({
    onSuccess: () => refetchAlerts(),
  });

  const handleCreate = () => {
    if (!form.name) return toast.error("请填写任务名称");
    if (!form.cityName) return toast.error("请选择城市");
    if (form.scheduleType === "cron" && !form.cronExpression) return toast.error("请选择或填写 Cron 表达式");
    createJob.mutate(form as any);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const s = stats;

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* ── 页头 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-blue-600" />
            数据采集控制台
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">统一管理采集任务、定时调度、代理池和告警</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> 新建任务
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setActiveTab("proxies"); }}>
            <Shield className="w-4 h-4 mr-1" /> 代理管理
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="w-4 h-4" /> 仪表盘
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5">
            <List className="w-4 h-4" /> 任务管理
            {(s?.jobs.running ?? 0) > 0 && (
              <span className="ml-1 bg-green-500 text-white text-xs px-1.5 rounded-full">
                {s?.jobs.running}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="proxies" className="gap-1.5">
            <Shield className="w-4 h-4" /> 代理池
            <span className="ml-1 text-xs text-gray-400">{s?.proxies.active ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5">
            <Bell className="w-4 h-4" /> 告警
            {(s?.alerts.unread ?? 0) > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                {s?.alerts.unread}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ════ 仪表盘 ════ */}
        <TabsContent value="dashboard" className="space-y-5 mt-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { title: "总任务", value: s?.jobs.total ?? 0, icon: List, color: "blue" },
              { title: "运行中", value: s?.jobs.running ?? 0, icon: Play, color: "green" },
              { title: "已完成", value: s?.jobs.completed ?? 0, icon: CheckCircle2, color: "indigo" },
              { title: "已失败", value: s?.jobs.failed ?? 0, icon: XCircle, color: "red" },
              { title: "数据总量", value: s?.cases.total ?? 0, icon: Database, color: "purple", fmt: true },
              { title: "今日采集", value: s?.cases.today ?? 0, icon: TrendingUp, color: "teal", fmt: true },
              { title: "活跃代理", value: s?.proxies.active ?? 0, icon: Shield, color: "orange" },
              { title: "未读告警", value: s?.alerts.unread ?? 0, icon: Bell, color: "yellow" },
            ].map(item => (
              <Card key={item.title} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.title}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {item.fmt ? (item.value as number).toLocaleString() : item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 队列状态 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <span className="font-medium text-gray-600 flex items-center gap-1">
                  <Server className="w-4 h-4" /> 队列状态：
                </span>
                {[
                  { label: "等待", value: s?.queue?.waiting ?? 0, cls: "text-gray-600" },
                  { label: "执行中", value: s?.queue?.active ?? 0, cls: "text-green-600 font-bold" },
                  { label: "已完成", value: s?.queue?.completed ?? 0, cls: "text-blue-600" },
                  { label: "失败", value: s?.queue?.failed ?? 0, cls: "text-red-600" },
                  { label: "延迟", value: s?.queue?.delayed ?? 0, cls: "text-yellow-600" },
                ].map(i => (
                  <span key={i.label} className="flex items-center gap-1">
                    <span className="text-gray-400">{i.label}</span>
                    <span className={i.cls}>{i.value}</span>
                  </span>
                ))}
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 定时任务 {s?.scheduledTasks ?? 0} 个
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 近30天采集趋势 */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> 近30天采集趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={s?.dailyStats ?? []}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5) ?? ''} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`${v} 条`, "采集量"]} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#cg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 数据来源分布 */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-500" /> 数据来源分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={(s?.sourceStats ?? []).map((ss: any) => ({
                        name: SOURCE_LABELS[ss.source] ?? ss.source,
                        value: Number(ss.cnt),
                        source: ss.source,
                      }))}
                      cx="50%" cy="50%" outerRadius={60} dataKey="value"
                    >
                      {(s?.sourceStats ?? []).map((item: any, i: number) => (
                        <Cell key={i} fill={SOURCE_COLORS[item.source] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} 条`, ""]} />
                    <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-gray-400 mt-1">
                  总计 {(s?.cases.total ?? 0).toLocaleString()} 条
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════ 任务管理 ════ */}
        <TabsContent value="jobs" className="space-y-4 mt-4">
          {/* 筛选栏 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {[undefined, "running", "completed", "failed", "paused", "pending"].map(s => (
                <Button key={String(s)} variant={statusFilter === s ? "default" : "outline"}
                  size="sm" className="text-xs h-7"
                  onClick={() => { setStatusFilter(s); setJobPage(1); }}>
                  {s ? STATUS_CONFIG[s]?.label : "全部"}
                </Button>
              ))}
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <span className="text-sm text-gray-500">已选 {selectedIds.length} 个</span>
                <Button size="sm" variant="outline" className="h-7 text-xs text-green-600"
                  onClick={() => batchOp.mutate({ ids: selectedIds, action: "start" })}>
                  批量启动
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-yellow-600"
                  onClick={() => batchOp.mutate({ ids: selectedIds, action: "pause" })}>
                  批量暂停
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-600"
                  onClick={() => { if (confirm("确认删除选中任务？")) batchOp.mutate({ ids: selectedIds, action: "delete" }); }}>
                  批量删除
                </Button>
              </div>
            )}
          </div>

          {/* 任务表格 */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-8">
                      <input type="checkbox" className="rounded"
                        checked={selectedIds.length === jobs.length && jobs.length > 0}
                        onChange={e => setSelectedIds(e.target.checked ? jobs.map((j: any) => j.id) : [])} />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">任务名称</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">来源/类型</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">城市</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">进度</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">调度</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jobs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      暂无任务，点击"新建任务"开始采集
                    </td></tr>
                  ) : jobs.map((job: any) => {
                    const sc = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded"
                            checked={selectedIds.includes(job.id)}
                            onChange={() => toggleSelect(job.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                            <span className="font-medium text-gray-900 truncate max-w-[160px]">{job.name}</span>
                          </div>
                          {job.errorMessage && (
                            <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">{job.errorMessage}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <span className="font-medium">{SOURCE_LABELS[job.source] ?? job.source}</span>
                            <br />
                            <span className="text-gray-400">{DATA_TYPE_LABELS[job.dataType] ?? job.dataType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{job.cityName ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-24">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{job.successCount ?? 0} 条</span>
                              <span>{job.progress ?? 0}%</span>
                            </div>
                            <Progress value={job.progress ?? 0} className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.scheduleType === "cron" ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.cronDescription ?? "定时"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">手动</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              title="查看详情"
                              onClick={() => router.push(`/dashboard/admin/crawler/${job.id}`)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {job.status === "running" ? (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-yellow-600"
                                title="暂停" onClick={() => pauseJob.mutate({ id: job.id })}>
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600"
                                title="启动" onClick={() => startJob.mutate({ id: job.id })}>
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600"
                              title="重启" onClick={() => restartJob.mutate({ id: job.id })}>
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                              title="删除"
                              onClick={() => { if (confirm(`确认删除任务"${job.name}"？`)) deleteJob.mutate({ id: job.id }); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* 分页 */}
            {(jobsData?.total ?? 0) > 15 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                <span>共 {jobsData?.total} 个任务</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={jobPage <= 1}
                    onClick={() => setJobPage(p => p - 1)}>上一页</Button>
                  <span className="px-2 py-1">第 {jobPage} 页</span>
                  <Button variant="outline" size="sm"
                    disabled={jobPage * 15 >= (jobsData?.total ?? 0)}
                    onClick={() => setJobPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ════ 代理池 ════ */}
        <TabsContent value="proxies" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {proxiesData?.total ?? 0} 个代理，活跃 {s?.proxies.active ?? 0} 个
            </div>
            <Button size="sm" onClick={() => setProxyOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> 批量导入代理
            </Button>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">地址</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">协议</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">地区</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">响应时间</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">成功/失败</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {proxies.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      暂无代理，点击"批量导入代理"添加
                    </td></tr>
                  ) : proxies.map((proxy: any) => (
                    <tr key={proxy.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{proxy.host}:{proxy.port}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{proxy.protocol}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{proxy.region ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          proxy.status === "active" ? "bg-green-100 text-green-700" :
                          proxy.status === "testing" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {proxy.status === "active" ? "可用" : proxy.status === "testing" ? "测试中" : "不可用"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {proxy.avgResponseMs ? `${proxy.avgResponseMs}ms` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <span className="text-green-600">{proxy.successCount ?? 0}</span>
                        {" / "}
                        <span className="text-red-500">{proxy.failCount ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs"
                            disabled={testProxy.isPending}
                            onClick={() => testProxy.mutate({ id: proxy.id })}>
                            <Wifi className="w-3 h-3 mr-1" /> 测试
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                            onClick={() => deleteProxy.mutate({ id: proxy.id })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">代理格式说明</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500 space-y-1">
              <p>支持以下格式（每行一个）：</p>
              <pre className="bg-gray-50 p-2 rounded text-xs">
{`host:port
host:port:username:password
示例：
123.45.67.89:8080
123.45.67.89:8080:user:pass`}
              </pre>
              <p className="text-gray-400">推荐代理服务商：芝麻代理、快代理、亮数据（Bright Data）</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════ 告警 ════ */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              共 {(alerts ?? []).length} 条告警，
              未读 {(alerts ?? []).filter((a: any) => !a.isRead).length} 条
            </span>
            <Button variant="outline" size="sm" onClick={() => markRead.mutate({})}>
              全部标为已读
            </Button>
          </div>

          <div className="space-y-2">
            {(alerts ?? []).length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                  <p>暂无告警，系统运行正常</p>
                </CardContent>
              </Card>
            ) : (alerts ?? []).map((alert: any) => (
              <Card key={alert.id}
                className={`border-0 shadow-sm ${!alert.isRead ? "border-l-4 border-l-orange-400" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 ${
                        alert.level === "critical" || alert.level === "error" ? "text-red-500" :
                        alert.level === "warn" ? "text-orange-400" : "text-blue-400"
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                      <div>
                        <p className={`font-medium ${!alert.isRead ? "text-gray-900" : "text-gray-600"}`}>
                          {alert.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{alert.message}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {alert.createdAt ? format(new Date(alert.createdAt), "yyyy-MM-dd HH:mm") : ""}
                          {alert.jobId && <span className="ml-2">任务 #{alert.jobId}</span>}
                        </p>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button variant="ghost" size="sm" className="text-xs flex-shrink-0"
                        onClick={() => markRead.mutate({ id: alert.id })}>
                        已读
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ════ 新建任务弹窗 ════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建数据采集任务</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>任务名称 *</Label>
              <Input placeholder="如：上海浦东新区二手房成交案例" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>数据来源 *</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>数据类型 *</Label>
              <Select value={form.dataType} onValueChange={v => setForm(f => ({ ...f, dataType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DATA_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>目标城市 *</Label>
              <Select value={form.cityName} onValueChange={v => {
                const city = citiesData?.find(c => c.name === v);
                setForm(f => ({ ...f, cityName: v, cityId: city?.id }));
              }}>
                <SelectTrigger><SelectValue placeholder="选择城市" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {citiesData?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}（{c.province}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>目标区域（可选）</Label>
              <Input placeholder="如：浦东新区" value={form.districtName}
                onChange={e => setForm(f => ({ ...f, districtName: e.target.value }))} />
            </div>
            <div>
              <Label>最大采集页数</Label>
              <Input type="number" min={1} max={200} value={form.maxPages}
                onChange={e => setForm(f => ({ ...f, maxPages: parseInt(e.target.value) || 10 }))} />
              <p className="text-xs text-gray-400 mt-1">每页约20条，50页≈1000条数据</p>
            </div>
            <div>
              <Label>并发数（1-5）</Label>
              <Input type="number" min={1} max={5} value={form.concurrency}
                onChange={e => setForm(f => ({ ...f, concurrency: parseInt(e.target.value) || 2 }))} />
              <p className="text-xs text-gray-400 mt-1">并发越高越快，但风险越大</p>
            </div>
            <div>
              <Label>最小延迟（毫秒）</Label>
              <Input type="number" min={500} value={form.delayMin}
                onChange={e => setForm(f => ({ ...f, delayMin: parseInt(e.target.value) || 2000 }))} />
            </div>
            <div>
              <Label>最大延迟（毫秒）</Label>
              <Input type="number" min={1000} value={form.delayMax}
                onChange={e => setForm(f => ({ ...f, delayMax: parseInt(e.target.value) || 5000 }))} />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.useProxy}
                onCheckedChange={v => setForm(f => ({ ...f, useProxy: v }))} />
              <Label>使用代理 IP 池（需先配置代理）</Label>
            </div>

            {/* 定时调度 */}
            <div className="col-span-2 border-t pt-4">
              <Label className="text-base font-semibold">定时调度</Label>
              <div className="mt-3 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="manual" checked={form.scheduleType === "manual"}
                    onChange={() => setForm(f => ({ ...f, scheduleType: "manual" }))} />
                  <span className="text-sm">手动触发</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="cron" checked={form.scheduleType === "cron"}
                    onChange={() => setForm(f => ({ ...f, scheduleType: "cron" }))} />
                  <span className="text-sm">定时自动采集（Cron）</span>
                </label>
              </div>
              {form.scheduleType === "cron" && (
                <div className="mt-3 space-y-2">
                  <Label>选择采集周期</Label>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map(p => (
                      <Button key={p.value} variant={form.cronExpression === p.value ? "default" : "outline"}
                        size="sm" className="text-xs h-7"
                        onClick={() => setForm(f => ({ ...f, cronExpression: p.value }))}>
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <Label>或自定义 Cron 表达式</Label>
                    <Input placeholder="0 2 * * *（每天凌晨2点）" value={form.cronExpression}
                      onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">
                      格式：分 时 日 月 周 | 示例：0 2 * * * = 每天凌晨2点
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createJob.isPending}>
              {createJob.isPending ? "创建中..." : "创建任务"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ 批量导入代理弹窗 ════ */}
      <Dialog open={proxyOpen} onOpenChange={setProxyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入代理 IP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>协议类型</Label>
              <Select value={proxyForm.protocol}
                onValueChange={v => setProxyForm(f => ({ ...f, protocol: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>服务商（可选）</Label>
              <Input placeholder="如：芝麻代理" value={proxyForm.provider}
                onChange={e => setProxyForm(f => ({ ...f, provider: e.target.value }))} />
            </div>
            <div>
              <Label>代理列表（每行一个）</Label>
              <Textarea
                placeholder={"123.45.67.89:8080\n123.45.67.89:8080:user:pass"}
                rows={8} value={proxyForm.text}
                onChange={e => setProxyForm(f => ({ ...f, text: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProxyOpen(false)}>取消</Button>
            <Button onClick={() => importProxies.mutate(proxyForm as any)}
              disabled={importProxies.isPending}>
              {importProxies.isPending ? "导入中..." : "导入代理"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
