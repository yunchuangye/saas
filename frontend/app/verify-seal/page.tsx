"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Shield, CheckCircle, XCircle, Search, Stamp, Building2,
  User, Calendar, FileText, Hash, Loader2
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

function VerifySealContent() {
  const searchParams = useSearchParams()
  const [inputCode, setInputCode] = useState("")
  const [queryCode, setQueryCode] = useState("")
  const [queryReportId, setQueryReportId] = useState<number | undefined>()

  // 从 URL 参数自动填充
  useEffect(() => {
    const code = searchParams.get("code")
    const reportId = searchParams.get("report")
    if (code) {
      setInputCode(code)
      setQueryCode(code)
      if (reportId) setQueryReportId(Number(reportId))
    }
  }, [searchParams])

  const { data: result, isLoading, refetch } = trpc.seals.verifyByCode.useQuery(
    { verifyCode: queryCode, reportId: queryReportId },
    { enabled: !!queryCode }
  )

  const handleSearch = () => {
    if (!inputCode.trim()) return
    setQueryCode(inputCode.trim().toUpperCase())
    setQueryReportId(undefined)
  }

  const formatDate = (d: any) => {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy年MM月dd日 HH:mm", { locale: zhCN }) } catch { return "—" }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 顶部导航 */}
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Stamp className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">固价 · 电子签章验证</span>
          <Badge variant="outline" className="ml-auto text-xs">公开验证服务</Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        {/* 标题区 */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">电子签章真实性验证</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            输入报告上的验证码，或扫描报告中的二维码，即可验证该电子签章的真实性和完整性
          </p>
        </div>

        {/* 搜索框 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="输入 8 位验证码（如：AB3D5E7F）"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono text-lg tracking-widest text-center"
                maxLength={8}
              />
              <Button onClick={handleSearch} disabled={!inputCode.trim() || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">验证</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              验证码位于报告底部，格式为 8 位大写字母和数字的组合
            </p>
          </CardContent>
        </Card>

        {/* 验证结果 */}
        {queryCode && !isLoading && result && (
          <Card className={result.valid ? "border-green-300 shadow-green-100 shadow-md" : "border-red-300"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-red-600" />
                  </div>
                )}
                <div>
                  <CardTitle className={result.valid ? "text-green-700" : "text-red-700"}>
                    {result.valid ? "验证通过" : "验证失败"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{result.message}</p>
                </div>
              </div>
            </CardHeader>

            {result.valid && result.data && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {/* 报告信息 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      报告信息
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">报告编号</p>
                        <p className="font-mono font-medium">{result.data.reportNo || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">报告标题</p>
                        <p className="font-medium truncate">{result.data.reportTitle || "—"}</p>
                      </div>
                      {result.data.propertyAddress && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">物业地址</p>
                          <p>{result.data.propertyAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 签章机构 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      签章信息
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">评估机构</p>
                        <p className="font-medium">{result.data.orgName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">评估师</p>
                        <p className="font-medium">{result.data.appraiserName || "—"}</p>
                      </div>
                      {result.data.orgSealName && (
                        <div>
                          <p className="text-muted-foreground text-xs">机构公章</p>
                          <p>{result.data.orgSealName}</p>
                        </div>
                      )}
                      {result.data.personalSealName && (
                        <div>
                          <p className="text-muted-foreground text-xs">个人执业章</p>
                          <p>{result.data.personalSealName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 时间和哈希 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      时间戳与完整性
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">签章时间</span>
                        <span className="font-medium">{formatDate(result.data.signedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">验证码</span>
                        <span className="font-mono font-bold text-primary tracking-widest">
                          {result.data.verifyCode}
                        </span>
                      </div>
                      {result.data.hash && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            文件哈希（SHA-256）
                          </p>
                          <p className="font-mono text-xs bg-white border rounded p-2 break-all text-gray-600">
                            {result.data.hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 法律声明 */}
                <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="font-medium text-blue-700 mb-1">法律效力声明</p>
                  <p className="text-blue-600">
                    本电子签章依据《电子签名法》及相关法规，具有与手写签名和传统印章同等的法律效力。
                    文件哈希值可用于验证报告内容未被篡改。如有疑问，请联系出具机构核实。
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 加载中 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">正在验证...</span>
          </div>
        )}

        {/* 使用说明 */}
        {!queryCode && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3 text-sm">如何验证签章？</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p>找到报告底部的 8 位验证码（格式：AB3D5E7F）</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p>在上方输入框中输入验证码，点击"验证"按钮</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p>系统将显示签章的真实性信息，包括签章机构、评估师和签章时间</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <p>也可直接扫描报告上的二维码，自动跳转到验证页面</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 底部 */}
      <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground">
        <p>固价智能估价平台 · 电子签章验证服务</p>
        <p className="mt-1">本服务依据《电子签名法》提供，验证结果具有法律效力</p>
      </footer>
    </div>
  )
}

export default function VerifySealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <VerifySealContent />
    </Suspense>
  )
}
