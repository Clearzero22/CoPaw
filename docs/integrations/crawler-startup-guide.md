# Amazon 爬虫服务深度分析

## 📋 目录

- [系统架构概览](#系统架构概览)
- [技术栈详解](#技术栈详解)
- [启动流程详解](#启动流程详解)
- [数据流分析](#数据流分析)
- [配置说明](#配置说明)
- [故障排查](#故障排查)
- [与CoPaw集成](#与copaw集成)

---

## 系统架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         CoPaw 主系统                             │
│                    (localhost:8088)                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  crawler.py 代理路由器                                    │  │
│  │  - 参数验证                                               │  │
│  │  - 请求转发                                               │  │
│  │  - 错误处理                                               │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │ HTTP Request                             │
└──────────────────────┼──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Amazon 爬虫系统                                │
│                    (localhost:8888)                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FastAPI 应用 (api/main.py)                               │  │
│  │  ┌────────────┬────────────┬────────────┬────────────┐   │  │
│  │  │ /products  │ /scraping  │/keywords   │/dify       │   │  │
│  │  └────────────┴────────────┴────────────┴────────────┘   │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │  后台任务 (BackgroundTasks)                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  SearchScraper / DetailScraper                     │  │
│  │  │  - Playwright 浏览器自动化                          │  │
│  │  │  - 反爬策略 (随机延迟、滚动、输入)                  │  │
│  │  │  - 数据提取和验证                                   │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │  APScheduler 定时任务                                     │  │
│  │  - 每 6 小时自动爬取                                      │  │
│  │  - 只爬取新数据                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ SQLAlchemy ORM
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PostgreSQL 数据库                                │
│                    (localhost:5433)                              │
│                                                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │  products   │ scraping_jobs│ keywords   │ dify_history    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 服务端口分配

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| CoPaw 后端 | 8088 | HTTP | 主服务 |
| CoPaw 前端 | 5173 | HTTP | React SPA |
| **爬虫 API** | **8888** | HTTP | FastAPI 服务 ⚠️ |
| 爬虫前端 | 5173 | HTTP | React 控制台 (会冲突!) |
| PostgreSQL | 5433 | TCP | Docker 数据库 |
| PgAdmin | 5050 | HTTP | 数据库管理 (可选) |

---

## 技术栈详解

### 后端技术栈

#### 1. FastAPI 框架

**版本**: `>=0.115`

**核心特性**:
- 异步支持 (`async/await`)
- 自动 API 文档 (Swagger UI)
- 类型验证 (Pydantic)
- 依赖注入系统

**路由结构**:
```python
# api/main.py
app = FastAPI(
    title="Amazon Crawler API",
    version="0.1.0",
    lifespan=lifespan,  # 启动/关闭钩子
)

# 路由注册
app.include_router(products.router, prefix="/api/products")
app.include_router(scraping.router, prefix="/api/scraping")
app.include_router(notifications.router, prefix="/api/notifications")
app.include_router(keywords.router, prefix="/api/keywords")
app.include_router(ws_router.router)  # WebSocket
```

#### 2. Playwright 浏览器自动化

**版本**: `>=1.58.0`

**反爬策略**:

```python
# src/scraper.py
class SearchScraper:
    """搜索爬虫 - 模拟真实用户"""

    async def search(self):
        # 1. 随机延迟 (2-3秒)
        await asyncio.sleep(random.uniform(2, 3))

        # 2. 逐字输入关键词
        for char in keyword:
            await search_box.type(char)
            await asyncio.sleep(random.uniform(0.05, 0.15))

        # 3. 随机滚动 (反爬检测)
        for i in range(random.randint(2, 4)):
            await self.page.evaluate(f"window.scrollTo(0, {random_y})")
            await asyncio.sleep(random.randint(500, 1500))
```

**浏览器配置**:
```python
# src/browser.py
await playwright.chromium.launch(
    headless=False,  # 有头模式 (开发) / 无头模式 (生产)
)

context = await browser.new_context(
    viewport={"width": 1920, "height": 1080},
    user_agent="Mozilla/5.0 ...",  # 真实 UA
    locale="en-US",
)
```

#### 3. SQLAlchemy + PostgreSQL

**连接池配置**:
```python
# api/database.py
engine = create_engine(
    database_url.replace("postgresql://", "postgresql+psycopg://"),
    pool_pre_ping=True,   # 连接健康检查
    pool_size=10,         # 连接池大小
    max_overflow=20,      # 最大溢出连接
)
```

**数据模型**:
```python
# api/models.py
class Product(Base):
    __tablename__ = "products"

    asin = Column(String(10), primary_key=True)
    title = Column(String(500))
    price = Column(String(20))
    rating = Column(Float)
    # ... 更多字段

class ScrapingJob(Base):
    __tablename__ = "scraping_jobs"

    job_id = Column(String(36), primary_key=True)
    job_type = Column(String(50))  # search, detail, batch_detail
    status = Column(String(20))    # pending, running, completed
    # ... 更多字段
```

#### 4. APScheduler 定时任务

**配置**:
```python
# api/scheduler.py
scheduler = AsyncIOScheduler()

scheduler.add_job(
    scheduled_scrape_job,
    trigger=IntervalTrigger(hours=6),  # 每6小时
    id="periodic_scrape",
    max_instances=1,  # 防止重叠执行
)
```

**智能跳过**:
```python
# 检查最近一次任务
recent_job = (
    db.query(ScrapingJob)
    .filter(ScrapingJob.status == "completed")
    .order_by(ScrapingJob.completed_at.desc())
    .first()
)

# 如果 1 小时内有成功任务，跳过本次
if recent_job and recent_job.completed_at > datetime.utcnow() - timedelta(hours=1):
    return
```

### 前端技术栈

#### 爬虫控制台 (React)

**位置**: `dashboard/`

**技术栈**:
- React 18
- Vite 6
- Ant Design 5
- React Query (数据获取)

**注意**: 默认端口 5173 与 CoPaw 前端冲突！

---

## 启动流程详解

### 方式一：一键启动脚本

**文件**: `scripts/start_all.sh`

```bash
#!/bin/bash
# 完整启动流程分析

# 1. 检查 PostgreSQL 容器
if ! docker ps | grep -q "amazon_crawler_db"; then
    echo "启动 PostgreSQL..."
    docker-compose up -d
    sleep 3  # 等待数据库就绪
fi

# 2. 清理旧进程 (防止端口占用)
if lsof -i :8888 > /dev/null; then
    fuser -k 8888/tcp  # 杀死占用 8888 端口的进程
fi

# 3. 启动 FastAPI 后台
.venv/bin/python -m uvicorn api.main:app \
    --host 0.0.0.0 \
    --port 8888 \
    --reload \          # 开发模式热重载
    > logs/api.log 2>&1 &

API_PID=$!  # 保存进程 ID

# 4. 健康检查
sleep 3
if curl -s http://localhost:8888/health; then
    echo "✅ API 启动成功"
fi

# 5. (可选) 启动前端
cd dashboard
bun run dev > ../logs/frontend.log 2>&1 &
```

**执行**:
```bash
cd /path/to/amazon_crawler
bash scripts/start_all.sh
```

### 方式二：手动分步启动

#### 步骤 1: 启动 PostgreSQL

```bash
cd /path/to/amazon_crawler
docker-compose up -d postgres

# 查看日志
docker-compose logs -f postgres

# 测试连接
docker exec -it amazon_crawler_db psql -U amazon -d amazon_crawler
```

**Docker Compose 配置解析**:
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: amazon_crawler
      POSTGRES_USER: amazon
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"  # 宿主机5433 -> 容器5432
    volumes:
      - postgres_data:/var/lib/postgresql/data  # 数据持久化
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/init_db.sql
      - ./configs/pg_hba.conf:/etc/postgresql/pg_hba.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U amazon -d amazon_crawler"]
      interval: 10s
      retries: 5
```

#### 步骤 2: 初始化数据库

```bash
# 激活虚拟环境
source .venv/bin/activate

# 安装依赖 (包括 API 扩展)
uv pip install -e ".[api]"

# 安装 Playwright 浏览器
playwright install chromium

# 运行数据库初始化脚本
python -c "from api.database import init_db; init_db()"
```

#### 步骤 3: 启动 API 服务

```bash
# 开发模式 (热重载)
python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 --reload

# 生产模式
python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 --workers 4
```

**启动时发生的事情**:
```python
# api/main.py - lifespan 函数
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ========== 启动阶段 ==========
    logger.info("Starting Amazon Crawler API...")

    # 1. 创建数据库表
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    # 2. 启动调度器
    scheduler.start()  # APScheduler 开始工作
    logger.info("Scheduler started")

    yield  # 应用开始处理请求

    # ========== 关闭阶段 ==========
    logger.info("Shutting down...")
    scheduler.stop()  # 停止定时任务
```

#### 步骤 4: 验证服务

```bash
# 健康检查
curl http://localhost:8888/health
# {"status":"healthy"}

# 查看产品列表
curl http://localhost:8888/api/products/

# 访问 API 文档
open http://localhost:8888/docs
```

---

## 数据流分析

### 搜索爬虫完整流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户发起爬取请求                                         │
│ ─────────────────────────────────────────────────────────── │
│ POST /api/scraping/search                                   │
│ Body: {"keyword": "laptop", "max_pages": 2}                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API 接收并创建任务                                       │
│ ─────────────────────────────────────────────────────────── │
│ - 生成 job_id (UUID)                                        │
│ - 创建 ScrapingJob 记录 (status=pending)                    │
│ - 返回 202 Accepted                                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 后台任务开始执行                                         │
│ ─────────────────────────────────────────────────────────── │
│ background_tasks.add_task(run_search_scrape, job_id, ...)  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 启动 Playwright 浏览器                                   │
│ ─────────────────────────────────────────────────────────── │
│ - BrowserController.start()                                 │
│ - 启动 Chromium (headless=False)                            │
│ - 创建浏览器上下文 (UA, viewport, locale)                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 执行搜索操作 (模拟真实用户)                              │
│ ─────────────────────────────────────────────────────────── │
│ a. 访问 Amazon 首页                                        │
│    - wait_until="domcontentloaded"                          │
│    - 随机延迟 2-3 秒                                         │
│                                                              │
│ b. 处理 "Continue shopping" 中间页                          │
│    - 尝试多个选择器                                          │
│    - 点击按钮                                                │
│                                                              │
│ c. 查找搜索框                                                │
│    - 等待选择器 (#twotabsearchtextbox)                      │
│    - 备选选择器列表                                          │
│                                                              │
│ d. 输入关键词                                                │
│    - 点击搜索框                                              │
│    - 逐字输入 (每字 0.05-0.15s)                             │
│    - 模拟打字速度                                            │
│                                                              │
│ e. 提交搜索                                                  │
│    - 点击搜索按钮 或 按回车                                  │
│    - 随机延迟 0.5-1.0s                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 解析搜索结果                                              │
│ ─────────────────────────────────────────────────────────── │
│ for page in range(1, max_pages + 1):                        │
│    - 等待结果加载                                            │
│    - 提取产品信息 (ASIN, title, price, rating)             │
│    - 随机滚动页面 (反爬策略)                                 │
│    - 点击 "下一页" 或等待翻页                                │
│    - 随机延迟 1-2 秒                                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. 数据验证和存储                                            │
│ ─────────────────────────────────────────────────────────── │
│ for product_data in extracted_products:                     │
│    - Pydantic 验证                                          │
│    - 检查是否已存在 (UPSERT)                                 │
│    - 保存到数据库                                            │
│    - 更新任务状态                                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. 任务完成                                                  │
│ ─────────────────────────────────────────────────────────── │
│ - 更新 ScrapingJob.status = "completed"                     │
│ - 设置 completed_at 时间戳                                   │
│ - 创建通知记录                                               │
│ - WebSocket 推送完成消息                                     │
│ - 关闭浏览器                                                │
└─────────────────────────────────────────────────────────────┘
```

### 批量详情爬虫流程

```
触发方式:
  1. API 调用: POST /api/scraping/batch-detail
  2. 定时任务: 每 6 小时自动执行
  3. 手动触发: 调度器强制执行

执行逻辑:
  1. 查询数据库中 detail_scraped=False 的产品
  2. 按创建时间排序 (优先爬取早期产品)
  3. 限制并发数 (max_concurrent_scrapes=3)
  4. 为每个产品创建独立的爬虫任务
  5. 使用信号量控制并发数量
```

**并发控制代码**:
```python
# api/routers/scraping.py
from asyncio import Semaphore

MAX_CONCURRENT = 3
semaphore = Semaphore(MAX_CONCURRENT)

async def scrape_with_semaphore(asin: str):
    async with semaphore:  # 限制并发
        await run_detail_scrape(asin)
```

---

## 配置说明

### 环境变量配置

虽然项目中没有 `.env` 文件，但可以通过 `api/config.py` 配置：

```python
# 默认配置
class Settings(BaseSettings):
    # API 设置
    api_host: str = "0.0.0.0"
    api_port: int = 8000  # ⚠️ 实际启动使用 8888
    environment: str = "development"

    # 数据库设置
    database_url: str = "postgresql://amazon:password@localhost:5433/amazon_crawler"

    # 爬虫设置
    max_concurrent_scrapes: int = 3      # 最大并发数
    scrape_timeout_seconds: int = 300    # 单个任务超时

    # 调度器设置
    scheduler_enabled: bool = True       # 是否启用定时任务
    scheduler_interval_hours: int = 6    # 运行间隔
```

### 创建 .env 文件 (可选)

```bash
# 在 amazon_crawler 目录创建 .env
cat > .env << 'EOF'
# API Settings
API_HOST=0.0.0.0
API_PORT=8888
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://amazon:password@localhost:5433/amazon_crawler

# Scraping
MAX_CONCURRENT_SCRAPES=3
SCRAPE_TIMEOUT_SECONDS=300

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_INTERVAL_HOURS=6
EOF
```

### Docker Compose 环境变量

```yaml
# docker-compose.yml
environment:
  POSTGRES_DB: amazon_crawler
  POSTGRES_USER: amazon
  POSTGRES_PASSWORD: password  # ⚠️ 生产环境需修改
```

---

## 故障排查

### 问题 1: 端口 8888 被占用

**症状**:
```
Error: [Errno 48] Address already in use
```

**解决**:
```bash
# 查找占用进程
lsof -i :8888

# 杀死进程
kill -9 <PID>

# 或使用启动脚本自动处理
fuser -k 8888/tcp
```

### 问题 2: 数据库连接失败

**症状**:
```
sqlalchemy.exc.OperationalError: (psycopg.OperationalError) connection refused
```

**检查**:
```bash
# 1. 确认 PostgreSQL 容器运行
docker ps | grep amazon_crawler_db

# 2. 查看容器日志
docker logs amazon_crawler_db

# 3. 测试连接
docker exec -it amazon_crawler_db psql -U amazon -d amazon_crawler

# 4. 重启数据库
docker-compose restart postgres
```

### 问题 3: Playwright 浏览器未安装

**症状**:
```
Executable doesn't exist at /path/to/chromium
```

**解决**:
```bash
# 安装 Chromium
playwright install chromium

# 验证安装
playwright install --dry-run chromium
```

### 问题 4: API 无法启动

**诊断步骤**:
```bash
# 1. 检查 Python 版本 (需要 >=3.12)
python --version

# 2. 检查依赖安装
pip list | grep -E "fastapi|playwright|sqlalchemy"

# 3. 查看详细错误
python -m uvicorn api.main:app --host 0.0.0.0 --port 8888

# 4. 查看日志
tail -f logs/api.log
```

### 问题 5: 与 CoPaw 集成失败

**症状**: CoPaw 返回 502 Bad Gateway

**原因**: 端口不匹配 (CoPaw 默认连接 8000，爬虫运行在 8888)

**解决**:
```bash
# 方法 1: 环境变量
export CRAWLER_BASE_URL="http://localhost:8888"
cd /path/to/CoPaw
uv run copaw app

# 方法 2: 修改代码
# 编辑 src/copaw/app/routers/crawler.py:20
_CRAWLER_BASE = "http://localhost:8888"

# 方法 3: 改用 8000 端口启动爬虫
python -m uvicorn api.main:app --port 8000
```

---

## 与 CoPaw 集成

### 集成架构

```
┌──────────────────────────────────────────────────────────┐
│                    CoPaw 主应用                           │
│                                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │  src/copaw/app/routers/crawler.py                  │   │
│  │                                                    │   │
│  │  _CRAWLER_BASE = "http://localhost:8888"  ⚠️      │   │
│  │  _TIMEOUT = 10.0                                   │   │
│  │                                                    │   │
│  │  @router.get("/products")                          │   │
│  │  async def list_products():                       │   │
│  │      return await _proxy("GET", "/api/products/") │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                        │ HTTP 代理
                        ↓
┌──────────────────────────────────────────────────────────┐
│              Amazon 爬虫 API (8888)                       │
│                                                               │
│  GET /api/products/  → CoPaw 转发到 ←                      │
│  GET /api/products/{asin}                                  │
│  POST /api/scraping/search                                 │
│  POST /api/scraping/detail                                 │
└──────────────────────────────────────────────────────────┘
```

### 代理功能实现

```python
# src/copaw/app/routers/crawler.py

async def _proxy(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json_body: dict | None = None,
    timeout: float = 10.0,
) -> JSONResponse:
    """转发请求到爬虫 API"""

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.request(
                method,
                f"{_CRAWLER_BASE}{path}",  # http://localhost:8888 + path
                params=params,
                json=json_body,
            )

        return JSONResponse(
            content=resp.json(),
            status_code=resp.status_code,
        )

    except httpx.ConnectError:
        # 爬虫服务未启动
        return JSONResponse(
            content={"error": "crawler_unavailable"},
            status_code=502,
        )

    except httpx.TimeoutException:
        # 请求超时
        return JSONResponse(
            content={"error": "crawler_timeout"},
            status_code=504,
        )
```

### 端点映射

| CoPaw 端点 | 爬虫端点 | 功能 |
|-----------|----------|------|
| `GET /api/crawler/products` | `GET /api/products/` | 产品列表 |
| `GET /api/crawler/products/{asin}` | `GET /api/products/{asin}` | 产品详情 |
| `POST /api/crawler/jobs/search` | `POST /api/scraping/search` | 触发搜索爬虫 |
| `POST /api/crawler/jobs/detail` | `POST /api/scraping/detail` | 触发详情爬虫 |
| `GET /api/crawler/jobs` | `GET /api/scraping/status` | 任务状态 |
| `POST /api/crawler/generate` | *(CoPaw 内部逻辑)* | 生成 Listing |

### 特殊端点: /generate

```python
# src/copaw/app/routers/crawler.py:232

@router.post("/generate")
async def generate_listings(request: Request):
    """
    从爬虫数据生成 Listing

    流程:
    1. 接收 ASIN 列表
    2. 从爬虫 API 获取产品详情
    3. 映射字段到 Listing 模型
    4. 保存到 listings.json
    """
    asins = body.get("asins", [])

    repo = ListingRepository(WORKING_DIR / "listings.json")

    for asin in asins:
        # 从爬虫获取数据
        product = await client.get(f"{_CRAWLER_BASE}/api/products/{asin}")

        # 转换为 Listing
        listing = Listing(
            asin=asin,
            title=product.get("title"),
            price=product.get("price"),
            # ... 更多字段
        )

        # 保存
        await repo.create_listing(listing)
```

---

## 完整启动检查清单

### 启动前检查

- [ ] Docker 已安装并运行
- [ ] Python 3.12+ 已安装
- [ ] 虚拟环境已创建 (`uv venv`)
- [ ] 依赖已安装 (`uv pip install -e ".[api]"`)
- [ ] Playwright 浏览器已安装 (`playwright install chromium`)
- [ ] 端口 8888 未被占用
- [ ] 端口 5433 未被占用
- [ ] 日志目录存在 (`logs/`)

### 启动步骤

```bash
# 1. 进入项目目录
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler

# 2. 启动 PostgreSQL
docker-compose up -d

# 3. 等待数据库就绪
docker-compose logs -f postgres
# 看到 "database system is ready to accept connections"

# 4. 激活虚拟环境
source .venv/bin/activate

# 5. 启动 API (开发模式)
python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 --reload

# 6. 验证服务 (新终端)
curl http://localhost:8888/health
curl http://localhost:8888/docs
```

### 启动后验证

```bash
# 健康检查
curl http://localhost:8888/health

# 查看产品列表
curl http://localhost:8888/api/products/ | jq

# 查看任务状态
curl http://localhost:8888/api/scraping/status | jq

# 测试爬虫 (需要浏览器)
curl -X POST http://localhost:8888/api/scraping/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "laptop", "max_pages": 1}' | jq
```

---

## 性能优化建议

### 1. 并发控制

```python
# 当前配置
max_concurrent_scrapes = 3  # 同时最多 3 个爬虫任务

# 建议配置
max_concurrent_scrapes = 5  # 提高并发 (需要更好的机器)
```

### 2. 超时设置

```python
# 当前配置
scrape_timeout_seconds = 300  # 5 分钟

# 建议
scrape_timeout_seconds = 600  # 10 分钟 (网络慢时)
```

### 3. 数据库连接池

```python
# 当前配置
pool_size=10
max_overflow=20

# 建议 (高负载)
pool_size=20
max_overflow=40
```

### 4. 定时任务间隔

```python
# 当前配置
scheduler_interval_hours = 6  # 每 6 小时

# 建议 (根据需求)
scheduler_interval_hours = 12  # 降低频率
```

---

## 安全建议

### 1. 生产环境配置

```bash
# 修改数据库密码
POSTGRES_PASSWORD=<strong_password>

# 使用环境变量
export DATABASE_URL="postgresql://amazon:<strong_password>@localhost:5433/amazon_crawler"

# 使用无头模式
headless=True
```

### 2. API 认证 (待实现)

```python
# 添加 API Key 验证
from fastapi import Security, HTTPException
from fastapi.security.api_key import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != os.getenv("CRAWLER_API_KEY"):
        raise HTTPException(status_code=403)

@router.get("/products", dependencies=[Depends(verify_api_key)])
async def list_products():
    ...
```

### 3. 速率限制 (待实现)

```python
# 使用 slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/products")
@limiter.limit("10/minute")
async def list_products():
    ...
```

---

## 总结

### 关键要点

1. **混合部署**: PostgreSQL 用 Docker，API 用 Python (Playwright 需要宿主机)
2. **端口配置**: API 使用 8888 (不是默认的 8000)
3. **反爬策略**: 随机延迟、滚动、逐字输入
4. **定时任务**: 每 6 小时自动爬取新数据
5. **与 CoPaw 集成**: 通过 HTTP 代理模式

### 启动命令速查

```bash
# 快速启动
cd /path/to/amazon_crawler
bash scripts/start_all.sh

# 手动启动
docker-compose up -d
source .venv/bin/activate
python -m uvicorn api.main:app --port 8888 --reload

# 停止服务
fuser -k 8888/tcp
docker-compose down
```

### 与 CoPaw 配置

```bash
# CoPaw 配置爬虫地址
export CRAWLER_BASE_URL="http://localhost:8888"
cd /path/to/CoPaw
uv run copaw app
```

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-27
**作者**: CoPaw Team
