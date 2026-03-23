import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import express from "express";
import jwt from 'jsonwebtoken';
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext, JWT_SECRET_KEY } from "./lib/trpc";
import { db, redis } from "./lib/db";
import { users, type InsertUser } from "./lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { startCrawlWorker } from './crawler/engines/job-queue';
import { upload, saveFile, isOssEnabled } from './lib/upload';
import * as fs from 'fs';
import * as pathModule from 'path';
import { initCronScheduler } from './crawler/engines/cron-scheduler';
import svgCaptcha from 'svg-captcha';
import { randomUUID } from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || "8721");
const IS_PROD = process.env.NODE_ENV === 'production';

// ============================================================
// 安全中间件（运营级别）
// ============================================================
// Helmet：设置安全 HTTP 头
app.use(helmet({
  contentSecurityPolicy: false, // tRPC 需要关闭 CSP 或自定义
  crossOriginEmbedderPolicy: false,
}));

// Compression：Gzip 压缩响应
app.use(compression());

// Morgan：HTTP 请求日志（生产环境使用 combined 格式）
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// Rate Limiting：全局限流（每 IP 每 15 分钟最多 500 次请求）
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
  skip: (req) => req.path === '/health', // 健康检查不限流
});
app.use(globalLimiter);

// Auth 接口专用限流（防暴力破解）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  keyGenerator: (req) => req.ip || 'unknown',
});

// 从环境变量解析允许的 CORS 来源列表
// 优先使用 CORS_ORIGINS，其次使用 FRONTEND_URL，最后允许所有（仅 development）
function getAllowedOrigins(): string[] {
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins && corsOrigins.trim()) {
    return corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && frontendUrl.trim()) {
    return frontendUrl.split(',').map(o => o.trim()).filter(Boolean);
  }
  return []; // 空数组表示允许所有（见下方逻辑）
}

// 中间件
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS 配置（从 .env 读取允许的来源）
const allowedOrigins = getAllowedOrigins();
console.log(`🔒 CORS allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '* (all)'}`);

app.use(
  cors({
    origin: (origin, callback) => {
      // 没有 origin（如服务端直接请求、curl 等）始终允许
      if (!origin) return callback(null, true);
      // 未配置白名单时允许所有来源（开发模式兜底）
      if (allowedOrigins.length === 0) return callback(null, true);
      // 检查是否在白名单中
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // 开发环境额外允许 localhost 和 manus.computer 代理域名
      if (process.env.NODE_ENV !== 'production') {
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
        if (/\.manus\.computer$/.test(origin)) return callback(null, true);
      }
      callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// 健康检查（增强版）
app.get("/health", async (req, res) => {
  const checks: Record<string, string> = {};
  // 检查 Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }
  // 检查主库 DB
  try {
    const { pool } = await import('./lib/db');
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  // 检查单库分表健康状态
  try {
    const { checkShardTablesHealth } = await import('./lib/shard-db');
    const shardHealth = await checkShardTablesHealth();
    checks.shards = shardHealth.healthy
      ? `ok (${shardHealth.totalTables} tables)`
      : `missing: ${shardHealth.missingTables.join(',')}`;
  } catch {
    checks.shards = 'error';
  }
  const allOk = Object.values(checks).every(v => typeof v === 'string' && v.startsWith('ok'));
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    checks,
  });
});

// 图形验证码接口（带限流）
// GET /api/captcha  -> 返回 { id: string, svg: string }
// 验证码文本存入 Redis，key=captcha:{id}，TTL=5分钟
app.get("/api/captcha", async (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 4,              // 4位数字
      noise: 1,             // 减少干扰线（1条）
      color: false,         // 统一深色，更清晰
      background: '#ffffff', // 纯白背景
      width: 120,           // 宽度适配数字
      height: 44,           // 高度与输入框对齐
      fontSize: 46,         // 字号
      charPreset: '23456789', // 纯数字，排除 0/1 易混淆
    });
    const id = randomUUID();
    // 存入 Redis，5分钟过期
    await redis.set(`captcha:${id}`, captcha.text, 'EX', 300);
    res.json({ id, svg: captcha.data });
  } catch (err: any) {
    console.error('[Captcha] 生成失败:', err.message);
    res.status(500).json({ error: '验证码生成失败' });
  }
});

// Auth 接口限流（应用到 login/register）
app.use('/api/trpc/auth.login', authLimiter);
app.use('/api/trpc/auth.register', authLimiter);
app.use('/api/trpc/auth.forgotPassword', authLimiter);

// tRPC 路由
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code !== "UNAUTHORIZED" && error.code !== "NOT_FOUND") {
        console.error(`tRPC error on ${path}:`, error.message);
      }
    },
  })
);

// 初始化数据库（创建默认管理员账号）
async function initDB() {
  try {
    // 检查是否有管理员账号
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (!admin) {
      console.log("Creating default admin user...");
      const hash = await bcrypt.hash("admin123456", 10);
      await db.insert(users).values({
        username: "admin",
        passwordHash: hash,
        displayName: "系统管理员",
        role: "admin",
        isActive: true,
      } as InsertUser);
      console.log("Default admin created: admin / admin123456");
    }

    // 创建测试用户
    const testUsers = [
      { username: "appraiser1", role: "appraiser" as const, displayName: "张评估师", password: "test123456" },
      { username: "bank1", role: "bank" as const, displayName: "李银行员", password: "test123456" },
      { username: "investor1", role: "investor" as const, displayName: "王投资人", password: "test123456" },
      { username: "customer1", role: "customer" as const, displayName: "赵客户", password: "test123456" },
    ];

    for (const u of testUsers) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, u.username))
        .limit(1);

      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        await db.insert(users).values({
          username: u.username,
          passwordHash: hash,
          displayName: u.displayName,
          role: u.role,
          isActive: true,
        } as InsertUser);
        console.log(`Test user created: ${u.username} / ${u.password}`);
      }
    }
  } catch (err: any) {
    console.error("DB init error:", err.message);
  }
}

// PDF 报告生成接口
app.get('/api/valuation-report/:id', async (req, res) => {
  try {
    // 验证 JWT
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: '未登录' })
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as any
    if (!decoded?.id && !decoded?.userId) return res.status(401).json({ error: '无效令牌' })

    const { db } = await import('./lib/db')
    const { autoValuations } = await import('./lib/schema')
    const { eq } = await import('drizzle-orm')

    const [record] = await db.select().from(autoValuations).where(eq(autoValuations.id, Number(req.params.id))).limit(1)
    if (!record) return res.status(404).json({ error: '记录不存在' })

    // 安全解析：llmAnalysis 可能是纯字符串或 JSON 对象
    let comparableCases: any[] = []
    try { comparableCases = record.comparableCases ? JSON.parse(record.comparableCases as string) : [] } catch { comparableCases = [] }
    let llmAnalysisText = ''
    try {
      const raw = record.llmAnalysis
      if (raw) {
        try {
          const parsed = JSON.parse(raw as string)
          llmAnalysisText = parsed?.analysis || parsed?.summary || (typeof parsed === 'string' ? parsed : '')
        } catch {
          llmAnalysisText = typeof raw === 'string' ? raw : ''
        }
      }
    } catch { llmAnalysisText = '' }
    let reportData: any = null
    try { reportData = record.reportData ? JSON.parse(record.reportData as string) : null } catch { reportData = null }

    // 生成 HTML 报告（一张纸简易估价说明模板）
    const { generateReportHTML: genHTML } = await import('./report-template')
    const html = genHTML(record, comparableCases, llmAnalysisText, reportData)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `inline; filename="valuation-report-${record.id}.html"`)
    res.send(html)
  } catch (err: any) {
    console.error('PDF report error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// generateReportHTML 已移至 ./report-template.ts
function _unused_generateReportHTML_REMOVED(record: any, comparableCases: any[], llmData: any, reportData: any): string {
  const formatMoney = (v: number) => {
    if (!v) return '—'
    if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿元`
    if (v >= 10000) return `${(v / 10000).toFixed(0)}万元`
    return `${v.toLocaleString()}元`
  }
  const formatNum = (v: number) => v ? v.toLocaleString('zh-CN') : '—'
  const now = new Date().toLocaleDateString('zh-CN')
  const finalValue = Number(record.estimatedValue || record.valuationResult || 0)
  const unitPrice = Number(record.unitPrice || 0)
  const area = Number(record.buildingArea || record.area || 0)
  const valueMin = Number(record.valuationMin || finalValue * 0.9)
  const valueMax = Number(record.valuationMax || finalValue * 1.1)

  const casesHTML = comparableCases.slice(0, 6).map((c: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.address || '同区域案例'}</td>
      <td>${Number(c.area || 0).toFixed(0)}</td>
      <td>${c.floor || '—'}/${c.totalFloors || '—'}</td>
      <td><strong>${formatNum(Number(c.unitPrice || c.unit_price || 0))}</strong></td>
      <td>${c.transactionDate ? new Date(c.transactionDate).toLocaleDateString('zh-CN') : '—'}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>房地产估价简易报告 - ${record.address}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; font-size: 14px; color: #333; background: #f5f5f5; }
  .container { max-width: 900px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
  .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 8px; }
  .header p { color: #666; font-size: 13px; line-height: 1.8; }
  .section { margin-bottom: 25px; }
  .section-title { font-size: 16px; font-weight: bold; color: #1e40af; border-left: 4px solid #2563eb; padding-left: 12px; margin-bottom: 15px; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .info-item { background: #f8fafc; padding: 10px; border-radius: 6px; }
  .info-item .label { font-size: 11px; color: #888; margin-bottom: 4px; }
  .info-item .value { font-size: 14px; font-weight: 500; color: #333; }
  .result-grid { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 15px; margin-bottom: 20px; }
  .result-card { text-align: center; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
  .result-card.main { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
  .result-card .label { font-size: 12px; opacity: 0.8; margin-bottom: 8px; }
  .result-card .value { font-size: 22px; font-weight: bold; }
  .result-card .sub { font-size: 12px; opacity: 0.7; margin-top: 6px; }
  .result-card.low .value { color: #ea580c; }
  .result-card.high .value { color: #16a34a; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 9px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:hover td { background: #f8fafc; }
  .ai-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; }
  .ai-box p { line-height: 1.8; color: #1e40af; white-space: pre-line; }
  .disclaimer { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 12px; color: #888; line-height: 1.8; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .confidence-bar { background: #e2e8f0; border-radius: 10px; height: 10px; margin-top: 8px; overflow: hidden; }
  .confidence-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
  @media print {
    body { background: white; }
    .container { box-shadow: none; margin: 0; padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>房地产估价简易报告</h1>
    <p>估价对象：${record.address || record.propertyAddress || '—'}</p>
    <p>报告编号：RPT-AUTO-${record.id} &nbsp;|&nbsp; 估价日期：${now} &nbsp;|&nbsp; 估价目的：${record.purpose === 'mortgage' ? '抵押贷款' : record.purpose === 'transaction' ? '买卖交易' : record.purpose || '—'}</p>
  </div>

  <div class="section">
    <div class="section-title">一、估价物业基本信息</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">物业地址</div><div class="value">${record.address || '—'}</div></div>
      <div class="info-item"><div class="label">建筑面积</div><div class="value">${area} ㎡</div></div>
      <div class="info-item"><div class="label">楼层/总层</div><div class="value">${record.floor || '—'}/${record.totalFloors || '—'} 层</div></div>
      <div class="info-item"><div class="label">楼龄</div><div class="value">${record.buildingAge || '—'} 年</div></div>
      <div class="info-item"><div class="label">物业类型</div><div class="value">${record.propertyType === 'residential' ? '住宅' : record.propertyType || '—'}</div></div>
      <div class="info-item"><div class="label">装修情况</div><div class="value">${record.decoration === 'fine' ? '精装' : record.decoration === 'rough' ? '毛坯' : record.decoration === 'luxury' ? '豪装' : record.decoration || '—'}</div></div>
      <div class="info-item"><div class="label">朝向</div><div class="value">${record.orientation === 'south_north' ? '南北通透' : record.orientation === 'south' ? '朝南' : record.orientation || '—'}</div></div>
      <div class="info-item"><div class="label">电梯/停车</div><div class="value">${record.hasElevator ? '有电梯' : '无电梯'} / ${record.hasParking ? '有停车位' : '无停车位'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">二、估价结果</div>
    <div class="result-grid">
      <div class="result-card low">
        <div class="label">估价低值</div>
        <div class="value">${formatMoney(valueMin)}</div>
        <div class="sub">${formatNum(Math.round(valueMin / area))} 元/㎡</div>
      </div>
      <div class="result-card main">
        <div class="label">估价中值（推荐）</div>
        <div class="value">${formatMoney(finalValue)}</div>
        <div class="sub">${formatNum(unitPrice)} 元/㎡ · ${area}㎡</div>
      </div>
      <div class="result-card high">
        <div class="label">估价高值</div>
        <div class="value">${formatMoney(valueMax)}</div>
        <div class="sub">${formatNum(Math.round(valueMax / area))} 元/㎡</div>
      </div>
    </div>
    <div style="display:flex; gap:20px; align-items:center; margin-top:15px;">
      <span>采用方法：<span class="badge badge-blue">${record.method || '综合估价法'}</span></span>
      <span>置信度：<span class="badge badge-green">${record.confidenceLevel === 'high' ? '高可信度' : record.confidenceLevel === 'medium' ? '中等可信度' : '低可信度'}</span></span>
      ${llmData ? `<span>AI置信度评分：<strong>${llmData.confidenceScore || 75}分</strong></span>` : ''}
      ${llmData ? `<span>风险等级：<strong>${llmData.riskLevel || '中'}风险</strong></span>` : ''}
    </div>
    ${llmData?.confidenceScore ? `<div class="confidence-bar" style="margin-top:10px;"><div class="confidence-fill" style="width:${llmData.confidenceScore}%"></div></div>` : ''}
  </div>

  ${comparableCases.length > 0 ? `
  <div class="section">
    <div class="section-title">三、参考案例（${comparableCases.length}个）</div>
    <table>
      <thead><tr><th>序号</th><th>地址</th><th>面积(㎡)</th><th>楼层</th><th>成交单价(元/㎡)</th><th>成交时间</th></tr></thead>
      <tbody>${casesHTML}</tbody>
    </table>
  </div>` : ''}

  ${llmData?.analysis ? `
  <div class="section">
    <div class="section-title">四、AI专业分析报告</div>
    <div class="ai-box"><p>${llmData.analysis}</p></div>
    ${llmData.keyFactors?.length ? `<div style="margin-top:12px;">关键影响因素：${llmData.keyFactors.map((f: string) => `<span class="badge badge-blue" style="margin-right:6px;">${f}</span>`).join('')}</div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">五、声明与限制条件</div>
    <div class="disclaimer">
      <p>1. 本报告由 gujia.app 智能估价系统自动生成，仅供参考，不构成正式估价报告。</p>
      <p>2. 正式估价报告须由持有国家注册房地产估价师资格证书的估价师签章方可生效。</p>
      <p>3. 本报告所引用的市场数据来源于系统案例库，数据截止日期为报告生成日。</p>
      <p>4. 估价结果受市场波动、政策变化等因素影响，有效期为报告生成之日起6个月内。</p>
      <p>5. 报告编号：RPT-AUTO-${record.id} &nbsp;|&nbsp; 生成时间：${now}</p>
    </div>
  </div>

  <div class="no-print" style="text-align:center; margin-top:30px;">
    <button onclick="window.print()" style="background:#2563eb; color:white; border:none; padding:12px 30px; border-radius:6px; font-size:15px; cursor:pointer;">🖨️ 打印 / 保存为 PDF</button>
  </div>
</div>
</body>
</html>`
}

// ============================================================
// 文件上传 API
// ============================================================

// 静态文件服务（本地上传文件）
const UPLOAD_DIR = pathModule.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

/**
 * POST /api/upload
 * 上传单个文件，支持本地存储和 OSS
 */
app.post('/api/upload', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录，请先登录' });
  try {
    jwt.verify(token, JWT_SECRET_KEY);
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  next();
}, upload.single('file'), async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未收到文件，请选择要上传的文件' });
    }
    const result = await saveFile(req.file);
    res.json({
      success: true,
      ...result,
      storageMode: isOssEnabled() ? 'oss' : 'local',
    });
  } catch (err: any) {
    console.error('[Upload] 上传失败:', err.message);
    res.status(500).json({ error: err.message || '文件上传失败' });
  }
}, (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // multer 错误处理（文件类型不允许、文件过大等）
  if (err) {
    return res.status(400).json({ error: err.message || '文件上传失败' });
  }
});

/**
 * GET /api/upload/config
 * 返回上传配置信息
 */
app.get('/api/upload/config', (_req, res) => {
  res.json({
    storageMode: isOssEnabled() ? 'oss' : 'local',
    maxFileSize: 10 * 1024 * 1024,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  });
});

// ============================================================
// SSE 实时通知端点
// ============================================================
// 存储所有活跃的 SSE 连接: userId -> Response[]
const sseClients = new Map<number, express.Response[]>();

/**
 * 向指定用户推送 SSE 事件（供其他模块调用）
 */
export function pushNotification(userId: number, data: any) {
  const clients = sseClients.get(userId);
  if (clients && clients.length > 0) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(res => {
      try { res.write(msg); } catch {}
    });
  }
}

/**
 * GET /api/sse/notifications
 * 建立 SSE 连接，接收实时通知推送
 */
app.get('/api/sse/notifications', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });

  let userId: number;
  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY) as any;
    userId = payload.id;
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 发送初始连接成功事件
  res.write(`data: ${JSON.stringify({ type: 'connected', message: '实时通知已连接' })}\n\n`);

  // 注册连接
  const clients = sseClients.get(userId) ?? [];
  clients.push(res);
  sseClients.set(userId, clients);

  // 心跳保活（每30秒）
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 30000);

  // 连接关闭时清理
  req.on('close', () => {
    clearInterval(heartbeat);
    const list = sseClients.get(userId) ?? [];
    const idx = list.indexOf(res);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) sseClients.delete(userId);
  });
});

// ============================================================
// 支付回调路由（微信/支付宝异步通知）
// ============================================================
import { handleWechatNotify, handleAlipayNotify } from './routers/payment';
import { EXPORT_DIR } from './lib/export-service';

app.post('/api/payment/wechat/notify', express.text({ type: 'text/xml' }), async (req, res) => {
  const body: Record<string, string> = {};
  const xmlStr = String(req.body || '');
  const matches = xmlStr.matchAll(/<(\w+)><!\[CDATA\[(.+?)\]\]><\/\1>/g);
  for (const m of matches) body[m[1]] = m[2];
  await handleWechatNotify({ ...req, body } as any, res);
});

app.post('/api/payment/alipay/notify', express.urlencoded({ extended: true }), async (req, res) => {
  await handleAlipayNotify(req, res);
});

// ============================================================
// 导出文件下载路由
// ============================================================
app.get('/api/exports/download/:taskNo/:filename', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    jwt.verify(token, JWT_SECRET_KEY);
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
  const filePath = pathModule.join(EXPORT_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在或已过期' });
  res.download(filePath);
});

// 启动服务
app.listen(PORT, "0.0.0.0", async () => {
  const backendPublicUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${PORT}`;
  console.log(`\n🚀 gujia.app Backend running on port ${PORT}`);
  console.log(`🌐 Public URL: ${backendPublicUrl}`);
  console.log(`📡 tRPC API: ${backendPublicUrl}/api/trpc`);
  console.log(`🔍 Health: ${backendPublicUrl}/health\n`);

  await initDB();
  // 启动采集任务 Worker
  try {
    startCrawlWorker(3);
    console.log('🕷️  Crawl Worker started (concurrency: 3)');
  } catch (e: any) {
    console.warn('⚠️  Crawl Worker failed to start:', e.message);
  }
  // 启动定时调度器
  try {
    await initCronScheduler();
    console.log('⏰  Cron Scheduler started');
  } catch (e: any) {
    console.warn('⚠️  Cron Scheduler failed to start:', e.message);
  }
});

export type { AppRouter } from "./routers";
