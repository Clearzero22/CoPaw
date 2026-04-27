# CoPaw 集成故障排查指南

本文档提供 CoPaw 外部服务集成的常见问题诊断和解决方案。

## 📋 目录

- [通用问题](#通用问题)
- [爬虫系统问题](#爬虫系统问题)
- [Dify 集成问题](#dify-集成问题)
- [N8n 集成问题](#n8n-集成问题)
- [性能问题](#性能问题)
- [安全问题](#安全问题)

---

## 通用问题

### 问题 1: 服务无法启动

**症状**:
```bash
$ copaw app
ERROR: Port 8088 already in use
```

**诊断步骤**:
```bash
# 1. 检查端口占用
sudo lsof -i :8088
# 或
sudo netstat -tlnp | grep 8088

# 2. 查看进程详情
ps aux | grep copaw

# 3. 检查日志
tail -f ~/.copaw/copaw.log
```

**解决方案**:
```bash
# 方案 1: 停止占用端口的进程
sudo kill -9 <PID>

# 方案 2: 更换端口
export COPAW_PORT=8089
copaw app

# 方案 3: 使用 Docker 时清理容器
docker ps -a
docker rm -f <container_id>
```

### 问题 2: API 请求失败

**症状**:
```json
{
  "error": "service_unavailable",
  "status_code": 502
}
```

**诊断脚本**:
```bash
#!/bin/bash
# check_integration.sh

echo "=== CoPaw 后端 ==="
curl -s http://localhost:8088/health || echo "❌ CoPaw 后端无响应"

echo ""
echo "=== 爬虫 API ==="
curl -s http://localhost:8000/health || echo "❌ 爬虫 API 无响应"

echo ""
echo "=== PostgreSQL ==="
pg_isready -h localhost -p 5433 || echo "❌ PostgreSQL 无响应"

echo ""
echo "=== 网络连接 ==="
ping -c 1 localhost
```

**常见原因**:
1. **服务未启动**: 检查进程状态
2. **端口错误**: 确认端口号配置
3. **防火墙阻止**: 检查防火墙规则
4. **DNS 解析失败**: 检查网络配置

### 问题 3: 数据库连接失败

**症状**:
```python
sqlalchemy.exc.OperationalError: 
(psycopg.OperationalError) could not connect to server
```

**诊断步骤**:
```bash
# 1. 测试数据库连接
psql -h localhost -p 5433 -U amazon -d amazon_crawler

# 2. 检查 PostgreSQL 状态
docker ps | grep postgres

# 3. 查看数据库日志
docker logs amazon_crawler_db

# 4. 检查连接配置
cat amazon_crawler/api/.env | grep DATABASE_URL
```

**解决方案**:
```bash
# 方案 1: 重启数据库
docker restart amazon_crawler_db

# 方案 2: 检查连接字符串
# 确保格式: postgresql://user:pass@host:port/database
DATABASE_URL=postgresql://amazon:password@localhost:5433/amazon_crawler

# 方案 3: 修改 pg_hba.conf
# 允许本地连接
host all all all md5
```

---

## 爬虫系统问题

### 问题 1: Playwright 浏览器启动失败

**症状**:
```python
playwright._impl._api_types.Error: 
Executable doesn't exist at /path/to/chromium
```

**诊断步骤**:
```bash
# 1. 检查 Playwright 安装
python -c "from playwright.sync_api import sync_playwright; print('✓ Playwright installed')"

# 2. 检查浏览器安装
playwright install chromium

# 3. 查看已安装浏览器
playwright install --help
```

**解决方案**:
```bash
# 安装 Playwright 浏览器
cd /path/to/amazon_crawler
.venv/bin/playwright install chromium

# 如果在 Docker 中运行，使用系统 Chromium
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 问题 2: 爬虫任务卡住

**症状**: 任务状态一直是 "running"

**诊断步骤**:
```bash
# 1. 检查爬虫 API 日志
tail -f amazon_crawler/crawler_api.log

# 2. 查看进程状态
ps aux | grep playwright

# 3. 检查任务表
psql -h localhost -p 5433 -U amazon -d amazon_crawler -c \
  "SELECT * FROM scraping_jobs WHERE status='running' ORDER BY started_at DESC LIMIT 5;"
```

**解决方案**:
```python
# 设置超时时间
from playwright.async_api import async_playwright, TimeoutError

async def scrape_with_timeout():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        try:
            # 设置页面超时
            await page.goto(url, timeout=30000)  # 30秒
        except TimeoutError:
            logger.error(f"页面加载超时: {url}")
            # 清理资源
            await browser.close()
            raise
```

**强制重置任务**:
```sql
-- 将卡住的任务标记为失败
UPDATE scraping_jobs 
SET status = 'failed', 
    error = 'Task timeout'
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '1 hour';
```

### 问题 3: 数据解析错误

**症状**: 爬取的数据为空或格式错误

**调试方法**:
```python
# 保存页面快照用于调试
import asyncio
from playwright.async_api import async_playwright

async def debug_scrape(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        await page.goto(url)
        
        # 保存截图
        await page.screenshot(path="debug.png")
        
        # 保存 HTML
        html = await page.content()
        with open("debug.html", "w") as f:
            f.write(html)
        
        # 保存控制台日志
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        
        # 等待用户手动检查
        input("按 Enter 继续...")
        
        await browser.close()

# 运行调试爬虫
asyncio.run(debug_scrape("https://example.com/product/B0XXX"))
```

---

## Dify 集成问题

### 问题 1: Dify API 连接失败

**症状**:
```typescript
Failed to fetch: http://localhost/v1/apps
```

**诊断步骤**:
```bash
# 1. 检查 Dify 服务状态
docker ps | grep dify

# 2. 测试 Dify API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost/v1/apps

# 3. 查看 Dify 日志
docker logs -f dify-api-1

# 4. 检查网络配置
curl -v http://localhost/v1/apps
```

**解决方案**:

1. **确认 Dify 部署正确**:
```bash
# 检查所有容器状态
cd dify/docker
docker-compose ps

# 重启服务
docker-compose restart api
```

2. **验证 API 密钥**:
```python
# 测试 API 密钥
import requests

API_KEY = "your-api-key"
BASE_URL = "http://localhost/v1"

response = requests.get(
    f"{BASE_URL}/apps",
    headers={"Authorization": f"Bearer {API_KEY}"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

3. **检查 CORS 配置**:
```python
# Dify nginx 配置
location / {
    # 允许 CoPaw 前端地址
    add_header 'Access-Control-Allow-Origin' 'http://localhost:5173';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
}
```

### 问题 2: 工作流执行超时

**症状**: Dify 工作流长时间无响应

**诊断步骤**:
```typescript
// 检查工作流执行状态
const checkWorkflowStatus = async (runId: string) => {
  const response = await fetch(
    `${config.baseUrl}/v1/workflows/runs/${runId}`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    }
  );
  
  const data = await response.json();
  console.log('Status:', data.status);
  console.log('Error:', data.error);
};
```

**解决方案**:

1. **调整超时设置**:
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
  // 增加超时时间
  signal: AbortSignal.timeout(60000),  // 60 秒
});
```

2. **使用异步执行模式**:
```typescript
// 提交异步任务
const response = await fetch(`${baseUrl}/v1/workflows/run`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: data,
    response_mode: 'streaming',  // 使用流式响应
    user: 'copaw-user',
  }),
});

// 处理流式响应
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = new TextDecoder().decode(value);
  console.log('Received:', chunk);
}
```

### 问题 3: 文件上传失败

**症状**: 图片上传到 Dify 失败

**诊断代码**:
```typescript
const debugUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('File info:', {
    name: file.name,
    size: file.size,
    type: file.type,
  });
  
  try {
    const response = await fetch(
        `${config.baseUrl}/v1/files/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            // 不要设置 Content-Type，让浏览器自动设置
          },
          body: formData,
        }
      );
    
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Upload error:', error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
```

**解决方案**:

1. **检查文件大小限制**:
```bash
# Dify 默认限制 15MB
# 可在 docker/.env 中调整
UPLOAD_FILE_SIZE_LIMIT=15728640
```

2. **分片上传大文件**:
```typescript
async function uploadLargeFile(file: File, chunkSize = 5 * 1024 * 1024) {
  const chunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunk', i);
    formData.append('total', chunks);
    
    await fetch(`${baseUrl}/v1/files/upload-chunk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
  }
}
```

---

## N8n 集成问题

### 问题 1: N8n Webhook 无法触发

**症状**: CoPaw 发送到 N8n 的 Webhook 没有响应

**诊断步骤**:
```bash
# 1. 测试 Webhook 端点
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 2. 检查 N8n 日志
docker logs n8n

# 3. 查看 Webhook 配置
# 在 N8n 界面中检查 Webhook 节点设置
```

**解决方案**:

1. **确认 Webhook 路径正确**:
```typescript
// N8n Webhook 路径格式
const webhookUrl = 'http://localhost:5678/webhook/my-webhook';

// 测试 Webhook
const testWebhook = async () => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'copaw',
      data: { /* ... */ },
    }),
  });
  
  console.log('Webhook response:', await response.json());
};
```

2. **使用 N8n 测试功能**:
```javascript
// 在 N8n Webhook 节点中
// 点击 "Listen for Test Event"
// 然后执行 Webhook 调用
// 查看是否能收到测试数据
```

### 问题 2: 工作流执行权限错误

**症状**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

**解决方案**:

1. **重新生成 API 密钥**:
```bash
# N8n 界面 → Settings → API
# 删除旧密钥，创建新密钥
# 更新 CoPaw 配置
```

2. **检查 API 密钥权限**:
```python
# 验证 API 密钥
async def verify_n8n_api_key(base_url: str, api_key: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{base_url}/rest/workflows",
            headers={
                "X-N8N-API-KEY": api_key,
            },
        )
        
        if response.status_code == 200:
            print("✓ API 密钥有效")
            return True
        else:
            print(f"✗ API 密钥无效: {response.status_code}")
            return False

# 使用示例
await verify_n8n_api_key(
    "http://localhost:5678",
    "your-api-key"
)
```

### 问题 3: 工作流节点执行失败

**症状**: 工作流执行到某个节点失败

**调试方法**:

1. **在 N8n 中查看执行日志**:
```javascript
// 在工作流编辑器中
// 点击工作流 → Executions
// 选择失败的执行
// 查看每个节点的执行详情
```

2. **添加调试节点**:
```javascript
// 在工作流中添加 Code 节点
// 输出调试信息
return [{
  json: {
    debug_info: {
      input_data: $input.item.json,
      current_time: new Date().toISOString(),
      node_name: "Debug Node"
    }
  }
}];
```

3. **逐步测试节点**:
```javascript
// 在工作流中设置断点
// 逐个节点执行
// 查看中间结果
```

---

## 性能问题

### 问题 1: API 响应缓慢

**症状**: API 请求耗时超过 10 秒

**诊断工具**:
```python
import time
import functools

def timing_decorator(func):
    """计时装饰器"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start
            if duration > 5.0:
                logger.warning(
                    f"{func.__name__} took {duration:.2f}s"
                )
    return wrapper

# 使用
@timing_decorator
async def slow_operation():
    await asyncio.sleep(10)
```

**优化方案**:

1. **添加缓存**:
```python
from functools import lru_cache
from datetime import datetime, timedelta

class TimedCache:
    """带过期时间的缓存"""
    def __init__(self, ttl_seconds=300):
        self.cache = {}
        self.ttl = ttl_seconds
    
    def get(self, key):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value):
        self.cache[key] = (value, time.time())

# 使用缓存
cache = TimedCache(ttl_seconds=300)

@router.get("/products")
async def list_products():
    # 尝试从缓存获取
    cached = cache.get("products_list")
    if cached:
        return cached
    
    # 缓存未命中，查询数据
    products = await fetch_products()
    
    # 存入缓存
    cache.set("products_list", products)
    return products
```

2. **使用连接池**:
```python
import httpx

# 创建连接池
client = httpx.AsyncClient(
    timeout=httpx.Timeout(10.0),
    limits=httpx.Limits(
        max_connections=100,
        max_keepalive_connections=20
    )
)

# 使用连接池
@router.on_event("startup")
async def startup():
    # 应用启动时创建连接池
    app.state.http_client = client

@router.on_event("shutdown")
async def shutdown():
    # 应用关闭时关闭连接池
    await app.state.http_client.aclose()
```

### 问题 2: 内存占用过高

**症状**: 服务运行一段时间后内存占用持续增长

**诊断工具**:
```bash
# 监控内存使用
watch -n 5 'ps aux | grep copaw'

# 使用内存分析器
python -m memory_profiler copaw_app.py

# 检查对象数量
import gc
print(f"Objects: {len(gc.get_objects())}")
```

**解决方案**:

1. **定期清理资源**:
```python
import asyncio

async def cleanup_worker():
    """定期清理任务"""
    while True:
        await asyncio.sleep(3600)  # 每小时清理一次
        
        # 清理缓存
        cache.clear()
        
        # 强制垃圾回收
        gc.collect()
        
        logger.info("Cleanup completed")

# 启动清理任务
asyncio.create_task(cleanup_worker())
```

2. **使用生成器减少内存占用**:
```python
def stream_products(batch_size=100):
    """流式读取产品数据"""
    offset = 0
    while True:
        # 每次只读取一批数据
        products = db.query(Product)\
            .offset(offset)\
            .limit(batch_size)\
            .all()
        
        if not products:
            break
        
        yield products
        
        offset += batch_size
        # 及时释放内存
        db.session.expire_all()

# 使用流式处理
for batch in stream_products():
    process_batch(batch)
```

---

## 安全问题

### 问题 1: API 密钥泄露

**症状**: API 密钥出现在日志或错误消息中

**预防措施**:

1. **密钥脱敏**:
```python
def mask_api_key(api_key: str) -> str:
    """掩码 API 密钥"""
    if len(api_key) <= 8:
        return "***"
    return f"{api_key[:4]}...{api_key[-4:]}"

# 在日志中使用
logger.info(f"Using API key: {mask_api_key(api_key)}")
```

2. **环境变量存储**:
```bash
# .env 文件（不要提交到 Git）
DIFY_API_KEY=sk-1234567890
N8N_API_KEY=n8n-1234567890

# .gitignore
.env
.env.local
```

### 问题 2: CORS 错误

**症状**:
```
Access to fetch at 'http://localhost:8000' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**解决方案**:

1. **后端添加 CORS 中间件**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. **开发环境使用代理**:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      }
    }
  }
});
```

### 问题 3: SQL 注入风险

**预防措施**:

1. **使用 ORM 参数化查询**:
```python
# ✅ 正确：使用参数化查询
from sqlalchemy.orm import Session

def get_products_by_asin(db: Session, asin: str):
    return db.query(Product)\
        .filter(Product.asin == asin)\
        .all()

# ❌ 错误：直接拼接 SQL
def get_products_by_asin_wrong(db: Session, asin: str):
    query = f"SELECT * FROM products WHERE asin = '{asin}'"
    return db.execute(query)  # SQL 注入风险！
```

2. **输入验证**:
```python
from pydantic import BaseModel, validator

class ProductQuery(BaseModel):
    asin: str
    
    @validator('asin')
    def validate_asin(cls, v):
        # 验证 ASIN 格式
        if not re.match(r'^[A-Z0-9]{10}$', v):
            raise ValueError('Invalid ASIN format')
        return v.upper()
```

---

## 监控和告警

### 设置监控脚本

```bash
#!/bin/bash
# monitor_integrations.sh

while true; do
  echo "=== $(date) ==="
  
  # 检查服务状态
  echo "Checking services..."
  curl -s http://localhost:8088/health > /dev/null && echo "✓ CoPaw" || echo "✗ CoPaw"
  curl -s http://localhost:8000/health > /dev/null && echo "✓ Crawler" || echo "✗ Crawler"
  
  # 检查数据库连接
  psql -h localhost -p 5433 -U amazon -d amazon_crawler -c "SELECT 1" > /dev/null 2>&1 && echo "✓ Database" || echo "✗ Database"
  
  # 检查磁盘空间
  df -h | grep -E "9[0-9]%" && echo "⚠️  Disk space low" || echo "✓ Disk OK"
  
  # 检查内存使用
  MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
  if [ $MEM_USAGE -gt 80 ]; then
    echo "⚠️  Memory usage: ${MEM_USAGE}%"
  fi
  
  sleep 300  # 每 5 分钟检查一次
done
```

### 设置告警通知

```python
# src/copaw/monitoring/alerts.py
import asyncio
import httpx

class AlertManager:
    """告警管理器"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send_alert(
        self,
        severity: str,
        service: str,
        message: str
    ):
        """发送告警通知"""
        payload = {
            "severity": severity,
            "service": service,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        async with httpx.AsyncClient() as client:
            await client.post(
                self.webhook_url,
                json=payload
            )

# 使用告警
alert_manager = AlertManager("https://hooks.slack.com/...")

# 在关键错误处发送告警
try:
    await risky_operation()
except Exception as e:
    await alert_manager.send_alert(
        severity="error",
        service="crawler",
        message=f"Crawler failed: {str(e)}"
    )
```

---

## 快速参考

### 常用命令

```bash
# 查看服务状态
systemctl status copaw
docker ps -a | grep -E "copaw|crawler|dify|n8n"

# 查看日志
tail -f ~/.copaw/copaw.log
tail -f amazon_crawler/crawler_api.log

# 重启服务
docker-compose restart
copaw app --reload

# 测试 API
curl http://localhost:8088/health
curl http://localhost:8000/health

# 数据库操作
psql -h localhost -p 5433 -U amazon -d amazon_crawler
```

### 重要文件位置

| 服务 | 配置文件 | 日志文件 |
|------|---------|---------|
| CoPaw | `~/.copaw/config.json` | `~/.copaw/copaw.log` |
| 爬虫 API | `amazon_crawler/api/.env` | `amazon_crawler/crawler_api.log` |
| Dify | `dify/docker/.env` | `dify/logs/api.log` |
| N8n | `~/.n8n/config` | N8n 界面查看 |

### 端口分配

| 服务 | 端口 | 配置变量 |
|------|------|---------|
| CoPaw | 8088 | `COPAW_PORT` |
| CoPaw 前端 | 5173 | Vite 配置 |
| 爬虫 API | 8000 | 硬编码 |
| PostgreSQL | 5433 | docker-compose |
| Dify | 变动 | 查看 docker-compose |
| N8n | 5678 | N8N_PORT |

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-27  
**维护团队**: CoPaw 开发团队
