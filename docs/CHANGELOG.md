# Changelog

本文件记录 CoPaw 项目的重要功能变更和开发里程碑。

---

## 2026-04-10 — Dify 批量识别历史持久化 + 编辑 + Markdown 预览 + 数据库选图

> 为批量识别 Tab 添加完整的历史记录持久化、编辑和预览能力。识别结果自动保存到 Amazon Crawler PostgreSQL 数据库，支持历史批次回溯查看、编辑结果/状态/错误字段，以及 Markdown 渲染预览。新增从数据库已爬取产品中批量选择图片加入识别队列的功能。

### 修改文件

```
00_project_ai/amazon_crawler/api/
├── models.py              # 新增 DifyRecognitionResult ORM 模型
├── schemas.py             # 新增 DifyRecognitionItem/Response/Update 等 schema
├── routers/dify_history.py # 新增 4 端点（POST/GET/GET detail/DELETE/PATCH）
├── main.py                # 注册 dify_history 路由

src/copaw/app/routers/
└── crawler.py             # 新增 5 个代理端点（/dify/history/*）

console/src/pages/Integration/Dify/
├── index.tsx              # 历史记录 UI、编辑弹窗、Markdown 预览、数据库选图弹窗
├── index.module.less      # 历史记录样式、Markdown 渲染样式、产品选择器样式、暗色模式
console/src/locales/
├── en.json                # 新增 history/edit/preview/database 相关 i18n key
├── zh.json                # 对应中文翻译
```

### 关键改动

- **后端持久化（Amazon Crawler）**：新增 `dify_recognition_results` 表，通过 SQLAlchemy ORM 存储，支持 CRUD 操作
- **增量保存**：每张图片识别完成即 POST 保存，中途刷新不丢失已完成的记录
- **历史记录 UI**：折叠面板展示批次列表（时间倒序），展开查看详情表格，支持删除批次和清空历史
- **编辑记录**：点击铅笔图标打开编辑弹窗，可修改 result、status（Select 下拉）、error 字段
- **Markdown 预览**：点击结果文本打开 760px 弹窗，自动解析 JSON 提取 `analysis_content`，用 `react-markdown` + `remark-gfm` 渲染完整 Markdown（标题、列表、表格、引用等）
- **数据库选图**：点击"从数据库选择"打开产品选择弹窗，复用 `crawlerApi.listProducts()` 搜索过滤，勾选产品后一键批量添加图片 URL 到识别队列
- **代理链路**：CoPaw 后端 (`:8088`) → Crawler API (`:8000`) → PostgreSQL (`:5433`)

---

## 2026-04-10 — Dify 批量图片识别集成

> 在 Dify 集成页面新增"批量识别"Tab，支持通过 Dify Workflow API 批量处理产品图片识别。自动检测工作流图片输入参数，支持本地文件上传和远程 URL 两种输入方式，可配置并发数（1x-10x）。

### 修改文件

```
console/src/pages/Integration/Dify/
├── index.tsx            # 按钮切换 → Tabs 布局（4 标签）；BatchRecognitionSection 组件
├── index.module.less    # Tabs 样式、批量识别布局、暗色模式
console/src/locales/
├── en.json              # 新增 integration.dify.batchRecognition.*（30 个 key）
├── zh.json              # 对应中文翻译
```

### 关键改动

- **Tabs 重构**：将 Dify 页面原来的 3 按钮视图切换改为 Ant Design Tabs（Applications / Dashboard / Chatbot / Batch Recognition）
- **自动参数检测**：通过 `/v1/parameters` API 自动识别工作流的 `file-list` 类型输入变量，无需手动配置
- **App-specific Key 兼容**：连接测试改用 `/v1/parameters`（而非 `/v1/apps`），兼容 Dify 的 app-specific API key
- **Base URL 路径修复**：添加 `difyApiUrl()` 辅助函数，避免 `/v1/v1` 路径重复
- **并发批量处理**：队列式并发控制（1x-10x），支持中途停止，实时进度显示
- **结果表格**：展示每张图片的状态、识别结果、耗时

---

## 2026-04-10 — Seller Tools（卖家工具）13 页面迁移

> 将 bun_project 中的 13 个亚马逊卖家管理页面集成到 CoPaw 控制台，新建侧边栏"卖家工具"目录。所有页面从 Tailwind CSS 转为 Ant Design + CSS Modules，支持暗色模式，包含完整中英文 i18n。

### 新增文件

```
console/src/pages/SellerTools/
├── index.tsx                              # 路由包装组件（13 条路由）
├── TagManager/                            # 标签管理
│   ├── index.tsx, index.module.less, mockData.ts
├── SellerSpriteHome/                      # 卖家精灵首页
│   ├── index.tsx, index.module.less, types.ts
├── KimiChat/                              # Kimi 聊天（品牌命名建议）
│   ├── index.tsx, index.module.less, mockData.tsx
├── ErpListing/                            # ERP 产品列表
│   ├── index.tsx, index.module.less, types.ts, mockData.ts
│   ├── components/
│   │   ├── FilterBar.tsx, ActionBar.tsx, ListingTable.tsx
│   │   ├── Pagination.tsx, StatsModal.tsx
├── KeywordMonitorKimi/                    # 关键词监控 (Kimi)
│   ├── index.tsx, index.module.less, types.ts
├── KeywordMonitorGemini/                  # 关键词监控 (Gemini)
│   ├── index.tsx, index.module.less, types.ts
├── AiAssistant/                           # AI 助手（5 页仪表盘）
│   ├── index.tsx, index.module.less, types.ts
├── SellerSpriteTools/                     # 卖家精灵工具（50+ 工具网格）
│   ├── index.tsx, index.module.less, types.ts
├── CopywritingAnalysis/                   # 文案分析（4 节报告）
│   ├── index.tsx, index.module.less, types.ts
├── AiProductIntro/                        # AI 产品介绍（暗色科幻风格）
│   ├── index.tsx, index.module.less
├── AiProductImage/                        # AI 产品图片
│   ├── index.tsx, index.module.less
├── ProductLanding/                        # 产品落地页（暗色营销页）
│   ├── index.tsx, index.module.less
├── Calendar/                              # 日历（自定义周视图 + 拖拽）
│   └── index.tsx, index.module.less
```

另外 `console/src/pages/SellerSpriteHome/` 也已独立迁移（非 SellerTools 子路由）。

### 涉及修改

- `console/src/layouts/Sidebar.tsx` — 新增 seller-tools-group 菜单组（13 项）
- `console/src/layouts/constants.ts` — 新增 DEFAULT_OPEN_KEYS、KEY_TO_PATH、KEY_TO_LABEL 映射
- `console/src/layouts/MainLayout/index.tsx` — 新增 SellerToolsPage 路由
- `console/src/locales/{en,zh,ja,ru}.json` — 新增 sellerTools.* i18n 节点
- `console/package.json` — 新增 chart.js + react-chartjs-2 依赖

### 各页面亮点

| 页面 | 关键特性 |
|------|---------|
| TagManager | 11 列 Ant Design Table，标签选择 Modal |
| SellerSpriteHome | 欢迎卡片、增长市场表格、快捷访问、直播课程 |
| KimiChat | 品牌命名建议表、白牌命名、TrendSparkline SVG |
| ErpListing | Chart.js 统计弹窗（订单量 + 销量折线图）、FilterBar |
| KeywordMonitorKimi | 5 秒实时排名趋势更新、ASIN 面板 |
| KeywordMonitorGemini | PC/Mobile 双列表头、TrendLine SVG（3 种类型） |
| AiAssistant | 工具选择面板（8 类别）、@-提及聊天输入、ClawSvg |
| SellerSpriteTools | 5 列工具网格、工具弹窗（Modal）、标签徽章 |
| CopywritingAnalysis | scroll-spy 侧边导航、进度条、叙事流程步骤 |
| AiProductIntro | 暗色科幻主题、CSS 动画（tech-grid、float、glow） |
| AiProductImage | 紫色品牌、上传拖拽区、12 场景卡片网格 |
| ProductLanding | 暗色营销页、红/绿痛点对比卡片、动态边框光效 |
| Calendar | 自定义周视图日历、拖拽 15 分钟吸附、当前时间红线 |

### 提交记录

| Commit | 说明 |
|--------|------|
| `be4019f` | feat: add Seller Tools section with 13 migrated pages from bun_project |

---

## 2026-04-10 — Product Context Selector（商品上下文选择器）

> 聊天页面新增商品上下文下拉选择器，从 Crawler Data 商品库中选择商品后，将格式化的商品数据加载到聊天输入框，用户可编辑后发送。

### 前端

新增文件：

```
console/src/pages/Chat/ProductSelector/
├── index.tsx                    # 下拉选择组件（搜索、列表、选中状态）
└── index.module.less            # 样式（含暗色模式）
```

组件功能：
- **下拉面板**：ShoppingBag 图标 + 标题 + 搜索框 + 商品列表 + 清除按钮
- **搜索**：300ms 防抖，调用 `crawlerApi.listProducts({ search, page_size: 20, detail_scraped: true })`
- **商品展示**：ASIN（等宽字体）、标题（单行截断）、价格、评分
- **选中状态**：紫色高亮 + CheckOutlined 图标
- **输入框写入**：选择商品后通过 DOM 操作将格式化的商品上下文写入聊天输入框（原生 value setter + `_valueTracker` 重置 + input 事件派发），用户可预览编辑后再发送
- **清除选择**：清空输入框内容

涉及修改：
- `console/src/pages/Chat/index.tsx` — 导入并渲染 `<ProductSelector />` 到 rightHeader
- `console/src/locales/en.json` / `zh.json` — 7 个 i18n key（`productSelector.*`）

### 技术要点

`@agentscope-ai/chat` 的 `AgentScopeRuntimeWebUI` ref 未暴露 `setInputContent` 方法，因此使用 DOM 操作绕过 React 受控组件限制：

```ts
// 1. 重置 Ant Design value tracker
textarea._valueTracker?.setValue("");
// 2. 原生 setter 设置值
Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set.call(textarea, text);
// 3. 派发 input 事件触发 React onChange
textarea.dispatchEvent(new Event("input", { bubbles: true }));
```

### 提交记录

| Commit | 说明 |
|--------|------|
| `e948de6` | feat: add Product Context Selector to chat page |

---

## 2026-04-09 — Prompt Templates 提示词模板管理

> 独立管理页面，用于管理 Listing 文案生成的提示词模板。支持按品类/平台/站点分类，标题/五点/描述/关键词各自独立的 prompt 字段，以及全文覆盖提示词。数据存储在 PostgreSQL。

### 架构

```
浏览器 → CoPaw 前端(5173) → CoPaw 后端(8088) → Crawler API(8000) → PostgreSQL(5433)
                                (代理层)               (REST API)
```

### 后端

**Crawler API**（`00_project_ai/amazon_crawler/api/`）：

新增文件：
- `api/models.py` — `PromptTemplate` SQLAlchemy 模型（15 个字段）
- `api/schemas.py` — `PromptTemplateCreateRequest`、`PromptTemplateListResponse`
- `api/routers/prompt_templates.py` — CRUD 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/prompt-templates/` | 列表查询（分页、搜索、品类/平台/站点筛选） |
| `GET` | `/api/prompt-templates/{id}` | 获取单个模板 |
| `POST` | `/api/prompt-templates/` | 创建模板 |
| `PUT` | `/api/prompt-templates/{id}` | 更新模板 |
| `DELETE` | `/api/prompt-templates/{id}` | 删除模板 |
| `POST` | `/api/prompt-templates/set-default/{id}` | 设为默认（自动清除同组其他默认） |
| `POST` | `/api/prompt-templates/batch-delete` | 批量删除 |

**CoPaw 代理**（`src/copaw/app/routers/prompt_templates.py`）：

透传端点（前缀 `/api/prompt-templates`），使用 `_proxy()` 通用转发函数，路由使用显式路径段（`/list`、`/item/{id}`、`/create`、`/update/{id}`、`/delete/{id}`）避免 FastAPI 路由冲突。

### 前端

新增文件：

```
console/src/pages/Ecommerce/PromptTemplates/
├── index.tsx                    # 主页面（筛选栏 + 表格 + 批量删除）
├── usePromptTemplates.ts        # 数据 Hook（300ms 搜索防抖、CRUD、乐观更新）
└── components/
    ├── columns.tsx              # 表格列定义（品类/平台彩色标签、默认金色标签）
    └── PromptDrawer.tsx         # 创建/编辑抽屉（4 个独立 prompt 字段 + 全文覆盖）
```

API 层：
- `console/src/api/types/prompt.ts` — TypeScript 类型（扩展 PromptTemplate 接口）
- `console/src/api/modules/promptTemplate.ts` — API 客户端（7 个方法）

功能特性：
- **筛选栏**：关键词搜索 + 品类/平台/站点下拉筛选
- **表格**：名称、品类（彩色标签）、平台、站点、默认标记、更新时间、操作（编辑/设为默认/删除）
- **PromptDrawer**：模板名称/描述 + 品类/平台/站点选择 + 4 个独立 TextArea（标题/五点/描述/关键词提示词）+ 全文覆盖提示词
- **批量操作**：行选择 + 批量删除（Popconfirm 确认）
- **设为默认**：同一品类+平台+站点组合下仅一个默认模板
- **i18n**：英文 + 中文翻译（~40 个 key）

### 问题与修复

| 问题 | 根因 | 修复 |
|------|------|------|
| 保存无反应 | `usePromptTemplates.createTemplate` 吞掉 API 错误，返回 `false` 但无错误提示 | `handleSubmit` 中 `ok === false` 时显示 `message.error()` |
| 405 Method Not Allowed | FastAPI 路由冲突：`POST /` 与 `GET /{template_id}` 同前缀下歧义 | 路由改为显式路径段（`/create`、`/list`、`/item/{id}` 等） |
| 404 Not Found | Crawler API 未重启，新路由未加载 | 重启 Crawler API |

### 提交记录

| Commit | 说明 |
|--------|------|
| `357e7c6` | feat: add Prompt Templates management page for listing copywriting |

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

---

## 2026-04-09 — XiYouZhaoCi 西柚找词集成（关键词研究）

> 集成 xiyouzhaoci.com 关键词爬虫，支持从 CoPaw 控制台一键触发爬取、查看关键词数据、批量管理。

### 架构

```
浏览器 → CoPaw 前端(5173) → CoPaw 后端(8088) → Crawler API(8000) → PostgreSQL(5433)
                                (代理层)               (REST API)       ↑
                                                         POST /scrape →  Bun subprocess
                                                         xi_you_zhao_ci/index.ts
                                                              ↓ Playwright
                                                      xiyouzhaoci.com
```

爬虫使用 Playwright 浏览器自动化抓取 xiyouzhaoci.com，结果直接写入 PostgreSQL（Bun.sql），CSV 作为备份。

### 后端

**Crawler API** (`00_project_ai/amazon_crawler/api/routers/keywords.py`)：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/keywords/` | 关键词列表（分页、搜索、ASIN/难度筛选、排序） |
| `GET` | `/api/keywords/stats` | 统计概览（总数、ASIN 数、热门关键词） |
| `DELETE` | `/api/keywords/{asin}` | 按 ASIN 删除关键词 |
| `POST` | `/api/keywords/batch-delete` | 按 ASIN 列表批量删除 |
| `POST` | `/api/keywords/scrape` | 触发爬取（异步子进程，Bun + Playwright） |
| `GET` | `/api/keywords/scrape/status` | 爬取任务状态（运行中 + 最近） |

**CoPaw 代理** (`src/copaw/app/routers/xiyouzhaoci.py`)：

透传端点（前缀 `/api/xiyouzhaoci`），含 ASIN 格式校验、超时处理、错误映射。

**爬虫改造** (`00_project_ai/xi_you_zhao_ci/index.ts`)：

- CLI 参数接收 ASIN（`process.argv.slice(2)`）
- CSV 解析 → 18 列映射 → PostgreSQL 写入（Bun.sql + ON CONFLICT upsert）
- 并发控制（semaphore，默认 3 个标签页）
- `scraped_at` 使用 `new Date()` 确保每条记录时间独立

### 前端

新增文件：

```
console/src/pages/Ecommerce/XiYouZhaoCi/
├── index.tsx                    # 主页面（3 Tab）
├── index.module.less            # 样式
├── useKeywords.ts               # 关键词数据 Hook（300ms 搜索防抖）
├── useScrape.ts                 # 爬取状态 Hook（3s 自动轮询）
└── components/
    ├── KeywordColumns.tsx       # 表格列定义（难度颜色标签）
    ├── KeywordDrawer.tsx        # 关键词详情抽屉
    ├── StatsCards.tsx           # 统计卡片（总数/ASIN/热门/最近）
    └── AsinPicker.tsx           # ASIN 选择弹窗（从 Crawler Data 选取）
```

API 层：
- `console/src/api/types/xiyouzhaoci.ts` — TypeScript 类型
- `console/src/api/modules/xiyouzhaoci.ts` — API 客户端

功能特性：
- **关键词数据 Tab**：表格展示 + 关键词/ASIN 搜索 + 分页 + 详情抽屉 + 单条/批量删除（行选择 + Popconfirm 确认）
- **触发爬取 Tab**：手动输入 ASIN / 从 Crawler Data 选择 → 异步爬取 + 实时进度展示
- **统计概览 Tab**：关键词总数、覆盖 ASIN 数、热门关键词、最近爬取时间
- 难度标签颜色编码（难=红色、中等=橙色、低=绿色）

涉及修改：
- `console/src/api/index.ts` — 注册 xiyouzhaoci API 模块
- `console/src/api/types/index.ts` — 导出类型
- `console/src/layouts/Sidebar.tsx` — 添加侧边栏菜单项（Search 图标）
- `console/src/layouts/constants.ts` — 添加路由映射
- `console/src/pages/Ecommerce/index.tsx` — 添加路由
- `console/src/locales/en.json` / `zh.json` — 约 55 个 i18n key
- `src/copaw/app/routers/__init__.py` — 注册路由

### 提交记录

| Commit | 说明 |
|--------|------|
| `3e3f426` | feat: add XiYouZhaoCi keyword research integration page |

---

## 2026-04-09 — Windows 迁移指南 + 兼容性分析

> 全面分析 CoPaw 从 Linux 迁移到 Windows 所需的操作。核心代码已具备 Windows 兼容性，文档覆盖外部依赖、通道兼容性、安装步骤。

### 核心结论

CoPaw Python 后端已内置 Windows 支持（`sys.platform == "win32"` 分支覆盖时区检测、进程管理、Shell 执行、信号处理、ANSI 颜色等），**无需代码修改即可在 Windows 运行**。

### 文档内容

新增 `docs/guides/windows-migration.md`，包含：

- **Quick Start** — PowerShell 一键安装命令（Python → uv → Bun → Playwright → 构建 → 启动）
- **Shell 脚本迁移** — 5 个 `.sh` 脚本需要创建 `.ps1` 等效版本（install.sh 显式拒绝 Windows）
- **外部基础设施** — PostgreSQL（Docker Desktop）、Playwright Chromium、Bun 运行时
- **Channel 兼容性矩阵** — 12 个通道中 11 个可用，iMessage 不可用（依赖 macOS SQLite）
- **Skills 外部工具** — poppler、LibreOffice、pandoc、ffmpeg、himalaya 等安装方式
- **LLM 提供商** — 全部云端提供商可用；本地提供商中 MLX 不可用（Apple Silicon 专属）
- **已处理清单** — 15+ 处跨平台代码已正确分支（时区、进程、Shell、权限、信号、路径等）
- **已知限制** — iMessage（macOS only）、MLX（Apple Silicon only）

### 提交记录

| Commit | 说明 |
|--------|------|
| `f90cc3c` | docs: add Windows migration guide |
