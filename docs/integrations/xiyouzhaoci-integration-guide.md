# 西柚找词集成指南

本文档详细说明如何将西柚找词（XiYouZhaoCi）Amazon 关键词研究工具集成到 CoPaw 系统中。

## 📋 目录

- [系统概述](#系统概述)
- [架构设计](#架构设计)
- [集成步骤](#集成步骤)
- [代码实现](#代码实现)
- [测试验证](#测试验证)
- [故障排查](#故障排查)

---

## 系统概述

### 什么是西柚找词？

西柚找词是一个 Amazon 产品关键词研究工具，通过自动化浏览器爬取 Amazon 产品页面的关键词数据，包括：
- 搜索量和趋势
- 关键词排名
- 流量份额
- 竞争难度
- 点击率和转化率

### 集成目标

将西柚找词功能集成到 CoPaw 控制台，用户可以：
1. 在 CoPaw 前端界面触发关键词爬取
2. 查看和管理爬取的关键词数据
3. 将关键词数据与产品研究功能关联

---

## 架构设计

### 三层代理架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  前端层     │ ───▶ │  CoPaw后端  │ ───▶ │  爬虫API    │
│  (React)    │      │  (FastAPI)  │      │  (FastAPI)  │
│  5173端口   │      │  8088端口   │      │  8000端口   │
└─────────────┘      └─────────────┘      └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  Bun脚本    │
                                            │  (Playwright)│
                                            └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  PostgreSQL │
                                            │  keywords表 │
                                            └─────────────┘
```

---

## 集成步骤

### 步骤 1：数据库准备

在 Amazon Crawler 项目的 PostgreSQL 数据库中创建 keywords 表：

文件位置: amazon_crawler/scripts/init_db.sql

```sql
CREATE TABLE keywords (
    id                  SERIAL PRIMARY KEY,
    asin                VARCHAR(20) NOT NULL,
    keyword             VARCHAR(500) NOT NULL,
    rank                INTEGER,
    search_volume       VARCHAR(100),
    search_volume_trend VARCHAR(50),
    traffic_share       VARCHAR(50),
    difficulty          VARCHAR(50),
    ranking_position    VARCHAR(100),
    click_rate          VARCHAR(50),
    conversion_rate     VARCHAR(50),
    organic_rank        VARCHAR(100),
    sponsored_rank      VARCHAR(100),
    extra_data          JSON,
    scraped_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(asin, keyword)
);

CREATE INDEX idx_keywords_asin ON keywords(asin);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume);
```

### 步骤 2：爬虫 API 开发

在 Amazon Crawler 项目中添加关键词路由：

文件: amazon_crawler/api/routers/keywords.py

主要功能：
- POST /api/keywords/scrape - 触发爬虫任务
- GET /api/keywords/scrape/status - 查询任务状态
- GET /api/keywords/ - 关键词列表（分页、筛选）
- GET /api/keywords/stats - 统计信息
- DELETE /api/keywords/{asin} - 删除关键词

在 amazon_crawler/api/main.py 中注册路由：

```python
from api.routers import keywords

app.include_router(keywords.router, prefix="/api/keywords", tags=["keywords"])
```

### 步骤 3：CoPaw 后端代理

在 CoPaw 项目中创建西柚找词代理路由：

文件: src/copaw/app/routers/xiyouzhaoci.py

主要功能：
- 接收前端请求
- 代理转发到爬虫 API (localhost:8000)
- 处理错误和超时
- 返回统一响应格式

在 src/copaw/app/routers/__init__.py 中注册路由：

```python
from .xiyouzhaoci import router as xiyouzhaoci_router

router.include_router(xiyouzhaoci_router)
```

### 步骤 4：前端 API 模块

在 CoPaw 前端添加西柚找词 API 模块：

文件: console/src/api/modules/xiyouzhaoci.ts

提供的接口：
- listKeywords() - 获取关键词列表
- getKeywordStats() - 获取统计信息
- triggerScrape() - 触发爬虫任务
- getScrapeStatus() - 查询任务状态
- deleteKeywords() - 删除关键词

### 步骤 5：前端页面开发

创建西柚找词管理页面：

文件: console/src/pages/Ecommerce/XiYouZhaoCi/index.tsx

功能：
- ASIN 输入界面
- 触发爬虫按钮
- 关键词列表展示
- 任务状态轮询
- 数据筛选和排序

在 console/src/pages/Ecommerce/index.tsx 中添加路由：

```typescript
import XiYouZhaoCi from "./XiYouZhaoCi";

<Route path="/xiyouzhaoci" element={<XiYouZhaoCi />} />
```

---

## 测试验证

### 1. 启动所有服务

```bash
# 启动爬虫 API
cd /path/to/amazon_crawler
.venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# 启动 CoPaw 后端
cd /path/to/CoPaw
.venv/bin/copaw app

# 启动 CoPaw 前端
cd /path/to/CoPaw/console
bun run dev
```

### 2. 测试 API 接口

```bash
# 测试触发爬虫
curl -X POST http://localhost:8088/api/xiyouzhaoci/scrape \
  -H "Content-Type: application/json" \
  -d '{"asins": ["B0XXX"]}'

# 测试查询状态
curl http://localhost:8088/api/xiyouzhaoci/scrape/status

# 测试获取关键词列表
curl http://localhost:8088/api/xiyouzhaoci/keywords
```

---

## 故障排查

### 常见问题

#### 1. 爬虫 API 无法连接

检查爬虫 API 是否运行：
```bash
curl http://localhost:8000/health
```

#### 2. Bun 脚本找不到

检查环境变量：
```bash
echo $XIYOUZHAOCI_DIR
```

#### 3. 数据库连接失败

检查 PostgreSQL：
```bash
psql -h localhost -p 5433 -U amazon -d amazon_crawler
```

---

## 总结

本文档详细说明了西柚找词集成到 CoPaw 系统的完整流程，通过这种分层代理架构，我们可以：

✅ 保持各层独立部署和维护
✅ 统一前端调用接口
✅ 灵活替换底层实现
✅ 有效隔离错误影响

