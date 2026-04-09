# Amazon 页面结构解析指南

> 帮助 Agent 从 browser_use 的 snapshot 中正确提取竞品数据。
> Amazon 页面结构会变化，以下为常见模式，Agent 应灵活适应。

## 商品详情页（Product Page）

### 1. 商品标题（Product Title）
- **位置：** 页面顶部，`#productTitle` 区域
- **识别：** snapshot 中最明显的长文本，通常包含品牌名和产品关键词
- **注意：** 可能包含尺寸/颜色变体信息，提取时注意保留完整标题

### 2. 价格（Price）
- **位置：** 标题下方
- **可能包含：** 原价（划线）、现价、优惠券价、Prime 价格
- **提取策略：** 取当前展示的主要售价（不取划线价）

### 3. 五点描述（Bullet Points）
- **位置：** 商品信息中部，"About this item" 下方
- **识别：** 列表形式，每条以粗体或破折号开头
- **注意：** 如果有 "See more" 链接，内容可能被截断。可用：
  ```
  browser_use: {"action": "click", "selector": "See more"}
  ```
  点击展开后重新 snapshot

### 4. 产品描述（Product Description）
- **位置：** 五点描述下方
- **两种形态：**
  - **纯文本描述：** 几段文字，可直接提取
  - **A+ 页面：** 富文本 + 图片，snapshot 中以图片和段落混合形式出现。提取文字部分即可，图片信息简要描述

### 5. 商品图片（Product Images）
- **位置：** 页面左侧
- **识别：** URL 通常包含 `images-amazon.com` 或 `m.media-amazon.com`
- **提取：** 主图 URL + 缩略图数量

### 6. 评分和评论
- **位置：** 标题下方
- **格式：** `X.X out of 5 stars` + `X,XXX ratings`
- **提取：** 评分数字 + 评论数量

### 7. 品类排名（Best Sellers Rank）
- **位置：** 商品详情区域（可能需要滚动）
- **格式：** `#X in {Category Name}`
- **提取：** 排名数字 + 品类名称

---

## 搜索结果页（Search Results Page）

### 识别
- URL 包含 `/s?k=`
- 页面展示商品列表，每个结果包含：缩略图、标题、价格、评分、Prime 标识

### 提取策略
- 从 snapshot 中提取前 5-10 个结果的标题、价格、评分
- 如需详细分析某个商品，点击进入商品详情页

### 操作示例
```
browser_use: {"action": "open", "url": "https://www.amazon.com/s?k=wireless+earbuds"}
browser_use: {"action": "snapshot"}
```

---

## 特殊页面处理

### CAPTCHA 验证页
- **标识：** 页面显示 "robot check"、"Enter the characters you see below"、"Sorry, we just need to make sure you're not a robot"
- **处理：** 立即告知用户页面被反爬拦截，建议：
  1. 稍后重试
  2. 手动在浏览器中访问确认页面可加载
  3. 检查网络环境（VPN 等）

### 商品不可用
- **标识：** "Currently unavailable"、"Page not found (404)"、"We don't know when or if this item will be back in stock"
- **处理：** 告知用户该 ASIN 对应的商品已下架或不可用

### 多变体商品（Variations）
- **标识：** 页面有颜色、尺寸、款式选择器
- **处理：** 提取默认变体的信息，并在结果中标注"此商品有多个变体，以下为默认变体信息"

### 加载不完整
- **标识：** snapshot 中关键区域为空或显示 "Loading..."
- **处理：** 等待 2-3 秒后重新 snapshot：
  ```
  browser_use: {"action": "snapshot"}
  ```
  如果仍然不完整，尝试滚动页面后重新获取

---

## 不同站点差异

| 站点 | 域名 | 语言 | 特殊说明 |
|------|------|------|---------|
| US | amazon.com | 英语 | 标准页面结构 |
| DE | amazon.de | 德语 | 五点描述可能较短 |
| JP | amazon.co.jp | 日语 | 注意 `co.jp` 子域名 |
| UK | amazon.co.uk | 英语 | 与 US 结构基本一致 |
| FR | amazon.fr | 法语 | A+ 页面较常见 |
