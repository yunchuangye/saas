import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

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
