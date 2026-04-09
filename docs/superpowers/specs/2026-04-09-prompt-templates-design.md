# Prompt Templates Management — Design Spec

> 独立页面管理 Listing 文案生成的提示词模板，支持按品类、平台、站点分类，标题/五点/描述各自独立的 prompt 字段。数据存储在 PostgreSQL。

## Context

当前 `listing_generator` Skill 的提示词规则硬编码在 `SKILL.md` 和 `references/listing_quality_rules.md` 中，所有品类共享同一套生成策略。需要一个可管理、可扩展的模板系统。

## Architecture

```
浏览器 UI → CoPaw 前端(5173) → CoPaw 后端(8088) → Crawler API(8000) → PostgreSQL(5433)
                                (代理层)               (REST API)
```

复用现有 Crawler API + CoPaw Proxy 的三层架构。

## Data Model

### PostgreSQL Table: `prompt_templates`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | Integer PK | No | auto-increment | |
| name | String(200) | No | | 模板名称 |
| description | String(500) | Yes | null | 模板描述 |
| category | String(100) | Yes | "generic" | 品类: electronics, home, clothing, generic |
| platform | String(50) | Yes | "amazon" | 平台: amazon, ebay |
| marketplace | String(10) | Yes | "us" | 站点: us, de, jp, uk |
| title_prompt | Text | Yes | null | 标题生成提示词 |
| bullet_prompt | Text | Yes | null | 五点描述生成提示词 |
| description_prompt | Text | Yes | null | 描述生成提示词 |
| keywords_prompt | Text | Yes | null | 搜索关键词生成提示词 |
| full_prompt | Text | Yes | null | 全文覆盖提示词（优先级高于分字段） |
| extra_data | JSON | Yes | null | 扩展字段（语气风格、品牌指南、禁忌词等） |
| is_default | Boolean | No | false | 该品类+平台+站点下的默认模板 |
| created_at | DateTime | No | utcnow | |
| updated_at | DateTime | No | utcnow | |

**约束：** 同一 `category + platform + marketplace` 下只能有一个 `is_default = true` 的模板。

### Prompt 优先级规则

```
full_prompt (非空时) > 分字段 prompt (title/bullet/description/keywords) > listing_quality_rules.md (默认规则)
```

## API Endpoints

### Crawler API (`/api/prompt-templates`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | 列表查询（分页、搜索、品类/平台/站点筛选、排序） |
| `GET` | `/{id}` | 获取单个模板 |
| `POST` | `/` | 创建模板 |
| `PUT` | `/{id}` | 更新模板 |
| `DELETE` | `/{id}` | 删除模板 |
| `POST` | `/set-default/{id}` | 设为默认（自动清除同组其他默认） |
| `POST` | `/batch-delete` | 批量删除（按 id 列表） |

### CoPaw Proxy (`/api/prompt-templates`)

透传所有端点，遵循 xiyouzhaoci.py 的 `_proxy()` 模式。

## Frontend

### Page Structure

```
console/src/pages/Ecommerce/PromptTemplates/
├── index.tsx                    # 主页面（工具栏 + 表格 + Drawer）
├── index.module.less            # 样式
├── usePromptTemplates.ts        # 数据 Hook（搜索、分页、CRUD）
└── components/
    ├── columns.tsx              # 表格列定义
    └── PromptDrawer.tsx         # 创建/编辑抽屉
```

### Table Columns

| 列 | 字段 | 宽度 | 说明 |
|----|------|------|------|
| Name | name | 200 | 模板名称 |
| Category | category | 120 | 品类标签 |
| Platform | platform | 80 | 平台标签 |
| Marketplace | marketplace | 80 | 站点标签 |
| Default | is_default | 80 | 默认标记（Tag） |
| Updated | updated_at | 150 | 最后更新时间 |
| Actions | — | 120 | 编辑 / 设为默认 / 删除 |

### Filter Bar

- 搜索框：按名称搜索（300ms 防抖）
- 品类筛选：Select（全部 / electronics / home / clothing / generic / 自定义）
- 平台筛选：Select（全部 / amazon / ebay）
- 站点筛选：Select（全部 / us / de / jp / uk）

### PromptDrawer

创建/编辑抽屉，使用 Drawer + Form 模式：

```
┌─────────────────────────────────────┐
│ Prompt Template           [×]      │
├─────────────────────────────────────┤
│ Name:        [____________]        │
│ Description: [____________]        │
│ Category:    [▼ electronics    ]   │
│ Platform:    [▼ amazon         ]   │
│ Marketplace: [▼ us             ]   │
│                                     │
│ ┌─ Tabs ──────────────────────┐   │
│ │ Title | Bullet | Desc | Key │   │
│ ├─────────────────────────────┤   │
│ │ [TextArea for prompt        ]   │
│ │                              ]   │
│ └─────────────────────────────┘   │
│                                     │
│ [Full Prompt Override]              │
│ [TextArea for full_prompt    ]     │
│ (Overrides all individual fields)  │
│                                     │
│              [Cancel]  [Save]       │
└─────────────────────────────────────┘
```

- 5 个独立 prompt 字段（标题/五点/描述/关键词）通过 Tabs 切换
- `full_prompt` 字段单独放置在 Tabs 下方，带说明"覆盖所有分字段"
- 所有 TextArea 支持 placeholder 提示内容格式

### Batch Operations

- 表格行选择（Checkbox）
- 批量删除按钮（Popconfirm 确认）
- 设为默认按钮（单个操作）

## Sidebar & Routing

- 菜单项：`ecommerce-group` 下新增 `ecommerce-prompt-templates`
- 图标：`FileText` from lucide-react
- 路由：`/ecommerce/prompt-templates`

## i18n Keys

约 30 个 key，命名空间 `ecommerce.promptTemplates.*`：

```
tabTitle, colName, colCategory, colPlatform, colMarketplace,
colDefault, colUpdated, colActions, searchPlaceholder,
filterCategory, filterPlatform, filterMarketplace,
createTitle, editTitle, fieldName, fieldDescription,
fieldCategory, fieldPlatform, fieldMarketplace,
tabTitlePrompt, tabBulletPrompt, tabDescPrompt, tabKeywordsPrompt,
fullPromptLabel, fullPromptHint,
setDefault, setDefaultSuccess, setDefaultFailed,
deleteBtn, batchDeleteBtn, batchDeleteConfirm,
saveSuccess, deleteSuccess, batchDeleteSuccess,
totalItems, confirm, cancel
```

## Files to Create/Modify

### New Files

| File | Description |
|------|-------------|
| `00_project_ai/amazon_crawler/api/routers/prompt_templates.py` | Crawler API 路由 |
| `src/copaw/app/routers/prompt_templates.py` | CoPaw 代理路由 |
| `console/src/api/modules/promptTemplate.ts` | 前端 API 客户端 |
| `console/src/pages/Ecommerce/PromptTemplates/index.tsx` | 主页面 |
| `console/src/pages/Ecommerce/PromptTemplates/index.module.less` | 样式 |
| `console/src/pages/Ecommerce/PromptTemplates/usePromptTemplates.ts` | 数据 Hook |
| `console/src/pages/Ecommerce/PromptTemplates/components/columns.tsx` | 表格列 |
| `console/src/pages/Ecommerce/PromptTemplates/components/PromptDrawer.tsx` | 编辑抽屉 |

### Modified Files

| File | Change |
|------|--------|
| `00_project_ai/amazon_crawler/api/models.py` | Add PromptTemplate model |
| `00_project_ai/amazon_crawler/api/schemas.py` | Add request/response schemas |
| `00_project_ai/amazon_crawler/api/main.py` | Register router |
| `src/copaw/app/routers/__init__.py` | Register proxy router |
| `console/src/api/types/prompt.ts` | Extend PromptTemplate interface |
| `console/src/api/types/index.ts` | Ensure export |
| `console/src/api/index.ts` | Import promptTemplateApi |
| `console/src/layouts/Sidebar.tsx` | Add menu item |
| `console/src/layouts/constants.ts` | Add route mapping |
| `console/src/pages/Ecommerce/index.tsx` | Add route |
| `console/src/locales/en.json` | English i18n |
| `console/src/locales/zh.json` | Chinese i18n |

## Future Extensions

- `extra_data` JSON 字段预留扩展：
  - 语气风格（professional / casual / playful）
  - 品牌专属用语（brand voice guidelines）
  - 禁忌词列表（forbidden words）
  - 目标用户画像（target audience persona）
- 与 listing_generator Skill 集成：生成时自动加载匹配的模板
- 模板导入/导出（JSON / CSV）
- 模板版本历史
