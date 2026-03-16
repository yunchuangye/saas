/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 运行时配置：在 Next.js 服务进程启动时从 process.env 读取，
  // 不会在 build 时静态编译进 JS bundle，修改 .env.local 重启服务即可生效。
  serverRuntimeConfig: {
    // 仅服务端（API Route、Server Component）使用
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8721',
  },
  publicRuntimeConfig: {
    // 客户端和服务端均可通过 getConfig() 获取
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8721',
  },
}

export default nextConfig
