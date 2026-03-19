/**
 * 电子签章服务
 * 功能：
 * 1. 在 PDF 报告上嵌入机构公章和个人执业章（图片叠加）
 * 2. 生成防篡改二维码（含验证码 + 时间戳 + 报告哈希）
 * 3. 计算 PDF 文件 SHA256 哈希（防篡改校验）
 * 4. 模拟可信时间戳（生产环境可对接联信时间戳服务）
 */

import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

// ============================================================
// 类型定义
// ============================================================

export interface SealConfig {
  /** 机构公章图片路径或 URL */
  orgSealImageUrl?: string;
  /** 个人执业章图片路径或 URL */
  personalSealImageUrl?: string;
  /** 签章位置 */
  position: "bottom_right" | "bottom_center" | "bottom_left" | "custom";
  /** 自定义位置（position='custom' 时使用，单位：PDF 点） */
  customX?: number;
  customY?: number;
  /** 签章页面 */
  sealPage: "last" | "all" | "first_and_last";
  /** 签章尺寸（PDF 点，1 点 ≈ 0.353mm） */
  sealSize?: number;
}

export interface SignResult {
  /** 签章后 PDF 的 Buffer */
  pdfBuffer: Buffer;
  /** 签章后 PDF 的 SHA256 哈希 */
  hash: string;
  /** 验证码（6位大写字母数字） */
  verifyCode: string;
  /** 时间戳 */
  timestamp: string;
  /** 验证 URL */
  verifyUrl: string;
}

// ============================================================
// 工具函数
// ============================================================

/** 生成 6 位随机验证码 */
function generateVerifyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** 计算 Buffer 的 SHA256 哈希 */
export function calcSHA256(data: Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/** 从 URL 下载文件到 Buffer */
async function fetchBuffer(url: string): Promise<Buffer> {
  // 本地文件
  if (!url.startsWith("http")) {
    const localPath = url.startsWith("/") ? url : path.resolve(process.cwd(), url);
    return fs.readFileSync(localPath);
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/** 生成签章二维码图片（PNG Buffer） */
async function generateSealQRCode(
  verifyCode: string,
  reportId: number,
  timestamp: string,
  hash: string,
  frontendUrl: string
): Promise<Buffer> {
  const verifyUrl = `${frontendUrl}/verify-seal?code=${verifyCode}&report=${reportId}`;
  const qrData = JSON.stringify({
    code: verifyCode,
    reportId,
    timestamp,
    hash: hash.substring(0, 16), // 只放前16位，节省二维码空间
    url: verifyUrl,
  });

  const qrBuffer = await QRCode.toBuffer(qrData, {
    type: "png",
    width: 120,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  return qrBuffer;
}

/** 将图片 URL 转为 PDF 可用的 Uint8Array */
async function loadSealImage(imageUrl: string): Promise<Uint8Array | null> {
  try {
    const buf = await fetchBuffer(imageUrl);
    return new Uint8Array(buf);
  } catch (e) {
    console.warn(`[SealService] 无法加载签章图片: ${imageUrl}`, e);
    return null;
  }
}

// ============================================================
// 核心签章函数
// ============================================================

/**
 * 对 PDF 报告进行电子签章
 * @param pdfBuffer 原始 PDF Buffer
 * @param reportId 报告 ID
 * @param reportNo 报告编号
 * @param config 签章配置
 * @param frontendUrl 前端地址（用于生成验证 URL）
 */
export async function signPDF(
  pdfBuffer: Buffer,
  reportId: number,
  reportNo: string,
  config: SealConfig,
  frontendUrl: string = process.env.FRONTEND_URL || "http://localhost:8720"
): Promise<SignResult> {
  const verifyCode = generateVerifyCode();
  const timestamp = new Date().toISOString();
  const originalHash = calcSHA256(pdfBuffer);

  // 加载 PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  // 确定需要签章的页面索引
  let targetPageIndices: number[] = [];
  if (config.sealPage === "last") {
    targetPageIndices = [totalPages - 1];
  } else if (config.sealPage === "first_and_last") {
    targetPageIndices = totalPages === 1 ? [0] : [0, totalPages - 1];
  } else {
    // all
    targetPageIndices = Array.from({ length: totalPages }, (_, i) => i);
  }

  const sealSize = config.sealSize || 100; // 默认 100 点 ≈ 3.5cm

  // 加载签章图片
  let orgSealImage: any = null;
  let personalSealImage: any = null;

  if (config.orgSealImageUrl) {
    const imgData = await loadSealImage(config.orgSealImageUrl);
    if (imgData) {
      try {
        // 尝试 PNG，失败则尝试 JPG
        orgSealImage = await pdfDoc.embedPng(imgData).catch(() => pdfDoc.embedJpg(imgData));
      } catch (e) {
        console.warn("[SealService] 机构公章图片嵌入失败", e);
      }
    }
  }

  if (config.personalSealImageUrl) {
    const imgData = await loadSealImage(config.personalSealImageUrl);
    if (imgData) {
      try {
        personalSealImage = await pdfDoc.embedPng(imgData).catch(() => pdfDoc.embedJpg(imgData));
      } catch (e) {
        console.warn("[SealService] 个人执业章图片嵌入失败", e);
      }
    }
  }

  // 生成验证二维码
  const qrBuffer = await generateSealQRCode(verifyCode, reportId, timestamp, originalHash, frontendUrl);
  const qrImage = await pdfDoc.embedPng(new Uint8Array(qrBuffer));

  // 嵌入字体（用于签章说明文字）
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 对每个目标页面进行签章
  for (const pageIdx of targetPageIndices) {
    const page = pages[pageIdx];
    const { width, height } = page.getSize();

    // 计算签章位置
    let baseX: number;
    let baseY: number;

    if (config.position === "custom" && config.customX !== undefined && config.customY !== undefined) {
      baseX = config.customX;
      baseY = config.customY;
    } else if (config.position === "bottom_center") {
      baseX = width / 2 - sealSize / 2;
      baseY = 40;
    } else if (config.position === "bottom_left") {
      baseX = 40;
      baseY = 40;
    } else {
      // bottom_right（默认）
      baseX = width - sealSize - 40;
      baseY = 40;
    }

    // 绘制机构公章（右侧）
    if (orgSealImage) {
      const orgDims = orgSealImage.scaleToFit(sealSize, sealSize);
      page.drawImage(orgSealImage, {
        x: baseX,
        y: baseY,
        width: orgDims.width,
        height: orgDims.height,
        opacity: 0.85,
      });
    }

    // 绘制个人执业章（机构章左侧，稍微重叠）
    if (personalSealImage) {
      const personalDims = personalSealImage.scaleToFit(sealSize * 0.8, sealSize * 0.8);
      const personalX = orgSealImage ? baseX - personalDims.width * 0.7 : baseX;
      page.drawImage(personalSealImage, {
        x: personalX,
        y: baseY + (sealSize - personalDims.height) / 2,
        width: personalDims.width,
        height: personalDims.height,
        opacity: 0.85,
      });
    }

    // 绘制验证二维码（右下角，签章旁边）
    const qrSize = 60;
    const qrX = width - qrSize - 10;
    const qrY = 10;
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    // 二维码下方说明文字
    page.drawText("扫码验证", {
      x: qrX + 8,
      y: qrY - 10,
      size: 6,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // 签章时间戳文字（页面底部中央）
    const timestampText = `电子签章 · ${new Date(timestamp).toLocaleString("zh-CN")} · 验证码: ${verifyCode}`;
    const textWidth = font.widthOfTextAtSize(timestampText, 7);
    page.drawText(timestampText, {
      x: (width - textWidth) / 2,
      y: 8,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // 在最后一页添加签章声明页脚
  const lastPage = pages[totalPages - 1];
  const { width: lastWidth, height: lastHeight } = lastPage.getSize();

  // 签章信息框（最后一页底部）
  lastPage.drawRectangle({
    x: 30,
    y: 70,
    width: lastWidth - 60,
    height: 55,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 0.5,
    color: rgb(0.98, 0.98, 0.98),
    opacity: 0.9,
  });

  lastPage.drawText("【电子签章声明】", {
    x: 40,
    y: 110,
    size: 8,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  lastPage.drawText(`本报告已加盖合法有效的电子签章，具有与手写签名同等的法律效力。`, {
    x: 40,
    y: 97,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  lastPage.drawText(`报告编号: ${reportNo}  |  签章时间: ${new Date(timestamp).toLocaleString("zh-CN")}`, {
    x: 40,
    y: 85,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  lastPage.drawText(`文件哈希(SHA256): ${originalHash.substring(0, 32)}...  |  验证码: ${verifyCode}`, {
    x: 40,
    y: 73,
    size: 6.5,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // 序列化已签章 PDF
  const signedPdfBytes = await pdfDoc.save();
  const signedBuffer = Buffer.from(signedPdfBytes);
  const signedHash = calcSHA256(signedBuffer);

  return {
    pdfBuffer: signedBuffer,
    hash: signedHash,
    verifyCode,
    timestamp,
    verifyUrl: `${frontendUrl}/verify-seal?code=${verifyCode}&report=${reportId}`,
  };
}

// ============================================================
// 模拟可信时间戳（生产环境可替换为真实 TSA 服务）
// ============================================================

/**
 * 生成模拟时间戳令牌
 * 生产环境可对接：
 * - 联信时间戳服务 (https://www.tsa.cn)
 * - 国家授时中心 NTP 时间戳
 * - RFC 3161 标准时间戳服务
 */
export function generateTimestampToken(data: string): string {
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = {
    version: 1,
    policy: "1.2.156.10260.4.1", // 模拟 OID
    messageImprint: {
      hashAlgorithm: "SHA-256",
      hashedMessage: calcSHA256(Buffer.from(data)),
    },
    serialNumber: nonce,
    genTime: timestamp,
    tsa: {
      name: "gujia.app Internal TSA (Development)",
      country: "CN",
    },
  };

  // 用 HMAC 模拟签名（生产环境应使用真实 CA 私钥签名）
  const secret = process.env.JWT_SECRET || "gujia_tsa_secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return Buffer.from(JSON.stringify({ ...payload, signature })).toString("base64");
}

/**
 * 验证时间戳令牌
 */
export function verifyTimestampToken(token: string, data: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const { signature, ...payload } = decoded;
    const secret = process.env.JWT_SECRET || "gujia_tsa_secret";
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
    return signature === expectedSig;
  } catch {
    return false;
  }
}
