/**
 * Next.js Middleware - 多城市分站路由
 * ============================================================
 * 功能：
 * 1. 泛域名拦截：sz.gujia.app → 注入 cityCode=sz（拼音前缀匹配）
 * 2. 请求头注入：X-City-Code / X-City-Id / X-City-Name / X-City-Region
 * 3. Cookie 持久化：城市选择保存 30 天
 * 4. 城市主页重定向：访问 sz.gujia.app/ → /city-home
 * 5. SEO 友好：每个城市分站有独立的 canonical URL
 *
 * 城市 ID 与数据库 cities 表保持一致（298 个城市）
 * 支持拼音子域名：beijing.gujia.app / shanghai.gujia.app 等
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── 城市映射表（与数据库 cities 表 id 字段保持一致）────────────
// 格式：pinyin → { id, name, region, regionName, tier }
// 仅列出主要城市（一线/新一线/二线），完整列表由后端 API 提供
export const CITY_PINYIN_MAP: Record<string, {
  id: number;
  name: string;
  region: "north" | "east" | "south" | "central" | "west" | "northeast";
  regionName: string;
  tier: number;
}> = {
  // ── 华北区 ──────────────────────────────────────────────────
  beijing:      { id: 1,   name: "北京",   region: "north",     regionName: "华北", tier: 1 },
  tianjin:      { id: 2,   name: "天津",   region: "north",     regionName: "华北", tier: 1 },
  shijiazhuang: { id: 3,   name: "石家庄", region: "north",     regionName: "华北", tier: 3 },
  tangshan:     { id: 4,   name: "唐山",   region: "north",     regionName: "华北", tier: 3 },
  baoding:      { id: 8,   name: "保定",   region: "north",     regionName: "华北", tier: 3 },
  taiyuan:      { id: 34,  name: "太原",   region: "north",     regionName: "华北", tier: 2 },
  hohhot:       { id: 45,  name: "呼和浩特", region: "north",   regionName: "华北", tier: 3 },
  // ── 东北区 ──────────────────────────────────────────────────
  shenyang:     { id: 35,  name: "沈阳",   region: "northeast", regionName: "东北", tier: 2 },
  dalian:       { id: 52,  name: "大连",   region: "northeast", regionName: "东北", tier: 2 },
  changchun:    { id: 58,  name: "长春",   region: "northeast", regionName: "东北", tier: 2 },
  harbin:       { id: 59,  name: "哈尔滨", region: "northeast", regionName: "东北", tier: 2 },
  // ── 华东区 ──────────────────────────────────────────────────
  shanghai:     { id: 69,  name: "上海",   region: "east",      regionName: "华东", tier: 1 },
  nanjing:      { id: 70,  name: "南京",   region: "east",      regionName: "华东", tier: 2 },
  wuxi:         { id: 71,  name: "无锡",   region: "east",      regionName: "华东", tier: 2 },
  suzhou:       { id: 74,  name: "苏州",   region: "east",      regionName: "华东", tier: 2 },
  hangzhou:     { id: 83,  name: "杭州",   region: "east",      regionName: "华东", tier: 2 },
  ningbo:       { id: 84,  name: "宁波",   region: "east",      regionName: "华东", tier: 2 },
  wenzhou:      { id: 85,  name: "温州",   region: "east",      regionName: "华东", tier: 2 },
  hefei:        { id: 94,  name: "合肥",   region: "east",      regionName: "华东", tier: 2 },
  fuzhou:       { id: 110, name: "福州",   region: "east",      regionName: "华东", tier: 2 },
  xiamen:       { id: 111, name: "厦门",   region: "east",      regionName: "华东", tier: 2 },
  jinan:        { id: 130, name: "济南",   region: "east",      regionName: "华东", tier: 2 },
  qingdao:      { id: 131, name: "青岛",   region: "east",      regionName: "华东", tier: 2 },
  nanchang:     { id: 120, name: "南昌",   region: "east",      regionName: "华东", tier: 2 },
  // ── 华中区 ──────────────────────────────────────────────────
  zhengzhou:    { id: 146, name: "郑州",   region: "central",   regionName: "华中", tier: 2 },
  wuhan:        { id: 163, name: "武汉",   region: "central",   regionName: "华中", tier: 2 },
  changsha:     { id: 175, name: "长沙",   region: "central",   regionName: "华中", tier: 2 },
  luoyang:      { id: 148, name: "洛阳",   region: "central",   regionName: "华中", tier: 3 },
  // ── 华南区 ──────────────────────────────────────────────────
  guangzhou:    { id: 188, name: "广州",   region: "south",     regionName: "华南", tier: 1 },
  shenzhen:     { id: 190, name: "深圳",   region: "south",     regionName: "华南", tier: 1 },
  dongguan:     { id: 192, name: "东莞",   region: "south",     regionName: "华南", tier: 2 },
  foshan:       { id: 193, name: "佛山",   region: "south",     regionName: "华南", tier: 2 },
  zhuhai:       { id: 194, name: "珠海",   region: "south",     regionName: "华南", tier: 2 },
  huizhou:      { id: 195, name: "惠州",   region: "south",     regionName: "华南", tier: 3 },
  zhongshan:    { id: 196, name: "中山",   region: "south",     regionName: "华南", tier: 3 },
  nanning:      { id: 214, name: "南宁",   region: "south",     regionName: "华南", tier: 2 },
  haikou:       { id: 225, name: "海口",   region: "south",     regionName: "华南", tier: 3 },
  // ── 西南区 ──────────────────────────────────────────────────
  chengdu:      { id: 228, name: "成都",   region: "west",      regionName: "西部", tier: 2 },
  chongqing:    { id: 227, name: "重庆",   region: "west",      regionName: "西部", tier: 1 },
  kunming:      { id: 230, name: "昆明",   region: "west",      regionName: "西部", tier: 2 },
  guiyang:      { id: 236, name: "贵阳",   region: "west",      regionName: "西部", tier: 3 },
  // ── 西北区 ──────────────────────────────────────────────────
  xian:         { id: 266, name: "西安",   region: "west",      regionName: "西部", tier: 2 },
  lanzhou:      { id: 256, name: "兰州",   region: "west",      regionName: "西部", tier: 3 },
  urumqi:       { id: 263, name: "乌鲁木齐", region: "west",    regionName: "西部", tier: 3 },
};

// 同时支持短码（兼容旧 Cookie）
export const CITY_SHORT_CODE_MAP: Record<string, string> = {
  bj: "beijing",   tj: "tianjin",  sh: "shanghai",  gz: "guangzhou",
  sz: "shenzhen",  cq: "chongqing", cd: "chengdu",  wh: "wuhan",
  hz: "hangzhou",  nj: "nanjing",  xa: "xian",      cs: "changsha",
  zz: "zhengzhou", sy: "shenyang", dl: "dalian",    qd: "qingdao",
  dg: "dongguan",  fs: "foshan",   zh: "zhuhai",    nb: "ningbo",
  xm: "xiamen",    fz: "fuzhou",   hf: "hefei",     km: "kunming",
};

// ─── 从 Host 解析城市拼音代码 ──────────────────────────────────
function parseCityFromHost(host: string): string | null {
  // 匹配：shenzhen.gujia.app / sz.gujia.app / shenzhen.localhost:3000
  const match = host.match(/^([a-z]{2,20})\.(gujia\.app|gujia\.com|localhost|[\w.-]+?)(?::\d+)?$/i);
  if (!match) return null;

  const sub = match[1].toLowerCase();

  // 优先完整拼音
  if (CITY_PINYIN_MAP[sub]) return sub;

  // 短码映射
  if (CITY_SHORT_CODE_MAP[sub]) {
    const full = CITY_SHORT_CODE_MAP[sub];
    if (CITY_PINYIN_MAP[full]) return full;
  }

  return null;
}

// ─── 不需要城市上下文的路径 ────────────────────────────────────
const BYPASS_PREFIXES = [
  "/_next/",
  "/api/",
  "/favicon",
  "/robots.txt",
  "/sitemap",
  "/icon",
  "/apple-icon",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-seal",
  "/platform-admin",
];

function shouldBypass(pathname: string): boolean {
  return BYPASS_PREFIXES.some(p => pathname.startsWith(p));
}

// ─── Middleware 主逻辑 ─────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // 跳过静态资源和认证路径
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // ── 1. 从子域名解析城市 ──────────────────────────────────────
  const cityPinyin = parseCityFromHost(host);

  if (cityPinyin) {
    const cityInfo = CITY_PINYIN_MAP[cityPinyin];

    // 访问分站根路径时重定向到城市首页
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

    // 写入 Cookie（供 Client Components 读取，30 天有效）
    const cookieOpts = { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
    response.cookies.set("city_pinyin",  cityPinyin,                                  cookieOpts);
    response.cookies.set("city_id",      String(cityInfo.id),                          cookieOpts);
    response.cookies.set("city_name",    encodeURIComponent(cityInfo.name),             cookieOpts);
    response.cookies.set("city_region",  cityInfo.region,                              cookieOpts);
    response.cookies.set("city_tier",    String(cityInfo.tier),                         cookieOpts);

    return response;
  }

  // ── 2. 非子域名：从 Cookie 恢复城市上下文 ───────────────────
  const cookiePinyin = request.cookies.get("city_pinyin")?.value
    || CITY_SHORT_CODE_MAP[request.cookies.get("city_code")?.value || ""] || "";

  if (cookiePinyin && CITY_PINYIN_MAP[cookiePinyin]) {
    const cityInfo = CITY_PINYIN_MAP[cookiePinyin];
    const response = NextResponse.next();
    response.headers.set("X-City-Pinyin", cookiePinyin);
    response.headers.set("X-City-Id",     String(cityInfo.id));
    response.headers.set("X-City-Name",   cityInfo.name);
    response.headers.set("X-City-Region", cityInfo.region);
    return response;
  }

  return NextResponse.next();
}

// ─── Matcher 配置 ─────────────────────────────────────────────
export const config = {
  matcher: [
    // 匹配所有路径，排除 _next 静态文件和图片优化
    "/((?!_next/static|_next/image|favicon.ico|icon.*\\.png|apple-icon\\.png).*)",
  ],
};
