/**
 * Playwright 爬虫引擎（升级版）
 * 集成 stealth 模式、更强反检测策略、链家 API 模式
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

// 更完整的 User-Agent 列表（真实 Chrome 版本）
const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUA(): string {
  return UA_LIST[Math.floor(Math.random() * UA_LIST.length)];
}

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
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--window-size=1366,768',
    ],
  };
  if (proxyServer) {
    launchOptions.proxy = { server: proxyServer };
  }
  browserInstance = await chromium.launch(launchOptions);
  return browserInstance;
}

/** 创建高度伪装的浏览器上下文 */
async function createStealthContext(browser: Browser): Promise<BrowserContext> {
  const ua = getRandomUA();
  const context = await browser.newContext({
    userAgent: ua,
    viewport: { width: 1366 + Math.floor(Math.random() * 100), height: 768 + Math.floor(Math.random() * 100) },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    javaScriptEnabled: true,
  });

  // 强化反检测脚本注入
  await context.addInitScript(`
    // 隐藏 webdriver
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;

    // 伪造插件列表
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const arr = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
        ];
        arr.__proto__ = PluginArray.prototype;
        return arr;
      }
    });

    // 伪造语言
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'] });

    // 伪造 chrome 对象
    window.chrome = {
      app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } },
      runtime: { OnInstalledReason: {}, OnRestartRequiredReason: {}, PlatformArch: {}, PlatformNaclArch: {}, PlatformOs: {}, RequestUpdateCheckStatus: {} },
    };

    // 修复 permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);

    // 伪造 hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });

    // 伪造 deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

    // 隐藏自动化特征
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
  `);

  return context;
}

/** 模拟人类滚动行为 */
async function humanScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 200 + Math.floor(Math.random() * 200);
      const timer = setInterval(() => {
        (window as any).scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= (document as any).body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100 + Math.floor(Math.random() * 100));
    });
  });
}

/** 模拟人类鼠标移动 */
async function humanMouseMove(page: Page): Promise<void> {
  try {
    const x = 100 + Math.floor(Math.random() * 800);
    const y = 100 + Math.floor(Math.random() * 400);
    await page.mouse.move(x, y, { steps: 10 });
  } catch (e) {}
}

/** 采集单个页面 */
export async function crawlPage(options: CrawlOptions): Promise<CrawlResult> {
  const { url, waitForSelector, waitMs = 3000, scrollToBottom = false, proxyServer, timeout = 45000 } = options;

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    const browser = await getBrowser(proxyServer);
    context = await createStealthContext(browser);
    page = await context.newPage();

    // 只拦截媒体和字体，保留图片（有助于通过某些反爬检测）
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['media', 'font'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // 先访问首页建立 Cookie
    const domain = new URL(url).origin;
    try {
      await page.goto(domain, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500 + Math.floor(Math.random() * 1000));
      await humanMouseMove(page);
    } catch (e) {}

    // 访问目标页面
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    });

    const status = response?.status() ?? 0;

    // 等待目标元素
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 15000 }).catch(() => {});
    }

    await page.waitForTimeout(waitMs + Math.floor(Math.random() * 1000));

    // 模拟人类行为
    await humanMouseMove(page);

    if (scrollToBottom) {
      await humanScroll(page);
      await page.waitForTimeout(1500);
    }

    const html = await page.content();

    // 检测是否被反爬拦截
    const isBlocked = html.includes('验证码') || html.includes('captcha') ||
      html.includes('访问频繁') || html.includes('请稍后再试') ||
      html.length < 5000;

    if (isBlocked) {
      return { html: '', url, status, error: '触发反爬机制，页面被拦截' };
    }

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
