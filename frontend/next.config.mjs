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
    "*.sg1.manus.computer",
  ],
  // 代理后端 API，解决公网代理环境下的跨域问题
  // 前端通过 /api/trpc/* 访问后端，Next.js 服务端转发到 localhost:8721
  async rewrites() {
    return [
      {
        source: '/api/trpc/:path*',
        destination: 'http://localhost:8721/api/trpc/:path*',
      },
      {
        source: '/api/captcha',
        destination: 'http://localhost:8721/api/captcha',
      },
    ]
  },
}

export default nextConfig
