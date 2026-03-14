"use client"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import {
  Copy, Check, Share2, Mail,
  Smartphone, ExternalLink, TrendingUp, Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"

// ─── 平台类型 ─────────────────────────────────────────────────────────────────
export type SharePlatform =
  | "wechat" | "moments" | "weibo" | "qq" | "qqzone"
  | "douyin" | "xiaohongshu" | "link" | "sms" | "email"

export type ShareContentType =
  | "invite" | "valuation" | "poster" | "report" | "pitchbook" | "coupon" | "group"

interface PlatformConfig {
  id: SharePlatform
  label: string
  shortLabel: string
  bgColor: string
  canDirectShare: boolean
  buildShareUrl?: (url: string, title: string, text: string) => string
  icon: React.ReactNode
}

// 微信 SVG 图标
const WechatIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 3.35c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm5.4 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z" />
  </svg>
)

// 微博 SVG 图标
const WeiboIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM21.2 12.248c-.24-.12-.404-.2-.28-.44.28-.6.32-1.2.04-1.6-.52-.76-1.96-.72-3.6-.04 0 0-.52.24-.38-.2.28-.88.24-1.6-.2-2.04-.96-.92-3.52.04-5.72 2.12C9.48 11.608 8.6 13.128 8.6 14.448c0 2.52 3.24 4.04 6.44 4.04 4.16 0 6.96-2.44 6.96-4.36 0-.76-.52-1.2-1.08-1.48l-.72-.4zM12 6.008c.28-.04.56-.04.84 0 .04 0 .08.04.08.08 0 .04-.04.08-.08.08-.28.04-.56.04-.84 0-.04 0-.08-.04-.08-.08 0-.04.04-.08.08-.08zm4.48-1.6c1.44.4 2.52 1.44 2.92 2.8.04.12-.04.24-.16.28-.12.04-.24-.04-.28-.16-.36-1.2-1.32-2.12-2.6-2.48-.12-.04-.2-.16-.16-.28.04-.12.16-.2.28-.16zM12.72 3.2c2.88.52 5.04 2.72 5.52 5.52.04.12-.04.24-.16.28-.12.04-.24-.04-.28-.16-.44-2.6-2.44-4.64-5.08-5.08-.12-.04-.2-.16-.16-.28.04-.12.16-.2.16-.28z" />
  </svg>
)

// QQ SVG 图标
const QQIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M12.003 2c-4.265 0-7.503 3.143-7.503 8.219 0 1.666.318 2.965.794 4.052-.144.481-.415 1.32-.415 1.32s-.028.085-.028.2c0 .397.354.72.79.72.282 0 .53-.14.673-.35.244.43.54.84.882 1.22-.44.25-.74.72-.74 1.26 0 .81.65 1.46 1.46 1.46.5 0 .94-.25 1.2-.63.58.2 1.2.31 1.87.31.67 0 1.29-.11 1.87-.31.26.38.7.63 1.2.63.81 0 1.46-.65 1.46-1.46 0-.54-.3-1.01-.74-1.26.342-.38.638-.79.882-1.22.143.21.391.35.673.35.436 0 .79-.323.79-.72 0-.115-.028-.2-.028-.2s-.271-.839-.415-1.32c.476-1.087.794-2.386.794-4.052C19.506 5.143 16.268 2 12.003 2z" />
  </svg>
)

// 抖音 SVG 图标
const DouyinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004C16.368 1.249 16.419 1 16.419 1h-3.934v14.71c0 .197 0 .392-.008.585 0 .023-.002.044-.004.068v.012c-.053.638-.285 1.234-.668 1.718a3.109 3.109 0 0 1-2.499 1.256 3.12 3.12 0 0 1-3.12-3.12 3.12 3.12 0 0 1 3.12-3.12c.305 0 .599.044.876.126V8.993a7.063 7.063 0 0 0-.876-.055 7.054 7.054 0 0 0-7.054 7.054 7.054 7.054 0 0 0 7.054 7.054 7.054 7.054 0 0 0 7.054-7.054V9.383a10.063 10.063 0 0 0 5.879 1.89V7.34s-2.321.11-4.918-1.778z" />
  </svg>
)

// 小红书 SVG 图标
const XiaohongshuIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 13.5H13v1.5h-1.5V15.5H10V14h1.5v-1.5H10V11h1.5V9.5H13V11h1.5v1.5H13V14h1.5v1.5z" />
  </svg>
)

// QQ空间图标
const QQZoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />
  </svg>
)

const PLATFORMS: PlatformConfig[] = [
  {
    id: "wechat", label: "微信好友", shortLabel: "微信",
    bgColor: "bg-[#07C160]", canDirectShare: false,
    icon: <WechatIcon />,
  },
  {
    id: "moments", label: "微信朋友圈", shortLabel: "朋友圈",
    bgColor: "bg-[#05A84E]", canDirectShare: false,
    icon: <WechatIcon />,
  },
  {
    id: "weibo", label: "微博", shortLabel: "微博",
    bgColor: "bg-[#E6162D]", canDirectShare: true,
    buildShareUrl: (url, _t, text) =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text + " " + url)}`,
    icon: <WeiboIcon />,
  },
  {
    id: "qq", label: "QQ好友", shortLabel: "QQ",
    bgColor: "bg-[#1D6EE9]", canDirectShare: true,
    buildShareUrl: (url, title, text) =>
      `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(text)}`,
    icon: <QQIcon />,
  },
  {
    id: "qqzone", label: "QQ空间", shortLabel: "QQ空间",
    bgColor: "bg-[#FAAD14]", canDirectShare: true,
    buildShareUrl: (url, title, text) =>
      `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(text)}`,
    icon: <QQZoneIcon />,
  },
  {
    id: "douyin", label: "抖音", shortLabel: "抖音",
    bgColor: "bg-[#010101]", canDirectShare: false,
    icon: <DouyinIcon />,
  },
  {
    id: "xiaohongshu", label: "小红书", shortLabel: "小红书",
    bgColor: "bg-[#FF2442]", canDirectShare: false,
    icon: <XiaohongshuIcon />,
  },
  {
    id: "sms", label: "短信", shortLabel: "短信",
    bgColor: "bg-[#34C759]", canDirectShare: true,
    buildShareUrl: (url, _t, text) => `sms:?body=${encodeURIComponent(text + " " + url)}`,
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: "email", label: "邮件", shortLabel: "邮件",
    bgColor: "bg-[#0078D4]", canDirectShare: true,
    buildShareUrl: (url, title, text) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + url)}`,
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "link", label: "复制链接", shortLabel: "复制",
    bgColor: "bg-gray-500", canDirectShare: true,
    icon: <Copy className="h-5 w-5" />,
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface ShareDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  url: string
  description?: string
  /** 兼容旧版 qrUrl 参数 */
  qrUrl?: string
  contentType?: ShareContentType
  contentId?: string
  data?: Record<string, unknown>
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function ShareDialog({
  open,
  onClose,
  title = "分享",
  url,
  description,
  contentType = "invite",
  contentId,
  data,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [copiedCopy, setCopiedCopy] = useState(false)
  const [activePlatform, setActivePlatform] = useState<SharePlatform | null>(null)

  const trackMutation = trpc.sales.share_trackShare.useMutation()

  const copyQuery = trpc.sales.share_generateCopy.useQuery(
    { platform: activePlatform ?? "wechat", contentType, data: data as Record<string, any> },
    { enabled: !!activePlatform }
  )

  const statsQuery = trpc.sales.share_getStats.useQuery()

  const handleCopyUrl = useCallback(async () => {
    try { await navigator.clipboard.writeText(url) } catch {
      const el = document.createElement("textarea")
      el.value = url; document.body.appendChild(el); el.select()
      document.execCommand("copy"); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "链接已复制", description: "可粘贴到任意平台分享" })
  }, [url])

  const handleCopyCopy = useCallback(async (text: string) => {
    const full = text + "\n\n" + url
    try { await navigator.clipboard.writeText(full) } catch {
      const el = document.createElement("textarea")
      el.value = full; document.body.appendChild(el); el.select()
      document.execCommand("copy"); document.body.removeChild(el)
    }
    setCopiedCopy(true)
    setTimeout(() => setCopiedCopy(false), 2000)
    toast({ title: "文案已复制", description: "可直接粘贴到平台发布" })
  }, [url])

  const handlePlatformShare = useCallback(async (platform: PlatformConfig) => {
    setActivePlatform(platform.id)
    trackMutation.mutate({ platform: platform.id, contentType, contentId, shareUrl: url })

    if (platform.id === "link") {
      await handleCopyUrl()
      return
    }
    if (platform.canDirectShare && platform.buildShareUrl) {
      const copy = copyQuery.data
      const shareUrl = platform.buildShareUrl(url, copy?.title ?? title, copy?.text ?? description ?? title)
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=520")
    }
  }, [trackMutation, contentType, contentId, url, handleCopyUrl, copyQuery.data, title, description])

  const stats = statsQuery.data
  const currentCopy = copyQuery.data
  const activePlatformConfig = PLATFORMS.find(p => p.id === activePlatform)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">分享到平台</TabsTrigger>
            <TabsTrigger value="stats">
              分享统计
              {stats && stats.totalShares > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{stats.totalShares}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── 分享面板 ── */}
          <TabsContent value="share" className="space-y-4 mt-3">
            {description && (
              <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">{description}</p>
            )}

            {/* 链接复制行 */}
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-xs font-mono bg-muted/30 flex-1 min-w-0" />
              <Button size="sm" variant="outline" onClick={handleCopyUrl} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? "已复制" : "复制"}</span>
              </Button>
            </div>

            {/* 平台网格 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">选择分享平台</p>
              <div className="grid grid-cols-5 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformShare(p)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all",
                      "hover:bg-muted/60 active:scale-95 border border-transparent",
                      activePlatform === p.id && "ring-2 ring-offset-1 ring-blue-500 bg-muted/40"
                    )}
                  >
                    <div className={cn("rounded-full p-2 text-white", p.bgColor)}>{p.icon}</div>
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{p.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 平台专属面板 */}
            {activePlatform && activePlatformConfig && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                {/* 平台标题行 */}
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-full p-1.5 text-white", activePlatformConfig.bgColor)}>
                    {activePlatformConfig.icon}
                  </div>
                  <span className="font-medium text-sm">{activePlatformConfig.label}</span>
                  {activePlatformConfig.canDirectShare
                    ? <Badge variant="outline" className="text-xs text-green-600 border-green-300">已跳转/已复制</Badge>
                    : <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">扫码 · 复制文案</Badge>
                  }
                </div>

                {/* 二维码（不支持直接跳转的平台） */}
                {!activePlatformConfig.canDirectShare && (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 bg-white">
                    <QRCodeSVG value={url} size={128} level="M" includeMargin className="rounded" />
                    <p className="text-xs text-muted-foreground text-center">
                      {activePlatform === "wechat" || activePlatform === "moments"
                        ? "截图后在微信中长按识别二维码"
                        : activePlatform === "douyin"
                        ? "截图后在抖音中扫描二维码"
                        : "截图后在 App 中扫描二维码"}
                    </p>
                  </div>
                )}

                {/* 平台专属文案 */}
                {currentCopy && (
                  <div className="space-y-2">
                    {currentCopy.title && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">标题</p>
                        <p className="text-sm font-medium">{currentCopy.title}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">分享文案</p>
                      <Textarea
                        value={currentCopy.text + "\n\n" + url}
                        readOnly
                        className="text-xs resize-none bg-white"
                        rows={4}
                      />
                    </div>
                    {currentCopy.hashtags && currentCopy.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {currentCopy.hashtags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <Button size="sm" className="w-full" onClick={() => handleCopyCopy(currentCopy.text)}>
                      {copiedCopy
                        ? <><Check className="mr-1.5 h-3.5 w-3.5" />文案已复制</>
                        : <><Copy className="mr-1.5 h-3.5 w-3.5" />复制文案 + 链接</>
                      }
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 使用提示 */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 space-y-1">
              <p className="font-medium">分享说明</p>
              <p>· <strong>微信 / 朋友圈 / 抖音 / 小红书</strong>：截图二维码或复制文案后在 App 内粘贴发布</p>
              <p>· <strong>微博 / QQ / QQ空间</strong>：点击图标将自动跳转到平台分享页</p>
              <p>· <strong>短信 / 邮件</strong>：点击后自动打开系统应用并填入分享内容</p>
              <p>· 好友通过分享链接注册后，您将获得奖励积分</p>
            </div>
          </TabsContent>

          {/* ── 统计面板 ── */}
          <TabsContent value="stats" className="space-y-4 mt-3">
            {stats ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "总分享次数", value: stats.totalShares, icon: <Share2 className="h-4 w-4 text-blue-500" /> },
                    { label: "带来点击", value: stats.totalClicks, icon: <ExternalLink className="h-4 w-4 text-green-500" /> },
                    { label: "成功转化", value: stats.totalConverts, icon: <Users className="h-4 w-4 text-purple-500" /> },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border bg-muted/20 p-3 text-center">
                      <div className="flex justify-center mb-1">{item.icon}</div>
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>

                {stats.platformStats.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      各平台分享占比
                    </p>
                    <div className="space-y-2">
                      {stats.platformStats.map((ps: { platform: string; label: string; count: number; rate: number }) => {
                        const p = PLATFORMS.find(x => x.id === ps.platform)
                        return (
                          <div key={ps.platform} className="flex items-center gap-2">
                            {p && (
                              <div className={cn("rounded-full p-1 text-white shrink-0 scale-75", p.bgColor)}>
                                {p.icon}
                              </div>
                            )}
                            <span className="text-xs w-14 shrink-0">{ps.label}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${ps.rate}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{ps.count}次</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">还没有分享记录</p>
                    <p className="text-xs mt-1">分享后可在此查看各平台数据</p>
                  </div>
                )}

                {stats.recentRecords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">最近分享记录</p>
                    <div className="space-y-1.5">
                      {stats.recentRecords.slice(0, 5).map((rec: { id: string; platform: string; sharedAt: string }) => {
                        const p = PLATFORMS.find(x => x.id === rec.platform)
                        return (
                          <div key={rec.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {p && (
                              <div className={cn("rounded-full p-0.5 text-white shrink-0 scale-75", p.bgColor)}>
                                {p.icon}
                              </div>
                            )}
                            <span className="flex-1">{p?.label ?? rec.platform}</span>
                            <span>{new Date(rec.sharedAt).toLocaleDateString("zh-CN")}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">加载中...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
