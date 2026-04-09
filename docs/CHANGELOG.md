# Changelog

本文件记录 CoPaw 项目的重要功能变更和开发里程碑。

---

## 2026-04-09 — Listing Management 模块 + AI Listing 生成 Skill

### 一、Listing Management（商品列表管理）

> 前后端完整 CRUD 模块，支持商品列表的增删改查、AI 生成、CSV 导入导出。

**后端（Python / FastAPI）**

新增文件：
- `src/copaw/app/listings/__init__.py` — Listing 模块包
- `src/copaw/app/listings/models.py` — Pydantic 数据模型（`Listing`、`ListingsFile`、`ListingGenerateRequest`）
- `src/copaw/app/listings/repository.py` — JSON 文件仓库，原子写入，CRUD + CSV 导入

新增 API 端点（`src/copaw/app/routers/listings.py`）：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/listings` | 列表查询（支持 search / status / platform 筛选） |
| `GET` | `/api/listings/{id}` | 获取单条 |
| `POST` | `/api/listings` | 新建 |
| `PUT` | `/api/listings/{id}` | 更新（部分字段） |
| `DELETE` | `/api/listings/{id}` | 删除 |
| `GET` | `/api/listings/export` | CSV 导出 |
| `POST` | `/api/listings/import` | CSV 导入（10MB 限制，UTF-8 校验） |
| `POST` | `/api/listings/generate` | AI 生成（SSE 流式，占位实现） |

代码质量加固：
- `_MAX_IMPORT_BYTES = 10MB` 文件大小限制
- `_IMMUTABLE_FIELDS` 防止 id / created_at 被覆盖
- 逐行 `ValidationError` 处理 + CSV 内 ASIN 去重
- `UnicodeDecodeError` 友好错误返回

**前端（React / TypeScript）**

新增文件：
- `console/src/api/types/listing.ts` — TypeScript 类型定义
- `console/src/api/modules/listing.ts` — API 客户端
- `console/src/pages/Ecommerce/ListingManagement/index.tsx` — 页面主组件
- `console/src/pages/Ecommerce/ListingManagement/index.module.less` — 样式
- `console/src/pages/Ecommerce/ListingManagement/useListings.ts` — CRUD Hook（300ms 搜索防抖）
- `console/src/pages/Ecommerce/ListingManagement/components/columns.tsx` — 表格列定义
- `console/src/pages/Ecommerce/ListingManagement/components/ListingDrawer.tsx` — 详情抽屉（编辑/新增）
- `console/src/pages/Ecommerce/ListingManagement/components/GenerateModal.tsx` — AI 生成弹窗（SSE 流式）

功能特性：
- 表格展示：标题、ASIN、平台、状态、价格、创建时间
- 筛选：关键词搜索（300ms 防抖）+ 状态筛选
- 批量操作：多选 + 批量删除
- ListingDrawer：全字段可编辑（title / asin / price / platform / marketplace / status / bullet_points / search_terms / description / image_url）
- GenerateModal：3 步式 AI 生成（输入 → 进度 → 结果），AbortController 防泄漏
- CSV 导入/导出

**涉及修改：**
- `console/src/api/types/index.ts` — 导出 listing 类型
- `console/src/api/index.ts` — 注册 listing API 模块
- `console/src/pages/Ecommerce/index.tsx` — 添加路由
- `console/src/layouts/Sidebar.tsx` — 添加侧边栏菜单项
- `console/src/layouts/constants.ts` — 添加路由映射
- `console/src/locales/en.json` / `zh.json` — 约 60 个 i18n key
- `src/copaw/app/routers/__init__.py` — 注册 listings 路由

---

### 二、listing_generator Skill（AI 商品列表生成）

> Markdown 驱动的 Agent Skill，用户在聊天界面通过自然语言触发竞品爬取 + Listing 生成。

**新增文件：**

```
src/copaw/agents/skills/listing_generator/
├── SKILL.md                              # 主指令文件
├── scripts/
│   └── save_listing.py                   # Listing 原子保存脚本
└── references/
    ├── listing_quality_rules.md          # Listing 内容质量规范
    └── amazon_scraping_guide.md          # Amazon 页面结构解析指南
```

**Skill 工作流：**

```
用户输入 → Agent 识别意图 → browser_use 爬取竞品
→ LLM 生成差异化 Listing → save_listing.py 保存
→ 回复用户（摘要 + Listing ID）
```

**支持的场景：**

| 场景 | 用户示例 | Agent 行为 |
|------|---------|-----------|
| 单品生成 | "帮我分析 B0XXXXXXXXX" | 爬取 → 生成 → 保存 |
| 关键词研究 | "研究 wireless earbuds 市场" | 搜索 → 分析竞品 → 输出报告 |
| Listing 优化 | "优化我的 Listing xxx" | 读取现有 → 爬取竞品 → 对比优化 |
| 批量生成 | 多个 ASIN（逗号/换行分隔） | 逐个处理 → 汇总 |

**save_listing.py 脚本：**
- 原子写入 `~/.copaw/listings.json`（tmp + shutil.move）
- 自动生成 UUID、时间戳
- 命令行参数接口（`--title` / `--asin` / `--bullet-points` / `--description` / `--search-terms` 等）
- 不依赖后端进程运行

**开发文档：**
- `docs/project/listing-skill-design.md` — 完整中文开发文档（架构设计、文件结构、SKILL.md 模板、质量规范、后端集成方案、开发路线图）

---

### 提交记录

| Commit | 说明 |
|--------|------|
| `a77a5b2` | feat(listings): add Listing Management with CRUD, AI generation, CSV and detail drawer |
| `b24a6e6` | fix(listings): address code review issues — stream abort, input debounce, CSV validation |
| `d514927` | feat(skills): add listing_generator skill for AI-powered listing creation |

---

## 2026-04-09 — Crawler Data 页面（Amazon 爬虫数据集成）

> 对接自建 Amazon Crawler 系统，在 CoPaw 控制台中展示 PostgreSQL 爬取数据，支持一键生成 Listing。

### 架构

```
浏览器 → CoPaw 前端(5173) → CoPaw 后端(8088) → Crawler API(8000) → PostgreSQL(5433)
                                (代理层)               (REST API)
```

CoPaw 后端作为代理层转发请求，不直接连接数据库。

### 后端

新增文件：
- `src/copaw/app/routers/crawler.py` — 代理路由，`_proxy()` 通用转发函数

代理端点（前缀 `/api/crawler`）：

| 方法 | 路径 | Crawler API 目标 | 说明 |
|------|------|-----------------|------|
| `GET` | `/products` | `/api/products/` | 商品列表（分页、搜索、筛选） |
| `GET` | `/products/stats` | `/api/products/stats/overview` | 统计概览 |
| `GET` | `/products/{asin}` | `/api/products/{asin}` | 单个商品详情 |
| `GET` | `/jobs` | `/api/scraping/status` | 任务总览（运行中 + 最近） |
| `GET` | `/jobs/{job_id}` | `/api/scraping/jobs/{job_id}` | 单个任务状态 |
| `POST` | `/jobs/search` | `/api/scraping/search` | 触发搜索爬取 |
| `POST` | `/jobs/detail` | `/api/scraping/detail` | 触发单品详情爬取 |
| `POST` | `/jobs/batch-detail` | `/api/scraping/batch-detail` | 触发批量详情爬取 |
| `DELETE` | `/jobs/{job_id}` | `/api/scraping/jobs/{job_id}` | 取消任务 |
| `GET` | `/notifications` | `/api/notifications/` | 通知列表 |
| `GET` | `/notifications/unread-count` | `/api/notifications/unread-count` | 未读数 |
| `PATCH` | `/notifications/{id}/read` | `/api/notifications/{id}/read` | 标记已读 |
| `POST` | `/notifications/mark-all-read` | `/api/notifications/mark-all-read` | 全部已读 |
| `DELETE` | `/notifications/{id}` | `/api/notifications/{id}` | 删除通知 |
| `POST` | `/generate` | 内部处理 | 一键生成 Listing |

异常处理：
- `ConnectError` → 502 `crawler_unavailable`
- `TimeoutException` → 504 `crawler_timeout`
- 通用异常 → 502 + 详细错误信息
- `trust_env=False` 禁用系统 HTTP 代理（防止请求被拦截）

### 前端

新增文件：

```
console/src/pages/Ecommerce/CrawlerData/
├── index.tsx                    # 主页面（4 Tab）
├── index.module.less            # 样式
├── useCrawlerProducts.ts        # 商品数据 Hook（300ms 搜索防抖）
├── useCrawlerJobs.ts            # 任务数据 Hook（5s 自动轮询）
├── useCrawlerNotifications.ts   # 通知数据 Hook
└── components/
    ├── ProductColumns.tsx       # 表格列定义
    ├── ProductDrawer.tsx        # 商品详情抽屉
    └── StatsCards.tsx           # 统计卡片
```

API 层：
- `console/src/api/types/crawler.ts` — TypeScript 类型（CrawlerProduct、ScrapingJob、CrawlerNotification 等）
- `console/src/api/modules/crawler.ts` — API 客户端

功能特性：
- **Products Tab**：商品列表表格 + 搜索/筛选（Prime、详情状态、排序）+ 分页 + 商品详情抽屉
- **Jobs Tab**：触发搜索/详情/批量爬取 + 任务列表 + 取消任务
- **Notifications Tab**：通知列表 + 未读徽章 + 标记已读/全部已读/删除
- **Stats Tab**：4 个统计卡片（商品总数、已详情爬取、Prime 商品、最后爬取时间）
- **一键生成 Listing**：从爬虫商品数据转换为 CoPaw Listing，保存到 `listings.json`

涉及修改：
- `console/src/api/index.ts` — 注册 crawler API 模块
- `console/src/api/types/index.ts` — 导出 crawler 类型
- `console/src/layouts/Sidebar.tsx` — 添加侧边栏菜单项（Globe 图标）
- `console/src/layouts/constants.ts` — 添加路由映射
- `console/src/pages/Ecommerce/index.tsx` — 添加路由
- `console/src/locales/en.json` / `zh.json` — 约 50 个 i18n key
- `src/copaw/app/routers/__init__.py` — 注册 crawler 路由

### 数据规模

- 71 个商品，57 个已详情爬取
- 30+ 字段（ASIN、标题、品牌、价格、图片、评分、评论数、五点描述、商品描述、库存、卖家、BSR 排名等）

### 问题与修复

| 问题 | 根因 | 修复 |
|------|------|------|
| 502 响应 body 为 `null` | 系统环境变量 `http_proxy` 导致 httpx 请求被代理服务器拦截 | `trust_env=False` |
| `@agentscope-ai/design` 缺少组件 | 设计库未导出 `Space/List/Descriptions/Badge` | 从 `antd` 直接导入 |
| `Spider` 图标不存在 | lucide-react 当前版本无此图标 | 改用 `Globe` |
| 后端重启后代码未更新 | `.pyc` 缓存 | 清除 `__pycache__` |

### 提交记录

| Commit | 说明 |
|--------|------|
| `44b5592` | feat: add Crawler Data page with Amazon Crawler API integration |
