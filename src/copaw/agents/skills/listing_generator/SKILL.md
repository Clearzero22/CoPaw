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
- 详细质量规范见 `references/listing_quality_rules.md`。
- 页面解析指南见 `references/amazon_scraping_guide.md`。

## 参数解析

从用户输入中提取以下参数，缺失时**主动询问用户**：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `asin` | Amazon 商品唯一标识 | 无 |
| `keyword` | 搜索关键词（ASIN 缺失时使用） | 无 |
| `platform` | 平台 | `amazon` |
| `marketplace` | 站点 | `us` |

ASIN 和 keyword 至少需要一个，如果用户都没有提供，询问用户提供其中一个。

## 执行步骤

### 第一步：爬取竞品数据

1. **构建 URL 并打开页面：**

   - 有 ASIN 时：
     - US: `https://www.amazon.com/dp/{asin}`
     - DE: `https://www.amazon.de/dp/{asin}`
     - JP: `https://www.amazon.co.jp/dp/{asin}`
     - UK: `https://www.amazon.co.uk/dp/{asin}`
     - 其他站点同理
   - 有关键词时：
     - `https://www.amazon.{marketplace}/s?k={keyword}`

   ```
   browser_use: {"action": "open", "url": "https://www.amazon.com/dp/B0XXXXXXXXX"}
   ```

2. **获取页面快照：**

   ```
   browser_use: {"action": "snapshot"}
   ```

3. **从快照中提取以下信息：**

   - 商品标题（Product Title）
   - 价格（Price — 注意区分原价和现价）
   - 五点描述（Bullet Points / About this item）
   - 产品描述（Product Description / A+ content）
   - 商品图片 URL
   - 评分和评论数
   - 品类排名（Best Sellers Rank）

4. **容错处理：**

   - 遇到 CAPTCHA 验证页（"robot check"、"Enter the characters"）→ 告知用户页面被拦截，建议稍后重试
   - ASIN 无效（404、"Currently unavailable"）→ 提示用户检查 ASIN
   - 五点描述缺失 → 根据标题和描述自行补充，在结果中标注"（部分内容由 AI 补充）"

### 第二步：分析竞品并生成差异化 Listing

基于爬取的数据，遵循 `references/listing_quality_rules.md` 中的规范：

1. **竞品分析**：总结竞品的核心卖点、关键词策略、内容结构
2. **差异化定位**：找出竞品不足和可优化空间
3. **生成内容**：

   - **标题（Title）**：200 字符以内，品牌名 + 核心关键词 + 特性 + 场景 + 兼容性
   - **五点描述（Bullet Points）**：恰好 5 条，每条以 [全大写特性亮点] 开头，每条不超过 500 字符
   - **产品描述（Description）**：2000 字符以内，概述 → 特性展开 → 场景 → 保障
   - **搜索关键词（Search Terms）**：5-8 个不与标题/五点重复的词组

### 第三步：保存 Listing

使用 `save_listing.py` 脚本保存到 listings.json：

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

**参数说明：**
- `--title`（必填）：生成的标题
- `--asin`：竞品 ASIN
- `--bullet-points`：用 `|` 分隔五点描述
- `--description`：产品描述
- `--search-terms`：用 `,` 分隔搜索关键词
- `--price`：价格
- `--image-url`：主图 URL
- `--platform`：平台，默认 `amazon`
- `--marketplace`：站点，默认 `us`

脚本成功后会输出完整的 Listing JSON（含自动生成的 ID）。

### 第四步：回复用户

按以下格式回复：

```
✅ Listing 生成完成！

**来源竞品：** {asin 或 keyword}
**平台/站点：** {platform} / {marketplace}

**生成的 Listing（ID: {listing_id}）：**

📌 **标题：** {title}

🔹 **五点描述：**
1. {bullet_1}
2. {bullet_2}
3. {bullet_3}
4. {bullet_4}
5. {bullet_5}

📝 **描述：** {description 前 150 字}...

🔍 **搜索关键词：** {search_terms}

---
💡 你可以在 Listing Management 页面查看和编辑此 Listing。
```

## 高级用法

### 关键词研究模式

如果用户说"研究 {关键词} 的市场"或"分析 {关键词} 的竞品"（没有要求生成 Listing）：

1. 用关键词搜索 Amazon
2. 收集前 5 个结果的标题、价格、评分
3. 分析共同关键词、价格区间、评分分布
4. **只输出竞品分析报告，不生成 Listing，不调用 save_listing.py**

### 基于现有 Listing 优化

如果用户说"优化我的 Listing {id}"或"改进 Listing {id}"：

1. 使用 `read_file` 读取 `~/.copaw/listings.json`
2. 找到对应 ID 的 Listing 数据
3. 用该 Listing 的 ASIN 重新爬取竞品
4. 对比现有内容和竞品，生成优化版本
5. 用 `execute_shell_command` 调用 save_listing.py 保存（会创建新记录，告知用户新 ID）
6. 回复中标注相比原版的改进点

### 批量分析

如果用户提供了多个 ASIN（逗号、顿号或换行分隔）：

1. 逐个处理每个 ASIN
2. 每个完成后调用 save_listing.py 保存
3. 最后汇总：生成数量、各 Listing ID 一览

## 注意事项

- 如果 browser_use 不可用（工具未启用），告知用户需要在 Agent 配置中启用浏览器工具
- 如果爬取到的数据极度不完整（连标题都没有），不要强行生成，告知用户该商品页面可能结构特殊或被限制
- 生成的内容要体现差异化，不能只是简单改写竞品内容
