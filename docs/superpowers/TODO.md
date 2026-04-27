# CoPaw TODO

> Last updated: 2026-04-10
> Track all pending tasks, planned features, and cleanup items.

---

## 0. 亚马逊运营流程 — 系统化实现路线图

> 基于完整的 6 阶段亚马逊运营流程，梳理 CoPaw 系统对应的功能需求。
> 流程：`AI视觉识别 → 市场洞察分析 → 竞品ASIN采集 → 关键词反查 → 词库分类 → 标题生成`

### 阶段一：AI视觉识别与产品定义（已实现 ✅）

> 对应功能：Dify 批量识别 Tab（`/integration/dify`）

- [x] 多图上传分析（本地文件 + 远程 URL）
- [x] Dify Workflow API 调用（自动检测图片输入变量）
- [x] 并发批量处理（1x-10x）
- [x] 识别结果持久化到 PostgreSQL
- [x] 历史记录回溯、编辑、Markdown 预览
- [x] 从数据库已爬取产品中选择图片

### 阶段二：AI市场洞察与用户画像

> 目标：AI 分析市场趋势、目标人群、需求场景、流量趋势

#### 2.1 市场环境分析

- **难度：** 中
- **描述：** 通过 AI 检索分析类目增长率、季节性波动、市场容量
- **方案：** 新增 `/api/ecommerce/market/insights` 端点，调用 LLM 基于产品信息 + 互联网知识生成市场分析报告
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增端点）
  - 前端新页面或集成到现有 Seller Tools
- **前置依赖：** 无
- **验证：** 输入类目和产品信息 → 返回市场分析报告（增长率、季节性、竞争度）

#### 2.2 目标人群画像生成

- **难度：** 中
- **描述：** 基于产品功能特性推导目标人群（都市小户型青年、游戏玩家、哺乳期妈妈等）
- **方案：** LLM 基于产品属性 + 市场数据生成人群画像卡片（Primary + Secondary）
- **涉及文件：** 同 2.1
- **前置依赖：** 2.1
- **验证：** 输入产品描述 → 返回人群画像（核心人群特征、痛点、场景）

#### 2.3 场景矩阵与需求分析

- **难度：** 中
- **描述：** 基于产品功能生成使用场景 × 人群痛点矩阵
- **方案：** LLM 分析产品功能点，映射到使用场景和对应人群痛点
- **涉及文件：** 同 2.1
- **前置依赖：** 2.1、2.2
- **验证：** 返回场景矩阵（场景 → 人群 → 痛点 → 关键词建议）

#### 2.4 流量趋势预测

- **难度：** 中-高
- **描述：** 分析近 1 年搜索量变化、识别新兴需求节点
- **方案：** 整合关键词搜索量历史数据 + LLM 趋势预测
- **涉及文件：** 同 2.1
- **前置依赖：** 1.3（关键词数据可用）
- **验证：** 输入产品 → 返回流量趋势图数据和新兴需求节点

---

### 阶段三：竞品筛选与 ASIN 采集（部分实现 ⚠️）

> 对应功能：ProductResearch 页面 + Crawler API

#### 3.1 产品搜索 API 对接（已有占位，需完善）

- **难度：** 低
- **当前状态：** `GET /ecommerce/products/search` 返回 2 个硬编码产品，前端 ProductResearch 页面用 mock 数据
- **方案：** 对接 Crawler API（从 products 表搜索或触发 `/api/scraping/search`），前端接上真实 API
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `search_products`）
  - `console/src/pages/Ecommerce/ProductResearch/index.tsx`（替换 mock，调用后端 API）
- **前置依赖：** 无
- **验证：** 前端搜索 "floor chair" → 返回 Crawler 数据库中真实产品

#### 3.2 产品详情 API 对接

- **难度：** 低
- **当前状态：** `GET /ecommerce/products/{asin}` 返回硬编码产品
- **方案：** 直接代理到 Crawler API `GET /api/products/{asin}`
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `get_product_details`）
- **前置依赖：** 无
- **验证：** 调用 `/ecommerce/products/B0XXXXX1` 返回真实产品详情

#### 3.3 竞品分析 API（待设计）

- **难度：** 中
- **当前状态：** `GET /ecommerce/competitors` 返回 3 个硬编码竞品
- **方案：** 基于同类目/关键词下 Crawler 产品数据，推导市场份额、价格分布、评分对比；加入评分卡逻辑（月销量 ≥ 300、评论数 ≥ 100、上架 ≤ 2 年、评分 ≥ 4.0）
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `get_competitors`）
- **前置依赖：** 3.1
- **验证：** 传入 ASIN → 返回评分后的竞品列表（含评分维度数据）

#### 3.4 ASIN 批量采集与管理

- **难度：** 中
- **描述：** 支持批量输入 ASIN → 触发 Crawler 批量详情抓取 → 自动存入 products 表 → 管理已采集 ASIN 库
- **方案：** 新增"ASIN 批量采集"功能，复用 Crawler `/api/scraping/batch-detail` 端点
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增 `POST /ecommerce/products/batch-scrape`）
  - 前端新增 ASIN 批量输入 + 采集状态展示
- **前置依赖：** 3.2
- **验证：** 输入 10 个 ASIN → 触发抓取 → 查询 products 表确认数据入库

---

### 阶段四：流量词反查与相关性验证

> 对应功能：KeywordResearch 页面 + XiYouZhaoCi 集成

#### 4.1 关键词分析 API 对接（已有占位，需完善）

- **难度：** 低-中
- **当前状态：** `GET /ecommerce/keywords/analyze` 返回 4 个硬编码关键词，前端 KeywordResearch 页面用 mock 数据
- **方案：** 对接 Crawler XiYouZhaoCi 数据（`GET /api/keywords/` 已有完整接口，含 search_volume、rank、click_rate 等）
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `analyze_keywords`）
  - `console/src/pages/Ecommerce/KeywordResearch/index.tsx`（替换 mock，调用后端 API）
- **前置依赖：** 无
- **验证：** 前端输入种子词 → 返回 XiYouZhaoCi 中的真实关键词数据

#### 4.2 ASIN 批量反查

- **难度：** 中
- **描述：** 输入多个 ASIN → 批量查询每个 ASIN 的流量关键词
- **方案：** 新增端点 `GET /ecommerce/keywords/by-asin?asins=B0XXX,B0YYY`，从 Crawler keywords 表按 ASIN 筛选
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增端点）
  - 前端新增批量反查 UI
- **前置依赖：** 4.1
- **验证：** 输入 5 个 ASIN → 返回各 ASIN 关联的流量词列表

#### 4.3 相关性验证工具

- **难度：** 中-高
- **描述：** 将关键词在亚马逊前台实际搜索，验证搜索结果与自身产品的匹配度（🟢高度相关/🟡中度相关/🔴不相关）
- **方案：** 新增 `/api/ecommerce/keywords/validate` 端点，用 browser_use 搜索关键词 + 提取首页结果 → AI 判断相关性
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增端点）
- **前置依赖：** browser_use 工具可用
- **验证：** 输入关键词 → 返回相关性标签 + 前 10 结果的产品 ASIN 匹配度

---

### 阶段五：关键词分类与词库搭建

#### 5.1 六级关键词分类体系

- **难度：** 中
- **描述：** 建立结构化关键词体系：核心流量大词、功能词、核心属性词、适配人群词、场景词、差异化属性词、精准长尾词
- **方案：** 新增 `/api/ecommerce/keywords/classify` 端点，AI 基于产品上下文自动分类
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增端点）
- **前置依赖：** 4.1
- **验证：** 输入一批关键词 + 产品信息 → 返回分类后的结构化词库

#### 5.2 词库管理功能

- **难度：** 中
- **描述：** 管理关键词库：增删改查、标签过滤、导出导入
- **方案：** 新增词库 CRUD 端点 + 前端词库管理页面（表格 + 标签筛选 + 导出 CSV）
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（新增端点）
  - `console/src/pages/Ecommerce/KeywordLibrary/`（新页面）
- **前置依赖：** 5.1
- **验证：** 创建词库 → 添加关键词 → AI 自动分类 → 按标签筛选 → 导出

#### 5.3 关键词去重与合并

- **难度：** 低
- **描述：** 批量关键词去重（相似词合并）、同义词合并
- **方案：** 在 5.2 基础上增加去重逻辑（基于 embedding 相似度或字符串编辑距离）
- **涉及文件：** 同 5.2
- **前置依赖：** 5.2
- **验证：** 导入 200 个关键词 → 去重后剩余 N 个 → 人工确认合并建议

---

### 阶段六：亚马逊标题生成与优化（部分实现 ⚠️）

> 对应功能：Listing Management 页面 + AI Listing 生成

#### 6.1 AI Listing 生成接入 Agent Runner（已有占位，需完善）

- **难度：** 高
- **当前状态：** `POST /listings/generate` 用 `asyncio.sleep` 模拟，返回硬编码 Listing
- **方案：** 按已有 listing_generator SKILL.md 流程：browser_use 抓取产品页 → agent runner 调用 listing_generator skill → AI 生成优化 Listing
- **涉及文件：**
  - `src/copaw/app/routers/listings.py`（修改 `generate_listing`）
- **前置依赖：** 需要理解 agent runner 从 FastAPI 端点的调用方式
- **验证：** 前端 GenerateModal → SSE 流显示 scraping → generating → 返回真实 AI 生成 Listing

#### 6.2 标题生成优化规则引擎

- **难度：** 中
- **描述：** 按亚马逊 SEO 规则生成标题：200 字符限制、核心大词前置、6 段式结构、避免堆砌和主观形容词
- **方案：** 在 listing_generator skill 中强化标题生成 prompt，加入规则约束（已部分在 `references/listing_quality_rules.md`）
- **涉及文件：**
  - `agents/skills/listing_generator/SKILL.md`（优化 prompt）
- **前置依赖：** 6.1
- **验证：** 生成的标题符合 200 字符限制，关键词自然分布，无堆砌

#### 6.3 A/B 测试与效果追踪

- **难度：** 高
- **描述：** 支持同时生成多个标题版本 → 跟踪 CTR、广告表现 → 数据驱动优化
- **方案：** 生成模式下支持 `variants: 3` 参数，存储多个版本；新增效果追踪数据模型和展示页面
- **涉及文件：**
  - `src/copaw/app/routers/listings.py`（多版本支持）
  - 前端 ListingManagement 新增版本对比视图
- **前置依赖：** 6.1、6.2
- **验证：** 生成 3 个标题版本 → 选择一个上架 → 查看对比数据

#### 6.4 季度数据自动更新

- **难度：** 中-高
- **描述：** Cron 定期更新标题数据（搜索趋势变化、季节词、新兴场景词），提示用户更新
- **方案：** 新增 cron 任务，每季度检查标题中关键词的趋势变化，发送提醒通知
- **涉及文件：**
  - `src/copaw/app/cron/`（新增定时任务）
  - 频道通知集成
- **前置依赖：** 5.1（关键词分类数据）、通知系统
- **验证：** 季度结束 → 收到通知 → 查看关键词趋势变化 → 更新标题

---

## 1. E-commerce API — 替换硬编码 Mock 数据（快速修复）

> 基础设施完善，支撑阶段 3-5 的数据需求。

### 1.1 `GET /ecommerce/products/{asin}` — 产品详情

- **难度：** 低
- **当前状态：** 返回 1 个硬编码产品
- **方案：** 直接代理到 Crawler API `GET /api/products/{asin}`
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `get_product_details`）
- **前置依赖：** 无
- **验证：** 调用 `/ecommerce/products/B0XXXXX1` 返回 Crawler 数据库中的真实产品

### 1.2 `GET /ecommerce/products/search` — 产品搜索

- **难度：** 低
- **当前状态：** 返回 2 个硬编码产品
- **方案：** 对接 Crawler API 搜索（从已有 products 表查询）
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `search_products`）
  - `console/src/pages/Ecommerce/ProductResearch/index.tsx`（接上后端 API，替换 mock 数据）
- **前置依赖：** 无
- **验证：** 前端 ProductResearch 页面搜索关键词返回真实产品列表

### 1.3 `GET /ecommerce/keywords/analyze` — 关键词分析

- **难度：** 低-中
- **当前状态：** 返回 4 个硬编码关键词
- **方案：** 对接 XiYouZhaoCi 已有数据（Crawler `/api/keywords/`）
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `analyze_keywords`）
  - `console/src/pages/Ecommerce/KeywordResearch/index.tsx`（接上后端 API，替换 mock 数据）
- **前置依赖：** 无
- **验证：** 前端 KeywordResearch 页面输入种子词返回真实关键词数据

### 1.4 `GET /ecommerce/competitors` — 竞品分析

- **难度：** 中
- **当前状态：** 返回 3 个硬编码竞品
- **方案：** 基于同一类目/关键词下的 Crawler 产品数据，推导竞品市场份额、价格分布、评分对比
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `get_competitors`）
- **前置依赖：** 1.2（产品搜索能正常工作）
- **验证：** 传入 ASIN 返回同类目的真实竞品列表

### 1.5 `GET /ecommerce/suppliers` — 供应商查询

- **难度：** 高
- **当前状态：** 返回 3 个硬编码供应商
- **方案：** 需要对接外部供应商数据源（如 Alibaba API、1688 等），或建立内部供应商数据库
- **涉及文件：**
  - `src/copaw/app/routers/ecommerce.py`（修改 `get_suppliers`）
- **前置依赖：** 需要确定供应商数据来源
- **验证：** 按品类搜索返回真实供应商信息

---

## 2. AI Listing 生成 — 接入 Agent Runner

> `src/copaw/app/routers/listings.py` 中 `POST /listings/generate` 使用 `asyncio.sleep` 模拟，未接入真实 agent runner。

### 2.1 Listing 生成流程接入

- **难度：** 高
- **当前状态：** SSE 流中用 sleep 模拟 scraping 和 generating 阶段，返回硬编码 Listing
- **方案：** 按照已有 `listing_generator` SKILL.md 文档的流程：
  1. `status: scraping` → 用 agent runner 调用 browser_use 抓取亚马逊产品页
  2. `status: generating` → 将抓取数据传入 listing_generator skill 生成优化 Listing
  3. `result` → 返回生成的 Listing JSON
  4. 保存到 ListingRepository
- **涉及文件：**
  - `src/copaw/app/routers/listings.py`（修改 `generate_listing`）
  - 可能需要新增 agent 调用辅助函数
- **前置依赖：** 需要理解 agent runner 调用方式（从 FastAPI 端点调用 `stream_query`）
- **验证：** 前端 GenerateModal 发起请求 → SSE 流显示 scraping → generating → 返回真实 AI 生成的 Listing

### 2.2 前端 GenerateModal 接线确认

- **难度：** 低
- **当前状态：** 前端已实现 SSE 读取逻辑（status/result/done/error 事件），只是后端返回假数据
- **方案：** 后端实现 2.1 后，前端无需改动或微调
- **涉及文件：** 无（或 `console/src/pages/Ecommerce/ListingManagement/components/GenerateModal.tsx` 微调字段映射）
- **前置依赖：** 2.1

---

## 3. ML 系统

> 设计文档：`docs/superpowers/specs/2026-04-10-ml-system-brainstorm.md`

### 3.1 Phase 1: ALIE — 智能 Listing 优化引擎

- **难度：** 高
- **预估周期：** ~5 周
- **内容：**
  - Chroma 嵌入用于竞品聚类
  - Listing 质量评分器（规则 + LLM-as-Judge）
  - 增强 listing_generator 加入竞品感知
  - 每周定时监控 + 频道通知
- **前置依赖：** 1.x（E-commerce API 完善）、2.1（Listing 生成真实可用）

### 3.2 Phase 2: RIS — 评论情报系统

- **难度：** 高
- **预估周期：** ~6 周
- **内容：**
  - 评论抓取 MCP Server
  - LLM 零样本分类（情感/主题/严重度）
  - 评论嵌入聚类发现缺陷模式
  - 个性化回复生成
- **前置依赖：** 需要 MCP Server 基础设施

### 3.3 Phase 3: PIFE — 定价情报与预测引擎

- **难度：** 高
- **预估周期：** ~5 周
- **内容：**
  - 价格历史追踪（cron 定时抓取）
  - 趋势分析（移动平均/波动率）
  - Buy Box 获得概率估算
  - LLM 定价建议
- **前置依赖：** 1.x（产品数据可用）、定时任务系统

---

## 4. 代码清理

### 4.1 App.tsx 欢迎屏逻辑恢复

- **位置：** `console/src/App.tsx:31`
- **问题：** 测试期间强制始终显示欢迎屏，原始条件判断被注释
- **方案：** 取消注释恢复原始条件逻辑

### 4.2 model_factory.py file:// 临时兼容方案

- **位置：** `src/copaw/agents/model_factory.py:132`
- **问题：** `file://` URL 转换是 AgentScope 上游更新前的临时方案
- **方案：** 等 AgentScope 更新后移除

### 4.3 scan_policy.py 预设扩展

- **位置：** `src/copaw/security/skill_scanner/scan_policy.py:43`
- **问题：** 只有 "balanced" 预设，计划添加 "strict" 和 "permissive"
- **方案：** 新增两个预设配置
