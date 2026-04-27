# Crawler Data Integration — Design Spec

> **Date:** 2026-04-09
> **Scope:** CoPaw 前端新增 Crawler Data 页面 + CoPaw 后端代理层对接 Amazon Crawler API

---

## 1. Context

CoPaw 已有 Listing Management 模块（CRUD + AI 生成）。用户自己编写的 Amazon Crawler 系统（独立 FastAPI + PostgreSQL，端口 8000）持续爬取竞品数据。需要一个新页面在 CoPaw 内部浏览爬虫数据、管理爬虫任务、并将爬虫数据一键转为 Listing。

**核心诉求：** 用户在 CoPaw 内完成 "爬取 → 浏览 → 生成 Listing → 编辑发布" 全流程，无需切换系统。

---

## 2. Architecture

```
PostgreSQL ──► Amazon Crawler API (:8000) ──► CoPaw 代理层 (:8088) ──► CoPaw 前端 (:5173)
                (数据源)                        (转发 + 转换)              (展示 + 操作)
```

**为什么用代理层而非前端直连：**
- 解耦：前端只依赖 CoPaw 后端，不需要知道爬虫地址
- 安全：爬虫数据库连接信息不暴露给前端
- 容错：爬虫不可用时返回友好错误，而非网络超时
- 转换：`/api/crawler/generate` 端点在代理层内部完成数据映射 + 写入 listings.json

---

## 3. Backend Proxy Layer

### 3.1 New Router: `src/copaw/app/routers/crawler.py`

CoPaw 后端新增 `/api/crawler/*` 路由，使用 `httpx.AsyncClient` 转发请求到爬虫 API。

**配置：**
- 爬虫 API 基地址通过环境变量 `CRAWLER_API_BASE_URL` 配置，默认 `http://localhost:8000`
- 请求超时 10 秒
- 爬虫不可用时返回 `502 {"error": "crawler_unavailable"}`

**端点映射：**

| CoPaw 端点 | 方法 | 转发目标 | 说明 |
|-----------|------|---------|------|
| `/api/crawler/products` | GET | `GET :8000/api/products/` | 商品列表（透传 query params） |
| `/api/crawler/products/{asin}` | GET | `GET :8000/api/products/{asin}` | 商品详情 |
| `/api/crawler/products/stats` | GET | `GET :8000/api/products/stats/overview` | 统计概览 |
| `/api/crawler/jobs` | GET | `GET :8000/api/scraping/status` | 任务状态总览 |
| `/api/crawler/jobs/{job_id}` | GET | `GET :8000/api/scraping/jobs/{job_id}` | 单个任务详情 |
| `/api/crawler/jobs/search` | POST | `POST :8000/api/scraping/search` | 触发搜索爬取 |
| `/api/crawler/jobs/detail` | POST | `POST :8000/api/scraping/detail` | 触发详情爬取 |
| `/api/crawler/jobs/batch-detail` | POST | `POST :8000/api/scraping/batch-detail` | 批量详情爬取 |
| `/api/crawler/jobs/{job_id}` | DELETE | `DELETE :8000/api/scraping/jobs/{job_id}` | 取消任务 |
| `/api/crawler/notifications` | GET | `GET :8000/api/notifications/` | 通知列表（透传 query params） |
| `/api/crawler/notifications/unread-count` | GET | `GET :8000/api/notifications/unread-count` | 未读计数 |
| `/api/crawler/notifications/{id}/read` | PATCH | `PATCH :8000/api/notifications/{id}/read` | 标记已读 |
| `/api/crawler/notifications/mark-all-read` | POST | `POST :8000/api/notifications/mark-all-read` | 全部已读 |
| `/api/crawler/notifications/{id}` | DELETE | `DELETE :8000/api/notifications/{id}` | 删除通知 |
| **`/api/crawler/generate`** | **POST** | **内部处理** | 批量生成 Listing（见 3.2） |

### 3.2 Generate Endpoint（内部处理，非转发）

`POST /api/crawler/generate`

**Request Body:**
```json
{
  "asins": ["B0XXX1", "B0XXX2", "B0XXX3"]
}
```

**流程：**
1. 逐个调用爬虫 API `GET /api/products/{asin}` 获取完整商品数据
2. 将爬虫字段映射为 Listing 字段（见 3.3）
3. 批量写入 `listings.json`（复用 `ListingRepository`）
4. 返回生成结果：`{"generated": 3, "skipped": 0, "listings": [...]}`

**容错：**
- 某个 ASIN 不存在时跳过，记入 skipped
- 部分成功时仍返回 200，在结果中标注哪些失败

### 3.3 Data Mapping: Crawler Product → Listing

| Crawler `Product` field | `Listing` field | Logic |
|------------------------|----------------|-------|
| `full_title` \| `title` | `title` | 优先 `full_title`，fallback `title` |
| `asin` | `asin` | 直接 |
| `about_this_item` (List[str]) | `bullet_points` (List[str]) | 直接（JSON array → array） |
| `product_description` | `description` | 直接 |
| `price` | `price` | 直接（保留原始格式，如 "$39.98"） |
| `all_images[0]` | `image_url` | 取第一张图，无图则空字符串 |
| — | `search_terms` | 空数组 `[]`（用户后续在 Listing Drawer 编辑） |
| — | `status` | `"draft"` |
| — | `platform` | `"amazon"` |
| — | `marketplace` | `""`（用户后续编辑） |
| — | `source_url` | `product_url` |
| — | `id` | `uuid4().hex`（自动生成） |
| — | `created_at` / `updated_at` | `datetime.utcnow().isoformat()` |

### 3.4 Registration

在 `src/copaw/app/routers/__init__.py` 中注册：
```python
from .crawler import router as crawler_router
router.include_router(crawler_router)
```

### 3.5 Environment Variable

新增到 `src/copaw/constant.py`：
```python
CRAWLER_API_BASE_URL = EnvVarLoader.get_str("CRAWLER_API_BASE_URL", "http://localhost:8000")
```

---

## 4. Frontend

### 4.1 Page Structure

新增 `console/src/pages/Ecommerce/CrawlerData/` 目录。

**路由：** `/ecommerce/crawler-data`
**侧边栏：** E-Commerce 下新增 "Crawler Data" 菜单项，icon: `Spider`（lucide-react）

### 4.2 Tab Layout

页面使用 Ant Design `Tabs` 组件，4 个 Tab：

```
┌──────────────────────────────────────────────────────────┐
│  [ 商品列表 ]  [ 爬虫任务 ]  [ 通知 ]  [ 统计 ]            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   (Tab content area)                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Tab 1: 商品列表（Products）

**布局：** 复用 Listing Management 的 toolbar + Table 模式。

**工具栏：**
- 搜索框（关键词搜索，300ms 防抖）
- 价格区间筛选（InputNumber min/max）
- Prime 筛选（Switch）
- 详情状态筛选（Select: 全部 / 已采集详情 / 未采集详情）
- 排序（Select: 采集时间 / 价格 / 评分）

**表格列：**

| 列 | 宽度 | 说明 |
|----|------|------|
| ASIN | 120px | 超链接，点击查看详情 Drawer |
| 图片 | 60px | 缩略图（image_url） |
| 标题 | 自适应 | 截断显示，hover 展示全文 |
| 品牌 | 100px | |
| 价格 | 80px | |
| 评分 | 80px | |
| 评论数 | 80px | |
| Prime | 60px | Tag: Yes 绿色 / No 灰色 |
| 详情状态 | 80px | Tag: 已采集 绿色 / 未采集 橙色 |
| 采集时间 | 150px | |
| 操作 | 120px | "生成 Listing" 按钮 + "查看详情" |

**行操作 — "生成 Listing"：**
- 点击后直接调用 `POST /api/crawler/generate` 传入该行 ASIN
- 成功后 `message.success("Listing 已生成")`
- 表格该行操作按钮变为 "已生成"（disabled 状态）

**行操作 — "查看详情"：**
- 打开 Drawer，展示完整商品数据（参考爬虫 ProductResponse 全部字段）
- Drawer 内部字段分组：基本信息 / 详情信息 / 销售信息 / 技术规格
- Drawer 底部："生成 Listing" 按钮

**分页：** 与爬虫 API 对齐，默认 20 条/页。

### 4.4 Tab 2: 爬虫任务（Scraping Jobs）

**上半部分 — 触发新任务：**
- 3 个卡片并排：
  - **搜索爬取**：输入关键词 + 最大页数 → POST /jobs/search
  - **详情爬取**：输入 ASIN → POST /jobs/detail
  - **批量详情**：输入数量限制 → POST /jobs/batch-detail

**下半部分 — 任务列表：**
- 表格列：任务 ID（截断）、类型、关键词/ASIN、状态、进度（successful/total）、耗时、开始时间
- 状态 Tag 颜色：pending 灰色、running 蓝色（加载动画）、completed 绿色、failed 红色
- 操作：取消（仅 pending/running 状态）
- 轮询：有 running 任务时，每 5 秒刷新一次

### 4.5 Tab 3: 通知（Notifications）

**布局：** 简单列表 + 未读计数 badge。

**Tab 标题：** `通知 (3)` — 括号内显示未读数。

**列表项：**
- 类型图标：完成 绿色 / 失败 红色
- 标题 + 消息
- 时间（相对时间：3 分钟前、2 小时前）
- 已读/未读样式区分（未读加粗 + 左侧蓝色竖线）

**操作：**
- 点击标记已读
- 顶部"全部已读"按钮
- 右侧删除按钮

### 4.6 Tab 4: 统计（Stats）

展示 `GET /api/crawler/products/stats` 返回的概览数据：

**4 个统计卡片：**
- 总商品数
- 已采集详情数 / 占比
- Prime 商品数
- 最后爬取时间

---

## 5. Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `console/src/api/types/crawler.ts` | CrawlerProduct, ScrapingJob, Notification 等类型 |
| `console/src/api/modules/crawler.ts` | API 客户端（httpx 代理层的前端调用） |
| `console/src/pages/Ecommerce/CrawlerData/index.tsx` | 主页面（Tabs 布局） |
| `console/src/pages/Ecommerce/CrawlerData/index.module.less` | 页面样式 |
| `console/src/pages/Ecommerce/CrawlerData/useCrawlerProducts.ts` | 商品列表 Hook |
| `console/src/pages/Ecommerce/CrawlerData/useCrawlerJobs.ts` | 爬虫任务 Hook |
| `console/src/pages/Ecommerce/CrawlerData/useCrawlerNotifications.ts` | 通知 Hook |
| `console/src/pages/Ecommerce/CrawlerData/components/ProductColumns.tsx` | 商品表格列定义 |
| `console/src/pages/Ecommerce/CrawlerData/components/ProductDrawer.tsx` | 商品详情 Drawer |
| `console/src/pages/Ecommerce/CrawlerData/components/JobTriggerCards.tsx` | 任务触发卡片 |
| `console/src/pages/Ecommerce/CrawlerData/components/StatsCards.tsx` | 统计卡片 |
| `src/copaw/app/routers/crawler.py` | 后端代理路由 |

### Modified Files

| File | Change |
|------|--------|
| `console/src/api/types/index.ts` | `export * from "./crawler"` |
| `console/src/api/index.ts` | 注册 crawlerApi |
| `console/src/pages/Ecommerce/index.tsx` | 添加 CrawlerData 路由 |
| `console/src/layouts/Sidebar.tsx` | 添加侧边栏菜单项 |
| `console/src/layouts/constants.ts` | 添加 KEY_TO_PATH / KEY_TO_LABEL |
| `console/src/locales/en.json` | 添加 crawlerData i18n keys |
| `console/src/locales/zh.json` | 添加 crawlerData 中文 i18n |
| `src/copaw/app/routers/__init__.py` | 注册 crawler_router |
| `src/copaw/constant.py` | 添加 CRAWLER_API_BASE_URL |

---

## 6. User Flow

### Complete Workflow (4 steps)

```
1. 打开 Crawler Data → Tab 2 → 输入关键词 → 开始爬取
2. 爬取完成 → 自动切到 Tab 1 → 浏览商品列表
3. 点击某商品的"生成 Listing"按钮
4. 成功提示 → 前往 Listing Management 查看和编辑
```

### Quick Flow (3 steps, data already exists)

```
1. 打开 Crawler Data → Tab 1 → 搜索/筛选商品
2. 点击"生成 Listing"
3. 前往 Listing Management 编辑发布
```

---

## 7. Error Handling

| 场景 | 行为 |
|------|------|
| 爬虫服务未启动 | 所有 API 返回 502 + `{"error": "crawler_unavailable"}`；页面顶部显示 Alert 横幅"爬虫服务未连接" |
| 网络超时 | 后端 10s 超时，返回 504；前端 Loading 状态自动结束 |
| 商品 ASIN 不存在 | generate 端点跳过该 ASIN，计入 skipped |
| 爬取任务失败 | 任务状态显示 failed + error_message；通知 Tab 收到失败通知 |
| 数据库为空 | 商品列表显示空状态插画 + "暂无数据，请先爬取" |

---

## 8. Dependencies

| Dependency | Where | Required |
|-----------|-------|----------|
| `httpx` | CoPaw 后端代理层 | 是（新增依赖） |
| Amazon Crawler API running | :8000 | 是（运行时） |
| Amazon Crawler PostgreSQL | :5433 | 是（运行时） |
| `Spider` icon from lucide-react | CoPaw 前端 | 是（已有 lucide-react） |

### Backend dependency check

```bash
# Check if httpx is available
uv add httpx
```

If `httpx` is not already in dependencies, it needs to be added to `pyproject.toml`.
