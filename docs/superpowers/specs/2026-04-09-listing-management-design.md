# Listing Management Design Spec

## Context

CoPaw is a personal AI assistant with an E-commerce module (currently all mock data). This feature adds:
1. A **Listing Management** page with CRUD table for managing product listings
2. **AI-powered generation** that scrapes competitor pages and generates optimized Listing content
3. **CSV import/export** for bulk data operations

### User Stories

- As a seller, I want to manage all my product listings in one table with search/filter
- As a seller, I want to input an ASIN and have AI scrape the competitor page, then generate an optimized listing (title, bullet points, description, search terms)
- As a seller, I want to export listings to CSV for bulk editing or platform upload
- As a seller, I want to import listings from a CSV file

### Scope

- This is a single feature with one spec and one implementation plan
- Storage: global JSON file (`~/.copaw/listings.json`), shared across all agents
- AI generation: agent uses `browser_use` tool to scrape, then LLM generates content
- CSV: server-side (Python `csv` module), not client-side

---

## Architecture

### Data Flow

```
User Input (ASIN/Keywords)
    │
    ▼
┌─────────────────┐
│  Frontend Modal  │  User enters ASIN or product keywords
│  "AI Generate"   │
└────────┬────────┘
         │ POST /api/listings/generate
         ▼
┌─────────────────────────────────────┐
│  Backend Agent Runner                 │
│  1. Agent uses browser_use tool    │
│  2. Scrapes Amazon product page    │
│  3. Analyzes competitor data        │
│  4. Generates optimized listing    │
│  5. Returns listing data          │
└────────┬────────────────────────────┘
         │ Store to listings.json
         ▼
┌─────────────────┐
│  Frontend Table  │  Table refreshes with new listing
│  Listings CRUD   │
└─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 CSV Export  CSV Import
```

### Component Structure

```
console/src/pages/Ecommerce/ListingManagement/
├── index.tsx              # Page component with Table + toolbar
├── useListings.ts          # Hook: CRUD operations + state
├── components/
│   ├── columns.tsx       # Table column definitions
│   └── GenerateModal.tsx  # AI generation modal (input → progress → result)
└── index.module.less

src/copaw/app/
├── routers/listings.py     # FastAPI CRUD + generate endpoint
├── listings/
│   ├── models.py          # Pydantic models (Listing, ListingGenerateRequest)
│   └── repository.py     # JSON file read/write with atomic write
└── listings_data.json      # Runtime data (auto-created, in .gitignore)
```

---

## Data Models

### Backend: Listing (Pydantic)

```python
class Listing(BaseModel):
    id: str                    # UUID
    asin: str = ""             # Source ASIN
    title: str = ""             # Product title (AI-generated or manual)
    bullet_points: list[str] = []  # 5 bullet points for description
    description: str = ""       # Product description
    search_terms: list[str] = [] # Backend search keywords
    price: str = ""            # Product price
    image_url: str = ""        # Main product image URL
    platform: str = "amazon"   # Target platform
    marketplace: str = ""       # Target marketplace (US, DE, JP, etc.)
    status: Literal["draft", "generated", "published", "archived"] = "draft"
    source_url: str = ""       # Competitor URL scraped
    created_at: str           # ISO datetime
    updated_at: str           # ISO datetime
```

### Backend: ListingGenerateRequest

```python
class ListingGenerateRequest(BaseModel):
    asin: Optional[str] = None         # Direct ASIN lookup
    keyword: Optional[str] = None      # Keyword search fallback
    platform: str = "amazon"
    marketplace: str = "us"
```

### Frontend: ListingInfo (TypeScript)

Mirrors backend model with status display fields added.

### Storage: listings.json

```json
{
  "listings": [
    {
      "id": "uuid",
      "asin": "B0XXXXXXXXX",
      "title": "...",
      "bullet_points": ["...", "..."],
      ...
    }
  ]
}
```

Location: `~/.copaw/listings.json`

---

## Backend API

### Router: `/api/listings`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | List all listings (supports `?search=`, `?status=`, `?platform=` query params) |
| GET | `/api/listings/{id}` | Get single listing |
| POST | `/api/listings` | Create listing (manual) |
| PUT | `/api/listings/{id}` | Update listing |
| DELETE | `/api/listings/{id}` | Delete listing |
| POST | `/api/listings/generate` | AI generate listing from competitor scrape |
| GET | `/api/listings/export` | Export filtered listings as CSV (streaming download) |
| POST | `/api/listings/import` | Import listings from CSV upload |

### Generate Endpoint Detail

```
POST /api/listings/generate
Request: { asin: "B0XXXXXXXXX", platform: "amazon", marketplace: "us" }
Response: Streaming SSE (text/event-stream)

Event flow:
1. event: "status"  data: "scraping"     # Browser scraping competitor
2. event: "status"  data: "generating"   # AI generating content
3. event: "result" data: { listing }    # Final listing data, auto-saved
4. event: "done"   data: ""              # Stream complete
```

### CSV Export

- Uses `StreamingResponse` with `media_type="text/csv"`
- Filename: `listings_{timestamp}.csv`
- Fields: id, asin, title, bullet_points (joined with `\n`), description, search_terms (joined with `,`), price, platform, marketplace, status, created_at
- Frontend triggers browser download via `window.open(url)`

### CSV Import

- Accepts `UploadFile` with `.csv` extension
- Required columns: `title` (at minimum)
- Optional columns: `asin`, `bullet_points`, `description`, `search_terms`, `price`, `platform`, `marketplace`
- Duplicates: skip by ASIN if already exists (configurable via query param `?skip_existing=true`)
- Returns: `{ imported: int, skipped: int, total: int }`

### AI Generation Implementation

The `/api/listings/generate` endpoint:

1. Gets the workspace's agent runner
2. Constructs a prompt: "Scrape this Amazon product page [URL], analyze the listing content, then generate an optimized listing with: title, 5 bullet points, description, backend search terms"
3. Streams the agent's response as SSE events
4. When complete, auto-saves the generated listing to `listings.json`

**Agent prompt template:**

```
You are an expert e-commerce Listing copywriter. Analyze the following competitor product page and generate an optimized product listing.

Requirements:
1. Title: SEO-optimized, max 200 characters, include main keyword in first 80 characters
2. Bullet Points: 5 key features/benefits, each max 500 characters, start with capital letter
3. Description: 2000 characters max, natural language, include primary keywords 2-3 times
4. Search Terms: 10-15 backend search terms, comma-separated

Competitor URL: {source_url}

Output valid JSON: { "title": "...", "bullet_points": ["...", "..."], "description": "...", "search_terms": ["...", "..."] }
```

---

## Frontend Components

### Page Layout (index.tsx)

```
┌──────────────────────────────────────────────────┐
│ [ + AI Generate ]  [ Import CSV ]  [ Export CSV ]     │
│ [ Search: _______________ ]  [ Status: ▼ All  ]      │
├──────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐  │
│ │ # │ ASIN      │ Title      │ Status    │ ... │  │
│ │ 1 │ B0XXX.. │ Optimized  │ Generated│     │  │
│ │ 2 │ B0XXX.. │ Draft     │ Draft    │     │  │
│ └──────────────────────────────────────────────┘  │
│                                         [< 1  2 >] │
└──────────────────────────────────────────────────┘
```

### Generate Modal (GenerateModal.tsx)

```
Step 1: Input                    Step 2: Progress              Step 3: Result Preview
┌──────────────┐              ┌──────────────┐          ┌──────────────────┐
│ Platform:    │              │ Status:     │          │ Title:        │
│ [Amazon ▼]   │              │ 🔄 Scraping  │          │ Bullet:       │
│ Marketplace:│              │ ⏳ Waiting  │          │ Description:  │
│ [US ▼]      │              │             │          │              │
│ ASIN/Keyword:│              │             │          │ [Save] [Close]│
│ [________] │              └──────────────┘          └──────────────────┘
│ [Generate ▼] │
└──────────────┘
```

### Table Columns (columns.tsx)

| Column | Width | Features |
|--------|-------|----------|
| Title | 300px | Ellipsis truncation |
| ASIN | 120px | Blue Tag |
| Platform | 100px | Tag |
| Status | 100px | Color-coded Tag (draft=gray, generated=blue, published=green, archived=default) |
| Price | 100px | `$` prefix |
| Actions | 150px | [Edit] [Copy] [Delete] |
| Created | 120px | Relative time |

### Row Selection & Batch Operations

- Checkbox selection for batch operations
- Selected actions: [Delete Selected] [Export Selected]

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/copaw/app/routers/listings.py` | FastAPI router with 8 endpoints |
| `src/copaw/app/listings/models.py` | Pydantic models |
| `src/copaw/app/listings/repository.py` | JSON file CRUD |
| `console/src/pages/Ecommerce/ListingManagement/index.tsx` | Page component |
| `console/src/pages/Ecommerce/ListingManagement/useListings.ts` | State + API hook |
| `console/src/pages/Ecommerce/ListingManagement/components/columns.tsx` | Table columns |
| `console/src/pages/Ecommerce/ListingManagement/components/GenerateModal.tsx` | AI generation modal |
| `console/src/pages/Ecommerce/ListingManagement/index.module.less` | Styles |
| `console/src/api/modules/listings.ts` | API client functions |
| `console/src/api/types/listing.ts` | TypeScript types |

### Modified Files

| File | Change |
|------|--------|
| `console/src/pages/Ecommerce/index.tsx` | Add ListingManagement route |
| `console/src/layouts/Sidebar.tsx` | Add sidebar menu item |
| `console/src/layouts/constants.ts` | Add key-to-path mapping + label |
| `.gitignore` | Add `listings_data.json` |
| `console/src/locales/en.json` | Add i18n keys |
| `console/src/locales/zh.json` | Add i18n keys |

### Router Registration

Add to `src/copaw/app/routers/__init__.py`:
```python
from .listings import router as listings_router
```

Register in FastAPI app (via agent-scoped router at `agent_scoped.py`):
```python
app.include_router(listings_router, prefix="/api")
```

---

## Verification

1. Create a listing manually via POST `/api/listings` → verify appears in table
2. Edit listing title/bullets → verify update persists
3. Delete a listing → verify removal
4. Export to CSV → verify download with correct headers
5. Import from CSV with 5 rows → verify all imported
6. Import duplicate ASINs → verify skip behavior
7. Click "AI Generate" with a valid ASIN → verify scraping + generation flow
8. Verify AI-generated listing is auto-saved to table
9. Search/filter listings → verify query params work
10. Verify AI generation works with keyword fallback (not just ASIN)
