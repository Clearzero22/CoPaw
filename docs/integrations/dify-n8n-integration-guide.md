# Dify 和 N8n 集成指南

本文档详细说明如何将 Dify AI 工作流平台和 N8n 自动化工具集成到 CoPaw 系统中。

## 📋 目录

- [Dify 集成](#dify-集成)
- [N8n 集成](#n8n-集成)
- [集成对比](#集成对比)
- [最佳实践](#最佳实践)

---

## Dify 集成

### 系统概述

**Dify** 是一个开源的 LLM 应用开发平台，提供：

- **可视化工作流编排**: 拖拽式 AI 应用构建
- **模型支持**: OpenAI、Anthropic、本地模型等
- **批量处理**: 支持批量数据处理和 AI 分析
- **API 集成**: 提供 REST API 和 Webhook

### 集成架构

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  CoPaw 前端     │ ───▶ │  CoPaw 后端    │ ───▶ │  Dify API      │
│  (批量识别界面) │      │  (代理路由)    │      │  (AI 工作流)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │  Dify 引擎      │
                                                    │  - LLM 推理     │
                                                    │  - 数据处理     │
                                                    │  - 文件分析     │
                                                    └─────────────────┘
```

### 集成步骤

#### 步骤 1：Dify 服务部署

**Docker 部署（推荐）**:

```bash
# 克隆 Dify 项目
git clone https://github.com/langgenius/dify.git
cd dify/docker

# 复制环境配置
cp .env.example .env

# 修改配置
vim .env
```

**关键配置**:

```yaml
# .env 配置
CONSOLE_WEB_URL: 'http://localhost'
CONSOLE_API_URL: 'http://localhost/console/api'

# 数据库配置
POSTGRES_HOST: db
POSTGRES_PORT: 5432
POSTGRES_DB: dify
POSTGRES_USER: postgres
POSTGRES_PASSWORD: difyai123456

# Redis 配置
REDIS_HOST: redis
REDIS_PORT: 6379

# API 密钥（后续使用）
API_TOKEN: your-api-token-here
```

**启动服务**:

```bash
docker-compose up -d
```

#### 步骤 2：CoPaw 后端代理

**文件**: `src/copaw/app/routers/crawler.py` (已包含 Dify 代理)

```python
# Dify API 代理已在 crawler.py 中实现
# 主要接口：

@router.post("/dify/apps")
async def list_dify_apps():
    """获取 Dify 应用列表"""
    return await _proxy("GET", "/dify/apps")

@router.post("/dify/batch-recognition")
async def batch_recognition(request: Request):
    """批量图片识别"""
    body = await request.json()
    return await _proxy(
        "POST", 
        "/dify/batch-recognition",
        json_body=body,
        timeout=60.0
    )
```

#### 步骤 3：前端集成实现

**文件**: `console/src/pages/Integration/Dify/index.tsx`

**核心功能**:

```typescript
// 1. Dify 配置管理
interface DifyConfig {
  baseUrl: string;        // Dify API 地址
  apiKey: string;         // API 密钥
  defaultApp: string;     // 默认应用 ID
}

// 2. 批量图片识别
interface BatchImageItem {
  id: string;
  source: "file" | "url";
  fileName?: string;
  file?: File;
  uploadFileId?: string;
  url?: string;
  status: "pending" | "uploading" | "processing" 
           | "succeeded" | "failed";
  result?: string;
  error?: string;
  elapsed?: number;
}

// 3. 历史记录管理
interface HistoryRecord {
  id: number;
  batch_id: string;
  source: string;
  source_detail: string;
  status: string;
  result: string;
  error: string;
  created_at: string;
}
```

**关键功能实现**:

```typescript
// 获取 Dify 应用列表
const fetchApps = async () => {
  const response = await fetch(
    `${config.baseUrl}/v1/apps`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  setApps(data.apps || []);
};

// 批量图片识别
const handleBatchRecognition = async (images: BatchImageItem[]) => {
  const batchId = generateUniqueId();
  
  for (const image of images) {
    // 上传图片
    const formData = new FormData();
    formData.append('file', image.file);
    
    const uploadResponse = await fetch(
      `${config.baseUrl}/v1/files/upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      }
    );
    
    const uploadData = await uploadResponse.json();
    image.uploadFileId = uploadData.id;
    
    // 调用 Dify 工作流
    const workflowResponse = await fetch(
      `${config.baseUrl}/v1/workflows/run`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            image_url: uploadData.id,
          },
          response_mode: 'blocking',
          user: 'copaw-user',
        }),
      }
    );
    
    const result = await workflowResponse.json();
    image.result = result.data.outputs.result;
    image.status = 'succeeded';
  }
  
  // 保存历史记录
  await saveBatchHistory(batchId, images);
};
```

#### 步骤 4：使用示例

**1. 配置 Dify 连接**:

```
1. 打开 CoPaw 控制台
2. 进入 Integration → Dify
3. 点击"设置"按钮
4. 填写配置信息：
   - Base URL: http://localhost/v1
   - API Key: your-api-token
5. 点击"测试连接"
6. 保存配置
```

**2. 创建 Dify 工作流**:

```yaml
# Dify 工作流示例：产品图片识别
工作流名称: Product Image Recognition

节点:
  1. 开始节点 (Start)
     - 输入: image_url (图片 URL)
  
  2. 图片处理节点 (Image Processing)
     - 下载图片
     - 图片格式验证
  
  3. AI 分析节点 (LLM)
     - 模型: GPT-4 Vision
     - Prompt: |
       分析这张产品图片，识别：
       1. 产品类型
       2. 品牌
       3. 关键特征
       4. 适用场景
       请以 JSON 格式返回结果。
  
  4. 结束节点 (End)
     - 输出: analysis_result
```

**3. 执行批量识别**:

```typescript
// 从爬虫数据选择产品
const selectedProducts = await crawlerApi.listProducts({
  detail_scraped: true,
  page_size: 10
});

// 提取产品图片
const images = selectedProducts.products.map(product => ({
  id: generateUniqueId(),
  source: 'url',
  url: product.main_image_url,
  status: 'pending'
}));

// 执行批量识别
await handleBatchRecognition(images);
```

### 高级功能

#### 1. 数据库选择器

在 Dify 工作流中集成数据库查询：

```python
# CoPaw 提供 API 端点供 Dify 调用
@router.get("/dify/db/products")
async def query_products_for_dify(
    category: str = None,
    min_price: float = None
):
    """为 Dify 工作流提供产品数据"""
    # 查询爬虫数据库
    products = await fetch_products_from_crawler(
        category=category,
        min_price=min_price
    )
    return {"products": products}
```

在 Dify 工作流中使用 HTTP 请求节点：

```yaml
HTTP 请求节点:
  method: GET
  url: http://localhost:8088/api/dify/db/products
  headers:
    Authorization: Bearer your-token
  params:
    category: electronics
    min_price: 100
```

#### 2. 实时进度推送

```typescript
// WebSocket 连接监听 Dify 工作流进度
const ws = new WebSocket('ws://localhost:8088/ws/dify/progress');

ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  
  switch (progress.type) {
    case 'workflow_started':
      console.log('工作流开始执行');
      break;
    case 'node_completed':
      console.log(`节点 ${progress.node_name} 完成`);
      break;
    case 'workflow_completed':
      console.log('工作流执行完成', progress.result);
      break;
    case 'error':
      console.error('执行错误', progress.error);
      break;
  }
};
```

---

## N8n 集成

### 系统概述

**N8n** 是一个开源的工作流自动化工具，特点：

- **可视化编排**: 拖拽式工作流设计
- **300+ 集成**: 支持各种 SaaS 服务
- **代码友好**: 支持自定义 JavaScript 代码
- **自托管**: 完全控制数据和隐私

### 集成架构

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  CoPaw 前端     │ ───▶ │  CoPaw 后端    │ ───▶ │  N8n API       │
│  (工作流管理)   │      │  (代理路由)    │      │  (自动化引擎)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │  N8n 工作流     │
                                                    │  - 数据转换     │
                                                    │  - API 调用     │
                                                    │  - 消息发送     │
                                                    └─────────────────┘
```

### 集成步骤

#### 步骤 1：N8n 服务部署

**使用 npm 安装**:

```bash
# 安装 N8n
npm install -g n8n

# 启动 N8n
n8n start

# 默认访问地址
# http://localhost:5678
```

**Docker 部署**:

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### 步骤 2：配置 API 密钥

```bash
# 在 N8n 界面中
1. 点击 Settings → API
2. 创建 API 密钥
3. 复制密钥供 CoPaw 使用
```

#### 步骤 3：CoPaw 前端集成

**文件**: `console/src/pages/Integration/N8n/index.tsx`

**核心功能**:

```typescript
interface N8nConfig {
  baseUrl: string;      // N8n 实例地址
  apiKey: string;       // API 密钥
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: number;
  connections: number;
  lastExecuted?: string;
}

// 获取工作流列表
const fetchWorkflows = async () => {
  const response = await fetch(
    `${config.baseUrl}/rest/workflows`,
    {
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await response.json();
  setWorkflows(data.data || []);
};

// 触发工作流执行
const triggerWorkflow = async (workflowId: string) => {
  const response = await fetch(
    `${config.baseUrl}/rest/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          // 工作流输入数据
        },
      }),
    }
  );
  
  return await response.json();
};
```

#### 步骤 4：创建 N8n 工作流

**示例 1：爬虫数据同步到 CoPaw**

```javascript
// N8n 工作流节点配置
{
  "nodes": [
    {
      "name": "定时触发",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 */6 * * *"  // 每 6 小时
      }
    },
    {
      "name": "调用爬虫 API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "http://localhost:8088/api/crawler/products/stats"
      }
    },
    {
      "name": "数据转换",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "language": "javaScript",
        "code": `
          const stats = $input.item.json;
          return {
            json: {
              total: stats.total_products,
              scraped: stats.detail_scraped,
              timestamp: new Date().toISOString()
            }
          };
        `
      }
    },
    {
      "name": "发送到 CoPaw",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:8088/api/notifications",
        "body": {
          "message": "爬虫数据已更新",
          "data": "={{$json}}"
        }
      }
    }
  ]
}
```

**示例 2：产品数据自动发布**

```javascript
{
  "nodes": [
    {
      "name": "监听爬虫完成",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "crawler-completed",
        "method": "POST"
      }
    },
    {
      "name": "获取产品详情",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:8088/api/crawler/products/{{$json.asin}}"
      }
    },
    {
      "name": "生成 Listing",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:8088/api/listings/generate",
        "body": "={{$json}}"
      }
    },
    {
      "name": "发布到电商平台",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.ecommerce.com/products",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "body": "={{$json.listing}}"
      }
    }
  ]
}
```

### 高级功能

#### 1. Webhook 集成

```python
# CoPaw 后端提供 Webhook 端点
@router.post("/webhooks/n8n/{workflow_id}")
async def n8n_webhook(
    workflow_id: str,
    request: Request
):
    """接收 N8n 工作流的 Webhook 调用"""
    payload = await request.json()
    
    # 处理工作流返回的数据
    if workflow_id == "product-sync":
        await sync_products(payload)
    elif workflow_id == "price-update":
        await update_prices(payload)
    
    return {"status": "received"}
```

在 N8n 工作流中配置 Webhook：

```javascript
{
  "name": "发送结果到 CoPaw",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://localhost:8088/api/webhooks/n8n/product-sync",
    "body": "={{$json}}"
  }
}
```

#### 2. 实时工作流监控

```typescript
// 轮询工作流执行状态
const pollWorkflowExecution = async (executionId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `${config.baseUrl}/rest/executions/${executionId}`,
      {
        headers: {
          'X-N8N-API-KEY': config.apiKey,
        },
      }
    );
    
    const execution = await response.json();
    
    if (execution.finished) {
      clearInterval(interval);
      handleExecutionComplete(execution);
    }
  }, 2000);
};
```

---

## 集成对比

### Dify vs N8n

| 特性 | Dify | N8n |
|------|------|-----|
| **主要用途** | AI 应用开发 | 工作流自动化 |
| **核心能力** | LLM 编排、数据处理 | API 集成、任务自动化 |
| **可视化** | 工作流画布 | 节点编辑器 |
| **AI 支持** | ✅ 原生支持 | ⚠️ 需要外部 API |
| **集成数量** | 50+ | 300+ |
| **学习曲线** | 中等 | 较低 |
| **适用场景** | AI 分析、内容生成 | 数据同步、系统集成 |

### 使用建议

**选择 Dify 的场景**:
- 需要AI分析和内容生成
- 图片识别和自然语言处理
- 复杂的数据处理流程
- 需要向量数据库和 RAG

**选择 N8n 的场景**:
- 多系统集成和数据同步
- 定时任务和自动化
- API 串联和数据处理
- 需要大量第三方服务集成

### 联合使用

```
CoPaw → N8n → 数据准备 → Dify → AI分析 → 结果存储 → CoPaw
         ↓                    ↑
     API集成              AI工作流
```

**示例工作流**:

```yaml
1. N8n 定时触发爬虫
2. N8n 调用 CoPaw API 获取产品数据
3. N8n 将数据传递给 Dify
4. Dify 执行 AI 分析（竞品分析、价格预测）
5. Dify 返回分析结果
6. N8n 将结果保存回 CoPaw
7. CoPaw 通知用户查看结果
```

---

## 最佳实践

### 1. 安全性

**API 密钥管理**:

```python
# 使用环境变量存储密钥
import os

DIFY_API_KEY = os.getenv("DIFY_API_KEY")
N8N_API_KEY = os.getenv("N8N_API_KEY")

# 或使用 CoPaw 的配置管理
from copaw.config import get_config

config = get_config()
dify_key = config.dify.api_key
```

**访问控制**:

```python
from fastapi import Depends, HTTPException
from copaw.app.auth import get_current_user

@router.post("/dify/execute")
async def execute_dify_workflow(
    request: Request,
    current_user = Depends(get_current_user)
):
    """需要认证的 Dify 接口"""
    if not current_user.has_permission("dify.execute"):
        raise HTTPException(status_code=403)
    # 执行工作流
```

### 2. 错误处理

```typescript
// 统一错误处理
async function safeApiCall<T>(
  apiFunc: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await apiFunc();
  } catch (error) {
    console.error(errorMessage, error);
    message.error(errorMessage);
    return null;
  }
}

// 使用示例
const result = await safeApiCall(
  () => fetchDifyApps(),
  "获取 Dify 应用失败"
);
```

### 3. 性能优化

**批量处理**:

```python
# Dify 批量处理优化
BATCH_SIZE = 10

async def process_in_batches(items: list):
    """分批处理大量数据"""
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        await process_batch(batch)
        # 避免限流
        await asyncio.sleep(1)
```

**缓存策略**:

```typescript
// N8n 工作流列表缓存
const workflowCache = new Map<string, N8nWorkflow[]>();

async function getWorkflows(forceRefresh = false) {
  const cacheKey = 'n8n_workflows';
  
  if (!forceRefresh && workflowCache.has(cacheKey)) {
    return workflowCache.get(cacheKey);
  }
  
  const workflows = await fetchWorkflows();
  workflowCache.set(cacheKey, workflows);
  
  // 5分钟后过期
  setTimeout(() => workflowCache.delete(cacheKey), 5 * 60 * 1000);
  
  return workflows;
}
```

### 4. 监控和日志

```python
# 工作流执行日志
from loguru import logger

@router.post("/n8n/trigger")
async def trigger_n8n_workflow(workflow_id: str):
    logger.info(f"Triggering N8n workflow: {workflow_id}")
    
    start_time = time.time()
    try:
        result = await execute_workflow(workflow_id)
        duration = time.time() - start_time
        
        logger.info(
            f"Workflow {workflow_id} completed in {duration:.2f}s"
        )
        
        # 记录执行统计
        record_workflow_metric(workflow_id, duration, success=True)
        
    except Exception as e:
        logger.error(f"Workflow {workflow_id} failed: {e}")
        record_workflow_metric(workflow_id, 0, success=False)
```

---

## 总结

通过集成 Dify 和 N8n，CoPaw 系统获得了强大的扩展能力：

✅ **Dify 集成**: AI 驱动的数据分析和内容生成
✅ **N8n 集成**: 灵活的工作流自动化和系统集成
✅ **协同工作**: 两者结合实现端到端的自动化 AI 流程
✅ **易于扩展**: 插件化架构支持更多第三方服务

这些集成使 CoPaw 从一个简单的 AI 助手演变为强大的业务自动化平台。
