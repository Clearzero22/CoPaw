# Listing AI 生成 Skill 开发文档

> **目标：** 在 CoPaw AI 聊天界面中，用户可通过一个 Skill 让 Agent 自动爬取竞品数据并生成优化的 Listing 内容（标题、五点描述、描述、搜索词等），直接存入 Listing Management 系统。

---

## 1. 背景与需求

### 1.1 现状

- Listing Management 模块已实现前端 CRUD 表格、详情抽屉、CSV 导入导出、AI 生成弹窗（SSE 流式）
- 后端 `POST /api/listings/generate` 端点存在，但内部是 **占位实现**（TODO），未接入真实的爬取和 AI 生成逻辑
- Agent 已具备 `browser_use`（Playwright 浏览器自动化）和 `execute_shell_command`（Shell 命令）工具

### 1.2 目标

| 功能 | 描述 |
|------|------|
| 竞品爬取 | Agent 通过浏览器自动打开竞品页面，提取标题、价格、五点描述、图片等信息 |
| AI 内容生成 | 基于爬取的竞品数据，使用 LLM 生成差异化的 Listing 内容 |
| 自动入库 | 生成的 Listing 直接写入 `listings.json`，前端即时可见 |
| 用户交互 | 用户在聊天界面输入"帮我分析 ASIN B0XXXXXXXXX"即可触发 |

### 1.3 用户使用流程

```
用户在聊天中输入："帮我分析竞品 B0XXXXXXXXX，生成一个优化的 Listing"
    ↓
Agent 识别意图 → 加载 listing_generator Skill
    ↓
Agent 调用 browser_use 打开 Amazon 商品页
    ↓
Agent 提取竞品数据（标题、五点描述、价格、A+内容、评论关键词）
    ↓
Agent 使用 LLM 能力生成差异化 Listing 内容
    ↓
Agent 调用 API 或直接写入 listings.json 保存
    ↓
Agent 回复用户：生成完成，展示摘要 + Listing ID
    ↓
用户在前端 Listing Management 页面查看和编辑
```

---

## 2. 技术方案

### 2.1 实现方式：Markdown Skill + Python 辅助脚本

CoPaw 的 Skill 体系是 **提示词驱动**（不是代码插件）。Skill 的 `SKILL.md` 被注入到 Agent 系统提示词中，LLM 根据 SKILL.md 中的指引，调用已有工具（`browser_use`、`execute_shell_command`）完成任务。

**架构选择：**

```
┌─────────────────────────────────────────────┐
│              用户（聊天界面）                   │
└──────────────────┬──────────────────────────┘
                   │ "帮我分析 B0XXX..."
                   ▼
┌─────────────────────────────────────────────┐
│            CoPaw Agent                       │
│  ┌─────────────────────────────────────┐    │
│  │  listing_generator SKILL.md         │    │
│  │  （提示词指令，告诉 Agent 如何操作）    │    │
│  └─────────────────────────────────────┘    │
│  ┌───────────┐  ┌──────────────────────┐    │
│  │ browser_use│  │ execute_shell_command│    │
│  │ (爬取竞品) │  │ (调用 Python 脚本)   │    │
│  └───────────┘  └──────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌───────┐ ┌──────────┐
   │ Amazon  │ │ 脚本  │ │listings  │
   │ 商品页  │ │ 保存  │ │.json     │
   └─────────┘ └───────┘ └──────────┘
```

### 2.2 为什么选择 Skill 而不是新 Tool

| 维度 | 新 Tool（Python 代码） | Skill（SKILL.md） |
|------|----------------------|-------------------|
| 开发复杂度 | 高 — 需要注册工具、处理参数序列化 | 低 — 纯 Markdown |
| 灵活性 | 固定流程，改逻辑需改代码 | Agent 自主决策，可适应不同场景 |
| 浏览器集成 | 需在代码中调用 Playwright | 直接复用 `browser_use` |
| 可维护性 | 需要跟随框架更新 | 提示词独立于框架代码 |
| 适用场景 | 固定的、可复用的原子操作 | 需要灵活判断的复杂工作流 |

**结论：** Listing 生成是一个需要多步判断的复杂工作流（页面结构不同、竞品数据不完整需要容错），Skill 是更合适的选择。

---

## 3. 文件结构

```
src/copaw/agents/skills/listing_generator/
├── SKILL.md                          # 主指令文件（提示词）
├── scripts/
│   └── save_listing.py               # Listing 保存脚本
└── references/
    ├── amazon_scraping_guide.md      # Amazon 页面结构解析指南
    └── listing_quality_rules.md      # Listing 内容质量规范
```

---

## 4. SKILL.md 设计

### 4.1 Frontmatter

```yaml
---
name: listing_generator
description: >-
  当用户需要分析竞品、生成商品 Listing、优化 Listing 内容、
  分析 Amazon/eBay 等电商产品时使用此 Skill。
  支持通过 ASIN 或关键词爬取竞品数据，生成优化的标题、五点描述、
  产品描述和搜索关键词，并自动保存到 Listing Management 系统。
metadata:
  {
    "builtin_skill_version": "1.0",
    "copaw":
      {
        "emoji": "🛒",
        "requires": {}
      }
  }
---
```

### 4.2 核心指令结构

SKILL.md 正文需要包含以下章节：

1. **触发条件** — 何时使用此 Skill
2. **参数解析** — 从用户输入中提取 ASIN、关键词、平台、站点
3. **数据爬取** — 使用 `browser_use` 的详细步骤
4. **内容生成** — 竞品分析 + 差异化 Listing 生成规则
5. **数据保存** — 调用 `save_listing.py` 脚本或直接通过 API 保存
6. **输出格式** — 回复用户的内容模板

### 4.3 数据爬取流程

```markdown
## 数据爬取步骤

使用 `browser_use` 工具完成以下操作：

### Step 1: 打开竞品页面

根据平台和站点构建 URL：
- Amazon US: `https://www.amazon.com/dp/{ASIN}`
- Amazon DE: `https://www.amazon.de/dp/{ASIN}`
- Amazon JP: `https://www.amazon.co.jp/dp/{ASIN}`
- 关键词搜索: `https://www.amazon.{marketplace}/s?k={keyword}`

调用示例：
{"action": "open", "url": "https://www.amazon.com/dp/B0XXXXXXXXX"}

### Step 2: 提取页面信息

{"action": "snapshot"}

从 snapshot 中提取：
- 商品标题（title）
- 价格（price）
- 五点描述（bullet_points / feature-bullets）
- 产品描述（productDescription）
- A+ 页面内容（如有）
- 商品图片 URL
- 评论数量和评分
- 排名（Best Sellers Rank）

### Step 3: 提取评论关键词（可选）

如果需要更深度的竞品分析：
{"action": "open", "url": "https://www.amazon.com/product-reviews/B0XXXXXXXXX"}
{"action": "snapshot"}

提取高频关键词、用户痛点、好评要素。

### Step 4: 错误处理

- 如果页面被反爬拦截（CAPTCHA），告知用户并建议稍后重试
- 如果 ASIN 无效（404），提示用户检查 ASIN
- 如果数据不完整（缺少五点描述），用已有数据生成并标注
```

### 4.4 内容生成规则

```markdown
## Listing 内容生成规范

基于爬取的竞品数据，生成差异化的 Listing 内容：

### 标题（Title）
- 最大 200 字符
- 格式：[品牌] + [核心关键词] + [特性] + [适用场景] + [兼容性]
- 首字母大写（介词/冠词除外）
- 禁止使用促销用语（Best, #1, Free shipping 等）
- 与竞品标题对比，确保关键词覆盖但不重复

### 五点描述（Bullet Points）
- 5 条，每条不超过 500 字符
- 格式：[特性亮点（全大写）] + 详细说明
- 覆盖：核心功能、材质/质量、使用方式、适用场景、售后服务
- 每条开头使用 emoji 或方括号突出卖点

### 产品描述（Description）
- 2000 字符以内
- 第一段：产品概述和价值主张
- 中间：核心优势和差异化卖点
- 结尾：使用场景和购买信心保障
- 可使用 HTML 标签（<br>, <b>, <ul>, <li>）

### 搜索关键词（Search Terms）
- 最多 250 字节（Amazon 后台限制）
- 5-8 个关键词/短语
- 不与标题和五点描述重复
- 包含：同义词、拼写变体、场景词、竞品词
- 用空格分隔，不用逗号
```

### 4.5 数据保存方式

**推荐方式：直接写入 listings.json**

Agent 通过 `execute_shell_command` 运行 Python 脚本保存：

```bash
cd {this_skill_dir} && python scripts/save_listing.py \
  --title "生成的标题" \
  --asin "B0XXXXXXXXX" \
  --bullet-points "特性1|特性2|特性3|特性4|特性5" \
  --description "生成的描述" \
  --search-terms "词1,词2,词3,词4,词5" \
  --price "29.99" \
  --image-url "https://..." \
  --platform "amazon" \
  --marketplace "us"
```

**备选方式：通过 HTTP API 调用**

如果后端正在运行，也可以用 `curl` 调用 API：

```bash
curl -s -X POST http://localhost:8088/api/listings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "生成的标题",
    "asin": "B0XXXXXXXXX",
    "bullet_points": ["特性1", "特性2"],
    "description": "生成的描述",
    "search_terms": ["词1", "词2"],
    "platform": "amazon",
    "marketplace": "us"
  }'
```

> **建议优先使用脚本方式**，不依赖后端进程是否运行，且可以原子写入。

---

## 5. save_listing.py 脚本设计

```python
#!/usr/bin/env python3
"""Save a listing to listings.json with atomic write."""
import argparse
import json
import shutil
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path


def find_listings_file() -> Path:
    """Locate listings.json in WORKING_DIR."""
    working_dir = Path.home() / ".copaw"
    # Also check COPAW_WORKING_DIR env var
    import os
    env_dir = os.environ.get("COPAW_WORKING_DIR")
    if env_dir:
        working_dir = Path(env_dir).expanduser()
    return working_dir / "listings.json"


def load_data(path: Path) -> dict:
    """Load existing listings data or return empty structure."""
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"version": 1, "listings": []}


def save_data(path: Path, data: dict) -> None:
    """Atomic write to listings.json."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    shutil.move(str(tmp), str(path))


def main():
    parser = argparse.ArgumentParser(description="Save a listing")
    parser.add_argument("--title", required=True)
    parser.add_argument("--asin", default="")
    parser.add_argument("--bullet-points", default="",
                        help="Pipe-separated bullet points")
    parser.add_argument("--description", default="")
    parser.add_argument("--search-terms", default="",
                        help="Comma-separated search terms")
    parser.add_argument("--price", default="")
    parser.add_argument("--image-url", default="")
    parser.add_argument("--platform", default="amazon")
    parser.add_argument("--marketplace", default="")
    args = parser.parse_args()

    now = datetime.now(timezone.utc).isoformat()
    listing = {
        "id": uuid.uuid4().hex,
        "asin": args.asin,
        "title": args.title,
        "bullet_points": args.bullet_points.split("|")
                               if args.bullet_points else [],
        "description": args.description,
        "search_terms": args.search_terms.split(",")
                               if args.search_terms else [],
        "price": args.price,
        "image_url": args.image_url,
        "platform": args.platform,
        "marketplace": args.marketplace,
        "status": "generated",
        "source_url": "",
        "created_at": now,
        "updated_at": now,
    }

    path = find_listings_file()
    data = load_data(path)
    data["listings"].append(listing)
    save_data(path, data)

    print(json.dumps(listing, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

---

## 6. 完整 SKILL.md 模板

以下是需要创建的完整 `SKILL.md` 文件：

```markdown
---
name: listing_generator
description: >-
  当用户需要分析竞品、生成商品 Listing、优化 Listing 内容、
  分析 Amazon/eBay 等电商产品时使用此 Skill。
  支持通过 ASIN 或关键词爬取竞品数据，生成优化的标题、五点描述、
  产品描述和搜索关键词，并自动保存到 Listing Management 系统。
metadata:
  {
    "builtin_skill_version": "1.0",
    "copaw":
      {
        "emoji": "🛒",
        "requires": {}
      }
  }
---

# Listing 生成器

当用户要求分析竞品、生成 Listing、优化产品内容时，按以下步骤操作。

## 前置条件

- 所有 `scripts/` 路径相对于本 Skill 目录。
- 运行脚本：`cd {this_skill_dir} && python scripts/save_listing.py ...`

## 参数解析

从用户输入中提取以下参数，缺失时主动询问：

| 参数 | 说明 | 示例 |
|------|------|------|
| `asin` | Amazon 商品唯一标识 | `B0XXXXXXXXX` |
| `keyword` | 搜索关键词（ASIN 缺失时使用） | `wireless earbuds` |
| `platform` | 平台，默认 `amazon` | `amazon`, `ebay`, `shopify` |
| `marketplace` | 站点，默认 `us` | `us`, `de`, `jp`, `uk` |

## 执行步骤

### 第一步：爬取竞品数据

1. **构建 URL：**
   - 有 ASIN：`https://www.amazon.{marketplace}/dp/{asin}`
   - 有关键词：`https://www.amazon.{marketplace}/s?k={keyword}`
   - 注意：日本站域名是 `amazon.co.jp`

2. **打开页面：**
   ```
   browser_use: {"action": "open", "url": "..."}
   ```

3. **获取页面快照：**
   ```
   browser_use: {"action": "snapshot"}
   ```

4. **从快照中提取：**
   - 商品标题
   - 价格
   - 五点描述（Bullet Points / Feature Bullets）
   - 产品描述
   - 商品图片 URL
   - 评分和评论数
   - 品类排名（如有）

5. **容错：**
   - 如果遇到 CAPTCHA 验证页面，告知用户并建议稍后重试
   - 如果 ASIN 无效（页面 404 或无商品信息），提示用户检查
   - 如果五点描述缺失，根据标题和描述自行补充，并在结果中标注

### 第二步：分析并生成 Listing

基于爬取的竞品数据，遵循 `references/listing_quality_rules.md` 中的质量规范，生成差异化的 Listing 内容：

1. **竞品分析：** 总结竞品的卖点、关键词策略、内容结构
2. **差异化定位：** 找出竞品的不足和可优化空间
3. **内容生成：**
   - **标题：** 200 字符以内，关键词前置，差异化开头
   - **五点描述：** 5 条，每条以 [特性亮点] 开头
   - **产品描述：** 2000 字符以内的段落式描述
   - **搜索关键词：** 5-8 个不与标题/五点重复的词组

### 第三步：保存 Listing

使用脚本保存到 listings.json：

```bash
cd {this_skill_dir} && python scripts/save_listing.py \
  --title "生成的标题" \
  --asin "B0XXXXXXXXX" \
  --bullet-points "特性1|特性2|特性3|特性4|特性5" \
  --description "生成的描述" \
  --search-terms "词1,词2,词3,词4,词5" \
  --platform "amazon" \
  --marketplace "us"
```

注意：
- `--bullet-points` 使用 `|` 分隔
- `--search-terms` 使用 `,` 分隔
- 运行成功后脚本会返回完整的 Listing JSON（含生成的 ID）

### 第四步：回复用户

回复格式：

```
✅ Listing 生成完成！

**来源竞品：** {asin 或关键词}
**平台/站点：** {platform} / {marketplace}

**生成的 Listing（ID: {listing_id}）：**

📌 **标题：** {title}

🔹 **五点描述：**
1. {bullet_1}
2. {bullet_2}
3. {bullet_3}
4. {bullet_4}
5. {bullet_5}

📝 **描述：** {description 前 100 字}...

🔍 **搜索关键词：** {search_terms}

---
💡 你可以在 Listing Management 页面查看和编辑此 Listing。
```

## 高级用法

### 批量生成
如果用户提供了多个 ASIN（逗号或换行分隔），逐个处理并在最后汇总。

### 基于现有 Listing 优化
如果用户说"优化我的 Listing {id}"：
1. 使用 `read_file` 读取 `~/.copaw/listings.json`
2. 找到对应 ID 的 Listing
3. 用相同流程爬取竞品后，对比优化
4. 更新后保存

### 关键词研究模式
如果用户说"研究 {关键词} 的市场"：
1. 用关键词搜索 Amazon
2. 收集前 10 个结果的标题和价格
3. 分析共同关键词、价格区间、评分分布
4. 生成竞品分析报告（不生成 Listing，仅分析）
```

---

## 7. references/listing_quality_rules.md

```markdown
# Listing 内容质量规范

## 标题（Title）

### 规则
- 最大 200 字符（Amazon 硬限制）
- 品牌名放在最前面
- 核心关键词紧随品牌名
- 特性和卖点在中间
- 适用场景和兼容性在末尾
- 每个单词首字母大写（a, an, the, and, or, but, for, in, on, at, to 除外）
- 禁止使用：促销用语（Best, #1, Free, 100%）、特殊符号（!@#$）、重复关键词

### 模板
```
[Brand] [Core Keyword] [Key Feature 1], [Key Feature 2], [Use Case], [Compatibility]
```

### 示例
```
SoundPeak Pro Wireless Earbuds Bluetooth 5.3, Active Noise Cancelling,
40H Battery, IPX7 Waterproof, Sport Earphones for Running Gym
```

## 五点描述（Bullet Points）

### 规则
- 恰好 5 条
- 每条不超过 500 字符
- 第一行是全大写的特性摘要（类似标题）
- 后续行是详细说明
- 覆盖维度：核心功能、材质/质量、使用体验、适用场景、售后/保障
- 禁止 HTML 标签和特殊符号

### 模板
```
[KEY FEATURE IN ALL CAPS]: Detailed explanation of this feature,
including specific benefits, measurements, materials, or certifications
that differentiate from competitors.
```

### 示例
```
ADVANCED NOISE CANCELLING: Our proprietary ANC technology reduces
ambient noise by up to 95%, letting you focus on your music or calls.
Features 3 transparency modes for when you need to stay aware.
```

## 产品描述（Description）

### 规则
- 最大 2000 字符
- 第一段：产品概述 + 核心价值主张（3-4 句）
- 第二段：详细特性展开（可使用 <ul>/<li> 列表）
- 第三段：适用场景和目标用户
- 最后：品牌承诺和售后保障
- 语气：专业、可信、有说服力

### 示例
```
SoundPeak Pro Wireless Earbuds deliver premium sound quality with
cutting-edge noise cancellation technology. Designed for music lovers
and professionals who demand the best audio experience on the go.

<ul>
<li><b>Bluetooth 5.3</b> — Stable connection, lower latency</li>
<li><b>40H Battery</b> — 8H per charge + 32H from case</li>
<li><b>IPX7 Waterproof</b> — Rain, sweat, and splash proof</li>
</ul>

Whether you're running, commuting, or working from home,
SoundPeak Pro adapts to your lifestyle.
Backed by our 18-month warranty and 24/7 customer support.
```

## 搜索关键词（Search Terms）

### 规则
- 最多 250 字节（Amazon 后台限制）
- 5-8 个关键词/短语
- 不与标题和五点描述中已出现的词重复
- 用空格分隔（不是逗号）
- 包含：同义词、拼写变体、场景词、受众词

### 策略
| 类型 | 示例 |
|------|------|
| 同义词 | `wireless headphones`, `cordless earphones` |
| 拼写变体 | `earbuds`, `earbuds`, `ear buds` |
| 场景词 | `running earbuds`, `workout headphones` |
| 受众词 | `earbuds for women`, `gifts for teens` |
| 竞品词 | `airpods alternative`, `galaxy buds competitor` |
```

---

## 8. references/amazon_scraping_guide.md

```markdown
# Amazon 页面结构解析指南

> 本文档帮助 Agent 理解 Amazon 商品页面的 DOM 结构，
> 以便从 browser_use 的 snapshot 中正确提取数据。

## 商品页关键区域

### 1. 商品标题
- 位置：页面顶部，`#productTitle`
- 在 snapshot 中通常显示为最明显的长文本
- 包含完整的商品标题信息

### 2. 价格
- 位置：标题下方
- 可能包含多个价格：原价（划线）、现价、优惠券价
- 注意区分 "Price" 和 "Deal Price"

### 3. 五点描述（Bullet Points）
- 位置：商品信息区域中部
- 标识：以 "About this item" 或列表形式展示
- 每条以粗体或破折号开头
- 如果页面有 "See more" 链接，需要点击展开

### 4. 产品描述
- 位置：五点描述下方
- 可能是纯文本或 A+ 页面（富文本/图片）
- A+ 页面内容较难从 snapshot 提取，可简要描述

### 5. 商品图片
- 位置：页面左侧
- 主图 + 缩略图列表
- 图片 URL 格式通常包含 `images.amazon.com`

### 6. 评分和评论
- 位置：标题下方、五点描述之间
- 格式：`X.X out of 5 stars` + `X,XXX ratings`

### 7. 品类排名
- 位置：商品详情区域
- 格式：`#X in {Category}`

## 特殊页面处理

### CAPTCHA 验证页
- 标识：页面显示 "robot check"、"Enter the characters" 等
- 处理：告知用户页面被拦截，建议稍后重试

### 商品不可用
- 标识：页面显示 "Currently unavailable"、"Page not found"
- 处理：告知用户该 ASIN 对应的商品已下架

### 多变体商品
- 标识：页面有颜色/尺寸选择器
- 处理：提取默认变体的信息，并在结果中标注"此商品有多个变体"

### 搜索结果页（关键词模式）
- 标识：URL 包含 `/s?k=`
- 处理：提取前 3-5 个结果的标题、价格、评分，生成综合分析
- 需要逐个点击进入商品详情页获取完整信息
```

---

## 9. 集成后端 generate 端点（后续优化）

当前的 `POST /api/listings/generate` 是占位实现。在 Skill 稳定后，可以将 Skill 的逻辑迁移到后端，实现前后端统一：

### 9.1 架构变更

```
前端 GenerateModal
    ↓ SSE POST /api/listings/generate
后端 listings router
    ↓ 调用 Agent Runner 的 browser_use
Agent Runner
    ↓ 爬取 → 分析 → 生成
    ↓ 写入 listings.json
    ↑ SSE 事件回传
前端 GenerateModal
    ↓ 展示结果
```

### 9.2 实现要点

- 后端 generate 端点创建一个临时的 Agent 实例（或复用现有 Agent）
- 通过 Agent 的 `browser_use` 工具完成爬取
- 用 LLM 直接生成 Listing 内容（不经过 Agent 的回复流程）
- 通过 SSE 将进度事件推送给前端
- 生成完成后直接写入 listings.json

### 9.3 优先级

此为 **P2 优化项**。Skill 方式已经可以完全满足需求，后端集成主要是为了：
1. 前端 GenerateModal 弹窗可以复用（目前是占位）
2. 统一前后端调用路径
3. 更好的进度展示和错误处理

---

## 10. 开发步骤清单

### Phase 1：核心 Skill（预计 1-2 小时）

- [ ] 创建 `src/copaw/agents/skills/listing_generator/` 目录
- [ ] 编写 `SKILL.md`（主指令文件）
- [ ] 编写 `scripts/save_listing.py`（保存脚本）
- [ ] 编写 `references/listing_quality_rules.md`（质量规范）
- [ ] 编写 `references/amazon_scraping_guide.md`（页面解析指南）
- [ ] 测试：在聊天界面输入"帮我分析 B0XXXXXXXXX"
- [ ] 验证生成的 Listing 出现在前端 Listing Management 页面

### Phase 2：增强功能（预计 2-3 小时）

- [ ] 支持多平台（eBay、Shopify）爬取指引
- [ ] 批量 ASIN 生成
- [ ] 基于现有 Listing 的优化模式
- [ ] 关键词研究模式（仅分析不生成）
- [ ] 竞品对比报告生成

### Phase 3：后端集成（预计 3-4 小时）

- [ ] 重构 `POST /api/listings/generate` 端点
- [ ] 接入 Agent Runner 进行真实爬取和生成
- [ ] 前端 GenerateModal 接入真实 SSE 数据
- [ ] 错误处理和重试机制

---

## 11. 风险和限制

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Amazon 反爬机制 | 页面被 CAPTCHA 拦截 | Agent 检测到验证页时主动告知用户 |
| 页面结构变化 | 提取失败 | SKILL.md 中说明容错策略，LLM 可自适应 |
| 生成内容质量 | 需要人工审核 | 生成状态为 `generated`，需手动改为 `published` |
| 浏览器性能 | `browser_use` 消耗资源 | Agent 复用浏览器实例，不每次新建 |
| 多语言 Listing | 英文生成规则不适用其他语言 | 后续可扩展多语言质量规范 |
