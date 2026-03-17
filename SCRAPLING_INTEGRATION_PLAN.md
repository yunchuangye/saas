# Scrapling 框架集成方案

**版本：** 1.0
**日期：** 2026-03-17
**作者：** Manus AI

---

## 1. 方案概述

本方案旨在将先进的 Web Scraping 框架 **Scrapling** [1] 集成到现有的 `saas` 项目中，以全面升级楼盘和案例数据采集能力。Scrapling 具备强大的反机器人绕过、自适应元素定位、并发爬取和代理管理功能，可以显著提升数据采集的成功率、稳定性和效率。

集成将遵循**渐进式替换**原则，首先将 Scrapling 作为新的采集引擎引入，与现有的 Playwright 和 HTTP 引擎并存。然后，逐步将现有采集任务（链家、贝壳、安居客等）迁移到 Scrapling 引擎上，最终实现采集核心的统一和现代化。

## 2. Scrapling 框架核心优势分析

| 特性 | 优势 | 对本项目的价值 |
|---|---|---|
| **`StealthyFetcher`** | 内置高级隐秘功能，可绕过 Cloudflare Turnstile 等反机器人系统 | 大幅提高对链家、贝壳等有强力反爬措施网站的采集成功率 |
| **自适应元素定位** | 网站页面结构变化后，能通过智能相似性算法自动重新定位元素 | 降低因网站改版导致采集脚本失效的维护成本 |
| **统一的 Spider 框架** | 类 Scrapy 的 API，支持并发、多 Session、暂停/恢复、代理轮换 | 简化大规模爬取任务的管理，提高采集效率和稳定性 |
| **多 Session 支持** | 可在同一 Spider 中混合使用 HTTP 请求和无头浏览器 | 针对不同网站或页面类型，灵活选择最高效的采集方式 |
| **内置代理轮换** | `ProxyRotator` 支持多种轮换策略，适用于所有 Session 类型 | 简化代理管理，有效应对 IP 封锁问题 |

## 3. 现有数据采集模块分析

项目已具备一套完整的数据采集体系，包括：

- **前端（`/dashboard/admin/crawler`）：** 用于创建、管理、监控采集任务和代理池的 UI 界面。
- **后端（`crawl.ts`）：** 负责任务的增删改查、调度和状态管理。
- **任务队列（BullMQ）：** 基于 Redis，负责异步分发和执行采集任务。
- **采集引擎：**
    - `playwright-engine.ts`：基于 Playwright，用于采集需要 JS 渲染的网站（如链家、贝壳）。
    - `http-engine.ts`：基于原生 HTTPS 模块，用于采集反爬较弱的移动端网站（如安居客）。
- **解析器（`lianjia-parser.ts` 等）：** 硬编码的解析逻辑，用于从 HTML 中提取数据。
- **数据库表：** `crawl_jobs`, `crawl_raw_data`, `crawl_proxies` 等多张表，结构清晰。

**主要痛点：**
1.  **反爬能力弱：** 现有的 Playwright 引擎反检测能力有限，容易被 Cloudflare 等系统识别和拦截。
2.  **维护成本高：** 解析器逻辑硬编码，一旦目标网站改版，需要手动修改代码，非常耗时。
3.  **引擎分散：** 针对不同网站使用不同引擎，增加了代码复杂性和维护难度。

## 4. 集成方案详细步骤

### 阶段一：环境准备与 Scrapling 引擎引入

**目标：** 在项目中安装 Scrapling，并创建一个新的 `scrapling-engine.ts` 文件，作为现有采集引擎的补充。

1.  **安装 Scrapling：**
    在 `backend` 目录下执行以下命令，安装 Scrapling 及其所有依赖（包括浏览器）。
    ```bash
    cd /home/ubuntu/saas/backend
    pnpm add scrapling
    pnpm exec scrapling install
    ```

2.  **创建 `scrapling-engine.ts`：**
    在 `backend/server/crawler/engines/` 目录下创建新文件 `scrapling-engine.ts`。该文件将封装 Scrapling 的核心功能，对外提供与现有引擎类似的接口。

    ```typescript
    // backend/server/crawler/engines/scrapling-engine.ts
    import { StealthyFetcher, Spider, Request, Response } from 'scrapling';

    export async function scrapeWithScrapling(jobId: number, urls: string[]) {
      // ... 封装 Scrapling 的 Spider 逻辑
    }
    ```

3.  **修改 `crawler-controller.ts`：**
    在 `executeCaseListingJob` 函数中增加逻辑判断，允许新创建的任务选择使用 Scrapling 引擎。

    ```typescript
    // backend/server/crawler/engines/crawler-controller.ts
    if (job.engine === 'scrapling') {
      // 调用 Scrapling 引擎
      await scrapeWithScrapling(jobId, urls);
    } else if (job.source === 'anjuke' || job.source === 'leyoujia') {
      // ... 现有 HTTP 引擎逻辑
    } else {
      // ... 现有 Playwright 引擎逻辑
    }
    ```

4.  **扩展数据库与前端：**
    - 在 `crawl_jobs` 表中增加一个 `engine` 字段（`enum('playwright', 'http', 'scrapling')`），默认为 `playwright`。
    - 在前端创建任务的弹窗中，增加一个「采集引擎」的下拉选项，允许用户选择。

### 阶段二：迁移首个采集源（以“链家”为例）

**目标：** 将链家二手房成交案例的采集任务完全迁移到 Scrapling 引擎，并利用其自适应解析功能。

1.  **创建 `LianjiaSpider`：**
    在 `scrapling-engine.ts` 中定义一个继承自 `Scrapling.Spider` 的类。

    ```typescript
    class LianjiaSpider extends Spider {
      name = "lianjia_cases";
      start_urls = []; // 从外部传入
      custom_settings = {
        concurrent_requests: 5, // 并发数
        // ... 其他配置
      };

      async parse(response: Response) {
        // 1. 使用 Scrapling 的自适应选择器提取数据
        const cases = response.css('.sellListContent li', { adaptive: true });
        for (const caseEl of cases) {
          yield {
            title: caseEl.css('.title a::text', { adaptive: true }).get(),
            // ... 其他字段
          };
        }

        // 2. 自动翻页
        const nextPage = response.css('a.next', { adaptive: true });
        if (nextPage) {
          yield response.follow(nextPage[0].attrib['href']);
        }
      }
    }
    ```

2.  **实现 `scrapeWithScrapling`：**
    在该函数中实例化并启动 `LianjiaSpider`，处理数据导出和日志记录。

    ```typescript
    export async function scrapeWithScrapling(jobId: number, urls: string[]) {
      const spider = new LianjiaSpider();
      spider.start_urls = urls;

      // 监听 item_scraped 事件，将数据写入数据库
      spider.events.on('item_scraped', async (item) => {
        // ... 将提取到的 item 写入 crawl_raw_data 表
      });

      await spider.start();
      // ... 更新任务状态
    }
    ```

3.  **移除旧逻辑：**
    验证通过后，可以逐步移除 `crawler-controller.ts` 和 `lianjia-parser.ts` 中与链家相关的旧代码。

### 阶段三：全面推广与功能深化

**目标：** 将所有采集源迁移到 Scrapling，并利用其高级功能（如代理轮换、多 Session）。

1.  **迁移其他源：**
    参照阶段二的方法，为贝壳、安居客等其他数据源创建对应的 Spider 类。

2.  **集成代理管理：**
    改造 `scrapling-engine.ts`，使其从 `crawl_proxies` 表中读取代理列表，并配置到 Scrapling 的 `ProxyRotator` 中。

    ```typescript
    import { ProxyRotator } from 'scrapling';

    const proxies = await db.select().from(crawlProxies).where(eq(crawlProxies.status, 'active'));
    const rotator = new ProxyRotator(proxies.map(p => p.url));

    // 在 Spider 或 Fetcher 中使用
    const spider = new MySpider({ proxy_rotator: rotator });
    ```

3.  **利用多 Session：**
    对于复杂的采集目标（如需要登录或 API + 页面混合采集），可以利用 Scrapling 的多 Session 功能，在同一个 Spider 中管理多个 `StealthySession` 或 `FetcherSession`。

## 5. 风险评估与应对

- **学习曲线：** Scrapling 是一个新框架，团队需要时间学习其 API 和最佳实践。**应对：** 从小范围任务开始试点，逐步推广，并组织内部培训。
- **兼容性问题：** Scrapling 的依赖可能与项目现有依赖冲突。**应对：** 在独立的开发分支上进行充分测试，优先使用 Docker 环境隔离依赖。
- **反爬升级：** 即使使用 Scrapling，目标网站仍可能升级反爬策略。**应对：** Scrapling 的自适应特性可以缓解部分问题，但仍需持续关注目标网站变化，并准备备用采集方案。

## 6. 参考文献

[1] D4Vinci. (2024). *Scrapling: Effortless Web Scraping for the Modern Web*. GitHub. Retrieved from https://github.com/D4Vinci/Scrapling
