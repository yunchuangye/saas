"use client"

import { useEffect, useRef, useState } from "react"
import { X, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// 类型定义
// ============================================================

export interface PreviewFile {
  url: string
  originalName: string
  mimeType: string
  size?: number
}

interface FilePreviewModalProps {
  file: PreviewFile | null
  files?: PreviewFile[]       // 多文件时支持前后翻页
  currentIndex?: number
  onClose: () => void
  onNavigate?: (index: number) => void
}

// ============================================================
// 工具函数
// ============================================================

function getPreviewType(mimeType: string, fileName: string): "image" | "pdf" | "office" | "text" | "unsupported" {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "application/pdf") return "pdf"
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) return "office"
  if (mimeType === "text/plain" || fileName.endsWith(".txt")) return "text"
  return "unsupported"
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================================
// 图片预览子组件
// ============================================================

function ImagePreview({ url, name }: { url: string; name: string }) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 4))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.25))
  const rotate = () => setRotation(r => (r + 90) % 360)
  const reset = () => { setScale(1); setRotation(0) }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-shrink-0">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={rotate}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="旋转"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
        >
          重置
        </button>
      </div>

      {/* 图片展示区 */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-checkered p-4 min-h-0"
        style={{ background: "repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 0 0 / 20px 20px" }}
      >
        {!loaded && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        )}
        <img
          src={url}
          alt={name}
          className={cn("max-w-none transition-transform duration-200 select-none shadow-lg", !loaded && "hidden")}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>
    </div>
  )
}

// ============================================================
// PDF 预览子组件
// ============================================================

function PdfPreview({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">正在加载 PDF...</span>
          </div>
        </div>
      )}
      <iframe
        src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
        className="flex-1 w-full border-0"
        title={name}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

// ============================================================
// Office 文档预览子组件（Microsoft Office Online）
// ============================================================

function OfficePreview({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const [useGoogle, setUseGoogle] = useState(false)

  // 判断 URL 是否为公网可访问（localhost 不能用 Office Online）
  const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1")

  // Office Online 预览 URL
  const officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  // Google Docs 预览 URL（备用）
  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

  const previewUrl = useGoogle ? googleDocsUrl : officeOnlineUrl

  if (isLocalhost) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-4xl">📄</div>
        <p className="text-muted-foreground text-sm max-w-sm">
          Office 文档在线预览需要公网可访问的文件地址。
          <br />
          当前文件存储在本地服务器，请下载后查看，或配置 OSS 存储以支持在线预览。
        </p>
        <a
          href={url}
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          下载文件
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 切换预览引擎 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-shrink-0 text-xs text-muted-foreground">
        <span>预览引擎：</span>
        <button
          onClick={() => { setUseGoogle(false); setLoaded(false) }}
          className={cn("px-2 py-0.5 rounded", !useGoogle ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          Microsoft Office
        </button>
        <button
          onClick={() => { setUseGoogle(true); setLoaded(false) }}
          className={cn("px-2 py-0.5 rounded", useGoogle ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          Google Docs
        </button>
        <span className="ml-auto text-xs">如预览失败，请切换引擎或下载查看</span>
      </div>

      <div className="flex-1 relative min-h-0">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">正在加载文档预览...</span>
            </div>
          </div>
        )}
        <iframe
          key={previewUrl}
          src={previewUrl}
          className="w-full h-full border-0"
          title={name}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  )
}

// ============================================================
// 纯文本预览子组件
// ============================================================

function TextPreview({ url, name }: { url: string; name: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(r => r.text())
      .then(text => { setContent(text); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [url])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        加载失败：{error}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 h-full">
      <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground leading-relaxed">
        {content}
      </pre>
    </div>
  )
}

// ============================================================
// 主预览模态框组件
// ============================================================

export function FilePreviewModal({
  file,
  files = [],
  currentIndex = 0,
  onClose,
  onNavigate,
}: FilePreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // 键盘快捷键
  useEffect(() => {
    if (!file) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && files.length > 1 && currentIndex > 0) {
        onNavigate?.(currentIndex - 1)
      }
      if (e.key === "ArrowRight" && files.length > 1 && currentIndex < files.length - 1) {
        onNavigate?.(currentIndex + 1)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [file, files, currentIndex, onClose, onNavigate])

  // 禁止背景滚动
  useEffect(() => {
    if (file) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [file])

  if (!file) return null

  const previewType = getPreviewType(file.mimeType, file.originalName)
  const hasPrev = files.length > 1 && currentIndex > 0
  const hasNext = files.length > 1 && currentIndex < files.length - 1

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div className="relative bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(90vw, 1000px)", height: "min(90vh, 700px)" }}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{file.originalName}</h3>
            {file.size && (
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            )}
          </div>

          {/* 多文件翻页 */}
          {files.length > 1 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <button
                onClick={() => onNavigate?.(currentIndex - 1)}
                disabled={!hasPrev}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[60px] text-center text-xs">
                {currentIndex + 1} / {files.length}
              </span>
              <button
                onClick={() => onNavigate?.(currentIndex + 1)}
                disabled={!hasNext}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="在新标签页打开"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={file.url}
              download={file.originalName}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="下载文件"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="关闭预览（Esc）"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 预览内容区 */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {previewType === "image" && (
            <ImagePreview url={file.url} name={file.originalName} />
          )}
          {previewType === "pdf" && (
            <PdfPreview url={file.url} name={file.originalName} />
          )}
          {previewType === "office" && (
            <OfficePreview url={file.url} name={file.originalName} />
          )}
          {previewType === "text" && (
            <TextPreview url={file.url} name={file.originalName} />
          )}
          {previewType === "unsupported" && (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="text-4xl">📎</div>
              <p className="text-muted-foreground text-sm">
                此文件类型暂不支持在线预览
              </p>
              <a
                href={file.url}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                下载文件
              </a>
            </div>
          )}
        </div>

        {/* 底部文件导航缩略图（多文件时显示） */}
        {files.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/20 overflow-x-auto flex-shrink-0">
            {files.map((f, idx) => (
              <button
                key={f.url}
                onClick={() => onNavigate?.(idx)}
                className={cn(
                  "flex-shrink-0 text-xs px-2 py-1 rounded border transition-colors max-w-[120px] truncate",
                  idx === currentIndex
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                )}
                title={f.originalName}
              >
                {f.originalName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
