"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Play, Pause, RefreshCw, Terminal, RotateCcw,
  Database, CheckCircle, XCircle, Clock, Activity, Download,
  AlertTriangle, BarChart3, List, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "待执行", color: "bg-gray-100 text-gray-700",    dot: "bg-gray-400" },
  running:   { label: "采集中", color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500 animate-pulse" },
  paused:    { label: "已暂停", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  failed:    { label: "失败",   color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

const LOG_COLORS: Record<string, string> = {
  info:    "text-gray-300",
  warn:    "text-yellow-400",
  error:   "text-red-400",
  success: "text-green-400",
  debug:   "text-gray-500",
};

const SOURCE_LABELS: Record<string, string> = {
  lianjia: "链家", beike: "贝壳找房", anjuke: "安居客",
  fang58: "58同城", custom: "自定义",
};

export default function CrawlerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logLevel, setLogLevel] = useState<string | undefined>(undefined);
  const [dataPage, setDataPage] = useState(1);
  const [activeTab, setActiveTab] = useState("logs");

  const { data: job, refetch: refetchJob } =
    trpc.crawl.getJob.useQuery({ id: jobId }, { refetchInterval: autoRefresh ? 5000 : false });
  const { data: logsData, refetch: refetchLogs } =
    trpc.crawl.getJobLogs.useQuery({ jobId, limit: 300, level: logLevel },
      { refetchInterval: autoRefresh ? 5000 : false });
  const { data: casesData, refetch: refetchCases } =
    trpc.crawl.getJobCases.useQuery({ jobId, page: dataPage, pageSize: 20 });
  const { data: historyData } =
    trpc.crawl.getScheduleHistory.useQuery({ jobId, limit: 20 });

  const startJob = trpc.crawl.startJob.useMutation({
    onSuccess: () => { toast.success("任务已启动"); refetchJob(); refetchLogs(); },
    onError: (e) => toast.error(e.message),
  });
  const pauseJob = trpc.crawl.pauseJob.useMutation({
    onSuccess: () => { toast.success("任务已暂停"); refetchJob(); },
    onError: (e) => toast.error(e.message),
  });
  const restartJob = trpc.crawl.restartJob.useMutation({
    onSuccess: () => { toast.success("任务已重启"); refetchJob(); refetchLogs(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteJob = trpc.crawl.deleteJob.useMutation({
    onSuccess: () => { toast.success("任务已删除"); router.push("/dashboard/admin/crawler"); },
    onError: (e) => toast.error(e.message),
  });

  // 自动滚动日志到底部
  useEffect(() => {
    if (autoRefresh && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData, autoRefresh]);

  // 自动开启刷新（任务运行中）
  useEffect(() => {
    if (job?.status === "running") setAutoRefresh(true);
  }, [job?.status]);

  const logs = logsData ?? [];
  const cases = casesData?.data ?? [];
  const history = historyData ?? [];
  const sc = STATUS_CONFIG[job?.status ?? "pending"] ?? STATUS_CONFIG.pending;

  // 导出日志为文本
  const exportLogs = () => {
    const text = logs.map((l: any) =>
      `[${format(new Date(l.createdAt), "yyyy-MM-dd HH:mm:ss")}] [${l.level?.toUpperCase()}] ${l.message}`
    ).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crawl_job_${jobId}_logs.txt`; a.click();
  };

  // 导出数据为 CSV
  const exportCSV = () => {
    if (!cases.length) return toast.error("暂无数据可导出");
    const headers = ["地址", "城市", "区域", "面积(㎡)", "单价(元/㎡)", "总价(万元)", "成交日期", "来源"];
    const rows = cases.map((c: any) => [
      c.address ?? "", c.cityId ?? "", c.district ?? "",
      c.area ?? "", c.unitPrice ?? "", c.totalPrice ?? "",
      c.dealDate ?? c.createdAt ?? "", c.source ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crawl_job_${jobId}_data.csv`; a.click();
  };

  if (!job) return (
    <div className="p-6 flex items-center justify-center h-64 text-gray-400">
      加载中...
    </div>
  );

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 页头 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/admin/crawler")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
              <h1 className="text-xl font-bold text-gray-900">{job.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                {sc.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {SOURCE_LABELS[job.source] ?? job.source} ·
              {job.cityName ?? "全国"} ·
              任务 #{job.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            onClick={() => { refetchJob(); refetchLogs(); refetchCases(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
          <Button variant="outline" size="sm"
            className={autoRefresh ? "bg-green-50 border-green-300 text-green-700" : ""}
            onClick={() => setAutoRefresh(v => !v)}>
            <Activity className="w-4 h-4 mr-1" />
            {autoRefresh ? "实时刷新中" : "开启实时刷新"}
          </Button>
          {job.status === "running" ? (
            <Button variant="outline" size="sm" className="text-yellow-600"
              onClick={() => pauseJob.mutate({ id: jobId })}>
              <Pause className="w-4 h-4 mr-1" /> 暂停
            </Button>
          ) : (
            <Button size="sm" className="bg-green-600 hover:bg-green-700"
              onClick={() => startJob.mutate({ id: jobId })}>
              <Play className="w-4 h-4 mr-1" /> 启动
            </Button>
          )}
          <Button variant="outline" size="sm"
            onClick={() => restartJob.mutate({ id: jobId })}>
            <RotateCcw className="w-4 h-4 mr-1" /> 重启
          </Button>
          <Button variant="outline" size="sm" className="text-red-500"
            onClick={() => { if (confirm("确认删除此任务？")) deleteJob.mutate({ id: jobId }); }}>
            <XCircle className="w-4 h-4 mr-1" /> 删除
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "已采集", value: job.successCount ?? 0, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "失败数", value: job.failCount ?? 0, icon: XCircle, color: "text-red-600 bg-red-50" },
          { label: "重复数", value: job.duplicateCount ?? 0, icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50" },
          { label: "进度", value: `${job.progress ?? 0}%`, icon: Activity, color: "text-blue-600 bg-blue-50" },
        ].map(item => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <span className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 进度条 */}
      {job.status === "running" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>采集进度</span>
              <span>{job.progress ?? 0}%（已采集 {job.successCount ?? 0} 条）</span>
            </div>
            <Progress value={job.progress ?? 0} className="h-2" />
            {job.startedAt && (
              <p className="text-xs text-gray-400 mt-2">
                开始时间：{format(new Date(job.startedAt), "yyyy-MM-dd HH:mm:ss")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {job.errorMessage && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">任务错误</p>
              <p className="text-sm text-red-600 mt-0.5">{job.errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="logs" className="gap-1.5">
            <Terminal className="w-4 h-4" /> 实时日志
            <span className="text-xs text-gray-400">({logs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <Database className="w-4 h-4" /> 采集数据
            <span className="text-xs text-gray-400">({casesData?.total ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <BarChart3 className="w-4 h-4" /> 执行历史
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <List className="w-4 h-4" /> 任务配置
          </TabsTrigger>
        </TabsList>

        {/* ── 实时日志 ── */}
        <TabsContent value="logs" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4" /> 任务日志
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={logLevel ?? "all"} onValueChange={v => setLogLevel(v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="info">INFO</SelectItem>
                    <SelectItem value="success">SUCCESS</SelectItem>
                    <SelectItem value="warn">WARN</SelectItem>
                    <SelectItem value="error">ERROR</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportLogs}>
                  <Download className="w-3 h-3 mr-1" /> 导出日志
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gray-900 rounded-b-lg font-mono text-xs p-4 h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center mt-8">暂无日志，启动任务后将在此显示...</p>
                ) : logs.map((log: any, i: number) => (
                  <div key={i} className={`mb-0.5 ${LOG_COLORS[log.level] ?? "text-gray-300"}`}>
                    <span className="text-gray-600 mr-2">
                      {log.createdAt ? format(new Date(log.createdAt), "HH:mm:ss") : ""}
                    </span>
                    <span className="mr-2 uppercase text-xs opacity-70">[{log.level}]</span>
                    <span>{log.message}</span>
                    {log.details && (
                      <span className="text-gray-500 ml-2 text-xs">{JSON.stringify(log.details)}</span>
                    )}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 采集数据 ── */}
        <TabsContent value="data" className="mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                采集数据预览（共 {casesData?.total ?? 0} 条）
              </CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportCSV}>
                <Download className="w-3 h-3 mr-1" /> 导出 CSV
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["地址", "区域", "面积(㎡)", "单价(元/㎡)", "总价(万元)", "成交日期", "来源"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cases.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                      暂无采集数据
                    </td></tr>
                  ) : cases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 max-w-[180px] truncate">{c.address ?? "—"}</td>
                      <td className="px-3 py-2">{c.district ?? "—"}</td>
                      <td className="px-3 py-2">{c.area ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">
                        {c.unitPrice ? Number(c.unitPrice).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {c.totalPrice ? (Number(c.totalPrice) / 10000).toFixed(0) + " 万" : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {c.dealDate ?? (c.createdAt ? format(new Date(c.createdAt), "yyyy-MM-dd") : "—")}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[c.source] ?? c.source ?? "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(casesData?.total ?? 0) > 20 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
                <span>第 {dataPage} 页 / 共 {Math.ceil((casesData?.total ?? 0) / 20)} 页</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={dataPage <= 1}
                    onClick={() => setDataPage(p => p - 1)}>上一页</Button>
                  <Button variant="outline" size="sm"
                    disabled={dataPage * 20 >= (casesData?.total ?? 0)}
                    onClick={() => setDataPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── 执行历史 ── */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">执行历史记录</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["触发方式", "状态", "开始时间", "结束时间", "耗时", "备注"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无执行记录</td></tr>
                  ) : history.map((h: any) => {
                    const duration = h.startedAt && h.completedAt
                      ? Math.round((new Date(h.completedAt).getTime() - new Date(h.startedAt).getTime()) / 1000)
                      : null;
                    return (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-xs">
                            {h.triggeredBy === "cron" ? "定时触发" : "手动触发"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            h.status === "success" ? "bg-green-100 text-green-700" :
                            h.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {h.status === "success" ? "成功" : h.status === "failed" ? "失败" : "跳过"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {h.startedAt ? format(new Date(h.startedAt), "MM-dd HH:mm:ss") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {h.completedAt ? format(new Date(h.completedAt), "MM-dd HH:mm:ss") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {duration !== null ? `${duration}s` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-500">
                          {h.errorMessage ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── 任务配置 ── */}
        <TabsContent value="config" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">任务配置详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "任务 ID", value: `#${job.id}` },
                  { label: "数据来源", value: SOURCE_LABELS[job.source] ?? job.source },
                  { label: "数据类型", value: job.dataType },
                  { label: "目标城市", value: job.cityName ?? "全国" },
                  { label: "目标区域", value: job.districtName ?? "—" },
                  { label: "最大页数", value: `${job.maxPages} 页` },
                  { label: "并发数", value: `${job.concurrency} 个` },
                  { label: "延迟范围", value: `${job.delayMin}~${job.delayMax}ms` },
                  { label: "使用代理", value: job.useProxy ? "是" : "否" },
                  { label: "调度类型", value: job.scheduleType === "cron" ? "定时" : "手动" },
                  { label: "Cron 表达式", value: job.cronExpression ?? "—" },
                  { label: "创建时间", value: job.createdAt ? format(new Date(job.createdAt), "yyyy-MM-dd HH:mm") : "—" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
