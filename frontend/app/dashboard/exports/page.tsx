"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const EXPORT_TYPES = [
  { code: "projects", label: "项目数据", icon: "📋", desc: "导出所有项目列表，包含状态、委托方、预算等信息" },
  { code: "reports", label: "报告数据", icon: "📄", desc: "导出所有估价报告，包含估价结果、审核状态等" },
  { code: "billing", label: "账单记录", icon: "💰", desc: "导出订阅和支付账单记录" },
  { code: "cases", label: "案例数据", icon: "🏠", desc: "导出房屋案例数据（楼盘/楼栋/套间）" },
];

const FORMAT_OPTIONS = [
  { code: "excel", label: "Excel (.xlsx)", icon: "📊", desc: "可用 Excel/WPS 打开，支持筛选排序" },
  { code: "pdf", label: "PDF (.pdf)", icon: "📕", desc: "适合打印和存档，格式固定" },
  { code: "csv", label: "CSV (.csv)", icon: "📃", desc: "纯文本格式，适合数据分析工具导入" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "等待中", color: "bg-gray-100 text-gray-600" },
  processing: { label: "处理中", color: "bg-blue-100 text-blue-600" },
  done: { label: "已完成", color: "bg-green-100 text-green-600" },
  failed: { label: "失败", color: "bg-red-100 text-red-600" },
};

function formatFileSize(bytes: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ExportsPage() {
  const [selectedType, setSelectedType] = useState("projects");
  const [selectedFormat, setSelectedFormat] = useState("excel");
  const [pollingTaskNo, setPollingTaskNo] = useState<string | null>(null);

  const { data: tasksData, refetch } = trpc.exports.myTasks.useQuery({ page: 1, pageSize: 20 });
  const createTask = trpc.exports.createTask.useMutation({
    onSuccess: (data) => {
      toast.success("导出任务已创建，正在处理...");
      setPollingTaskNo(data.taskNo);
      // 轮询任务状态
      const timer = setInterval(async () => {
        await refetch();
      }, 2000);
      setTimeout(() => clearInterval(timer), 60000);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteTask = trpc.exports.deleteTask.useMutation({
    onSuccess: () => { toast.success("已删除"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleExport = () => {
    createTask.mutate({ type: selectedType as any, format: selectedFormat as any });
  };

  const handleDownload = (task: any) => {
    if (!task.file_url) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.gujia.app";
    window.open(`${backendUrl}${task.file_url}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据导出</h1>
        <p className="text-gray-500 mt-1">批量导出项目、报告、账单等数据为 Excel、PDF 或 CSV 格式</p>
      </div>

      {/* 新建导出任务 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">新建导出任务</h2>

        <div className="space-y-5">
          {/* 选择数据类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择数据类型</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EXPORT_TYPES.map(type => (
                <button
                  key={type.code}
                  onClick={() => setSelectedType(type.code)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                    selectedType === type.code
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-sm text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 选择格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择导出格式</label>
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map(fmt => (
                <button
                  key={fmt.code}
                  onClick={() => setSelectedFormat(fmt.code)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                    selectedFormat === fmt.code
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-xl mb-1">{fmt.icon}</div>
                  <div className="font-medium text-sm text-gray-900">{fmt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={createTask.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createTask.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                开始导出{" "}
                {EXPORT_TYPES.find(t => t.code === selectedType)?.label}（
                {FORMAT_OPTIONS.find(f => f.code === selectedFormat)?.label}）
              </>
            )}
          </button>
        </div>
      </div>

      {/* 导出历史 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">导出历史</h2>
          <button onClick={() => refetch()} className="text-sm text-blue-600 hover:text-blue-700">
            刷新
          </button>
        </div>

        {!tasksData?.items?.length ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无导出记录</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasksData.items.map((task: any) => {
              const status = STATUS_LABELS[task.status] || { label: task.status, color: "bg-gray-100 text-gray-600" };
              const typeMeta = EXPORT_TYPES.find(t => t.code === task.type);
              const fmtMeta = FORMAT_OPTIONS.find(f => f.code === task.format);

              return (
                <div key={task.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="text-2xl">{typeMeta?.icon || "📦"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {typeMeta?.label || task.type}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{fmtMeta?.label || task.format}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                      <span>{task.task_no}</span>
                      {task.total_rows > 0 && <span>{task.total_rows.toLocaleString()} 条记录</span>}
                      {task.file_size > 0 && <span>{formatFileSize(task.file_size)}</span>}
                      {task.status === "processing" && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          处理中...
                        </span>
                      )}
                      {task.error_msg && <span className="text-red-500">{task.error_msg}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "done" && task.file_url && (
                      <button
                        onClick={() => handleDownload(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        下载
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask.mutate({ taskNo: task.task_no })}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <div className="font-medium mb-1">📌 使用说明</div>
        <ul className="space-y-1 text-blue-600 text-xs">
          <li>• 导出任务在后台异步处理，大量数据可能需要 1-2 分钟</li>
          <li>• 导出文件保留 24 小时，请及时下载</li>
          <li>• Excel 格式支持筛选、排序，推荐日常使用</li>
          <li>• PDF 格式适合打印存档，每页最多显示 20 条记录</li>
          <li>• CSV 格式适合导入其他数据分析工具（如 Python、R）</li>
        </ul>
      </div>
    </div>
  );
}
