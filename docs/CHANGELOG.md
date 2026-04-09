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
