"""
Scrapling 核心采集引擎
- 支持普通 HTTP 采集（Fetcher）和隐秘模式（StealthyFetcher）
- 支持代理轮换
- 支持并发采集
- 自动重试和错误处理
"""
import time
import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable

from scrapling.fetchers import Fetcher, StealthyFetcher

from utils.db import get_active_proxies, write_log


class ScraplingEngine:
    """
    Scrapling 采集引擎
    根据任务配置自动选择合适的 Fetcher
    """

    def __init__(self, job_id: int, use_stealth: bool = False,
                 concurrency: int = 3, delay_min: int = 2000,
                 delay_max: int = 5000, timeout: int = 30000,
                 max_retries: int = 2):
        self.job_id = job_id
        self.use_stealth = use_stealth
        self.concurrency = concurrency
        self.delay_min = delay_min / 1000  # 转换为秒
        self.delay_max = delay_max / 1000
        self.timeout = timeout / 1000
        self.max_retries = max_retries
        self._proxies = []
        self._proxy_index = 0
        self._proxy_lock = threading.Lock()
        self._load_proxies()

    def _load_proxies(self):
        """加载代理列表"""
        try:
            self._proxies = get_active_proxies()
            if self._proxies:
                write_log(self.job_id, 'info', f'已加载 {len(self._proxies)} 个可用代理')
        except Exception:
            self._proxies = []

    def _get_next_proxy(self) -> str | None:
        """轮换获取下一个代理"""
        if not self._proxies:
            return None
        with self._proxy_lock:
            proxy = self._proxies[self._proxy_index % len(self._proxies)]
            self._proxy_index += 1
            return proxy

    def _random_delay(self):
        """随机延迟"""
        delay = random.uniform(self.delay_min, self.delay_max)
        time.sleep(delay)

    def fetch_page(self, url: str) -> dict:
        """
        采集单个页面
        返回: {'html': str, 'url': str, 'error': str | None}
        """
        proxy = self._get_next_proxy()
        proxy_dict = {'http': proxy, 'https': proxy} if proxy else None

        for attempt in range(self.max_retries + 1):
            try:
                if self.use_stealth:
                    # 使用 StealthyFetcher（curl-cffi，绕过 Cloudflare 等）
                    fetcher = StealthyFetcher()
                    page = fetcher.fetch(
                        url,
                        timeout=int(self.timeout),
                        proxy=proxy,
                        stealthy_headers=True,
                        network_idle=True,
                    )
                else:
                    # 使用普通 Fetcher（requests-based，速度快）
                    fetcher = Fetcher(auto_match=True)
                    page = fetcher.get(
                        url,
                        timeout=int(self.timeout),
                        proxies=proxy_dict,
                        stealthy_headers=True,
                    )

                if page and page.status == 200:
                    return {'html': str(page.html), 'url': url, 'error': None}
                elif page and page.status in (403, 429, 503):
                    # 被封禁，换代理重试
                    proxy = self._get_next_proxy()
                    proxy_dict = {'http': proxy, 'https': proxy} if proxy else None
                    write_log(self.job_id, 'warn',
                              f'页面返回 {page.status}，正在重试 ({attempt + 1}/{self.max_retries + 1})',
                              url)
                    time.sleep(5 * (attempt + 1))
                    continue
                else:
                    status = page.status if page else 'None'
                    return {'html': '', 'url': url, 'error': f'HTTP {status}'}

            except Exception as e:
                if attempt < self.max_retries:
                    write_log(self.job_id, 'warn',
                              f'采集异常，重试 ({attempt + 1}/{self.max_retries + 1}): {str(e)[:100]}',
                              url)
                    time.sleep(3 * (attempt + 1))
                    continue
                return {'html': '', 'url': url, 'error': str(e)[:200]}

        return {'html': '', 'url': url, 'error': '超过最大重试次数'}

    def crawl_pages(self, urls: list[str],
                    callback: Callable[[int, int, dict], None]) -> dict:
        """
        并发采集多个页面
        callback(done_count, total_count, result) 在每个页面完成后调用
        返回统计信息
        """
        total = len(urls)
        done = 0
        stats = {'success': 0, 'failed': 0}
        lock = threading.Lock()

        def fetch_with_delay(url: str, index: int) -> dict:
            # 首个请求不延迟，后续请求随机延迟
            if index > 0:
                self._random_delay()
            return self.fetch_page(url)

        with ThreadPoolExecutor(max_workers=self.concurrency) as executor:
            future_to_url = {
                executor.submit(fetch_with_delay, url, i): url
                for i, url in enumerate(urls)
            }

            for future in as_completed(future_to_url):
                result = future.result()
                with lock:
                    done += 1
                    if result.get('error'):
                        stats['failed'] += 1
                    else:
                        stats['success'] += 1

                # 调用回调（在锁外，避免死锁）
                try:
                    callback(done, total, result)
                except Exception as e:
                    write_log(self.job_id, 'error', f'回调处理异常: {str(e)[:100]}',
                              result.get('url'))

        return stats
