"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Shield, Bell, Palette, Database, Mail } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统配置</h1>
        <p className="text-muted-foreground">管理平台系统设置</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="notification">通知设置</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                平台信息
              </CardTitle>
              <CardDescription>配置平台基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">平台名称</Label>
                  <Input id="platform-name" defaultValue="gujia.app" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-slogan">平台口号</Label>
                  <Input id="platform-slogan" defaultValue="有态度的估价专业平台" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">联系邮箱</Label>
                <Input id="contact-email" defaultValue="support@gujia.app" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">联系电话</Label>
                <Input id="contact-phone" defaultValue="400-xxx-xxxx" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                业务配置
              </CardTitle>
              <CardDescription>配置业务相关参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bidding-duration">默认竞价时长 (天)</Label>
                  <Input id="bidding-duration" type="number" defaultValue="7" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-deadline">默认报告期限 (天)</Label>
                  <Input id="report-deadline" type="number" defaultValue="10" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>自动分配项目</Label>
                  <p className="text-sm text-muted-foreground">根据评估公司评分自动分配项目</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>开启评分系统</Label>
                  <p className="text-sm text-muted-foreground">允许银行对评估公司进行评分</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                安全设置
              </CardTitle>
              <CardDescription>配置平台安全相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>强制双因素认证</Label>
                  <p className="text-sm text-muted-foreground">要求所有用户启用双因素认证</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>密码复杂度要求</Label>
                  <p className="text-sm text-muted-foreground">要求密码包含大小写字母和数字</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>登录失败锁定</Label>
                  <p className="text-sm text-muted-foreground">连续5次登录失败后锁定账号</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">会话超时时间 (分钟)</Label>
                <Input id="session-timeout" type="number" defaultValue="30" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知设置
              </CardTitle>
              <CardDescription>配置系统通知相关设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">通过邮件发送重要通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>短信通知</Label>
                  <p className="text-sm text-muted-foreground">通过短信发送紧急通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>项目截止提醒</Label>
                  <p className="text-sm text-muted-foreground">项目截止前发送提醒通知</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                邮件服务配置
              </CardTitle>
              <CardDescription>配置SMTP邮件服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP服务器</Label>
                  <Input id="smtp-host" placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">端口</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">用户名</Label>
                  <Input id="smtp-user" placeholder="noreply@gujia.app" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">密码</Label>
                  <Input id="smtp-pass" type="password" placeholder="••••••••" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>
    </div>
  )
}
