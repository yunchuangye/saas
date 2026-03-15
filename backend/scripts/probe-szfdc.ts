/**
 * 深圳市住建局房源信息网站 API 探测脚本
 * 目标：https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk
 */
import { chromium } from 'playwright';

const TARGET_URL = 'https://fdc.zjj.sz.gov.cn/szfdccommon/#/publicInfo/main?params=ysxk&t=1773594617648&ot=1773594617648';

async function probe() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
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
  const apiRequests: any[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/') || url.includes('.json') || req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
      apiRequests.push({
        method: req.method(),
        url: url,
        headers: req.headers(),
        postData: req.postData(),
      });
    }
  });

  // 拦截响应
  const apiResponses: any[] = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/') || url.includes('.json') || res.headers()['content-type']?.includes('json')) {
      try {
        const body = await res.text();
        if (body.length < 50000) {
          apiResponses.push({
            url,
            status: res.status(),
            contentType: res.headers()['content-type'],
            body: body.substring(0, 2000),
          });
        }
      } catch (e) {}
    }
  });

  console.log('正在访问目标页面...');
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e: any) {
    console.log('页面加载超时或错误，继续分析已捕获的请求:', e.message);
  }

  // 等待额外时间让页面完全渲染
  await page.waitForTimeout(5000);

  // 获取页面标题和内容
  const title = await page.title();
  const content = await page.content();
  
  console.log('\n=== 页面标题 ===');
  console.log(title);
  
  console.log('\n=== 捕获的 API 请求 ===');
  apiRequests.forEach((req, i) => {
    console.log(`[${i+1}] ${req.method} ${req.url}`);
    if (req.postData) console.log('  POST数据:', req.postData.substring(0, 200));
  });

  console.log('\n=== 捕获的 API 响应 ===');
  apiResponses.forEach((res, i) => {
    console.log(`[${i+1}] ${res.status} ${res.url}`);
    console.log('  Content-Type:', res.contentType);
    console.log('  响应内容:', res.body.substring(0, 500));
    console.log('---');
  });

  // 截图保存
  await page.screenshot({ path: '/home/ubuntu/saas/logs/szfdc-probe.png', fullPage: true });
  console.log('\n截图已保存到 /home/ubuntu/saas/logs/szfdc-probe.png');

  // 获取页面文本内容
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== 页面文本内容（前2000字符）===');
  console.log(bodyText.substring(0, 2000));

  // 查找所有 input 和 button
  const inputs = await page.$$eval('input, select, button', els => 
    els.map(el => ({ tag: el.tagName, type: (el as any).type, placeholder: (el as any).placeholder, text: el.textContent?.trim() }))
  );
  console.log('\n=== 页面交互元素 ===');
  console.log(JSON.stringify(inputs, null, 2));

  await browser.close();
}

probe().catch(console.error);
