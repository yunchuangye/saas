"use client"

import { useState } from "react"
import { Bot, Save, RefreshCw, TestTube, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Info, Zap, Shield, Settings2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function OpenclawSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 模拟配置数据
  const [config, setConfig] = useState({
    enabled: true,
    apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    apiEndpoint: "https://api.openclaw.ai/v1",
    model: "gpt-4-turbo",
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30,
    retryCount: 3,
    enableCache: true,
    cacheExpiry: 3600,
    enableLogging: true,
    promptTemplate: `你是一个专业的房地产评估助手，请根据以下信息提供评估建议：

物业信息：{{property_info}}
市场数据：{{market_data}}
历史交易：{{history_data}}

请提供：
1. 估价区间
2. 评估依据
3. 风险提示`,
  })

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    // 模拟API测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTestResult(Math.random() > 0.3 ? "success" : "error")
    setIsTesting(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">OPENCLAW 设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置 OPENCLAW AI 服务，用于智能评估辅助和数据分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleTest} disabled={isTesting}>
            {isTesting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 h-4 w-4" />
            )}
            测试连接
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存配置
          </Button>
        </div>
      </div>

      {/* 连接状态提示 */}
      {testResult === "success" && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">连接成功</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            OPENCLAW API 连接正常，可以正常使用智能评估服务
          </AlertDescription>
        </Alert>
      )}
      {testResult === "error" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>连接失败</AlertTitle>
          <AlertDescription>
            无法连接到 OPENCLAW API，请检查 API Key 和端点配置是否正确
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="model">模型参数</TabsTrigger>
          <TabsTrigger value="prompt">提示词模板</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        {/* 基础配置 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    服务状态
                  </CardTitle>
                  <CardDescription>启用或禁用 OPENCLAW 智能服务</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.enabled ? "default" : "secondary"}>
                    {config.enabled ? "已启用" : "已禁用"}
                  </Badge>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                API 认证
              </CardTitle>
              <CardDescription>配置 OPENCLAW API 访问凭证</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  请在 OPENCLAW 控制台获取您的 API Key
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiEndpoint">API 端点</Label>
                <Input
                  id="apiEndpoint"
                  value={config.apiEndpoint}
                  onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                  placeholder="https://api.openclaw.ai/v1"
                />
                <p className="text-xs text-muted-foreground">
                  默认使用官方 API 端点，私有部署可修改为自定义地址
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模型参数 */}
        <TabsContent value="model" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                模型配置
              </CardTitle>
              <CardDescription>调整 AI 模型参数以优化评估效果</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="model">模型选择</Label>
                <Select
                  value={config.model}
                  onValueChange={(value) => setConfig({ ...config, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo (推荐)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  GPT-4 Turbo 提供最佳的评估准确性和响应速度
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="maxTokens">最大 Token 数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    控制单次请求的最大输出长度
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperature">温度系数</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    越低越精确，越高越有创意 (0-2)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="timeout">请求超时(秒)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.timeout}
                    onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="retryCount">重试次数</Label>
                  <Input
                    id="retryCount"
                    type="number"
                    min="0"
                    max="5"
                    value={config.retryCount}
                    onChange={(e) => setConfig({ ...config, retryCount: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 提示词模板 */}
        <TabsContent value="prompt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>评估提示词模板</CardTitle>
              <CardDescription>
                自定义 AI 评估时使用的提示词模板，支持变量替换
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>变量说明</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <code className="bg-muted px-1 rounded">{"{{property_info}}"}</code>
                    <span>物业基本信息</span>
                    <code className="bg-muted px-1 rounded">{"{{market_data}}"}</code>
                    <span>市场行情数据</span>
                    <code className="bg-muted px-1 rounded">{"{{history_data}}"}</code>
                    <span>历史交易记录</span>
                    <code className="bg-muted px-1 rounded">{"{{comparable_data}}"}</code>
                    <span>可比案例数据</span>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="grid gap-2">
                <Label htmlFor="promptTemplate">提示词模板</Label>
                <Textarea
                  id="promptTemplate"
                  value={config.promptTemplate}
                  onChange={(e) => setConfig({ ...config, promptTemplate: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                恢复默认模板
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 高级设置 */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                缓存设置
              </CardTitle>
              <CardDescription>配置 API 响应缓存以提高性能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用缓存</Label>
                  <p className="text-xs text-muted-foreground">
                    缓存相同查询的 AI 响应，减少 API 调用
                  </p>
                </div>
                <Switch
                  checked={config.enableCache}
                  onCheckedChange={(checked) => setConfig({ ...config, enableCache: checked })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cacheExpiry">缓存过期时间(秒)</Label>
                <Input
                  id="cacheExpiry"
                  type="number"
                  value={config.cacheExpiry}
                  onChange={(e) => setConfig({ ...config, cacheExpiry: parseInt(e.target.value) })}
                  disabled={!config.enableCache}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日志与监控</CardTitle>
              <CardDescription>配置 API 调用日志记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用日志记录</Label>
                  <p className="text-xs text-muted-foreground">
                    记录所有 API 调用日志，便于问题排查和审计
                  </p>
                </div>
                <Switch
                  checked={config.enableLogging}
                  onCheckedChange={(checked) => setConfig({ ...config, enableLogging: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>使用统计</CardTitle>
              <CardDescription>本月 OPENCLAW API 使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-xs text-muted-foreground">API 调用次数</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">2.5M</div>
                  <div className="text-xs text-muted-foreground">Token 消耗</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">¥125.60</div>
                  <div className="text-xs text-muted-foreground">预估费用</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
