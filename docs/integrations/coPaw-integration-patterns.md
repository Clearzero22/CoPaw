# CoPaw 集成模式与最佳实践

本文档总结了 CoPaw 系统集成的通用模式和最佳实践，为集成新服务提供指导。

## 📋 目录

- [集成架构模式](#集成架构模式)
- [开发模式](#开发模式)
- [测试策略](#测试策略)
- [部署方案](#部署方案)
- [监控运维](#监控运维)
- [安全考虑](#安全考虑)

---

## 集成架构模式

### 模式 1: 三层代理模式

**适用场景**: 外部 API 服务集成

**架构图**:
```
前端界面 → CoPaw 后端代理 → 外部服务 API
```

**优点**:
- ✅ 统一认证和授权
- ✅ 错误处理和重试
- ✅ 日志和监控集中
- ✅ 前端无需关心外部服务

**实现模板**:

```python
# src/copaw/app/routers/external_service.py
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/external-service", tags=["external-service"])

_SERVICE_BASE = "http://localhost:9000"
_TIMEOUT = 30.0

async def _proxy(
    method: str,
    path: str,
    *,
    params: dict | None = None,
    json_body: dict | None = None,
    timeout: float = _TIMEOUT,
) -> JSONResponse:
    """统一代理方法"""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.request(
                method,
                f"{_SERVICE_BASE}{path}",
                params=params,
                json=json_body,
            )
        return JSONResponse(
            content=resp.json(),
            status_code=resp.status_code,
        )
    except httpx.ConnectError:
        return JSONResponse(
            content={"error": "service_unavailable"},
            status_code=502,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            content={"error": "service_timeout"},
            status_code=504,
        )

# 具体接口实现
@router.get("/resource")
async def list_resources(request: Request):
    params = dict(request.query_params)
    return await _proxy("GET", "/api/resources", params=params)

@router.post("/action")
async def trigger_action(request: Request):
    body = await request.json()
    return await _proxy("POST", "/api/actions", json_body=body)
```

**前端调用**:

```typescript
// console/src/api/modules/externalService.ts
export const externalServiceApi = {
  listResources: (params?: any) =>
    request("/external-service/resource", { params }),
  
  triggerAction: (data: any) =>
    request("/external-service/action", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
```

**真实案例**:
- 西柚找词集成 (`/api/xiyouzhaoci/*`)
- Amazon 爬虫代理 (`/api/crawler/*`)

### 模式 2: 插件化集成模式

**适用场景**: 可复用的功能模块

**架构图**:
```
CoPaw 核心
    ↓
插件管理器
    ↓
┌─────┬─────┬─────┐
│爬虫 │AI  │其他 │
│插件 │插件 │插件 │
└─────┴─────┴─────┘
```

**实现模板**:

```python
# src/copaw/plugins/base.py
from abc import ABC, abstractmethod

class BasePlugin(ABC):
    """插件基类"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """插件名称"""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """插件版本"""
        pass
    
    @abstractmethod
    async def initialize(self, config: dict):
        """初始化插件"""
        pass
    
    @abstractmethod
    async def execute(self, input_data: dict) -> dict:
        """执行插件功能"""
        pass
    
    async def cleanup(self):
        """清理资源"""
        pass

# src/copaw/plugins/manager.py
class PluginManager:
    """插件管理器"""
    
    def __init__(self):
        self._plugins: dict[str, BasePlugin] = {}
    
    def register(self, plugin: BasePlugin):
        """注册插件"""
        self._plugins[plugin.name] = plugin
    
    async def initialize_all(self, configs: dict):
        """初始化所有插件"""
        for name, config in configs.items():
            plugin = self._plugins.get(name)
            if plugin:
                await plugin.initialize(config)
    
    async def execute_plugin(
        self,
        name: str,
        input_data: dict
    ) -> dict:
        """执行插件"""
        plugin = self._plugins.get(name)
        if not plugin:
            raise ValueError(f"Plugin {name} not found")
        return await plugin.execute(input_data)
```

**使用示例**:

```python
# 定义爬虫插件
class CrawlerPlugin(BasePlugin):
    @property
    def name(self) -> str:
        return "amazon-crawler"
    
    async def execute(self, input_data: dict) -> dict:
        asin = input_data.get("asin")
        # 执行爬虫逻辑
        return await scrape_product(asin)

# 注册和使用
manager = PluginManager()
manager.register(CrawlerPlugin())
await manager.initialize_all({"amazon-crawler": {...}})
result = await manager.execute_plugin("amazon-crawler", {"asin": "B0XXX"})
```

### 模式 3: 事件驱动集成模式

**适用场景**: 异步任务和实时通知

**架构图**:
```
用户操作 → 事件总线 → 订阅者处理 → 结果通知
```

**实现模板**:

```python
# src/copaw/events/bus.py
from typing import Callable, Dict
from collections import defaultdict

class EventBus:
    """事件总线"""
    
    def __init__(self):
        self._subscribers: Dict[str, list[Callable]] = defaultdict(list)
    
    def subscribe(self, event: str, callback: Callable):
        """订阅事件"""
        self._subscribers[event].append(callback)
    
    def publish(self, event: str, data: dict):
        """发布事件"""
        for callback in self._subscribers[event]:
            asyncio.create_task(callback(data))

# 全局事件总线
event_bus = EventBus()

# src/copaw/events/handlers.py
async def on_crawler_completed(data: dict):
    """爬虫完成处理器"""
    asin = data.get("asin")
    # 1. 发送通知
    await send_notification(f"爬虫完成: {asin}")
    # 2. 触发后续任务
    await trigger_dify_analysis(asin)
    # 3. 更新统计
    await update_statistics()

# 订阅事件
event_bus.subscribe("crawler.completed", on_crawler_completed)

# 发布事件
await event_bus.publish("crawler.completed", {
    "asin": "B0XXX",
    "status": "success",
    "product_count": 10
})
```

### 模式 4: 数据库集成模式

**适用场景**: 需要持久化存储的数据

**实现模板**:

```python
# src/copaw/database/models.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ExternalData(Base):
    """外部数据模型"""
    __tablename__ = "external_data"
    
    id = Column(Integer, primary_key=True)
    source = Column(String(50))  # 数据源标识
    external_id = Column(String(100))  # 外部 ID
    data = Column(JSON)  # 数据内容
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    __table_args__ = (
        UniqueConstraint('source', 'external_id'),
    )

# src/copaw/database/repository.py
class ExternalDataRepository:
    """外部数据仓储"""
    
    def __init__(self, session):
        self.session = session
    
    async def upsert(
        self,
        source: str,
        external_id: str,
        data: dict
    ):
        """插入或更新数据"""
        instance = await self.session.query(
            ExternalData
        ).filter_by(
            source=source,
            external_id=external_id
        ).first()
        
        if instance:
            instance.data = data
            instance.updated_at = datetime.now()
        else:
            instance = ExternalData(
                source=source,
                external_id=external_id,
                data=data,
                created_at=datetime.now()
            )
            self.session.add(instance)
        
        await self.session.commit()
        return instance
```

---

## 开发模式

### 开发流程

```
1. 需求分析
    ↓
2. 技术选型（选择集成模式）
    ↓
3. 接口设计（API 契约）
    ↓
4. 后端开发（路由 + 代理）
    ↓
5. 前端开发（UI + API 调用）
    ↓
6. 联调测试
    ↓
7. 文档更新
```

### 代码组织

**后端结构**:
```
src/copaw/app/
├── routers/
│   ├── external_service.py  # 新服务路由
│   └── ...
├── models/
│   └── external_service.py  # 数据模型（如需要）
└── utils/
    └── external_service.py   # 工具函数
```

**前端结构**:
```
console/src/
├── api/
│   └── modules/
│       └── externalService.ts  # API 模块
├── pages/
│   └── Integration/
│       └── ExternalService/    # 页面组件
│           ├── index.tsx
│           └── components/
└── types/
    └── externalService.ts      # 类型定义
```

### 配置管理

```python
# src/copaw/config/settings.py
class ExternalServiceConfig(BaseSettings):
    """外部服务配置"""
    
    base_url: str = "http://localhost:9000"
    api_key: str = ""
    timeout: float = 30.0
    enabled: bool = True
    
    class Config:
        env_prefix = "EXTERNAL_SERVICE_"

# 使用配置
from copaw.config.settings import ExternalServiceConfig

config = ExternalServiceConfig()
if config.enabled:
    # 初始化服务
    pass
```

---

## 测试策略

### 单元测试

```python
# tests/unit/routers/test_external_service.py
import pytest
from httpx import AsyncClient
from copaw.app import app

@pytest.mark.asyncio
async def test_list_products():
    """测试产品列表接口"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/external-service/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
```

### 集成测试

```python
# tests/integration/test_external_service_integration.py
@pytest.mark.asyncio
async def test_full_workflow():
    """测试完整工作流"""
    # 1. 触发爬虫
    response = await client.post("/external-service/scrape", json={
        "asins": ["B0XXX"]
    })
    assert response.status_code == 200
    
    # 2. 等待完成
    task_id = response.json()["task_id"]
    await wait_for_task(task_id)
    
    # 3. 查询结果
    result = await client.get(f"/external-service/results/{task_id}")
    assert result.status_code == 200
    assert len(result.json()["products"]) > 0
```

### 端到端测试

```typescript
// tests/e2e/external-service.spec.ts
import { test, expect } from '@playwright/test';

test('external service workflow', async ({ page }) => {
  await page.goto('http://localhost:5173/integration/external-service');
  
  // 配置服务
  await page.click('[data-testid="config-button"]');
  await page.fill('[data-testid="base-url"]', 'http://localhost:9000');
  await page.click('[data-testid="save-config"]');
  
  // 执行操作
  await page.fill('[data-testid="asin-input"]', 'B0XXX');
  await page.click('[data-testid="submit-button"]');
  
  // 验证结果
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

---

## 部署方案

### Docker Compose 部署

```yaml
# docker-compose.integration.yml
version: '3.8'

services:
  copaw:
    image: copaw:latest
    ports:
      - "8088:8088"
    environment:
      - EXTERNAL_SERVICE_URL=http://external-service:9000
    depends_on:
      - external-service
  
  external-service:
    image: external-service:latest
    ports:
      - "9000:9000"
    environment:
      - DATABASE_URL=postgresql://db:5432/service_db
    depends_on:
      - db
  
  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=service_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

### 环境变量配置

```bash
# .env.integration
# CoPaw 配置
COPAW_PORT=8088
COPAW_LOG_LEVEL=INFO

# 外部服务配置
EXTERNAL_SERVICE_URL=http://localhost:9000
EXTERNAL_SERVICE_API_KEY=your-api-key
EXTERNAL_SERVICE_TIMEOUT=30

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/copaw

# Redis 配置（用于缓存）
REDIS_URL=redis://localhost:6379
```

---

## 监控运维

### 健康检查

```python
# src/copaw/app/routers/health.py
from fastapi import APIRouter
import httpx

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/external-service")
async def check_external_service():
    """检查外部服务健康"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.external_service_url}/health"
            )
        if response.status_code == 200:
            return {"status": "healthy", "service": "external-service"}
        else:
            return {
                "status": "unhealthy",
                "service": "external-service",
                "code": response.status_code
            }
    except Exception as e:
        return {
            "status": "down",
            "service": "external-service",
            "error": str(e)
        }
```

### 指标收集

```python
# src/copaw/monitoring/metrics.py
from prometheus_client import Counter, Histogram

# 定义指标
request_counter = Counter(
    'external_service_requests_total',
    'Total requests to external service',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'external_service_request_duration_seconds',
    'Request duration to external service',
    ['method', 'endpoint']
)

# 使用指标
@router.get("/products")
async def list_products():
    with request_duration.labels('GET', '/products').time():
        try:
            response = await call_external_service()
            request_counter.labels(
                'GET', '/products', 'success'
            ).inc()
            return response
        except Exception as e:
            request_counter.labels(
                'GET', '/products', 'error'
            ).inc()
            raise
```

### 日志记录

```python
# src/copaw/utils/logging.py
from loguru import logger

class IntegrationLogger:
    """集成服务专用日志器"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
    
    def log_request(self, method: str, path: str, params: dict):
        """记录请求"""
        logger.info(
            f"[{self.service_name}] {method} {path}",
            extra={
                "service": self.service_name,
                "method": method,
                "path": path,
                "params": params
            }
        )
    
    def log_response(
        self,
        status_code: int,
        duration: float
    ):
        """记录响应"""
        logger.info(
            f"[{self.service_name}] Response: {status_code}",
            extra={
                "service": self.service_name,
                "status_code": status_code,
                "duration": duration
            }
        )
    
    def log_error(self, error: Exception):
        """记录错误"""
        logger.error(
            f"[{self.service_name}] Error: {str(error)}",
            exc_info=True,
            extra={"service": self.service_name}
        )

# 使用日志器
integration_logger = IntegrationLogger("external-service")
```

---

## 安全考虑

### API 密钥管理

```python
# src/copaw/security/api_keys.py
from cryptography.fernet import Fernet
import os

class APIKeyManager:
    """API 密钥管理器"""
    
    def __init__(self):
        # 使用环境变量中的密钥
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY not set")
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, api_key: str) -> str:
        """加密 API 密钥"""
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt(self, encrypted_key: str) -> str:
        """解密 API 密钥"""
        return self.cipher.decrypt(encrypted_key.encode()).decode()
    
    def mask(self, api_key: str) -> str:
        """掩码显示密钥"""
        if len(api_key) <= 8:
            return "****"
        return f"{api_key[:4]}...{api_key[-4:]}"

# 使用示例
key_manager = APIKeyManager()
encrypted = key_manager.encrypt("sk-1234567890")
masked = key_manager.mask("sk-1234567890")  # "sk-1...7890"
```

### 访问控制

```python
# src/copaw/security/permissions.py
from enum import Enum

class Permission(str, Enum):
    """权限枚举"""
    EXTERNAL_SERVICE_READ = "external_service:read"
    EXTERNAL_SERVICE_WRITE = "external_service:write"
    EXTERNAL_SERVICE_ADMIN = "external_service:admin"

def check_permission(permission: Permission):
    """权限检查装饰器"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            from copaw.app.auth import get_current_user
            
            user = await get_current_user()
            if permission not in user.permissions:
                raise HTTPException(
                    status_code=403,
                    detail=f"Permission denied: {permission}"
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
@router.post("/external-service/execute")
@check_permission(Permission.EXTERNAL_SERVICE_WRITE)
async def execute_task(request: Request):
    """需要写权限才能执行"""
    pass
```

### 请求限流

```python
# src/copaw/security/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/external-service/scrape")
@limiter.limit("10/minute")  # 每分钟最多 10 次请求
async def trigger_scrape(request: Request):
    """带限流的爬虫接口"""
    pass
```

---

## 最佳实践总结

### 设计原则

1. **单一职责**: 每个集成服务只负责一个外部系统
2. **接口统一**: 所有外部服务通过统一代理层访问
3. **错误隔离**: 外部服务故障不影响 CoPaw 主系统
4. **可观测性**: 完整的日志、指标和追踪
5. **安全第一**: 密钥加密、权限控制、请求限流

### 开发规范

1. **API 设计**: RESTful 风格，清晰的命名约定
2. **错误处理**: 统一的错误码和错误消息
3. **文档完善**: API 文档、集成文档、使用示例
4. **测试覆盖**: 单元测试、集成测试、E2E 测试
5. **版本管理**: API 版本控制、向后兼容

### 运维要点

1. **监控告警**: 服务健康检查、异常告警
2. **日志收集**: 集中日志管理、日志分析
3. **性能优化**: 缓存策略、并发控制、资源复用
4. **故障恢复**: 自动重试、降级策略、熔断机制
5. **数据备份**: 定期备份、灾难恢复

---

## 附录

### 快速开始模板

**新集成服务检查清单**:

- [ ] 确定集成模式（代理/插件/事件驱动）
- [ ] 设计 API 接口
- [ ] 实现后端路由和代理
- [ ] 实现前端 API 模块和页面
- [ ] 编写单元测试
- [ ] 编写集成文档
- [ ] 配置监控和日志
- [ ] 安全审查
- [ ] 性能测试
- [ ] 部署上线

### 常用工具库

```python
# requirements.txt
httpx>=0.27.0              # HTTP 客户端
pydantic>=2.0              # 数据验证
loguru>=0.7.0              # 日志记录
prometheus-client>=0.20.0  # 指标收集
slowapi>=0.1.9             # 限流
cryptography>=41.0         # 加密
```

```typescript
// package.json
{
  "dependencies": {
    "axios": "^1.6.0",           // HTTP 客户端
    "zustand": "^4.4.0",          // 状态管理
    "react-query": "^3.39.0",     // 数据获取
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-27
**维护团队**: CoPaw 开发团队
