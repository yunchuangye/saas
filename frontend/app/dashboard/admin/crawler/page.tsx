"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Play, Pause, Trash2, Eye, Plus, RefreshCw,
  Database, Activity, CheckCircle, XCircle, Clock,
} from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  lianjia: "链家",
  beike: "贝壳找房",
  anjuke: "安居客",
  fang58: "58同城",
  custom: "自定义",
};

const DATA_TYPE_LABELS: Record<string, string> = {
  sold_cases: "二手房成交案例",
  listing: "在售挂牌房源",
  estate_info: "楼盘基础信息",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: "待执行", color: "bg-gray-100 text-gray-700",   icon: Clock },
  running:   { label: "采集中", color: "bg-blue-100 text-blue-700",   icon: Activity },
  paused:    { label: "已暂停", color: "bg-yellow-100 text-yellow-700", icon: Pause },
  completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: CheckCircle },
  failed:    { label: "失败",   color: "bg-red-100 text-red-700",     icon: XCircle },
};

export default function CrawlerPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    source: "lianjia",
    dataType: "sold_cases",
    cityId: undefined as number | undefined,
    cityName: "",
    districtName: "",
    keyword: "",
    maxPages: 5,
    concurrency: 2,
    delayMin: 2000,
    delayMax: 5000,
    useProxy: false,
    scheduleType: "manual",
  });

  const { data, refetch, isLoading } = trpc.crawl.listJobs.useQuery({ page, pageSize: 20 });
  const { data: stats } = trpc.crawl.getStats.useQuery();
  const { data: queueStats } = trpc.crawl.getQueueStats.useQuery();
  const { data: citiesData } = trpc.crawl.getCities.useQuery();

  const createJob = trpc.crawl.createJob.useMutation({
    onSuccess: () => { toast.success("任务创建成功"); setCreateOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const startJob = trpc.crawl.startJob.useMutation({
    onSuccess: () => { toast.success("任务已加入队列，开始采集"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const pauseJob = trpc.crawl.pauseJob.useMutation({
    onSuccess: () => { toast.success("任务已暂停"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteJob = trpc.crawl.deleteJob.useMutation({
    onSuccess: () => { toast.success("任务已删除"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.name) return toast.error("请填写任务名称");
    if (!form.cityName && form.source !== "custom") return toast.error("请选择城市");
    createJob.mutate(form as any);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据采集中心</h1>
          <p className="text-sm text-gray-500 mt-1">管理房产数据爬虫任务，自动采集成交案例和楼盘信息</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" /> 新建采集任务
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新建数据采集任务</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="col-span-2">
                  <Label>任务名称 *</Label>
                  <Input placeholder="如：北京朝阳区二手房成交案例" value={form.name}
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
                    <SelectContent>
                      {citiesData?.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name} ({c.province})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>目标区域（可选）</Label>
                  <Input placeholder="如：朝阳区" value={form.districtName}
                    onChange={e => setForm(f => ({ ...f, districtName: e.target.value }))} />
                </div>
                <div>
                  <Label>最大采集页数</Label>
                  <Input type="number" min={1} max={100} value={form.maxPages}
                    onChange={e => setForm(f => ({ ...f, maxPages: parseInt(e.target.value) || 5 }))} />
                  <p className="text-xs text-gray-400 mt-1">每页约 20 条，建议不超过 50 页</p>
                </div>
                <div>
                  <Label>并发数（1-5）</Label>
                  <Input type="number" min={1} max={5} value={form.concurrency}
                    onChange={e => setForm(f => ({ ...f, concurrency: parseInt(e.target.value) || 2 }))} />
                  <p className="text-xs text-gray-400 mt-1">并发越高速度越快，但触发反爬风险越大</p>
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
                {form.source === "custom" && (
                  <div className="col-span-2">
                    <Label>自定义 URL</Label>
                    <Input placeholder="https://..." value={form.keyword}
                      onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
                <Button onClick={handleCreate} disabled={createJob.isPending}>
                  {createJob.isPending ? "创建中..." : "创建任务"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500">成交案例总量</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCases?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500">近7天新增</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.recentCases?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-gray-500">运行中任务</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.runningJobs ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-gray-500">队列等待</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats?.waiting ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据来源分布 */}
      {stats?.sourceStats && stats.sourceStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">数据来源分布</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-3">
              {stats.sourceStats.map((s: any) => (
                <div key={s.source} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  <Badge variant="secondary">{s.count} 条</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">采集任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : data?.jobs.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无采集任务</p>
              <p className="text-sm text-gray-400 mt-1">点击"新建采集任务"开始数据采集</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.jobs.map((job) => {
                const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 truncate">{job.name}</h3>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                          <Badge variant="outline" className="text-xs">{SOURCE_LABELS[job.source] ?? job.source}</Badge>
                          <Badge variant="outline" className="text-xs">{DATA_TYPE_LABELS[job.dataType] ?? job.dataType}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>城市：{job.cityName ?? '—'}</span>
                          {job.districtName && <span>区域：{job.districtName}</span>}
                          <span>最大 {job.maxPages} 页</span>
                          <span>并发 {job.concurrency}</span>
                          <span>创建：{new Date(job.createdAt!).toLocaleString('zh-CN')}</span>
                        </div>
                        {job.status === 'running' && (
                          <div className="mt-2 space-y-1">
                            <Progress value={job.progress ?? 0} className="h-1.5" />
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span className="text-green-600">✓ 成功 {job.successCount}</span>
                              <span className="text-red-500">✗ 失败 {job.failCount}</span>
                              <span className="text-gray-400">重复 {job.duplicateCount}</span>
                              <span className="ml-auto">{job.progress}%</span>
                            </div>
                          </div>
                        )}
                        {job.status === 'completed' && (
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-green-600 font-medium">✓ 成功采集 {job.successCount} 条</span>
                            {(job.duplicateCount ?? 0) > 0 && <span className="text-gray-400">去重 {job.duplicateCount} 条</span>}
                            {(job.failCount ?? 0) > 0 && <span className="text-red-400">失败 {job.failCount} 页</span>}
                          </div>
                        )}
                        {job.status === 'failed' && job.errorMessage && (
                          <p className="text-xs text-red-500 mt-1 truncate">{job.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/admin/crawler/${job.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(job.status === 'pending' || job.status === 'paused' || job.status === 'failed' || job.status === 'completed') && (
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700"
                            onClick={() => startJob.mutate({ id: job.id })}>
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === 'running' && (
                          <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700"
                            onClick={() => pauseJob.mutate({ id: job.id })}>
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"
                          onClick={() => { if (confirm('确认删除此任务？')) deleteJob.mutate({ id: job.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
