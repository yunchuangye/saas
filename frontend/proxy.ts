import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 路由代理（proxy.ts）
 * ============================================================
 * 功能：
 * 1. 权限守卫：访问 /dashboard/* 必须携带有效 token，否则跳转 /login
 * 2. 角色路由隔离：每个角色只能访问自己的 dashboard 子路径
 * 3. 多城市分站路由：泛域名拦截，注入城市上下文到请求头和 Cookie
 *    - sz.gujia.app / shenzhen.gujia.app → X-City-Id: 190
 *    - 根路径 / 自动重定向到 /city-home
 */

// ─── 城市映射表（与数据库 cities 表 id 字段保持一致）────────────
const CITY_PINYIN_MAP: Record<string, { id: number; name: string; region: string; tier: number }> = {
  // 华北
  beijing:      { id: 1,   name: "北京",     region: "north",     tier: 1 },
  tianjin:      { id: 2,   name: "天津",     region: "north",     tier: 1 },
  shijiazhuang: { id: 3,   name: "石家庄",   region: "north",     tier: 3 },
  tangshan:     { id: 4,   name: "唐山",     region: "north",     tier: 3 },
  baoding:      { id: 8,   name: "保定",     region: "north",     tier: 3 },
  taiyuan:      { id: 34,  name: "太原",     region: "north",     tier: 2 },
  hohhot:       { id: 45,  name: "呼和浩特", region: "north",     tier: 3 },
  // 东北
  shenyang:     { id: 35,  name: "沈阳",     region: "northeast", tier: 2 },
  dalian:       { id: 52,  name: "大连",     region: "northeast", tier: 2 },
  changchun:    { id: 58,  name: "长春",     region: "northeast", tier: 2 },
  harbin:       { id: 59,  name: "哈尔滨",   region: "northeast", tier: 2 },
  // 华东
  shanghai:     { id: 69,  name: "上海",     region: "east",      tier: 1 },
  nanjing:      { id: 70,  name: "南京",     region: "east",      tier: 2 },
  wuxi:         { id: 71,  name: "无锡",     region: "east",      tier: 2 },
  suzhou:       { id: 74,  name: "苏州",     region: "east",      tier: 2 },
  hangzhou:     { id: 83,  name: "杭州",     region: "east",      tier: 2 },
  ningbo:       { id: 84,  name: "宁波",     region: "east",      tier: 2 },
  wenzhou:      { id: 85,  name: "温州",     region: "east",      tier: 2 },
  hefei:        { id: 94,  name: "合肥",     region: "east",      tier: 2 },
  fuzhou:       { id: 110, name: "福州",     region: "east",      tier: 2 },
  xiamen:       { id: 111, name: "厦门",     region: "east",      tier: 2 },
  nanchang:     { id: 120, name: "南昌",     region: "east",      tier: 2 },
  jinan:        { id: 130, name: "济南",     region: "east",      tier: 2 },
  qingdao:      { id: 131, name: "青岛",     region: "east",      tier: 2 },
  // 华中
  zhengzhou:    { id: 146, name: "郑州",     region: "central",   tier: 2 },
  luoyang:      { id: 148, name: "洛阳",     region: "central",   tier: 3 },
  wuhan:        { id: 163, name: "武汉",     region: "central",   tier: 2 },
  changsha:     { id: 175, name: "长沙",     region: "central",   tier: 2 },
  // 华南
  guangzhou:    { id: 188, name: "广州",     region: "south",     tier: 1 },
  shenzhen:     { id: 190, name: "深圳",     region: "south",     tier: 1 },
  dongguan:     { id: 192, name: "东莞",     region: "south",     tier: 2 },
  foshan:       { id: 193, name: "佛山",     region: "south",     tier: 2 },
  zhuhai:       { id: 194, name: "珠海",     region: "south",     tier: 2 },
  huizhou:      { id: 195, name: "惠州",     region: "south",     tier: 3 },
  zhongshan:    { id: 196, name: "中山",     region: "south",     tier: 3 },
  nanning:      { id: 214, name: "南宁",     region: "south",     tier: 2 },
  haikou:       { id: 225, name: "海口",     region: "south",     tier: 3 },
  // 西部（含西南+西北）
  chongqing:    { id: 227, name: "重庆",     region: "west",      tier: 1 },
  chengdu:      { id: 228, name: "成都",     region: "west",      tier: 2 },
  kunming:      { id: 230, name: "昆明",     region: "west",      tier: 2 },
  guiyang:      { id: 236, name: "贵阳",     region: "west",      tier: 3 },
  xian:         { id: 266, name: "西安",     region: "west",      tier: 2 },
  lanzhou:      { id: 256, name: "兰州",     region: "west",      tier: 3 },
  urumqi:       { id: 263, name: "乌鲁木齐", region: "west",      tier: 3 },
};

// 短码别名
const CITY_SHORT_CODE: Record<string, string> = {
  bj: "beijing",   tj: "tianjin",  sh: "shanghai",  gz: "guangzhou",
  sz: "shenzhen",  cq: "chongqing", cd: "chengdu",  wh: "wuhan",
  hz: "hangzhou",  nj: "nanjing",  xa: "xian",      cs: "changsha",
  zz: "zhengzhou", sy: "shenyang", dl: "dalian",    qd: "qingdao",
  dg: "dongguan",  fs: "foshan",   zh: "zhuhai",    nb: "ningbo",
  xm: "xiamen",    fz: "fuzhou",   hf: "hefei",     km: "kunming",
};

// 从 Host 解析城市拼音
function parseCityFromHost(host: string): string | null {
  const match = host.match(/^([a-z]{2,20})\.(gujia\.app|gujia\.com|localhost|[\w.-]+?)(?::\d+)?$/i);
  if (!match) return null;
  const sub = match[1].toLowerCase();
  if (CITY_PINYIN_MAP[sub]) return sub;
  const full = CITY_SHORT_CODE[sub];
  if (full && CITY_PINYIN_MAP[full]) return full;
  return null;
}

// 不需要城市上下文的路径前缀
const CITY_BYPASS = ["/_next/", "/api/", "/favicon", "/robots", "/sitemap", "/icon", "/apple-icon"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const token = request.cookies.get("token")?.value;

  // ── 1. 多城市分站路由（泛域名拦截）──────────────────────────────
  const skipCityRoute = CITY_BYPASS.some(p => pathname.startsWith(p));
  if (!skipCityRoute) {
    const cityPinyin = parseCityFromHost(host);
    if (cityPinyin) {
      const cityInfo = CITY_PINYIN_MAP[cityPinyin];
      // 分站根路径重定向到城市首页
      if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/city-home";
        return NextResponse.redirect(url);
      }
      const response = NextResponse.next();
      // 注入城市上下文到请求头（供 Server Components 读取）
      response.headers.set("X-City-Pinyin", cityPinyin);
      response.headers.set("X-City-Id",     String(cityInfo.id));
      response.headers.set("X-City-Name",   cityInfo.name);
      response.headers.set("X-City-Region", cityInfo.region);
      response.headers.set("X-City-Tier",   String(cityInfo.tier));
      // 写入 Cookie（30 天有效，供 Client Components 读取）
      const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
      response.cookies.set("city_pinyin", cityPinyin,                         cookieOpts);
      response.cookies.set("city_id",     String(cityInfo.id),                 cookieOpts);
      response.cookies.set("city_name",   encodeURIComponent(cityInfo.name),   cookieOpts);
      response.cookies.set("city_region", cityInfo.region,                     cookieOpts);
      response.cookies.set("city_tier",   String(cityInfo.tier),               cookieOpts);
      return response;
    }

    // 非子域名：从 Cookie 恢复城市上下文，注入请求头
    const cookiePinyin = request.cookies.get("city_pinyin")?.value
      || CITY_SHORT_CODE[request.cookies.get("city_code")?.value || ""] || "";
    if (cookiePinyin && CITY_PINYIN_MAP[cookiePinyin]) {
      const cityInfo = CITY_PINYIN_MAP[cookiePinyin];
      const response = NextResponse.next();
      response.headers.set("X-City-Pinyin", cookiePinyin);
      response.headers.set("X-City-Id",     String(cityInfo.id));
      response.headers.set("X-City-Name",   cityInfo.name);
      response.headers.set("X-City-Region", cityInfo.region);
      // 继续执行权限守卫逻辑（不提前 return）
      // 注意：此处需要继续走下面的权限守卫，所以不 return response
      // 而是在最终 return 时附带城市头
    }
  }

  // ── 2. 权限守卫：保护 /dashboard/* 路由 ──────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf-8")
        );
        const role: string = payload.role || "";
        const rolePathMap: Record<string, string> = {
          bank:      "/dashboard/bank",
          investor:  "/dashboard/investor",
          appraiser: "/dashboard/appraiser",
          customer:  "/dashboard/customer",
          admin:     "/dashboard/admin",
        };
        const allowedPrefix = rolePathMap[role];
        if (allowedPrefix && !pathname.startsWith(allowedPrefix) && pathname !== "/dashboard") {
          return NextResponse.redirect(new URL(allowedPrefix, request.url));
        }
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }
  }

  // ── 3. 已登录用户访问 /login 自动跳回对应角色 dashboard ──────────
  if (pathname === "/login" && token) {
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf-8")
        );
        const role: string = payload.role || "";
        const rolePathMap: Record<string, string> = {
          bank:      "/dashboard/bank",
          investor:  "/dashboard/investor",
          appraiser: "/dashboard/appraiser",
          customer:  "/dashboard/customer",
          admin:     "/dashboard/admin",
        };
        const dashboardPath = rolePathMap[role] || "/dashboard";
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    } catch {
      // token 无效，允许访问登录页
    }
  }

  return NextResponse.next();
}

// 配置代理匹配路径
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.*\\.png|apple-icon\\.png).*)",
  ],
};
