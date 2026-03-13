/**
 * Playwright 爬虫引擎
 * 支持动态渲染页面采集，内置反爬策略
 */
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { randomDelay, randomUA } from '../utils/helpers';

export interface CrawlOptions {
  url: string;
  waitForSelector?: string;
  waitMs?: number;
  scrollToBottom?: boolean;
  proxyServer?: string;
  timeout?: number;
}

export interface CrawlResult {
  html: string;
  url: string;
  status: number;
  error?: string;
}

let browserInstance: Browser | null = null;

/** 获取或创建浏览器实例（单例） */
async function getBrowser(proxyServer?: string): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  };
  if (proxyServer) {
    launchOptions.proxy = { server: proxyServer };
  }
  browserInstance = await chromium.launch(launchOptions);
  return browserInstance;
}

/** 创建隐身浏览器上下文（每次任务独立） */
async function createContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: randomUA(),
    viewport: { width: 1366, height: 768 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    // 隐藏 webdriver 标志
    javaScriptEnabled: true,
  });

  // 注入反检测脚本
  await context.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
    window.chrome = { runtime: {} };
  `);

  return context;
}

/** 模拟人类滚动行为 */
async function humanScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        (window as any).scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= (document as any).body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
}

/** 采集单个页面 */
export async function crawlPage(options: CrawlOptions): Promise<CrawlResult> {
  const { url, waitForSelector, waitMs = 2000, scrollToBottom = false, proxyServer, timeout = 30000 } = options;

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    const browser = await getBrowser(proxyServer);
    context = await createContext(browser);
    page = await context.newPage();

    // 拦截不必要的资源（图片、字体、媒体），加快加载速度
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    const status = response?.status() ?? 0;

    // 等待目标元素出现
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
    } else {
      await page.waitForTimeout(waitMs);
    }

    // 模拟滚动
    if (scrollToBottom) {
      await humanScroll(page);
      await page.waitForTimeout(1000);
    }

    const html = await page.content();

    return { html, url, status };
  } catch (error: any) {
    return {
      html: '',
      url,
      status: 0,
      error: error.message,
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}

/** 批量采集多个页面（带并发控制） */
export async function crawlPages(
  urls: string[],
  options: Omit<CrawlOptions, 'url'>,
  concurrency = 2,
  delayMin = 2000,
  delayMax = 5000,
  onProgress?: (done: number, total: number, result: CrawlResult) => void
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const currentIndex = index++;
      const url = urls[currentIndex];
      await randomDelay(delayMin, delayMax);
      const result = await crawlPage({ ...options, url });
      results[currentIndex] = result;
      onProgress?.(results.filter(Boolean).length, urls.length, result);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}

/** 关闭浏览器 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
