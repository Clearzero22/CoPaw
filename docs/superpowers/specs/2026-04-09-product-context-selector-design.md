# Product Context Selector Design

## Overview

在聊天页面增加一个下拉框，从 Crawler Data 商品库中选择一个 ASIN，将其商品数据作为上下文注入到对话中，方便 AI 基于该商品信息回答问题。

## Interaction Flow

```
用户点击 ProductSelector 下拉框
  → 搜索/浏览商品列表（ASIN、标题、价格、评分）
  → 选择一个商品（高亮显示）
  → 用户输入问题并发送
  → 商品数据自动作为上下文前缀注入到消息中
  → AI 基于该商品数据回答
```

## Architecture

```
Chat Page (ChatPage)
  ├── rightHeader
  │     ├── AgentSelector
  │     ├── SkillSelector
  │     ├── ToolSelector
  │     ├── WorkflowSelector
  │     ├── ModelSelector
  │     ├── PromptSelector
  │     └── ProductSelector (NEW) ──→ crawlerApi.listProducts()
  │
  ├── selectedProduct state (new)
  │     ↑ CustomEvent("product-selected")
  │
  └── customFetch (modified)
        └── formatProductContext() → prepend to user message
```

## Component Design

### ProductSelector

位置: `console/src/pages/Chat/ProductSelector/index.tsx`

遵循 AgentSelector 的模式：

- **Trigger button**: `ShoppingBag` icon (lucide-react) + 标签文本 + `DownOutlined` 箭头
- **Dropdown panel**:
  - Header: 图标 + "商品上下文" 标题
  - Search input: 每次打开时获取商品列表，支持关键词实时搜索（300ms 防抖）
  - Product list: 每行显示 ASIN（等宽字体）、标题（截断 1 行）、价格、评分
  - Selected state: 选中商品显示 `CheckOutlined` + 紫色高亮边框
  - Footer: "清除选择" 按钮，dispatch `null` 取消绑定
- **Communication**: `window.dispatchEvent(new CustomEvent("product-selected", { detail: { product } }))`
- **Styling**: 复用 AgentSelector 的 `index.module.less` 模式，含暗黑模式

### Data Source

调用现有 API:
- `crawlerApi.listProducts({ search, page_size: 20, detail_scraped: true })` → 商品列表搜索
- 返回 `CrawlerProduct[]`，使用字段: `asin`, `title`, `price`, `rating`, `review_count`, `brand`, `about_this_item`, `product_description`, `image_url`

### Context Injection

在 `ChatPage.customFetch` 中，当 `selectedProduct` 存在时，将商品数据格式化为结构化文本前缀，注入到用户消息的 `content` 中：

```
[Product Context - ASIN: B0XXXXXXX]
Title: 商品标题
Brand: 品牌名
Price: $29.99
Rating: 4.5 (1200 reviews)
Bullet Points:
- 五点描述第1条
- 五点描述第2条
...

---

用户的实际问题内容
```

**限制**:
- `about_this_item` 最多取前 5 条
- `product_description` 截断至 2000 字符
- 仅包含非空字段

### ChatPage Changes

`console/src/pages/Chat/index.tsx`:

1. 导入 `ProductSelector` 和 `CrawlerProduct` 类型
2. 添加 `const [selectedProduct, setSelectedProduct] = useState<CrawlerProduct | null>(null)`
3. 添加 `useEffect` 监听 `product-selected` CustomEvent
4. 在 `rightHeader` JSX 中添加 `<ProductSelector />`
5. 在 `customFetch` 中，`rewrittenInput` 计算完成后、发送请求前，注入商品上下文

## Files

| Action | File | Description |
|--------|------|-------------|
| Create | `console/src/pages/Chat/ProductSelector/index.tsx` | 商品选择器组件 |
| Create | `console/src/pages/Chat/ProductSelector/index.module.less` | 样式（含暗黑模式） |
| Modify | `console/src/pages/Chat/index.tsx` | 导入、state、CustomEvent 监听、customFetch 注入 |
| Modify | `console/src/locales/en.json` | `chat.productSelector.*` i18n keys |
| Modify | `console/src/locales/zh.json` | 对应中文翻译 |

## Verification

1. `bun run build` 无 TypeScript 错误
2. 打开 `/chat` → ProductSelector 出现在顶栏（ShoppingBag 图标）
3. 点击下拉框 → 商品列表加载（Crawler API 未启动时显示空状态）
4. 搜索关键词 → 列表实时过滤
5. 选择商品 → 高亮显示，trigger 按钮显示 ASIN
6. 输入问题并发送 → Network 面板中请求体 input 包含商品上下文前缀
7. 点击"清除选择" → 上下文不再注入
8. 暗黑模式 → 样式正确
