/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 允许公网代理域名访问开发服务器资源（避免跨域警告）
  allowedDevOrigins: [
    "*.us1.manus.computer",
  ],
  // ⚠️ 注意：不要在这里设置 NEXT_PUBLIC_BACKEND_URL！
  //
  // 原因：next.config.mjs 在 .env.local 被 Next.js 加载之前执行，
  // 在这里读取 process.env.NEXT_PUBLIC_BACKEND_URL 永远是 undefined，
  // 会导致默认值 http://localhost:8721 被硬编码进 JS bundle。
  //
  // 正确做法：直接在 frontend/.env.local 中设置：
  //   NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
  //
  // Next.js 会在 build 时自动读取 .env.local 中的 NEXT_PUBLIC_ 前缀变量，
  // 并将其编译进客户端 JS bundle，无需任何额外配置。
}

export default nextConfig
