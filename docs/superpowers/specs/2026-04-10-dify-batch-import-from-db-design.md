# Dify Batch Recognition — Import Images from Products DB

> **Date:** 2026-04-10
> **Scope:** 批量识别 Tab 新增从数据库已爬取产品中选择图片的功能

---

## 1. Context

批量识别 Tab 已支持两种图片输入方式：本地文件上传（拖拽）和单个 URL 粘贴。但用户每天需要处理竞品图片时，这些图片已经通过 Amazon Crawler 爬取并存入了数据库（`products` 表的 `image_url` / `all_images` 字段）。目前无法直接从数据库选择产品图片加入识别队列，用户需要手动从其他地方复制 URL 逐一粘贴，效率低。

**核心诉求：** 在批量识别 Tab 中，提供"从数据库选择"功能，让用户可以搜索、浏览已爬取的产品，选择其中包含的图片，一键批量添加到识别队列。

---

## 2. User Flow

```
1. 打开"批量识别"Tab
2. 在图片输入区域，点击"从数据库选择"按钮
3. 弹出产品选择弹窗
4. 搜索关键词（如 "bed frame"）过滤产品
5. 勾选需要的（多个）产品
6. 点击"添加选中"
7. 弹窗关闭，所有选中产品的图片 URL 自动添加到识别队列
8. 点击"开始识别"，正常流程
```

---

## 3. Architecture

```
BatchRecognitionSection (前端)
    │
    ├─► 点击"从数据库选择"
    │     │
    │     └─► 弹窗 Modal
    │           ├─► crawlerApi.listProducts({ search, page, page_size })
    │           │     GET /api/crawler/products
    │           │       → CoPaw backend proxy
    │           │           → Amazon Crawler :8000/api/products/
    │           │               → PostgreSQL products 表
    │           │
    │           └─► 用户勾选产品 → 提取 image_url / all_images
    │                 → 添加到 imageItems 队列（source: "url"）
    │
    └─► 识别流程不变（transfer_method: "remote_url"）
```

无后端改动。完全复用现有 products API 和前端 BatchImageItem 机制。

---

## 4. Existing Infrastructure (全部复用)

### 4.1 Frontend API

`console/src/api/modules/crawler.ts` — `crawlerApi.listProducts()`：

```typescript
listProducts(params?: {
  page?: number;        // 默认 1
  page_size?: number;   // 默认 20, 最大 100
  search?: string;      // 搜索 title / brand / ASIN
  min_price?: number;
  max_price?: number;
  prime_only?: boolean;
  detail_scraped?: boolean;
  sort_by?: string;     // scraped_at | price | rating | title
  sort_order?: string;  // asc | desc
}) => Promise<CrawlerProductListResponse>
```

### 4.2 TypeScript Types

`console/src/api/types/crawler.ts`：

```typescript
interface CrawlerProduct {
  asin: string;
  title: string;
  full_title?: string;
  brand?: string;
  price?: string;
  image_url?: string;      // 单张主图
  all_images?: string[];   // 所有图片（detail_scraped 后有值）
  product_url?: string;
  detail_scraped?: boolean;
  // ... 其他字段
}
```

### 4.3 Queue Item Type

现有 `BatchImageItem`：

```typescript
interface BatchImageItem {
  id: string;
  source: "file" | "url";
  fileName?: string;
  url?: string;
  status: "pending" | "uploading" | "processing" | "succeeded" | "failed";
  result?: string;
  error?: string;
  elapsed?: number;
}
```

从数据库添加的图片直接用 `source: "url"`, `url: imageUrl`，与手动粘贴 URL 完全一致。

---

## 5. UI Design

### 5.1 入口按钮

在"添加图片"Card 中，URL 输入行下方新增一行按钮：

```
┌──────────────────────────────────────────────┐
│ 添加图片                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ 拖拽或点击上传图片                         │ │
│ └──────────────────────────────────────────┘ │
│ [ https://example.com/image.jpg ] [添加链接] │
│ [📁 从数据库选择]                              │
└──────────────────────────────────────────────┘
```

### 5.2 产品选择弹窗

```
┌─────────────────────────────────────────────────────┐
│ 从数据库选择图片                              [×]    │
├─────────────────────────────────────────────────────┤
│ 搜索: [___________bed frame___________] [搜索]       │
│                                                      │
│ ☑ ASIN    标题                              图片数  │
│ ☑ B0XXXX  Metal Platform Bed Frame...       5张    │
│ ☐ B0YYYY  Wood Bed Frame Queen...           3张    │
│ ☐ B0ZZZZ  Adjustable Bed Frame...           —      │
│                                                      │
│                              第 1 页 / 共 3 页      │
│                                                      │
│ 已选 1 个产品，共 5 张图片        [添加选中]  [取消] │
└─────────────────────────────────────────────────────┘
```

**产品列表行为：**
- 每行显示：复选框、缩略图（`image_url`，40x40）、ASIN、标题（截断）、图片数量
- 图片数量取 `all_images?.length ?? (image_url ? 1 : 0)`
- 没有图片的产品（`!image_url && !all_images`）禁用复选框，显示"—"
- 分页器使用 Ant Design `Pagination`
- 底部显示"已选 N 个产品，共 M 张图片"汇总

**点击"添加选中"：**
- 遍历选中产品，提取图片 URL：
  - 优先 `all_images` 数组
  - 无 `all_images` 则用 `image_url`（单张）
- 每张图片创建一个 `BatchImageItem`（`source: "url"`）
- `fileName` 设为 `{ASIN}_img{index}` 便于识别
- 追加到现有 `imageItems` 队列
- 关闭弹窗

---

## 6. Frontend Changes

### 6.1 New State in `BatchRecognitionSection`

```typescript
const [dbModalOpen, setDbModalOpen] = useState(false);
const [dbProducts, setDbProducts] = useState<CrawlerProduct[]>([]);
const [dbTotal, setDbTotal] = useState(0);
const [dbPage, setDbPage] = useState(1);
const [dbSearch, setDbSearch] = useState("");
const [dbSelectedAsins, setDbSelectedAsins] = useState<Set<string>>(new Set());
const [dbLoading, setDbLoading] = useState(false);
```

### 6.2 Functions

```typescript
// 加载产品列表
const loadDbProducts = useCallback(async (page: number, search?: string) => {
  setDbLoading(true);
  try {
    const data = await crawlerApi.listProducts({
      page,
      page_size: 20,
      search: search || undefined,
      sort_by: "scraped_at",
      sort_order: "desc",
    });
    setDbProducts(data.products);
    setDbTotal(data.total);
  } catch {
    message.error(t("integration.dify.batchRecognition.loadProductsFailed"));
  } finally {
    setDbLoading(false);
  }
}, [t]);

// 打开弹窗
const openDbModal = useCallback(() => {
  setDbSelectedAsins(new Set());
  setDbSearch("");
  setDbPage(1);
  setDbModalOpen(true);
  loadDbProducts(1);
}, [loadDbProducts]);

// 切换产品选中
const toggleDbProduct = useCallback((asin: string) => {
  setDbSelectedAsins((prev) => {
    const next = new Set(prev);
    if (next.has(asin)) next.delete(asin);
    else next.add(asin);
    return next;
  });
}, []);

// 计算选中产品的总图片数
const selectedImageCount = useMemo(() => {
  return dbProducts
    .filter((p) => dbSelectedAsins.has(p.asin))
    .reduce((sum, p) => {
      return sum + (p.all_images?.length ?? (p.image_url ? 1 : 0));
    }, 0);
}, [dbProducts, dbSelectedAsins]);

// 添加选中产品图片到队列
const addDbProductsToQueue = useCallback(() => {
  const selected = dbProducts.filter((p) => dbSelectedAsins.has(p.asin));
  const newItems: BatchImageItem[] = [];
  for (const product of selected) {
    const images = product.all_images?.length
      ? product.all_images
      : product.image_url
        ? [product.image_url]
        : [];
    images.forEach((url, idx) => {
      newItems.push({
        id: crypto.randomUUID(),
        source: "url",
        url,
        fileName: `${product.asin}_img${idx + 1}`,
        status: "pending",
      });
    });
  }
  if (newItems.length === 0) {
    message.warning(t("integration.dify.batchRecognition.noImages"));
    return;
  }
  setImageItems((prev) => [...prev, ...newItems]);
  setDbModalOpen(false);
}, [dbProducts, dbSelectedAsins, t]);
```

### 6.3 Import

```typescript
import { crawlerApi } from "@/api/modules/crawler";
import type { CrawlerProduct } from "@/api/types/crawler";
```

### 6.4 JSX Changes

在 URL 输入行下方添加按钮，在组件末尾（edit modal 之后）添加 Modal。

### 6.5 CSS — `index.module.less`

`.dbModalList` — 产品列表行样式（缩略图、ASIN、标题布局）
`.dbProductRow` — 行 hover + 选中高亮
`.dbSummary` — 底部汇总栏

---

## 7. i18n Keys

### en.json

```json
"fromDatabase": "From Database",
"selectProducts": "Select Products",
"searchProducts": "Search products...",
"addSelected": "Add Selected",
"imageCount": "{{count}} images",
"noImages": "No images",
"noProducts": "No products found",
"selectedProductsSummary": "{{products}} products selected, {{images}} images total",
"loadProductsFailed": "Failed to load products"
```

### zh.json

```json
"fromDatabase": "从数据库选择",
"selectProducts": "选择产品",
"searchProducts": "搜索产品...",
"addSelected": "添加选中",
"imageCount": "{{count}}张图片",
"noImages": "无图片",
"noProducts": "未找到产品",
"selectedProductsSummary": "已选 {{products}} 个产品，共 {{images}} 张图片",
"loadProductsFailed": "加载产品失败"
```

---

## 8. Verification

1. `bun run build` — no TypeScript errors
2. 打开批量识别 Tab → "从数据库选择"按钮可见
3. 点击 → 弹窗打开，加载第一页产品
4. 搜索 "bed" → 列表过滤
5. 勾选 2 个有图片的产品 → 底部显示"2 个产品，N 张图片"
6. 点击"添加选中" → 图片出现在队列中
7. 无图片产品复选框禁用
8. 分页正常工作
