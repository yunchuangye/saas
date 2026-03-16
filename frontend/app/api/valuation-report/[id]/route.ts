import { NextRequest, NextResponse } from "next/server"
import { getServerBackendUrl } from "@/lib/config"

export const dynamic = "force-dynamic" // 禁止缓存，确保每次读取最新 process.env

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const backendUrl = getServerBackendUrl()

  try {
    // 转发 cookie（session）
    const cookie = request.headers.get("cookie") || ""
    const res = await fetch(`${backendUrl}/api/pdf/valuation-report/${id}`, {
      headers: { cookie },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "生成报告失败" }, { status: res.status })
    }

    const pdfBuffer = await res.arrayBuffer()
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="valuation-report-${id}.pdf"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "服务异常" }, { status: 500 })
  }
}
