"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles } from "lucide-react"

export default function AIFeaturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI 智能功能</h1>
        <p className="text-muted-foreground">AI 辅助数据处理功能</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>功能开发中</CardTitle>
          </div>
          <CardDescription>该 AI 功能正在开发中，即将上线</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Sparkles className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">AI 功能即将上线</p>
            <p className="text-sm mt-2">该功能正在开发中，敬请期待</p>
            <Badge variant="secondary" className="mt-4">开发中</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
