"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Play, Pause, RefreshCw, Terminal,
  Database, CheckCircle, XCircle, Clock, Activity,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "待执行", color: "bg-gray-100 text-gray-700" },
  running:   { label: "采集中", color: "bg-blue-100 text-blue-700" },
  paused:    { label: "已暂停", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  failed:    { label: "失败",   color: "bg-red-100 text-red-700" },
};

const LOG_COLORS: Record<string, string> = {
  info:    "text-gray-300",
  warn:    "text-yellow-400",
  error:   "text-red-400",
  success: "text-green-400",
};

export default function CrawlerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: job, refetch: refetchJob } = trpc.crawl.getJob.useQuery({ id: jobId });
  const { data: logsData, refetch: refetchLogs } = trpc.crawl.getJobLogs.useQuery({ jobId, limit: 200 });
  const { data: rawData, refetch: refetchData } = trpc.crawl.getJobData.useQuery({ jobId, page: 1, pageSize: 20 });

  const startJob = trpc.crawl.startJob.useMutation({
    onSuccess: () => { toast.success("任务已启动"); refetchJob(); },
    onError: (e) => toast.error(e.message),
  });
  const pauseJob = trpc.crawl.pauseJob.useMutation({
    onSuccess: () => { toast.success("任务已暂停"); refetchJob(); },
    onError: (e) => toast.error(e.message),
  });

  // 自动刷新（运行中时每3秒刷新）
  useEffect(() => {
    if (job?.status === 'running') {
      setAutoRefresh(true);
    } else {
      setAutoRefresh(false);
    }
  }, [job?.status]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      refetchJob();
      refetchLogs();
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // 日志自动滚动到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logsData]);

  if (!job) return <div className="p-6 text-gray-400">加载中...</div>;

  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="p-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.name}</h1>
            <p className="text-xs text-gray-500">任务 #{job.id} · 创建于 {new Date(job.createdAt!).toLocaleString('zh-CN')}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchJob(); refetchLogs(); refetchData(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
          {(job.status === 'pending' || job.status === 'paused' || job.status === 'failed' || job.status === 'completed') && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => startJob.mutate({ id: jobId })}>
              <Play className="w-4 h-4 mr-1" /> 启动采集
            </Button>
          )}
          {job.status === 'running' && (
            <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-600"
              onClick={() => pauseJob.mutate({ id: jobId })}>
              <Pause className="w-4 h-4 mr-1" /> 暂停
            </Button>
          )}
        </div>
      </div>

      {/* 任务概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">成功采集</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{job.successCount ?? 0}</p>
            <p className="text-xs text-gray-400">条有效数据</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-500">失败页面</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{job.failCount ?? 0}</p>
            <p className="text-xs text-gray-400">个页面失败</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">重复数据</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{job.duplicateCount ?? 0}</p>
            <p className="text-xs text-gray-400">条已去重</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500">采集进度</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{job.progress ?? 0}%</p>
            <Progress value={job.progress ?? 0} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* 任务配置信息 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">任务配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { label: "数据来源", value: job.source },
              { label: "数据类型", value: job.dataType },
              { label: "目标城市", value: job.cityName ?? "—" },
              { label: "目标区域", value: job.districtName ?? "全市" },
              { label: "最大页数", value: `${job.maxPages} 页` },
              { label: "并发数", value: job.concurrency },
              { label: "延迟范围", value: `${job.delayMin}~${job.delayMax}ms` },
              { label: "调度方式", value: job.scheduleType === 'cron' ? `定时: ${job.cronExpression}` : "手动" },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="font-medium text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 日志和数据 Tabs */}
      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">
            <Terminal className="w-4 h-4 mr-1" /> 实时日志
            {logsData && <Badge variant="secondary" className="ml-1 text-xs">{logsData.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="w-4 h-4 mr-1" /> 采集数据预览
            {rawData && <Badge variant="secondary" className="ml-1 text-xs">{rawData.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* 日志面板 */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <div className="bg-gray-950 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
                {!logsData || logsData.length === 0 ? (
                  <p className="text-gray-500 text-center mt-8">暂无日志</p>
                ) : (
                  logsData.map((log, i) => (
                    <div key={i} className={`mb-1 ${LOG_COLORS[log.level] ?? 'text-gray-300'}`}>
                      <span className="text-gray-600 mr-2">
                        {new Date(log.createdAt!).toLocaleTimeString('zh-CN')}
                      </span>
                      <span className={`mr-2 uppercase font-bold text-[10px] ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'success' ? 'text-green-400' :
                        log.level === 'warn' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>[{log.level}]</span>
                      <span>{log.message}</span>
                      {log.url && <span className="text-gray-600 ml-2 truncate block pl-20">{log.url}</span>}
                      {(log.dataCount ?? 0) > 0 && (
                        <span className="text-green-500 ml-2">+{log.dataCount} 条</span>
                      )}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据预览面板 */}
        <TabsContent value="data">
          <Card>
            <CardContent className="p-4">
              {!rawData || rawData.data.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>暂无采集数据</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">共采集 {rawData.total} 批次数据</p>
                  {rawData.data.map((item, i) => {
                    const parsed = item.parsedData as any[];
                    return (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">{item.source}</Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt!).toLocaleString('zh-CN')}
                          </span>
                          <Badge className={`text-xs ${item.status === 'imported' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </Badge>
                        </div>
                        {parsed && parsed.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-1.5 font-medium text-gray-600">小区</th>
                                  <th className="text-left p-1.5 font-medium text-gray-600">户型</th>
                                  <th className="text-right p-1.5 font-medium text-gray-600">面积</th>
                                  <th className="text-right p-1.5 font-medium text-gray-600">总价</th>
                                  <th className="text-right p-1.5 font-medium text-gray-600">单价</th>
                                  <th className="text-left p-1.5 font-medium text-gray-600">成交日期</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parsed.slice(0, 5).map((c: any, j: number) => (
                                  <tr key={j} className="border-t hover:bg-gray-50">
                                    <td className="p-1.5 text-gray-700 max-w-[120px] truncate">{c.community || c.title}</td>
                                    <td className="p-1.5 text-gray-600">{c.rooms || '—'}</td>
                                    <td className="p-1.5 text-right text-gray-600">{c.area ? `${c.area}㎡` : '—'}</td>
                                    <td className="p-1.5 text-right font-medium text-gray-800">
                                      {c.totalPrice ? `${(c.totalPrice / 10000).toFixed(0)}万` : '—'}
                                    </td>
                                    <td className="p-1.5 text-right text-blue-600">
                                      {c.unitPrice ? `${c.unitPrice.toLocaleString()}元/㎡` : '—'}
                                    </td>
                                    <td className="p-1.5 text-gray-500">{c.dealDate || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {parsed.length > 5 && (
                              <p className="text-xs text-gray-400 mt-1 text-center">...还有 {parsed.length - 5} 条</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
