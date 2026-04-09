# XiYouZhaoCi Integration Design

## Overview

Integrate the xi_you_zhao_ci (西柚找词) Amazon keyword research scraper into CoPaw console. Users can view scraped keyword data and trigger new scraping tasks directly from a new sidebar page.

## Architecture

```
CoPaw Frontend (5173)
  ├── Crawler Data (existing)
  └── 西柚找词 (new) ──── ASIN flow ──→ Crawler Data
         │
CoPaw Backend (8088)
  ├── /api/crawler/*  → Crawler API (8000) [existing proxy]
  └── /api/xiyouzhaoci/* → Crawler API (8000) [new proxy]
                                │
                        subprocess (bun run)
                         xi_you_zhao_ci/index.ts
                                │
                        PostgreSQL (:5433)
                         amazon_crawler DB
                          ├── products (existing)
                          ├── scraping_jobs (existing)
                          ├── notifications (existing)
                          └── keywords (NEW)
```

All database access goes through the Crawler API (port 8000). CoPaw remains a pure HTTP proxy layer, consistent with the existing crawler.py pattern.

## Database: New `keywords` Table

Added to the `amazon_crawler` PostgreSQL database:

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

Note: xiyouzhaoci data uses string formats (e.g. "340,592 -13.26%"), so volume/trend fields are VARCHAR. No foreign key to products.asin because keywords may be scraped for ASINs not yet in the products table.

## Crawler API: New Endpoints

Added to `amazon_crawler` project (`/api/keywords/*`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/keywords/` | List keywords (pagination, filter by ASIN, search by keyword text) |
| `GET` | `/api/keywords/stats` | Stats overview (total keywords, covered ASINs, avg search volume) |
| `DELETE` | `/api/keywords/{asin}` | Delete all keywords for an ASIN |
| `POST` | `/api/keywords/scrape` | Trigger scraping (accepts ASIN list, launches subprocess) |
| `GET` | `/api/keywords/scrape/status` | Query scrape task status |

### Scrape Flow

1. CoPaw sends `POST /api/keywords/scrape` with `{ asins: ["B0XXX", ...] }`
2. Crawler API receives request, spawns subprocess: `bun run index.ts` in xi_you_zhao_ci directory
3. The scraper runs Playwright automation, extracts keyword data
4. Scraper writes results to PostgreSQL (via new DB write logic in the scraper or a post-processing step)
5. Frontend polls `/api/keywords/scrape/status` for progress

### Subprocess Management

- Scrape tasks run as background subprocesses with unique task IDs
- Status tracked in memory (or a lightweight JSON file): `{ task_id, asins, status, progress, started_at, completed_at, error }`
- Timeout: 10 minutes per ASIN group
- Concurrent scrape limit: 1 (Playwright is resource-heavy)

## CoPaw Backend: New Proxy Router

New file: `src/copaw/app/routers/xiyouzhaoci.py`

Proxy mapping:

| CoPaw Endpoint | Forwards To |
|---------------|-------------|
| `GET /api/xiyouzhaoci/keywords` | `:8000/api/keywords/` |
| `GET /api/xiyouzhaoci/keywords/stats` | `:8000/api/keywords/stats` |
| `DELETE /api/xiyouzhaoci/keywords/{asin}` | `:8000/api/keywords/{asin}` |
| `POST /api/xiyouzhaoci/scrape` | `:8000/api/keywords/scrape` |
| `GET /api/xiyouzhaoci/scrape/status` | `:8000/api/keywords/scrape/status` |

Follows the same `_proxy()` pattern as `crawler.py` with input validation.

## Frontend: New Sidebar Page

### Navigation

- New menu item under Ecommerce group: "西柚找词" (icon: `Search`)
- Route: `/ecommerce/xiyouzhaoci`

### Page Layout: 3 Tabs

#### Tab 1: 关键词数据 (Keywords Data)

Table columns:
- ASIN (link to Amazon)
- 关键词 (Keyword)
- 排名 (Rank)
- 搜索量 (Search Volume) — with trend indicator
- 流量占比 (Traffic Share)
- 难度 (Difficulty) — color-coded tag
- 排名位置 (Ranking Position)
- 点击率 (Click Rate)
- 转化率 (Conversion Rate)
- 爬取时间 (Scraped At)

Filters:
- ASIN filter (text input)
- Keyword search (text input with debounce)
- Difficulty range filter

Actions:
- View detail (drawer with full keyword data)
- Delete (by ASIN)
- Export CSV

#### Tab 2: 触发爬取 (Trigger Scrape)

Two ASIN input methods:
1. **Manual input**: Textarea for ASINs (comma/newline separated)
2. **From Crawler Data**: Modal with searchable product table, multi-select ASINs

Scrape configuration:
- Concurrency (default: 3, matches xi_you_zhao_ci default)

Scrape status display:
- Current task status (pending/running/completed/failed)
- Progress indicator
- Error messages if any

#### Tab 3: 统计概览 (Stats Overview)

Cards:
- Total keywords scraped
- Unique ASINs covered
- Average search volume
- Last scrape time

Charts (if chart library available):
- Search volume TOP 10 keywords
- Difficulty distribution

### Files to Create/Modify

**New files:**
- `console/src/pages/Ecommerce/XiYouZhaoCi/index.tsx`
- `console/src/pages/Ecommerce/XiYouZhaoCi/index.module.less`
- `console/src/pages/Ecommerce/XiYouZhaoCi/useKeywords.ts`
- `console/src/pages/Ecommerce/XiYouZhaoCi/useScrape.ts`
- `console/src/pages/Ecommerce/XiYouZhaoCi/components/KeywordColumns.tsx`
- `console/src/pages/Ecommerce/XiYouZhaoCi/components/KeywordDrawer.tsx`
- `console/src/pages/Ecommerce/XiYouZhaoCi/components/StatsCards.tsx`
- `console/src/pages/Ecommerce/XiYouZhaoCi/components/AsinPicker.tsx`
- `console/src/api/types/xiyouzhaoci.ts`
- `console/src/api/modules/xiyouzhaoci.ts`
- `src/copaw/app/routers/xiyouzhaoci.py`

**Modified files:**
- `console/src/api/index.ts` — register xiyouzhaoci API module
- `console/src/api/types/index.ts` — export xiyouzhaoci types
- `console/src/layouts/Sidebar.tsx` — add menu item
- `console/src/layouts/constants.ts` — add route mapping
- `console/src/pages/Ecommerce/index.tsx` — add route
- `console/src/locales/en.json` — i18n keys
- `console/src/locales/zh.json` — i18n keys
- `src/copaw/app/routers/__init__.py` — register router

**External project (amazon_crawler):**
- `api/models.py` — add Keywords model
- `api/routes/keywords.py` — new router with endpoints
- `api/routes/__init__.py` — register keywords router
- Modify scraper to write results to PostgreSQL

**External project (xi_you_zhao_ci):**
- Modify `index.ts` to write results to PostgreSQL instead of CSV (or add a separate script)

## Error Handling

- Crawler API unavailable → 502
- Scraper subprocess timeout → 504
- Invalid ASIN format → 400
- Scraper login expired → return specific error code so frontend can prompt user to re-login

## User Flows

### Scenario 1: Scrape a New Product

```
Open CoPaw → Sidebar "西柚找词" → Tab "触发爬取"
  │
  ├─ Manual: type ASIN "B0CQXMXJC5"
  │  or
  └─ Click "从 Crawler Data 选择" → Modal → search products → select ASINs
  │
  ▼
Click "开始爬取"
  │
  ▼
Frontend shows progress: 正在爬取 B0CQXMXJC5...
  │
  │  (Backend data flow)
  │  Frontend → POST /api/xiyouzhaoci/scrape
  │    → CoPaw proxy → POST :8000/api/keywords/scrape
  │      → Crawler API receives request
  │        → subprocess: bun run index.ts in xi_you_zhao_ci directory
  │          → Playwright opens browser → visits xiyouzhaoci.com
  │            → types ASIN → queries → waits for results
  │              → clicks "select all" → extracts table data
  │                → writes to PostgreSQL keywords table
  │                  → subprocess ends, returns success
  │
  ▼
Frontend polls /api/xiyouzhaoci/scrape/status → "completed"
  │
  ▼
Auto-switch to "关键词数据" Tab → shows all keywords for that ASIN
```

### Scenario 2: View Scraped Data

```
Open "西柚找词" → default "关键词数据" Tab
  │
  ▼
Table shows all scraped keywords (from PostgreSQL)
  │
  ├─ Search box: type "headphones" → real-time filter
  ├─ ASIN filter: type "B0CQ" → show only that ASIN
  │
  ▼
Click "查看详情" on a row → drawer shows full keyword data
  │
  ▼
Click "导出 CSV" → download filtered results
```

### Scenario 3: Cross-page ASIN Selection

```
User is on "Crawler Data" page → sees 71 products
  │
  ▼
Wants to check Amazon keywords for some products
  │
  ▼
Navigate to "西柚找词" → "触发爬取" Tab
  │
  ▼
Click "从 Crawler Data 选择"
  │
  ▼
Modal shows Crawler Data product list → search/filter → multi-select ASINs
  │
  ▼
Confirm → ASINs auto-filled → start scraping
```

## System Data Flows

### Write Flow (Scrape Trigger)

```
┌──────────┐    POST {asins}     ┌──────────────┐    POST {asins}    ┌──────────────┐
│  Frontend │ ──────────────────→ │  CoPaw       │ ────────────────→ │  Crawler API │
│  Browser  │                     │  Backend     │                    │  :8000        │
└──────────┘                     │  :8088       │                    └──────┬───────┘
                                 └──────────────┘                           │
                                                                        subprocess
                                                                        bun run index.ts
                                                                        xi_you_zhao_ci
                                                                        (Playwright)
                                                                              │
                                                                        scrape done
                                                                              │
                                                                              ▼
                                                                     ┌────────────────┐
                                                                     │  PostgreSQL     │
                                                                     │  keywords table │
                                                                     │  INSERT rows     │
                                                                     └────────────────┘
```

### Read Flow (Data Display)

```
┌──────────┐   GET /keywords?asin=xxx   ┌──────────────┐   GET /keywords/?asin=xxx  ┌──────────────┐
│  Frontend │ ────────────────────────→ │  CoPaw       │ ─────────────────────────→ │  Crawler API │
│  Browser  │                           │  Backend     │                            │  :8000        │
└──────────┘                           │  :8088       │                            └──────┬───────┘
      ↑                                 └──────────────┘                                   │
      │                                                                                 │
      │                              ┌────────────────┐                                  │
      └──────────────────────────────│  PostgreSQL     │ ← SELECT FROM keywords ←──────┘
                                     │  :5433          │
                                     └────────────────┘
```

### Status Polling Flow (Scrape Progress)

```
┌──────────┐   GET /scrape/status   ┌──────────────┐   GET /scrape/status   ┌──────────────┐
│  Frontend │ ─────────────────────→ │  CoPaw       │ ────────────────────→ │  Crawler API │
│  (3s poll)│                        │  Backend     │                       │  :8000        │
└──────────┘                         │  :8088       │                       └──────┬───────┘
      ↑                               └──────────────┘                              │
      │                                                                            │
      │                                         subprocess status                  │
      └────────── { task_id, status, progress } ──────────────────────────────────┘
```

### ASIN Selection Flow (from Crawler Data)

```
┌──────────┐  GET /crawler/products  ┌──────────────┐  GET /products/    ┌──────────────┐
│  Frontend │ ─────────────────────→ │  CoPaw       │ ─────────────────→ │  Crawler API │
│  (Modal)  │                        │  Backend     │                   │  :8000        │
└──────────┘                         │  :8088       │                   └──────┬───────┘
      ↑                               └──────────────┘                          │
      │                                                                         │
      │                                          PostgreSQL                     │
      └────────── product list [{asin, title...}] ────────────────────────────┘
```

## i18n

~50 new keys under `ecommerce.xiyouzhaoci.*` in both en.json and zh.json.
