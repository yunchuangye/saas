/**
 * 深圳市住建局房源信息网站 API 探测脚本 v2
 * 使用 Playwright 拦截 XHR/Fetch 请求
 */
import { chromium } from 'playwright';
import * as fs from 'fs';

const TARGET_URL = 'https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk&t=1773594617648&ot=1773594617648';

async function probe() {
  console.log('启动 Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // 拦截所有网络请求
  const captured: any[] = [];
  
  page.on('request', (req) => {
    const url = req.url();
    const type = req.resourceType();
    if (['xhr', 'fetch'].includes(type) || url.includes('/api') || url.includes('query') || url.includes('list') || url.includes('search')) {
      captured.push({
        type: 'request',
        method: req.method(),
        url,
        resourceType: type,
        postData: req.postData(),
        headers: req.headers(),
      });
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const type = res.request().resourceType();
    const ct = res.headers()['content-type'] || '';
    if (['xhr', 'fetch'].includes(type) || ct.includes('json') || url.includes('/api')) {
      try {
        const body = await res.text();
        captured.push({
          type: 'response',
          url,
          status: res.status(),
          contentType: ct,
          body: body.substring(0, 3000),
        });
        console.log(`[RES] ${res.status()} ${url} (${body.length} bytes)`);
        if (body.length < 5000) {
          console.log('  Body:', body.substring(0, 500));
        }
      } catch (e) {}
    }
  });

  console.log(`\n访问: ${TARGET_URL}`);
  try {
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    console.log('页面加载完成，等待渲染...');
    await page.waitForTimeout(8000);
  } catch (e: any) {
    console.log('加载异常:', e.message);
  }

  // 截图
  await page.screenshot({ path: '/home/ubuntu/saas/logs/szfdc-probe2.png', fullPage: true });
  
  // 获取页面内容
  const title = await page.title().catch(() => '');
  const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
  
  console.log('\n=== 页面标题 ===', title);
  console.log('\n=== 页面文本（前3000字符）===');
  console.log(bodyText.substring(0, 3000));

  // 保存结果
  fs.writeFileSync('/home/ubuntu/saas/logs/szfdc-captured.json', JSON.stringify(captured, null, 2));
  console.log(`\n已保存 ${captured.length} 条网络请求到 /home/ubuntu/saas/logs/szfdc-captured.json`);

  // 尝试点击搜索/查询按钮
  console.log('\n尝试与页面交互...');
  const buttons = await page.$$('button, .btn, [class*="search"], [class*="query"]');
  console.log(`找到 ${buttons.length} 个按钮/搜索元素`);

  await browser.close();
  console.log('\n探测完成');
}

probe().catch(e => {
  console.error('探测失败:', e);
  process.exit(1);
});
