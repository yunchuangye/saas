"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, QrCode, Share2, MessageCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  url: string
  description?: string
  qrUrl?: string
}

export function ShareDialog({ open, onClose, title = "分享链接", url, description, qrUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement("textarea")
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const channels = [
    { name: "微信", icon: MessageCircle, color: "bg-green-500", action: () => handleCopy() },
    { name: "朋友圈", icon: Share2, color: "bg-green-600", action: () => handleCopy() },
    { name: "微博", icon: Send, color: "bg-red-500", action: () => handleCopy() },
    { name: "复制链接", icon: Copy, color: "bg-gray-500", action: handleCopy },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {description && (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">{description}</p>
          )}
          {/* 链接复制 */}
          <div className="flex gap-2">
            <Input value={url} readOnly className="text-xs font-mono bg-muted/30" />
            <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          {/* 分享渠道 */}
          <div className="grid grid-cols-4 gap-3">
            {channels.map((ch) => (
              <button
                key={ch.name}
                onClick={ch.action}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-2.5 text-white", ch.color)}>
                  <ch.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground">{ch.name}</span>
              </button>
            ))}
          </div>
          {/* 二维码区域 */}
          {qrUrl && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-4">
              <QrCode className="h-12 w-12 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">扫码访问（二维码生成中）</p>
              <p className="text-xs font-mono text-blue-600 break-all text-center">{qrUrl}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
