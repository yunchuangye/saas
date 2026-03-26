/**
 * 文件上传服务
 * 支持两种存储方式：
 * 1. 本地存储（默认）：文件保存到 /uploads 目录，通过静态文件服务访问
 * 2. 阿里云 OSS：配置 OSS_* 环境变量后自动切换到 OSS 上传
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// ============================================================
// 配置
// ============================================================

/** 是否启用 OSS 上传（需配置所有 OSS_* 环境变量） */
export function isOssEnabled(): boolean {
  return !!(
    process.env.OSS_REGION &&
    process.env.OSS_ACCESS_KEY_ID &&
    process.env.OSS_ACCESS_KEY_SECRET &&
    process.env.OSS_BUCKET
  );
}

/** 允许上传的文件类型 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

/** 最大文件大小（10MB） */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** 本地上传目录 */
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================
// Multer 配置（内存存储，便于 OSS 上传；本地存储时写入磁盘）
// ============================================================

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型：${file.mimetype}。支持 PDF、Word、Excel、图片等格式。`));
    }
  },
});

// ============================================================
// 上传结果类型
// ============================================================

export interface UploadResult {
  /** 文件原始名称 */
  originalName: string;
  /** 存储文件名（含扩展名） */
  storedName: string;
  /** 文件访问 URL */
  url: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mimeType: string;
  /** 存储方式 */
  storage: "local" | "oss";
}

// ============================================================
// 本地存储
// ============================================================

async function saveToLocal(file: Express.Multer.File): Promise<UploadResult> {
  const ext = path.extname(file.originalname) || "";
  const storedName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  fs.writeFileSync(filePath, file.buffer);

  const backendUrl = process.env.BACKEND_PUBLIC_URL || "https://api.gujia.app";
  const url = `${backendUrl}/uploads/${storedName}`;

  return {
    originalName: file.originalname,
    storedName,
    url,
    size: file.size,
    mimeType: file.mimetype,
    storage: "local",
  };
}

// ============================================================
// 阿里云 OSS 存储
// ============================================================

async function saveToOss(file: Express.Multer.File): Promise<UploadResult> {
  // 动态导入 ali-oss（避免未配置时报错）
  const OSS = (await import("ali-oss")).default;

  const client = new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
    endpoint: process.env.OSS_ENDPOINT, // 可选，自定义 endpoint
  });

  const ext = path.extname(file.originalname) || "";
  const storedName = `uploads/${randomUUID()}${ext}`;

  const result = await client.put(storedName, file.buffer, {
    mime: file.mimetype,
    headers: {
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalname)}"`,
    },
  });

  // 生成访问 URL（公共读 bucket 直接用 result.url，私有 bucket 用签名 URL）
  let url: string;
  if (process.env.OSS_CDN_DOMAIN) {
    url = `https://${process.env.OSS_CDN_DOMAIN}/${storedName}`;
  } else {
    url = result.url;
  }

  return {
    originalName: file.originalname,
    storedName,
    url,
    size: file.size,
    mimeType: file.mimetype,
    storage: "oss",
  };
}

// ============================================================
// 统一上传入口
// ============================================================

/**
 * 保存文件到存储（自动选择本地或 OSS）
 */
export async function saveFile(file: Express.Multer.File): Promise<UploadResult> {
  if (isOssEnabled()) {
    return saveToOss(file);
  }
  return saveToLocal(file);
}

/**
 * 删除本地文件
 */
export function deleteLocalFile(storedName: string): void {
  const filePath = path.join(UPLOAD_DIR, storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
