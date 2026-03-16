/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 后端地址通过 /api/config 接口运行时下发，见 app/api/config/route.ts
  // 不在此处静态配置，避免 build 时编译进 JS bundle
}

export default nextConfig
