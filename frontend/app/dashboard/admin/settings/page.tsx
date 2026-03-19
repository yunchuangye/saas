"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Bot, Cloud, Mail, MessageSquare, Globe, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT)", models: ["gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"] },
  { value: "deepseek", label: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"] },
  { value: "claude", label: "Anthropic Claude", models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"] },
  { value: "custom", label: "自定义 API", models: [] },
]

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const { data: allSettings, isLoading, refetch } = trpc.settings.getAll.useQuery()
  const updateBatchMutation = trpc.settings.updateBatch.useMutation({
    onSuccess: () => { toast({ title: "设置已保存" }); refetch() },
    onError: (err) => toast({ title: "保存失败", description: err.message, variant: "destructive" }),
  })
  const testAIMutation = trpc.settings.testAI.useMutation()

  const [aiProvider, setAiProvider] = useState("openai")
  const [aiModel, setAiModel] = useState("gpt-4.1-mini")
  const [aiApiKey, setAiApiKey] = useState("")
  const [aiBaseUrl, setAiBaseUrl] = useState("")
  const [aiMaxTokens, setAiMaxTokens] = useState("4096")
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [siteName, setSiteName] = useState("GuJia.App")
  const [siteDomain, setSiteDomain] = useState("gujia.app")
  const [maxBidders, setMaxBidders] = useState("10")
  const [bidDurationHours, setBidDurationHours] = useState("48")
  const [ossProvider, setOssProvider] = useState("local")
  const [ossBucket, setOssBucket] = useState("")
  const [ossAccessKey, setOssAccessKey] = useState("")
  const [ossSecretKey, setOssSecretKey] = useState("")
  const [ossEndpoint, setOssEndpoint] = useState("")
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("465")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [smtpFrom, setSmtpFrom] = useState("")
  const [smsProvider, setSmsProvider] = useState("aliyun")
  const [smsAccessKey, setSmsAccessKey] = useState("")
  const [smsSecretKey, setSmsSecretKey] = useState("")
  const [smsSign, setSmsSign] = useState("")

  useEffect(() => {
    if (!allSettings) return
    setAiProvider(allSettings.ai_provider ?? "openai")
    setAiModel(allSettings.ai_model ?? "gpt-4.1-mini")
    setAiApiKey(allSettings.ai_api_key ?? "")
    setAiBaseUrl(allSettings.ai_base_url ?? "")
    setAiMaxTokens(allSettings.ai_max_tokens ?? "4096")
    setSiteName(allSettings.site_name ?? "GuJia.App")
    setSiteDomain(allSettings.site_domain ?? "gujia.app")
    setMaxBidders(allSettings.max_bidders ?? "10")
    setBidDurationHours(allSettings.bid_duration_hours ?? "48")
    setOssProvider(allSettings.oss_provider ?? "local")
    setOssBucket(allSettings.oss_bucket ?? "")
    setOssAccessKey(allSettings.oss_access_key ?? "")
    setOssSecretKey(allSettings.oss_secret_key ?? "")
    setOssEndpoint(allSettings.oss_endpoint ?? "")
    setSmtpHost(allSettings.smtp_host ?? "")
    setSmtpPort(allSettings.smtp_port ?? "465")
    setSmtpUser(allSettings.smtp_user ?? "")
    setSmtpPass(allSettings.smtp_pass ?? "")
    setSmtpFrom(allSettings.smtp_from ?? "")
    setSmsProvider(allSettings.sms_provider ?? "aliyun")
    setSmsAccessKey(allSettings.sms_access_key ?? "")
    setSmsSecretKey(allSettings.sms_secret_key ?? "")
    setSmsSign(allSettings.sms_sign ?? "")
  }, [allSettings])

  const currentProvider = AI_PROVIDERS.find(p => p.value === aiProvider)
  const availableModels = currentProvider?.models ?? []

  const handleTestAI = async () => {
    setAiTestResult(null)
    const result = await testAIMutation.mutateAsync({ provider: aiProvider, model: aiModel, apiKey: aiApiKey || undefined, baseUrl: aiBaseUrl || undefined })
    setAiTestResult(result)
  }

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">配置系统全局参数、AI 模型、存储和通知服务</p>
      </div>
      <Tabs defaultValue="site">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="site"><Globe className="mr-1 h-4 w-4" />站点</TabsTrigger>
          <TabsTrigger value="ai"><Bot className="mr-1 h-4 w-4" />AI 配置</TabsTrigger>
          <TabsTrigger value="storage"><Cloud className="mr-1 h-4 w-4" />存储</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-1 h-4 w-4" />邮件</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare className="mr-1 h-4 w-4" />短信</TabsTrigger>
        </TabsList>
        <TabsContent value="site">
          <Card>
            <CardHeader><CardTitle>站点基础配置</CardTitle><CardDescription>配置系统名称、域名和业务参数</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>系统名称</Label><Input value={siteName} onChange={e => setSiteName(e.target.value)} /></div>
                <div className="space-y-2"><Label>站点域名</Label><Input value={siteDomain} onChange={e => setSiteDomain(e.target.value)} /></div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>最大竞价方数量</Label>
                  <Input type="number" value={maxBidders} onChange={e => setMaxBidders(e.target.value)} />
                  <p className="text-xs text-muted-foreground">每个项目最多允许多少家评估公司参与竞价</p>
                </div>
                <div className="space-y-2">
                  <Label>竞价持续时间（小时）</Label>
                  <Input type="number" value={bidDurationHours} onChange={e => setBidDurationHours(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => updateBatchMutation.mutate({ settings: { site_name: siteName, site_domain: siteDomain, max_bidders: maxBidders, bid_duration_hours: bidDurationHours } })} disabled={updateBatchMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />{updateBatchMutation.isPending ? "保存中..." : "保存设置"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle>AI 模型配置</CardTitle><CardDescription>配置用于智能估价、报告审核等功能的 AI 模型</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>AI 提供商</Label>
                  <Select value={aiProvider} onValueChange={v => { setAiProvider(v); setAiModel("") }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>模型名称</Label>
                  {availableModels.length > 0 ? (
                    <Select value={aiModel} onValueChange={setAiModel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input value={aiModel} onChange={e => setAiModel(e.target.value)} placeholder="输入模型名称" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder="sk-... 或留空使用环境变量" />
                <p className="text-xs text-muted-foreground">留空则使用服务器环境变量 OPENAI_API_KEY</p>
              </div>
              {(aiProvider === "custom" || aiProvider === "deepseek") && (
                <div className="space-y-2">
                  <Label>Base URL（自定义 API 地址）</Label>
                  <Input value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)} placeholder="https://api.deepseek.com/v1" />
                </div>
              )}
              <div className="space-y-2">
                <Label>最大 Token 数</Label>
                <Input type="number" value={aiMaxTokens} onChange={e => setAiMaxTokens(e.target.value)} min="512" max="32768" />
              </div>
              {aiTestResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${aiTestResult.success ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"}`}>
                  {aiTestResult.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                  <span>{aiTestResult.message}</span>
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={() => updateBatchMutation.mutate({ settings: { ai_provider: aiProvider, ai_model: aiModel, ai_api_key: aiApiKey, ai_base_url: aiBaseUrl, ai_max_tokens: aiMaxTokens } })} disabled={updateBatchMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />{updateBatchMutation.isPending ? "保存中..." : "保存配置"}
                </Button>
                <Button variant="outline" onClick={handleTestAI} disabled={testAIMutation.isPending}>
                  {testAIMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  {testAIMutation.isPending ? "测试中..." : "测试连接"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storage">
          <Card>
            <CardHeader><CardTitle>对象存储配置</CardTitle><CardDescription>配置文件上传存储方式</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>存储提供商</Label>
                <Select value={ossProvider} onValueChange={setOssProvider}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">本地存储</SelectItem>
                    <SelectItem value="aliyun">阿里云 OSS</SelectItem>
                    <SelectItem value="qiniu">七牛云</SelectItem>
                    <SelectItem value="tencent">腾讯云 COS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ossProvider !== "local" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Bucket 名称</Label><Input value={ossBucket} onChange={e => setOssBucket(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Endpoint</Label><Input value={ossEndpoint} onChange={e => setOssEndpoint(e.target.value)} /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Access Key</Label><Input value={ossAccessKey} onChange={e => setOssAccessKey(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={ossSecretKey} onChange={e => setOssSecretKey(e.target.value)} /></div>
                  </div>
                </>
              )}
              {ossProvider === "local" && <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">使用本地存储，文件保存在服务器 <code className="bg-muted px-1 rounded">uploads/</code> 目录</div>}
              <Button onClick={() => updateBatchMutation.mutate({ settings: { oss_provider: ossProvider, oss_bucket: ossBucket, oss_access_key: ossAccessKey, oss_secret_key: ossSecretKey, oss_endpoint: ossEndpoint } })} disabled={updateBatchMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle>SMTP 邮件配置</CardTitle><CardDescription>配置系统发送邮件通知的 SMTP 服务器</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>SMTP 服务器</Label><Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.example.com" /></div>
                <div className="space-y-2"><Label>端口</Label><Input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>用户名</Label><Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} /></div>
                <div className="space-y-2"><Label>密码</Label><Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>发件人邮箱</Label><Input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} /></div>
              <Button onClick={() => updateBatchMutation.mutate({ settings: { smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, smtp_pass: smtpPass, smtp_from: smtpFrom } })} disabled={updateBatchMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sms">
          <Card>
            <CardHeader><CardTitle>短信通知配置</CardTitle><CardDescription>配置短信验证码和通知服务</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>短信提供商</Label>
                <Select value={smsProvider} onValueChange={setSmsProvider}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aliyun">阿里云短信</SelectItem>
                    <SelectItem value="tencent">腾讯云短信</SelectItem>
                    <SelectItem value="yunpian">云片网</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Access Key</Label><Input value={smsAccessKey} onChange={e => setSmsAccessKey(e.target.value)} /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={smsSecretKey} onChange={e => setSmsSecretKey(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>短信签名</Label><Input value={smsSign} onChange={e => setSmsSign(e.target.value)} placeholder="【估价平台】" /></div>
              <Button onClick={() => updateBatchMutation.mutate({ settings: { sms_provider: smsProvider, sms_access_key: smsAccessKey, sms_secret_key: smsSecretKey, sms_sign: smsSign } })} disabled={updateBatchMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
