/**
 * 支付网关服务
 * 支持：微信支付（Native扫码）、支付宝（PC/H5）、沙箱模拟模式
 * 生产环境：配置 WECHAT_PAY_* 和 ALIPAY_* 环境变量即可切换为真实网关
 */
import crypto from "crypto";
import axios from "axios";

const IS_SANDBOX = process.env.NODE_ENV !== "production" || process.env.PAYMENT_SANDBOX === "true";

// ============================================================
// 工具函数
// ============================================================
function generateOrderNo(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GJ${ts}${rand}`;
}

function generateNonceStr(len = 16): string {
  return crypto.randomBytes(len).toString("hex").substring(0, len);
}

// ============================================================
// 微信支付 Native（扫码支付）
// ============================================================
export interface WechatPayConfig {
  appId: string;
  mchId: string;
  apiKey: string;       // V2 API密钥
  apiV3Key?: string;    // V3 API密钥
  certPath?: string;    // 商户证书路径
  notifyUrl: string;
}

function getWechatConfig(): WechatPayConfig | null {
  if (!process.env.WECHAT_PAY_APP_ID) return null;
  return {
    appId: process.env.WECHAT_PAY_APP_ID!,
    mchId: process.env.WECHAT_PAY_MCH_ID!,
    apiKey: process.env.WECHAT_PAY_API_KEY!,
    notifyUrl: `${process.env.BACKEND_PUBLIC_URL}/api/payment/wechat/notify`,
  };
}

function wechatSign(params: Record<string, string>, apiKey: string): string {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&") + `&key=${apiKey}`;
  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
}

export async function createWechatOrder(opts: {
  orderNo: string;
  amount: number;   // 分
  description: string;
  openid?: string;
}): Promise<{ qrCode: string; payUrl: string; orderNo: string }> {
  const config = getWechatConfig();

  // 沙箱/无配置时返回模拟数据
  if (IS_SANDBOX || !config) {
    return {
      qrCode: `weixin://wxpay/bizpayurl?pr=sandbox_${opts.orderNo}`,
      payUrl: `${process.env.FRONTEND_URL || "http://localhost:8720"}/pay/sandbox?order=${opts.orderNo}&amount=${opts.amount}`,
      orderNo: opts.orderNo,
    };
  }

  const nonceStr = generateNonceStr();
  const params: Record<string, string> = {
    appid: config.appId,
    mch_id: config.mchId,
    nonce_str: nonceStr,
    body: opts.description,
    out_trade_no: opts.orderNo,
    total_fee: opts.amount.toString(),
    spbill_create_ip: "127.0.0.1",
    notify_url: config.notifyUrl,
    trade_type: "NATIVE",
  };
  params.sign = wechatSign(params, config.apiKey);

  const xmlBody = "<xml>" + Object.entries(params).map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`).join("") + "</xml>";
  const resp = await axios.post("https://api.mch.weixin.qq.com/pay/unifiedorder", xmlBody, {
    headers: { "Content-Type": "text/xml" },
    timeout: 10000,
  });

  // 解析XML响应
  const codeUrlMatch = resp.data.match(/<code_url><!\[CDATA\[(.+?)\]\]><\/code_url>/);
  const qrCode = codeUrlMatch ? codeUrlMatch[1] : "";

  return { qrCode, payUrl: qrCode, orderNo: opts.orderNo };
}

export function verifyWechatNotify(body: Record<string, string>): boolean {
  const config = getWechatConfig();
  if (!config) return true; // 沙箱模式直接通过
  const { sign, ...rest } = body;
  const expectedSign = wechatSign(rest, config.apiKey);
  return sign === expectedSign;
}

// ============================================================
// 支付宝（PC网站支付）
// ============================================================
export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  notifyUrl: string;
  returnUrl: string;
  gateway: string;
}

function getAlipayConfig(): AlipayConfig | null {
  if (!process.env.ALIPAY_APP_ID) return null;
  return {
    appId: process.env.ALIPAY_APP_ID!,
    privateKey: process.env.ALIPAY_PRIVATE_KEY!,
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
    notifyUrl: `${process.env.BACKEND_PUBLIC_URL}/api/payment/alipay/notify`,
    returnUrl: `${process.env.FRONTEND_URL}/dashboard/org/billing?payment=success`,
    gateway: process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do",
  };
}

function alipaySign(params: Record<string, string>, privateKey: string): string {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  return crypto.createSign("RSA-SHA256").update(str, "utf8").sign(
    `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`, "base64"
  );
}

export async function createAlipayOrder(opts: {
  orderNo: string;
  amount: number;   // 分，转换为元
  description: string;
}): Promise<{ payUrl: string; orderNo: string }> {
  const config = getAlipayConfig();

  if (IS_SANDBOX || !config) {
    return {
      payUrl: `${process.env.FRONTEND_URL || "http://localhost:8720"}/pay/sandbox?order=${opts.orderNo}&amount=${opts.amount}&channel=alipay`,
      orderNo: opts.orderNo,
    };
  }

  const amountYuan = (opts.amount / 100).toFixed(2);
  const bizContent = JSON.stringify({
    out_trade_no: opts.orderNo,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: amountYuan,
    subject: opts.description,
  });

  const params: Record<string, string> = {
    app_id: config.appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    version: "1.0",
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
    biz_content: bizContent,
  };
  params.sign = alipaySign(params, config.privateKey);

  const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return { payUrl: `${config.gateway}?${query}`, orderNo: opts.orderNo };
}

export function verifyAlipayNotify(params: Record<string, string>): boolean {
  const config = getAlipayConfig();
  if (!config) return true;
  const { sign, sign_type, ...rest } = params;
  const str = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join("&");
  try {
    return crypto.createVerify("RSA-SHA256").update(str, "utf8").verify(
      `-----BEGIN PUBLIC KEY-----\n${config.alipayPublicKey}\n-----END PUBLIC KEY-----`,
      sign, "base64"
    );
  } catch { return false; }
}

// ============================================================
// 统一创建支付订单
// ============================================================
export async function createPaymentOrder(opts: {
  orgId: number;
  userId: number;
  planCode: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  channel: "wechat" | "alipay";
  description: string;
}) {
  const orderNo = generateOrderNo();

  if (opts.channel === "wechat") {
    const result = await createWechatOrder({ orderNo, amount: opts.amount, description: opts.description });
    return { orderNo, channel: "wechat" as const, ...result, isSandbox: IS_SANDBOX };
  } else {
    const result = await createAlipayOrder({ orderNo, amount: opts.amount, description: opts.description });
    return { orderNo, channel: "alipay" as const, ...result, isSandbox: IS_SANDBOX };
  }
}

export { generateOrderNo, IS_SANDBOX };
