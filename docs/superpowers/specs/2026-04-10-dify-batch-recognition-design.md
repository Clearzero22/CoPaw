# Dify Batch Image Recognition — Design Spec

> **Date:** 2026-04-10
> **Scope:** CoPaw 前端批量识别 Tab 完善 + Amazon Crawler API 新增 Dify 识别历史持久化

---

## 1. Context

CoPaw 集成了 Dify 工作流系统，支持通过 API 调用 Dify Workflow 进行图片识别。现有"批量识别"Tab 已实现前端批量处理能力（并发调用 Dify API），但识别结果仅保存在前端内存中，刷新页面即丢失。

Amazon Crawler 系统（独立 FastAPI + PostgreSQL，端口 8000）提供了现有的数据库基础设施。用户需要一个持久化方案，将每次批量识别的结果保存到数据库，支持历史记录回溯。

**核心诉求：** 用户每次批量识别的结果自动保存到数据库，再次访问页面时可查看所有历史批次和识别结果，无需重新运行。

---

## 2. User Flow

### 2.1 首次使用

```
1. 打开 /integration/dify
2. 点击"Configure"，填入 Dify Base URL + API Key
3. 切换到"批量识别"Tab
4. 系统自动检测到工作流图片输入变量（如 wood_image）
5. 添加图片（拖拽上传本地文件 / 粘贴远程 URL）
6. 选择并发数，点击"开始识别"
7. 实时查看进度和每张图片的识别结果
8. 识别完成后，结果自动保存到数据库
```

### 2.2 查看历史记录

```
1. 打开"批量识别"Tab
2. 页面从后端加载历史批次列表（时间倒序）
3. 点击某个批次 → 展开该批次所有图片的识别结果
4. 可继续新增批次识别
```

### 2.3 典型场景

亚马逊卖家每天早上花 15 分钟处理竞品图片：从 SellerSprite 复制 20 个竞品主图 URL，粘贴到输入框，点击识别，结果自动保存，第二天回溯查看。

---

## 3. Architecture

```
CoPaw 前端 (:5173)
    │
    ├─► Dify API (直接调用)
    │     POST /v1/files/upload
    │     POST /v1/workflows/run
    │
    └─► CoPaw 后端 (:8088)
          │
          └─► Amazon Crawler API (:8000)
                │
                └─► PostgreSQL (:5433)
                      amazon_crawler 数据库
                      + dify_recognition_results 表
```

**Dify API 调用：** 前端直连 Dify（现有模式不变，无需 CoPaw 后端中转二进制数据）。

**结果持久化：** 通过 CoPaw 后端代理层 → Crawler API → PostgreSQL 保存。

**为什么结果通过后端保存而非前端直连数据库：**
- 复用现有代理层架构（CoPaw → Crawler API）
- 统一数据访问模式，前端不暴露数据库连接信息
- Crawler API 已有完整的 SQLAlchemy + PostgreSQL 基础设施

---

## 4. Database Schema

### 4.1 New Table: `dify_recognition_results`

在 `amazon_crawler` 数据库中新增一张表：

```sql
CREATE TABLE dify_recognition_results (
    id            SERIAL PRIMARY KEY,
    batch_id      VARCHAR(50)  NOT NULL,
    source        VARCHAR(10)  NOT NULL,       -- 'file' | 'url'
    source_detail VARCHAR(500) NOT NULL,       -- URL 或文件名
    status        VARCHAR(20)  NOT NULL,       -- 'succeeded' | 'failed'
    result        TEXT DEFAULT '',              -- 工作流 outputs（JSON 字符串）
    error         TEXT DEFAULT '',              -- 失败原因
    elapsed       FLOAT DEFAULT 0,              -- 耗时（秒）
    variable_name VARCHAR(100) DEFAULT '',     -- Dify 工作流图片变量名
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dify_batch_id ON dify_recognition_results(batch_id);
CREATE INDEX idx_dify_created_at ON dify_recognition_results(created_at);
```

### 4.2 Indexes

| Index | Column | Purpose |
|-------|--------|---------|
| `idx_dify_batch_id` | `batch_id` | 按批次查询所有结果 |
| `idx_dify_created_at` | `created_at` | 时间排序 |

### 4.3 为什么不用独立数据库

复用 `amazon_crawler` 现有 PostgreSQL 实例（端口 5433），避免引入新的数据库服务。数据逻辑上属于卖家工具链的一部分，和 `products`、`keywords` 等表同属一个业务域。

---

## 5. Backend Changes (Amazon Crawler Project)

### 5.1 New ORM Model: `api/models.py`

新增 `DifyRecognitionResult` 模型：

```python
class DifyRecognitionResult(Base):
    __tablename__ = "dify_recognition_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), nullable=False, index=True)
    source = Column(String(10), nullable=False)           # 'file' | 'url'
    source_detail = Column(String(500), nullable=False)    # URL 或文件名
    status = Column(String(20), nullable=False)             # 'succeeded' | 'failed'
    result = Column(Text, default='')                       # 工作流 outputs
    error = Column(Text, default='')                        # 失败原因
    elapsed = Column(Float, default=0)                       # 耗时
    variable_name = Column(String(100), default='')          # 图片变量名
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "batch_id": self.batch_id,
            "source": self.source,
            "source_detail": self.source_detail,
            "status": self.status,
            "result": self.result,
            "error": self.error,
            "elapsed": self.elapsed,
            "variable_name": self.variable_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
```

### 5.2 New Schemas: `api/schemas.py`

```python
class DifyRecognitionItem(BaseModel):
    """Single recognition result from frontend."""
    source: str                           # 'file' | 'url'
    source_detail: str                    # URL 或文件名
    status: str                           # 'succeeded' | 'failed'
    result: str = ""                      # 工作流 outputs
    error: str = ""                      # 失败原因
    elapsed: float = 0.0                   # 耗时

class DifyBatchSaveRequest(BaseModel):
    """Frontend sends a batch of recognition results."""
    batch_id: str
    variable_name: str = ""
    items: List[DifyRecognitionItem]

class DifyRecognitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    batch_id: str
    source: str
    source_detail: str
    status: str
    result: str
    error: str
    elapsed: float
    variable_name: str
    created_at: Optional[str] = None

class DifyBatchListResponse(BaseModel):
    """List of distinct batches with summary."""
    batches: List[dict]
    total: int

class DifyBatchDetailResponse(BaseModel):
    """All results for a specific batch."""
    batch_id: str
    items: List[DifyRecognitionResponse]
    total: int
    succeeded: int
    failed: int
    created_at: Optional[str] = None
```

### 5.3 New Router: `api/routers/dify_history.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dify/history` | POST | 保存一个批次的多条识别结果 |
| `/api/dify/history/batches` | GET | 获取所有批次列表（分页，含每批次的成功/失败摘要） |
| `/api/dify/history/batches/{batch_id}` | GET | 获取某个批次的所有识别结果 |
| `/api/dify/history/batches/{batch_id}` | DELETE | 删除某个批次的所有记录 |

**POST /api/dify/history — 保存批次结果**

请求体：
```json
{
  "batch_id": "batch-1744301234",
  "variable_name": "wood_image",
  "items": [
    { "source": "url", "source_detail": "https://m.media-amazon.com/I/xxx.jpg", "status": "succeeded", "result": "{\"text\": \"实木餐桌\"}", "elapsed": 3.2 },
    { "source": "file", "source_detail": "product_01.jpg", "status": "failed", "error": "Upload failed", "elapsed": 1.1 }
  ]
}
```

**GET /api/dify/history/batches?limit=20&offset=0 — 批次列表**

返回（按 created_at 倒序）：
```json
{
  "batches": [
    {
      "batch_id": "batch-1744301234",
      "total": 2,
      "succeeded": 1,
      "failed": 1,
      "created_at": "2026-04-10T07:30:00",
      "variable_name": "wood_image"
    }
  ],
  "total": 5
}
```

实现方式：`SELECT batch_id, COUNT(*), SUM(CASE WHEN status='succeeded' THEN 1 ELSE 0 END), ... GROUP BY batch_id`

**GET /api/dify/history/batches/{batch_id} — 批次详情**

返回：
```json
{
  "batch_id": "batch-1744301234",
  "items": [
    { "id": 1, "batch_id": "batch-1744301234", "source": "url", "source_detail": "...", "status": "succeeded", "result": "...", "elapsed": 3.2, ... }
  ],
  "total": 2,
  "succeeded": 1,
  "failed": 1,
  "created_at": "2026-04-10T07:30:00"
}
```

**DELETE /api/dify/history/batches/{batch_id} — 删除批次**

```json
{ "message": "Deleted 2 records" }
```

### 5.4 Router Registration: `api/main.py`

```python
from .routers.dify_history import router as dify_history_router
app.include_router(dify_history_router, prefix="/api/dify", tags=["dify"])
```

`init_db()` 中 `Base.metadata.create_all(bind=engine)` 会自动创建新表。

---

## 6. Backend Changes (CoPaw Project)

### 6.1 New Proxy Endpoints: `src/copaw/app/routers/crawler.py`

在现有 crawler proxy router 中新增 3 个转发端点：

| CoPaw 端点 | 方法 | 转发目标 | 说明 |
|-----------|------|---------|------|
| `/api/crawler/dify/history` | POST | `POST :8000/api/dify/history` | 保存识别结果 |
| `/api/crawler/dify/history/batches` | GET | `GET :8000/api/dify/history/batches` | 批次列表 |
| `/api/crawler/dify/history/batches/{batch_id}` | GET | `GET :8000/api/dify/history/batches/{batch_id}` | 批次详情 |
| `/api/crawler/dify/history/batches/{batch_id}` | DELETE | `DELETE :8000/api/dify/history/batches/{batch_id}` | 删除批次 |

遵循现有代理模式：CoPaw 后端用 `httpx.AsyncClient` 转发请求到 `http://localhost:8000`，爬虫不可用时返回 `502`。

---

## 7. Frontend Changes (CoPaw Console)

### 7.1 BatchRecognitionSection 改造

**当前行为：** 结果仅存在 React state 中，刷新丢失。

**改造为：**

1. **每张图片识别完成后**（成功或失败），立即 POST 到 `/api/crawler/dify/history`
   - 生成 `batch_id = batch-{timestamp}`（同一批次共享）
   - 请求体包含单条识别结果

2. **使用"增量保存"而非"批量保存"：** 每张图片完成时独立调用 POST，而非等全部完成后一次性发送。这样即使中途停止或刷新页面，已完成的识别结果也已保存。

3. **页面加载时从后端获取历史批次列表**，显示在顶部

### 7.2 API 调用层

新增 `src/api/modules/integration.ts`（或直接在组件内 fetch），封装：

```typescript
// 保存单条识别结果
async function saveRecognitionResult(data: {
  batch_id: string;
  variable_name: string;
  source: string;
  source_detail: string;
  status: string;
  result?: string;
  error?: string;
  elapsed: number;
}): Promise<void>

// 获取批次列表
async function getBatchList(limit?: number, offset?: number): Promise<{
  batches: BatchSummary[];
  total: number;
}>

// 获取批次详情
async function getBatchDetail(batchId: string): Promise<BatchDetail>

// 删除批次
async function deleteBatch(batchId: string): Promise<void>
```

API 请求路径通过 `getApiUrl("/crawler/dify/history")` 获取，走 Vite proxy 到 CoPaw 后端。

### 7.3 历史记录 UI

在批量识别 Tab 顶部新增可折叠的历史记录区域：

```
┌──────────────────────────────────────────────┐
│ 📋 历史记录                                    │
├──────────────────────────────────────────────┤
│ ▼ 2026-04-10 15:30 — batch-1744301234       │
│   12张图片 · 11成功 · 1失败 · wood_image    │
│ ▼ 2026-04-10 14:22 — batch-1744298000       │
│    5张图片 · 5成功 · 0失败 · wood_image     │
│ ▼ 2026-04-10 10:15 — batch-1744275000       │
│    8张图片 · 7成功 · 1失败 · wood_image     │
└──────────────────────────────────────────────┘
```

点击某个批次展开 → 加载该批次详情 → 以表格形式展示每张图片的识别结果。

### 7.4 历史记录的操作

- **查看详情**：点击批次行展开/收起
- **删除批次**：批次行右侧删除按钮，确认后 DELETE 调用
- **查看结果**：结果列展示识别出的文本，过长则省略号截断
- **清空历史**："清空历史记录"按钮，批量删除所有批次

---

## 8. Error Handling

| 场景 | 行为 |
|------|------|
| Crawler API 不可用 | 前端 toast 提示"保存失败，请检查爬虫服务"，结果仍保留在页面中 |
| 单条保存失败 | 不影响其他结果保存，前端标记为"未同步"，可重试 |
| 网络中断 | 前端自动重试（最多 3 次，指数退避） |
| 删除失败 | toast 提示"删除失败" |

---

## 9. Implementation Sequence

```
Phase 1 (amazon_crawler): 后端数据持久层
  ├── 新增 DifyRecognitionResult ORM 模型
  ├── 新增 Pydantic schemas
  ├── 新增 dify_history.py 路由（CRUD）
  └── 注册路由到 main.py

Phase 2 (CoPaw backend): 代理转发层
  ├── crawler.py 新增 /api/crawler/dify/history/* 代理端点
  └── 测试代理转发（curl 验证）

Phase 3 (CoPaw frontend): UI + 对接
  ├── 新增 API 调用函数
  ├── BatchRecognitionSection 添加逐条保存逻辑
  ├── 添加历史记录 UI（折叠面板 + 批次列表）
  ├── 添加批次详情展开/收起
  └── 添加删除批次功能
```

---

## 10. Verification

1. 启动 Amazon Crawler：`cd amazon_crawler && docker-compose up -d`
2. 重启 CoPaw 后端：`uv run copaw app`
3. 启动前端：`cd console && bun run dev`
4. 打开 /integration/dify → 批量识别 Tab
5. 添加 2 张图片，执行识别
6. 刷新页面 → 历史记录应显示刚保存的批次
7. 点击批次展开 → 看到 2 条识别结果
8. 删除该批次 → 列表中消失
9. 用 `psql -h localhost -p 5433 -U amazon -d amazon_crawler -c "SELECT * FROM dify_recognition_results"` 验证数据库写入
