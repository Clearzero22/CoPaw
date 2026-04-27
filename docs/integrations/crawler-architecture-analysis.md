# Amazon 爬虫系统架构分析

本文档详细分析 CoPaw 集成的 Amazon 爬虫系统架构，包括设计模式、技术实现和运行机制。

## 📋 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [技术栈分析](#技术栈分析)
- [核心模块](#核心模块)
- [数据流分析](#数据流分析)
- [性能优化](#性能优化)
- [扩展性设计](#扩展性设计)

---

## 系统概述

### 功能定位

Amazon 爬虫系统是 CoPaw 项目的数据采集核心，负责：

1. **产品信息采集**: 抓取 Amazon 产品的基本信息和详情
2. **关键词研究**: 通过西柚找词获取产品相关关键词数据
3. **任务调度**: 支持定时和手动触发爬虫任务
4. **数据持久化**: 将爬取数据存储到 PostgreSQL 数据库
5. **实时通知**: 通过 WebSocket 推送爬虫进度和结果

### 系统边界

```
┌─────────────────────────────────────────────────────────┐
│                    CoPaw 主系统                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │  用户界面  │  │  AI 助手   │  │  工作流    │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────┘
                        │ API 调用
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Amazon 爬虫系统                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │ 产品爬取   │  │ 关键词研究 │  │ 任务调度   │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────┘
                        │ 数据存储
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL 数据库                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ products │  │ keywords │  │  jobs    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 架构设计

### 分层架构

```
┌───────────────────────────────────────────────────────────┐
│  表现层 (Presentation Layer)                              │
│  ─────────────────────────────────────────────────────── │
│  • Web 控制台 (React + Ant Design)                       │
│  • REST API (FastAPI 自动文档)                           │
│  • WebSocket 实时通信                                     │
└───────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTP/WebSocket
                           ▼
┌───────────────────────────────────────────────────────────┐
│  应用层 (Application Layer)                               │
│  ─────────────────────────────────────────────────────── │
│  • API 路由 (FastAPI Routers)                            │
│  • 业务逻辑 (Services)                                    │
│  • 任务调度 (APScheduler)                                │
│  • 请求代理 (CoPaw Gateway)                              │
└───────────────────────────────────────────────────────────┘
                           ▲
                           │ 函数调用
                           ▼
┌───────────────────────────────────────────────────────────┐
│  领域层 (Domain Layer)                                    │
│  ─────────────────────────────────────────────────────── │
│  • 爬虫引擎 (Playwright Scraper)                         │
│  • 数据模型 (SQLAlchemy Models)                          │
│  • 数据验证 (Pydantic Schemas)                           │
│  • 业务规则 (Business Logic)                              │
└───────────────────────────────────────────────────────────┘
                           ▲
                           │ 数据访问
                           ▼
┌───────────────────────────────────────────────────────────┐
│  数据层 (Data Layer)                                      │
│  ─────────────────────────────────────────────────────── │
│  • PostgreSQL 数据库                                      │
│  • SQLAlchemy ORM                                         │
│  • 连接池管理                                             │
│  • 事务处理                                               │
└───────────────────────────────────────────────────────────┘
```

### 微服务架构

爬虫系统采用微服务架构，各服务独立部署：

```yaml
服务清单:
  爬虫 API 服务:
    端口: 8000
    技术: FastAPI + Uvicorn
    功能: REST API、任务调度、WebSocket
    
  PostgreSQL 数据库:
    端口: 5433
    技术: PostgreSQL 16 + TimescaleDB
    功能: 数据持久化、时序数据
    
  CoPaw 代理服务:
    端口: 8088
    技术: FastAPI + httpx
    功能: API 代理、认证授权
    
  前端控制台:
    端口: 5173
    技术: React + Vite + Ant Design
    功能: 用户界面、数据展示
```

---

## 技术栈分析

### 后端技术栈

| 技术 | 版本 | 用途 | 优势 |
|------|------|------|------|
| **FastAPI** | 0.115+ | Web 框架 | 高性能、自动文档、类型检查 |
| **Uvicorn** | 0.40+ | ASGI 服务器 | 异步支持、高性能 |
| **Playwright** | 1.58+ | 浏览器自动化 | 跨浏览器、速度快、稳定性高 |
| **SQLAlchemy** | 2.0+ | ORM | 数据库抽象、迁移支持 |
| **Pydantic** | 2.0+ | 数据验证 | 类型安全、自动文档 |
| **APScheduler** | 3.11+ | 任务调度 | 持久化、分布式支持 |
| **WebSockets** | - | 实时通信 | 双向通信、低延迟 |

### 前端技术栈

| 技术 | 版本 | 用途 | 优势 |
|------|------|------|------|
| **React** | 18 | UI 框架 | 组件化、生态丰富 |
| **Vite** | 6+ | 构建工具 | 快速热更新、优化生产构建 |
| **Ant Design** | 5+ | UI 组件库 | 企业级、组件丰富 |
| **Zustand** | 5+ | 状态管理 | 轻量、简单易用 |
| **React Query** | - | 数据获取 | 缓存、自动重试 |

### 数据库技术

```sql
-- 核心表结构
products          -- 产品信息表
scraping_jobs     -- 爬虫任务表
notifications     -- 通知消息表
keywords          -- 关键词表 (西柚找词)
```

---

## 核心模块

### 1. 爬虫引擎模块

**位置**: `src/scrapers/`

**核心类**:

```python
class SearchScraper:
    """搜索页爬虫"""
    
    async def search(self, keyword: str, max_pages: int):
        """爬取搜索结果"""
        # 1. 启动浏览器
        # 2. 访问 Amazon 搜索页
        # 3. 解析产品列表
        # 4. 提取产品数据
        # 5. 返回结果列表

class DetailScraper:
    """详情页爬虫"""
    
    async def scrape_detail(self, asin: str):
        """爬取产品详情"""
        # 1. 访问产品详情页
        # 2. 解析详细信息
        # 3. 提取图片、价格、评分等
        # 4. 保存到数据库
```

**技术特点**:

- **异步执行**: 使用 `async/await` 提高并发性能
- **错误重试**: 内置重试机制处理网络波动
- **数据验证**: 使用 Pydantic 验证数据完整性
- **进度跟踪**: 实时更新爬虫进度到数据库

### 2. API 路由模块

**位置**: `api/routers/`

**路由结构**:

```python
# 产品相关
/products                 -- 产品列表（分页）
/products/{asin}         -- 单个产品详情
/products/stats          -- 统计信息

# 爬虫任务
/jobs                     -- 任务状态列表
/jobs/{job_id}           -- 单个任务详情
/jobs/search             -- 触发搜索爬虫
/jobs/detail             -- 触发详情爬虫
/jobs/batch-detail       -- 批量详情爬虫

# 关键词（西柚找词）
/keywords/               -- 关键词列表
/keywords/stats          -- 关键词统计
/keywords/scrape         -- 触发关键词爬取
/keywords/scrape/status  -- 爬取状态

# 通知系统
/notifications           -- 通知列表
/notifications/{id}      -- 通知详情
```

**设计模式**:

```python
# 代理模式 (Proxy Pattern)
class CrawlerProxy:
    """爬虫 API 代理"""
    
    async def _proxy(self, method, path, **kwargs):
        """统一代理方法"""
        # 1. 参数验证
        # 2. 请求转发
        # 3. 响应处理
        # 4. 错误处理

# 仓储模式 (Repository Pattern)
class ProductRepository:
    """产品数据仓储"""
    
    def get_products(self, filters):
        """查询产品"""
        # 数据库查询逻辑
    
    def save_product(self, product):
        """保存产品"""
        # 数据库插入逻辑
```

### 3. 任务调度模块

**位置**: `api/scheduler.py`

**调度器配置**:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()

# 定时任务
scheduler.add_job(
    func=periodic_scrape_job,
    trigger=IntervalTrigger(hours=6),
    id='periodic_scrape',
    max_instances=1
)
```

**任务类型**:

1. **定时任务**: 每 6 小时自动爬取更新
2. **一次性任务**: 用户手动触发
3. **批量任务**: 处理多个 ASIN 的批量爬取

### 4. WebSocket 通知模块

**位置**: `api/routers/ws.py`

**实时推送**:

```python
class WebSocketManager:
    """WebSocket 连接管理"""
    
    async def broadcast(self, message: dict):
        """广播消息到所有连接的客户端"""
        # 推送爬虫进度
        # 推送任务完成通知
        # 推送错误信息
```

**事件类型**:

```typescript
interface ScrapingEvent {
  type: 'progress' | 'completed' | 'error';
  jobId: string;
  data: any;
  timestamp: number;
}
```

---

## 数据流分析

### 爬虫任务完整流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 任务创建                                              │
│ ─────────────────────────────────────────────────────── │
│ 用户触发 → API 请求 → 创建任务记录 → 返回 task_id      │
│                                                          │
│ POST /api/jobs/search                                   │
│ Body: {keyword: "laptop", max_pages: 2}                │
│ Response: {task_id: "abc123", status: "pending"}        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 任务执行                                              │
│ ─────────────────────────────────────────────────────── │
│ 后台任务 → 启动浏览器 → 访问页面 → 解析数据             │
│                                                          │
│ async def run_scraping_task(task_id):                   │
│   - 更新状态为 running                                   │
│   - 启动 Playwright 浏览器                              │
│   - 访问 Amazon 搜索页                                  │
│   - 提取产品数据                                        │
│   - 保存到数据库                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 进度通知                                              │
│ ─────────────────────────────────────────────────────── │
│ WebSocket → 推送进度 → 前端更新 → 用户反馈              │
│                                                          │
│ ws.send({                                               │
│   type: 'progress',                                     │
│   jobId: 'abc123',                                     │
│   current_page: 2,                                     │
│   total_pages: 5                                      │
│ })                                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. 任务完成                                              │
│ ─────────────────────────────────────────────────────── │
│ 数据保存 → 更新状态 → 发送通知 → 清理资源               │
│                                                          │
│ - 更新任务状态为 completed                              │
│ - 创建通知记录                                          │
│ - WebSocket 推送完成消息                                │
│ - 关闭浏览器                                            │
└─────────────────────────────────────────────────────────┘
```

### 数据转换流程

```python
# 原始 HTML
html = """
<div class="product-item">
  <span class="price">$29.99</span>
</div>
"""

# 解析为字典
parsed_data = {
    "price": "$29.99",
    "currency": "USD"
}

# 验证和清洗
validated_data = ProductSchema(**parsed_data)

# 转换为数据库模型
db_product = Product(**validated_data.dict())

# 保存到数据库
session.add(db_product)
session.commit()
```

---

## 性能优化

### 1. 并发控制

```python
# 限制并发爬虫数量
MAX_CONCURRENT_SCRAPES = 3

semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCRAPES)

async def scrape_with_limit(url):
    async with semaphore:
        return await scrape_page(url)
```

### 2. 数据库优化

```sql
-- 索引优化
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_scraped_at ON products(scraped_at);
CREATE INDEX idx_jobs_status ON scraping_jobs(status);

-- 分区表（大数据量）
CREATE TABLE products_partitioned (
    -- 字段定义
) PARTITION BY RANGE (scraped_at);
```

### 3. 缓存策略

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_product_info(asin: str):
    """缓存产品信息"""
    return db.query(Product).filter_by(asin=asin).first()
```

### 4. 浏览器池化

```python
class BrowserPool:
    """浏览器连接池"""
    
    def __init__(self, max_size: int = 3):
        self.pool = asyncio.Queue(maxsize=max_size)
    
    async def acquire(self):
        """获取浏览器实例"""
        return await self.pool.get()
    
    async def release(self, browser):
        """释放浏览器实例"""
        await self.pool.put(browser)
```

---

## 扩展性设计

### 1. 插件化爬虫

```python
class ScraperPlugin(ABC):
    """爬虫插件基类"""
    
    @abstractmethod
    async def scrape(self, url: str) -> dict:
        """爬取数据"""
        pass
    
    @abstractmethod
    def parse(self, html: str) -> dict:
        """解析数据"""
        pass

# 注册插件
scraper_registry.register('amazon', AmazonScraper())
scraper_registry.register('ebay', EbayScraper())
```

### 2. 配置化爬取规则

```yaml
# scrapers/amazon.yaml
site: amazon.com
selectors:
  title: ".product-title"
  price: ".price .price-to-pay"
  rating: "[data-csa-c-type='widget']"
  images: ".image-container img"

pagination:
  next_button: ".s-pagination-next"
  max_pages: 10

delays:
  page_load: 2000
  element_wait: 5000
```

### 3. 分布式爬取

```python
# 使用 Celery 进行分布式任务调度
from celery import Celery

app = Celery('crawler', broker='redis://localhost:6379')

@app.task
def scrape_product(asin: str):
    """分布式爬虫任务"""
    scraper = DetailScraper()
    return scraper.scrape_detail(asin)

# 任务分发
for asin in asin_list:
    scrape_product.delay(asin)
```

### 4. API 版本控制

```python
# API 版本化
app.include_router(
    products_router,
    prefix="/api/v1/products"
)

app.include_router(
    products_router_v2,
    prefix="/api/v2/products"
)
```

---

## 监控与日志

### 日志系统

```python
from loguru import logger

# 配置日志
logger.add(
    "logs/crawler.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)

# 使用日志
logger.info("Starting scraper for ASIN: {}", asin)
logger.error("Scraping failed: {}", error)
```

### 性能监控

```python
import time
from functools import wraps

def monitor_performance(func):
    """性能监控装饰器"""
    
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start
            logger.info(f"{func.__name__} took {duration:.2f}s")
    
    return wrapper
```

### 错误追踪

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0
)

# 自动捕获异常
try:
    await scrape_page(url)
except Exception as e:
    sentry_sdk.capture_exception(e)
```

---

## 安全性考虑

### 1. 反爬虫对策

```python
# 用户代理轮换
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...'
]

# 请求限速
RATE_LIMIT = 2  # 每秒最多 2 个请求

# IP 代理池
PROXIES = [
    'http://proxy1.example.com:8080',
    'http://proxy2.example.com:8080'
]
```

### 2. 数据验证

```python
from pydantic import BaseModel, validator

class ProductSchema(BaseModel):
    """产品数据验证"""
    
    asin: str
    title: str
    price: float
    
    @validator('asin')
    def validate_asin(cls, v):
        if not re.match(r'^[A-Z0-9]{10}$', v):
            raise ValueError('Invalid ASIN format')
        return v
```

### 3. 权限控制

```python
from fastapi import Depends, HTTPException
from api.auth import get_current_user

@router.post("/admin/scrape")
async def admin_scrape(
    request: ScrapeRequest,
    current_user = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403)
    # 执行爬虫
```

---

## 总结

Amazon 爬虫系统采用了现代化的微服务架构，具有以下特点：

✅ **高性能**: 异步执行、并发控制、数据库优化
✅ **可扩展**: 插件化设计、配置化规则、分布式支持
✅ **可维护**: 分层架构、代码模块化、完善日志
✅ **用户友好**: 实时通知、进度展示、错误处理

该架构为 CoPaw 系统提供了强大的数据采集能力，支持未来扩展到更多电商平台和数据源。
