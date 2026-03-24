import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { TRPCProvider } from '@/components/providers/trpc-provider'
import { CityProvider } from '@/lib/city-context'
import { headers } from 'next/headers'
import { getCityBySubdomain } from '@/lib/city-map'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  
  // 提取子域名 (例如 sz.gujia.app -> sz，shenzhen.gujia.app -> shenzhen)
  let subdomain = '';
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    if (sub !== 'www' && sub !== 'api') {
      subdomain = sub;
    }
  }

  // 尝试根据子域名匹配城市（支持缩写如 sz、全拼如 shenzhen）
  const city = subdomain ? getCityBySubdomain(subdomain) : null;

  // ── 有城市子域名：生成城市专属 SEO ──────────────────────────
  if (city) {
    const cityName = city.name;
    const provinceName = city.province.replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|藏族自治区/g, '');

    const title = `${cityName}免费估价_${cityName}自动估价_${cityName}房产评估公司_${cityName}估价 - GuJia.App`;
    const description = `GuJia.App提供${cityName}房产一键免费估价服务，基于217万+真实成交案例，AI秒级返回${cityName}房产精准估值。对接${cityName}50+银行贷款直申，200+专业评估机构出具正式报告，${provinceName}最专业的房产估价平台。`;
    const keywords = [
      `${cityName}免费估价`,
      `${cityName}自动估价`,
      `${cityName}房地产评估公司`,
      `${cityName}估价`,
      `${cityName}房产评估`,
      `${cityName}二手房估价`,
      `${cityName}房产价值评估`,
      `${cityName}银行估价`,
      `${cityName}房屋评估报告`,
      `${cityName}房产估价平台`,
      `${provinceName}房产评估`,
      '房产估价',
      '免费估价',
      '一键估价',
    ];

    return {
      title: { default: title, template: `%s | ${cityName}房产估价 - GuJia.App` },
      description,
      keywords,
      authors: [{ name: 'GuJia.App' }],
      openGraph: {
        title, description,
        url: `https://${host}`,
        siteName: 'GuJia.App',
        locale: 'zh_CN',
        type: 'website',
      },
      twitter: { card: 'summary_large_image', title, description },
      alternates: { canonical: `https://${host}` },
      icons: {
        icon: [
          { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
          { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
          { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        apple: '/apple-icon.png',
      },
    };
  }

  // ── 默认首页 SEO（gujia.app 主域名）──────────────────────────
  const defaultTitle = 'GuJia.App - 一键免费估价 | 房产评估专业平台';
  const defaultDescription = '基于217万+真实成交案例，AI秒级返回精准房产估值。对接全国50+银行贷款直申，200+专业评估机构出具正式报告，免费、快速、专业的房产估价平台。';
  const defaultKeywords = [
    '房产估价', '免费估价', '一键估价', '房地产评估',
    '银行估价', '房产评估公司', '二手房估价', '房屋评估报告',
    '自动估价', '房产价值评估', 'AI估价', '房产评估平台',
  ];

  return {
    title: { default: defaultTitle, template: '%s | GuJia.App' },
    description: defaultDescription,
    keywords: defaultKeywords,
    authors: [{ name: 'GuJia.App' }],
    openGraph: {
      title: defaultTitle, description: defaultDescription,
      url: 'https://gujia.app',
      siteName: 'GuJia.App',
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: defaultTitle, description: defaultDescription },
    alternates: { canonical: 'https://gujia.app' },
    icons: {
      icon: [
        { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
        { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A2540' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1B2A' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head suppressHydrationWarning></head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            <CityProvider>
              {children}
            </CityProvider>
          </TRPCProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
