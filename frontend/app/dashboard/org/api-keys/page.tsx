"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Key,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [createDialog, setCreateDialog] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<{ apiKey: string; keyPrefix: string } | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [keyName, setKeyName] = useState("")
  const [keyExpireDays, setKeyExpireDays] = useState("")

  const { data: keys, isLoading, refetch } = trpc.billing.getApiKeys.useQuery()

  const createMutation = trpc.billing.createApiKey.useMutation({
    onSuccess: (data) => {
      setNewKeyResult({ apiKey: data.apiKey, keyPrefix: data.keyPrefix })
      setCreateDialog(false)
      setKeyName("")
      setKeyExpireDays("")
      refetch()
    },
    onError: (err: any) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const toggleMutation = trpc.billing.toggleApiKey.useMutation({
    onSuccess: () => { toast({ title: "操作成功" }); refetch() },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const deleteMutation = trpc.billing.deleteApiKey.useMutation({
    onSuccess: () => { toast({ title: "已删除" }); setDeleteId(null); refetch() },
    onError: (err: any) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const handleCreate = () => {
    if (!keyName.trim()) { toast({ title: "请输入密钥名称", variant: "destructive" }); return }
    createMutation.mutate({
      name: keyName,
      expiresInDays: keyExpireDays ? Number(keyExpireDays) : undefined,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "已复制到剪贴板" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API 密钥管理</h1>
          <p className="text-muted-foreground">管理用于访问估价 API 的密钥，需要专业版或企业版订阅</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建密钥
        </Button>
      </div>

      {/* API 使用说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Key className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">API 调用说明</p>
              <p className="text-blue-700">在请求头中添加 <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code> 即可调用估价 API。</p>
              <p className="text-blue-700 mt-1">API 基础地址：<code className="bg-blue-100 px-1 rounded">https://api.gujia.com/v1</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 密钥列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            API 密钥
            {keys && (keys as any[]).length > 0 && <Badge variant="secondary">{(keys as any[]).length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !keys || (keys as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Key className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无 API 密钥，点击"创建密钥"生成</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>密钥前缀</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>累计调用</TableHead>
                  <TableHead>最后使用</TableHead>
                  <TableHead>到期时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(keys as any[]).map((k: any) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{k.key_prefix}...</code>
                    </TableCell>
                    <TableCell>
                      {k.is_active ? (
                        <Badge variant="outline" className="text-green-600 text-xs">启用</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{k.total_calls?.toLocaleString() ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString("zh-CN") : "从未使用"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString("zh-CN") : "永不过期"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleMutation.mutate({ id: k.id, isActive: !k.is_active })}
                          title={k.is_active ? "禁用" : "启用"}
                        >
                          {k.is_active
                            ? <ToggleRight className="h-4 w-4 text-green-600" />
                            : <ToggleLeft className="h-4 w-4 text-gray-400" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(k.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建密钥弹窗 */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建 API 密钥</DialogTitle>
            <DialogDescription>密钥只在创建时显示一次，请妥善保管</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>密钥名称</Label>
              <Input
                placeholder="如：生产环境密钥"
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>有效期（天，留空=永不过期）</Label>
              <Input
                type="number"
                placeholder="如：365"
                value={keyExpireDays}
                onChange={e => setKeyExpireDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              创建密钥
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新密钥展示弹窗 */}
      <Dialog open={newKeyResult !== null} onOpenChange={() => setNewKeyResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              密钥创建成功
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-700">此密钥只显示一次，关闭后将无法再次查看，请立即复制保存！</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API 密钥</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={newKeyResult?.apiKey ?? ""}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newKeyResult?.apiKey ?? "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyResult(null)}>我已保存，关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除 API 密钥</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">删除后，使用此密钥的所有 API 调用将立即失效，无法恢复。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
