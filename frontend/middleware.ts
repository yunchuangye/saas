/**
 * Next.js Middleware - 多城市分站路由
 * ============================================================
 * 功能：
 * 1. 泛域名拦截：sz.gujia.app → 注入 cityCode=sz
 * 2. 请求头注入：X-City-Code / X-City-Id / X-City-Name
 * 3. 路径重写：将城市分站请求透明路由到对应的数据隔离上下文
 * 4. 城市主页重定向：访问 sz.gujia.app 自动跳转到城市首页
 *
 * 支持的城市代码（cityCode → cityId 映射）：
 *   华南区: sz=1(深圳) gz=2(广州) dg=3(东莞) fs=4(佛山) zh=5(珠海)
 *   华东区: sh=11(上海) hz=12(杭州) nj=13(南京) su=14(苏州) nb=15(宁波)
 *   华北区: bj=21(北京) tj=22(天津) sjz=23(石家庄) sy=26(沈阳) dl=27(大连)
 *   华中区: wh=31(武汉) cs=32(长沙) zz=33(郑州)
 *   西部区: cd=41(成都) cq=42(重庆) xa=43(西安)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── 城市映射表 ────────────────────────────────────────────────
export const CITY_CODE_MAP: Record<string, { id: number; name: string; region: string }> = {
  // 华南区
  sz:  { id: 1,  name: "深圳", region: "south" },
  gz:  { id: 2,  name: "广州", region: "south" },
  dg:  { id: 3,  name: "东莞", region: "south" },
  fs:  { id: 4,  name: "佛山", region: "south" },
  zh:  { id: 5,  name: "珠海", region: "south" },
  hz2: { id: 6,  name: "惠州", region: "south" },
  zs:  { id: 7,  name: "中山", region: "south" },
  st:  { id: 8,  name: "汕头", region: "south" },
  zj:  { id: 9,  name: "湛江", region: "south" },
  hk:  { id: 10, name: "海口", region: "south" },
  // 华东区
  sh:  { id: 11, name: "上海", region: "east" },
  hz:  { id: 12, name: "杭州", region: "east" },
  nj:  { id: 13, name: "南京", region: "east" },
  su:  { id: 14, name: "苏州", region: "east" },
  nb:  { id: 15, name: "宁波", region: "east" },
  hf:  { id: 16, name: "合肥", region: "east" },
  fz:  { id: 17, name: "福州", region: "east" },
  xm:  { id: 18, name: "厦门", region: "east" },
  nc:  { id: 19, name: "南昌", region: "east" },
  jn:  { id: 20, name: "济南", region: "east" },
  // 华北区
  bj:  { id: 21, name: "北京", region: "north" },
  tj:  { id: 22, name: "天津", region: "north" },
  sjz: { id: 23, name: "石家庄", region: "north" },
  ty:  { id: 24, name: "太原", region: "north" },
  sy:  { id: 26, name: "沈阳", region: "north" },
  dl:  { id: 27, name: "大连", region: "north" },
  cc:  { id: 28, name: "长春", region: "north" },
  hrb: { id: 29, name: "哈尔滨", region: "north" },
  qd:  { id: 30, name: "青岛", region: "north" },
  // 华中区
  wh:  { id: 31, name: "武汉", region: "central" },
  cs:  { id: 32, name: "长沙", region: "central" },
  zz:  { id: 33, name: "郑州", region: "central" },
  nn:  { id: 34, name: "南宁", region: "central" },
  // 西部区
  cd:  { id: 41, name: "成都", region: "west" },
  cq:  { id: 42, name: "重庆", region: "west" },
  xa:  { id: 43, name: "西安", region: "west" },
  lz:  { id: 44, name: "兰州", region: "west" },
  km:  { id: 50, name: "昆明", region: "west" },
};

// ─── 从 Host 中解析城市代码 ────────────────────────────────────
function parseCityCodeFromHost(host: string): string | null {
  // 匹配 sz.gujia.app / sz.localhost:3000 / sz.example.com
  const match = host.match(/^([a-z]{2,5})\.(gujia\.app|localhost|[\w.-]+)(?::\d+)?$/i);
  if (!match) return null;
  const code = match[1].toLowerCase();
  return CITY_CODE_MAP[code] ? code : null;
}

// ─── 不需要城市上下文的路径 ────────────────────────────────────
const PUBLIC_PATHS = [
  "/api/",
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap",
  "/login",
  "/register",
  "/forgot-password",
  "/pay/",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

// ─── Middleware 主逻辑 ─────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // 跳过静态资源和公共路径
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 解析城市代码
  const cityCode = parseCityCodeFromHost(host);

  if (cityCode) {
    const cityInfo = CITY_CODE_MAP[cityCode];
    const response = NextResponse.next();

    // 注入城市上下文到请求头（供 Server Components 读取）
    // 注意：HTTP Header 只支持 ASCII，中文需要 URL 编码
    response.headers.set("X-City-Code", cityCode);
    response.headers.set("X-City-Id", String(cityInfo.id));
    response.headers.set("X-City-Name", encodeURIComponent(cityInfo.name));
    response.headers.set("X-City-Region", cityInfo.region);

    // 同时写入 Cookie（供 Client Components 读取）
    response.cookies.set("city_code", cityCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30天
      sameSite: "lax",
    });
    response.cookies.set("city_id", String(cityInfo.id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    response.cookies.set("city_name", encodeURIComponent(cityInfo.name), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    // 访问分站根路径时重定向到城市首页
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/city-home", request.url));
    }

    return response;
  }

  // 非城市分站：检查是否有 city_code cookie（用于保持城市上下文）
  const existingCityCode = request.cookies.get("city_code")?.value;
  if (existingCityCode && CITY_CODE_MAP[existingCityCode]) {
    const cityInfo = CITY_CODE_MAP[existingCityCode];
    const response = NextResponse.next();
    response.headers.set("X-City-Code", existingCityCode);
    response.headers.set("X-City-Id", String(cityInfo.id));
    response.headers.set("X-City-Name", encodeURIComponent(cityInfo.name));
    response.headers.set("X-City-Region", cityInfo.region);
    return response;
  }

  return NextResponse.next();
}

// 配置 middleware 匹配范围
export const config = {
  matcher: [
    // 匹配所有路径，排除 _next 静态文件
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
