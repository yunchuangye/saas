"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Image as ImageIcon, Download, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function AppraiserPosterPage() {
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [customText, setCustomText] = useState("")
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { data: templates, isLoading } = trpc.sales.appraiser_getPosterTemplates.useQuery()
  const templateList = (templates as any)?.templates ?? []

  const generateMutation = trpc.sales.appraiser_generatePoster.useMutation({
    onSuccess: (data: any) => {
      setGeneratedPoster(data.posterUrl || data.url)
      setShowPreview(true)
      toast({ title: "海报生成成功", description: "可以下载或分享海报" })
    },
    onError: (err) => toast({ title: "生成失败", description: err.message, variant: "destructive" }),
  })

  const handleGenerate = () => {
    if (!selectedTemplate) {
      toast({ title: "请选择海报模板", variant: "destructive" })
      return
    }
    generateMutation.mutate({ templateId: selectedTemplate, customText })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">海报生成</h1>
        <p className="text-muted-foreground">一键生成专业推广海报，快速分享到社交媒体</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>选择模板</CardTitle>
              <CardDescription>选择一个适合您的海报模板</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[3/4] w-full" />)}
                </div>
              ) : templateList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p>暂无可用模板</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {templateList.map((tpl: any) => (
                    <div key={tpl.id}
                      className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${selectedTemplate === tpl.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
                      onClick={() => setSelectedTemplate(tpl.id)}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
                        {tpl.previewUrl ? (
                          <img src={tpl.previewUrl} alt={tpl.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                            <p className="text-xs font-medium">{tpl.name}</p>
                          </div>
                        )}
                      </div>
                      {selectedTemplate === tpl.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-5 w-5 text-primary bg-white rounded-full" />
                        </div>
                      )}
                      <div className="p-2 border-t bg-card">
                        <p className="text-xs font-medium truncate">{tpl.name}</p>
                        {tpl.category && <Badge variant="secondary" className="text-[10px] mt-1">{tpl.category}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>自定义文案</CardTitle>
              <CardDescription>可选：添加个性化文案到海报</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>宣传语（选填）</Label>
                <Textarea value={customText} onChange={e => setCustomText(e.target.value)}
                  placeholder="例：专业评估15年，服务客户10000+，精准估价，值得信赖" className="min-h-[80px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>生成海报</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed aspect-[3/4] flex items-center justify-center bg-muted/30">
                {generatedPoster ? (
                  <img src={generatedPoster} alt="生成的海报" className="w-full h-full object-contain rounded" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">选择模板后点击生成</p>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={generateMutation.isPending || !selectedTemplate}>
                {generateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />生成海报</>
                )}
              </Button>
              {generatedPoster && (
                <Button variant="outline" className="w-full" onClick={() => {
                  const a = document.createElement("a")
                  a.href = generatedPoster
                  a.download = "poster.png"
                  a.click()
                }}>
                  <Download className="mr-2 h-4 w-4" />下载海报
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>使用说明</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                {[
                  "选择合适的海报模板",
                  "可选填个性化宣传语",
                  "点击生成，系统自动合成",
                  "下载后分享到朋友圈/微信群",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
