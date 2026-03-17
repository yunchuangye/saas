/**
 * 验证码代理接口
 * 前端浏览器无法直接访问 localhost:8721，通过 Next.js API 路由在服务端转发
 */
import { NextResponse } from "next/server";

const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8721";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/api/captcha`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "验证码服务暂不可用" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[captcha proxy] error:", e);
    return NextResponse.json({ error: "验证码服务连接失败" }, { status: 503 });
  }
}
