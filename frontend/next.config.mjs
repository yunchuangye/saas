/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 将 BACKEND_URL 映射为 NEXT_PUBLIC_BACKEND_URL
  // 这样在 .env.local 中只需配置 NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
  // NEXT_PUBLIC_ 前缀的变量在 build 时被编译进客户端 JS bundle（Next.js 官方方案）
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:8721',
  },
}

export default nextConfig
