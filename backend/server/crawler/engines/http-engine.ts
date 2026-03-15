/**
 * HTTP 采集引擎（安居客专用）
 * 使用 Node.js 原生 https 模块直接发起 HTTP 请求，绕过 Playwright 无头浏览器检测
 * 安居客移动端（m.anjuke.com）对普通 HTTP 请求无反爬限制
 */
import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';
import { randomDelay } from '../utils/helpers';

export interface HttpCrawlResult {
  html: string;
  url: string;
  status: number;
  error?: string;
}

// 移动端 User-Agent 列表（模拟真实手机浏览器）
const MOBILE_UA_LIST = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.194 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 12; HUAWEI Mate 50 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
];

function getRandomMobileUA(): string {
  return MOBILE_UA_LIST[Math.floor(Math.random() * MOBILE_UA_LIST.length)];
}

/** 通过 HTTP 请求采集单个页面 */
export function fetchPage(url: string, retries = 3): Promise<HttpCrawlResult> {
  return new Promise((resolve) => {
    const attempt = (retriesLeft: number) => {
      const ua = getRandomMobileUA();
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
          'Referer': `https://${parsedUrl.hostname}/`,
        },
        timeout: 30000,
      };

      const req = lib.request(options, (res) => {
        const status = res.statusCode ?? 0;
        const chunks: Buffer[] = [];

        const encoding = res.headers['content-encoding'];
        let stream: any = res;

        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip());
        } else if (encoding === 'br') {
          stream = res.pipe(zlib.createBrotliDecompress());
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate());
        }

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => {
          const html = Buffer.concat(chunks).toString('utf-8');

          // 检测是否被拦截
          const isBlocked =
            html.includes('验证码') ||
            html.includes('captcha') ||
            html.includes('访问频繁') ||
            html.includes('请稍后再试') ||
            html.length < 3000;

          if (isBlocked && retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 3000 + Math.random() * 2000);
            return;
          }

          if (isBlocked) {
            resolve({ html: '', url, status, error: '触发反爬机制，页面被拦截' });
          } else {
            resolve({ html, url, status });
          }
        });

        stream.on('error', (err: Error) => {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 2000);
          } else {
            resolve({ html: '', url, status: 0, error: err.message });
          }
        });
      });

      req.on('error', (err: Error) => {
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 2000);
        } else {
          resolve({ html: '', url, status: 0, error: err.message });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 2000);
        } else {
          resolve({ html: '', url, status: 0, error: '请求超时' });
        }
      });

      req.end();
    };

    attempt(retries);
  });
}

/** 批量 HTTP 采集（带并发控制和进度回调） */
export async function fetchPages(
  urls: string[],
  concurrency = 3,
  delayMin = 1500,
  delayMax = 3500,
  onProgress?: (done: number, total: number, result: HttpCrawlResult) => Promise<void>
): Promise<HttpCrawlResult[]> {
  const results: HttpCrawlResult[] = new Array(urls.length);
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const currentIndex = index++;
      const url = urls[currentIndex];
      await randomDelay(delayMin, delayMax);
      const result = await fetchPage(url);
      results[currentIndex] = result;
      if (onProgress) {
        await onProgress(results.filter(Boolean).length, urls.length, result);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}
