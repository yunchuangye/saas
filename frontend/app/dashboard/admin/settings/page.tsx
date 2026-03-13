"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [siteName, setSiteName] = useState("估价 SaaS 平台")
  const [maxBidders, setMaxBidders] = useState("10")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">配置系统全局参数</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>基础配置</CardTitle>
          </div>
          <CardDescription>系统基础参数设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>系统名称</Label>
            <Input value={siteName} onChange={e => setSiteName(e.target.value)} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>最大竞价方数量</Label>
            <Input type="number" value={maxBidders} onChange={e => setMaxBidders(e.target.value)} />
          </div>
          <Button onClick={() => toast({ title: "设置已保存" })}>
            <Save className="mr-2 h-4 w-4" />保存设置
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
