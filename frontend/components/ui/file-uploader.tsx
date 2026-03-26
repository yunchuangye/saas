"use client"

import { useState, useRef, useCallback } from "react"
import { X, Upload, FileText, Image, File, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilePreviewModal, type PreviewFile } from "./file-preview-modal"

// ============================================================
// 类型定义
// ============================================================

export interface UploadedFile {
  /** 唯一标识（本地临时 ID） */
  id: string
  /** 原始文件名 */
  originalName: string
  /** 存储文件名 */
  storedName: string
  /** 访问 URL */
  url: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  mimeType: string
  /** 存储方式 */
  storage: "local" | "oss"
  /** 存储模式 */
  storageMode: "local" | "oss"
}

interface FileItem {
  id: string
  file: File
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  result?: UploadedFile
  error?: string
  /** 本地 ObjectURL，用于上传成功后立即预览 */
  localUrl?: string
}

interface FileUploaderProps {
  /** 已上传文件列表（受控） */
  value?: UploadedFile[]
  /** 文件列表变化回调 */
  onChange?: (files: UploadedFile[]) => void
  /** 后端 API 地址，默认从环境变量读取 */
  apiBase?: string
  /** 最多上传文件数，默认 10 */
  maxFiles?: number
  /** 最大文件大小（字节），默认 10MB */
  maxSize?: number
  /** 允许的文件类型（MIME），默认支持 PDF/Word/Excel/图片 */
  accept?: string[]
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义 className */
  className?: string
}

// ============================================================
// 工具函数
// ============================================================

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />
  if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />
  if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-4 w-4 text-blue-600" />
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileText className="h-4 w-4 text-green-600" />
  return <File className="h-4 w-4 text-gray-500" />
}

/** 判断文件类型是否支持在线预览 */
function canPreview(mimeType: string, fileName: string): boolean {
  if (mimeType.startsWith("image/")) return true
  if (mimeType === "application/pdf") return true
  if (mimeType === "text/plain") return true
  if (
    mimeType.includes("word") || mimeType.includes("document") ||
    mimeType.includes("excel") || mimeType.includes("spreadsheet") ||
    fileName.endsWith(".doc") || fileName.endsWith(".docx") ||
    fileName.endsWith(".xls") || fileName.endsWith(".xlsx")
  ) return true
  return false
}

const DEFAULT_ACCEPT = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]

// ============================================================
// 主组件
// ============================================================

export function FileUploader({
  value = [],
  onChange,
  apiBase,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept = DEFAULT_ACCEPT,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [items, setItems] = useState<FileItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 预览状态
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  // 获取后端地址
  const getApiBase = useCallback(() => {
    if (apiBase) return apiBase
    return process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.gujia.app"
  }, [apiBase])

  // 上传单个文件
  const uploadFile = useCallback(async (fileItem: FileItem) => {
    setItems(prev => prev.map(i => i.id === fileItem.id ? { ...i, status: "uploading", progress: 10 } : i))

    try {
      const formData = new FormData()
      formData.append("file", fileItem.file)

      // 从 cookie 读取 token（兼容跨域场景）
      const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]

      const resp = await fetch(`${getApiBase()}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      })

      setItems(prev => prev.map(i => i.id === fileItem.id ? { ...i, progress: 80 } : i))

      const data = await resp.json()

      if (!resp.ok || !data.success) {
        throw new Error(data.error || "上传失败")
      }

      const result: UploadedFile = data

      setItems(prev => prev.map(i =>
        i.id === fileItem.id ? { ...i, status: "success", progress: 100, result } : i
      ))

      // 通知父组件
      onChange?.([...value, result])
    } catch (err: any) {
      setItems(prev => prev.map(i =>
        i.id === fileItem.id ? { ...i, status: "error", progress: 0, error: err.message } : i
      ))
    }
  }, [getApiBase, value, onChange])

  // 处理文件选择
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = maxFiles - value.length - items.filter(i => i.status !== "error").length

    if (remaining <= 0) {
      alert(`最多上传 ${maxFiles} 个文件`)
      return
    }

    const toUpload = fileArray.slice(0, remaining)
    const newItems: FileItem[] = []

    for (const file of toUpload) {
      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 超过大小限制（最大 ${formatSize(maxSize)}）`)
        continue
      }
      if (!accept.includes(file.type)) {
        alert(`文件 "${file.name}" 类型不支持，请上传 PDF、Word、Excel 或图片格式`)
        continue
      }
      // 创建本地预览 URL
      const localUrl = URL.createObjectURL(file)
      newItems.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: "pending",
        progress: 0,
        localUrl,
      })
    }

    if (newItems.length === 0) return

    setItems(prev => [...prev, ...newItems])

    // 依次上传
    for (const item of newItems) {
      uploadFile(item)
    }
  }, [maxFiles, maxSize, accept, value.length, items, uploadFile])

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  // 删除已上传文件
  const removeUploaded = (url: string) => {
    onChange?.(value.filter(f => f.url !== url))
  }

  // 删除上传中/失败的文件
  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (item?.localUrl) URL.revokeObjectURL(item.localUrl)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  // 打开预览（已上传文件）
  const openPreview = (file: UploadedFile, index: number) => {
    setPreviewFile({
      url: file.url,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    })
    setPreviewIndex(index)
  }

  // 打开预览（上传中/本地文件）
  const openLocalPreview = (item: FileItem) => {
    const url = item.result?.url || item.localUrl || ""
    setPreviewFile({
      url,
      originalName: item.file.name,
      mimeType: item.file.type,
      size: item.file.size,
    })
    setPreviewIndex(-1)
  }

  // 所有已上传文件列表（用于翻页）
  const allUploadedFiles: PreviewFile[] = value.map(f => ({
    url: f.url,
    originalName: f.originalName,
    mimeType: f.mimeType,
    size: f.size,
  }))

  const hasUploading = items.some(i => i.status === "uploading" || i.status === "pending")

  return (
    <div className={cn("space-y-3", className)}>
      {/* 拖拽上传区域 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept.join(",")}
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isDragOver ? "松开鼠标上传文件" : "拖拽文件到此处或点击上传"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          支持 PDF、Word、Excel、图片等格式，单文件最大 {formatSize(maxSize)}
        </p>
        {hasUploading && (
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>上传中...</span>
          </div>
        )}
      </div>

      {/* 上传中/失败的文件列表 */}
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              {getFileIcon(item.file.type)}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{item.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.status === "uploading" || item.status === "pending" ? (
                    <>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.progress}%</span>
                    </>
                  ) : item.status === "success" ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      上传成功 · {formatSize(item.file.size)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {item.error || "上传失败"}
                    </span>
                  )}
                </div>
              </div>
              {/* 预览按钮（上传成功后可预览） */}
              {item.status === "success" && canPreview(item.file.type, item.file.name) && (
                <button
                  type="button"
                  onClick={() => openLocalPreview(item)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="在线预览"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                disabled={item.status === "uploading"}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 已上传成功的文件列表 */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, idx) => (
            <li key={file.url} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm bg-muted/30">
              {getFileIcon(file.mimeType)}
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => canPreview(file.mimeType, file.originalName) ? openPreview(file, idx) : undefined}
                  className={cn(
                    "truncate font-medium block text-left w-full",
                    canPreview(file.mimeType, file.originalName)
                      ? "text-primary hover:underline cursor-pointer"
                      : "text-foreground cursor-default"
                  )}
                  title={canPreview(file.mimeType, file.originalName) ? "点击在线预览" : file.originalName}
                >
                  {file.originalName}
                </button>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatSize(file.size)} · {file.storageMode === "oss" ? "OSS 存储" : "本地存储"}
                  {canPreview(file.mimeType, file.originalName) && (
                    <span className="ml-1 text-primary/70">· 可在线预览</span>
                  )}
                </p>
              </div>
              {/* 预览按钮 */}
              {canPreview(file.mimeType, file.originalName) && (
                <button
                  type="button"
                  onClick={() => openPreview(file, idx)}
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  title="在线预览"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeUploaded(file.url)}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 在线预览模态框 */}
      <FilePreviewModal
        file={previewFile}
        files={previewIndex >= 0 ? allUploadedFiles : undefined}
        currentIndex={previewIndex >= 0 ? previewIndex : 0}
        onClose={() => setPreviewFile(null)}
        onNavigate={(idx) => {
          setPreviewIndex(idx)
          setPreviewFile(allUploadedFiles[idx])
        }}
      />
    </div>
  )
}
