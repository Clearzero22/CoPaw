# CoPaw 代码优化指南

> 从性能调优到代码重构，全面提升 CoPaw 的质量和效率

## 📋 目录
1. [性能优化策略](#性能优化策略)
2. [代码重构技巧](#代码重构技巧)
3. [内存管理](#内存管理)
4. [并发处理](#并发处理)
5. [缓存优化](#缓存优化)
6. [监控与分析](#监控与分析)

---

## 性能优化策略

### 1.1 识别性能瓶颈

#### 使用性能分析工具

```python
# 1. 使用 cProfile 分析函数性能
import cProfile
import pstats

def profile_function():
    """分析函数性能"""
    pr = cProfile.Profile()
    pr.enable()

    # 执行你的代码
    result = your_function()

    pr.disable()

    # 打印统计信息
    stats = pstats.Stats(pr)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # 打印前 20 个

# 2. 使用 line_profiler 分析行级性能
# pip install line_profiler
# kernprof -l -v script.py

@profile
def your_function():
    """被分析的函数"""
    # 你的代码
    pass
```

#### 常见性能问题

```python
# ❌ 问题 1：重复计算
def process_items(items):
    results = []
    for item in items:
        # 每次循环都重新计算
        processed = expensive_operation(item)
        results.append(processed)
    return results

# ✅ 优化：缓存计算结果
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_operation(item):
    """缓存计算结果"""
    return complex_calculation(item)

# ❌ 问题 2：不必要的循环
def find_user(users, user_id):
    for user in users:  # O(n)
        if user.id == user_id:
            return user
    return None

# ✅ 优化：使用字典查找 O(1)
def find_user(users_dict, user_id):
    return users_dict.get(user_id)

# ❌ 问题 3：字符串拼接
def build_string(parts):
    result = ""
    for part in parts:
        result += part  # 每次都创建新字符串
    return result

# ✅ 优化：使用 join
def build_string(parts):
    return "".join(parts)
```

### 1.2 I/O 优化

#### 文件操作优化

```python
# ❌ 不好：逐行读取大文件
async def read_large_file_slow(file_path: str):
    results = []
    async with aiofiles.open(file_path, 'r') as f:
        async for line in f:
            # 逐行处理，慢
            processed = await process_line(line)
            results.append(processed)
    return results

# ✅ 优化：批量读取
async def read_large_file_fast(file_path: str, batch_size: int = 1000):
    results = []
    batch = []

    async with aiofiles.open(file_path, 'r') as f:
        async for line in f:
            batch.append(line)
            if len(batch) >= batch_size:
                # 批量处理
                processed = await process_batch(batch)
                results.extend(processed)
                batch = []

        # 处理剩余的行
        if batch:
            processed = await process_batch(batch)
            results.extend(processed)

    return results
```

#### 数据库查询优化

```python
# ❌ 不好：N+1 查询
async def get_users_with_posts_slow():
    users = await db.get_all_users()
    for user in users:
        # 每个用户都查询一次
        user.posts = await db.get_posts(user.id)
    return users

# ✅ 优化：批量查询
async def get_users_with_posts_fast():
    users = await db.get_all_users()
    user_ids = [u.id for u in users]

    # 一次性查询所有帖子
    posts = await db.get_posts_by_user_ids(user_ids)

    # 组织数据
    posts_by_user = {}
    for post in posts:
        posts_by_user.setdefault(post.user_id, []).append(post)

    for user in users:
        user.posts = posts_by_user.get(user.id, [])

    return users
```

### 1.3 网络请求优化

```python
# ❌ 不好：串行请求
async def fetch_data_serial(urls):
    results = []
    for url in urls:
        response = await httpx.AsyncClient().get(url)
        results.append(response.json())
    return results

# ✅ 优化：并行请求
async def fetch_data_parallel(urls):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]

# ✅ 进一步优化：限制并发数
async def fetch_data_with_limit(urls, max_concurrent: int = 10):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_one(url):
        async with semaphore:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                return response.json()

    tasks = [fetch_one(url) for url in urls]
    return await asyncio.gather(*tasks)
```

---

## 代码重构技巧

### 2.1 提取函数

#### 重构前：长函数

```python
async def process_message(message_data: dict) -> dict:
    """处理消息 - 100+ 行代码"""
    # 1. 验证数据 (20 行)
    if not message_data.get("content"):
        raise ValueError("Content is required")
    if not message_data.get("sender_id"):
        raise ValueError("Sender ID is required")

    # 2. 解析内容 (30 行)
    content = message_data["content"]
    if isinstance(content, str):
        text = content
        images = []
    elif isinstance(content, list):
        text = ""
        images = [c for c in content if c.get("type") == "image"]

    # 3. 调用 Agent (30 行)
    agent = get_agent()
    response = await agent.chat(text, images)

    # 4. 格式化响应 (20 行)
    formatted = {
        "text": response.text,
        "images": response.images,
        "timestamp": datetime.now().isoformat(),
    }

    return formatted
```

#### 重构后：拆分函数

```python
async def process_message(message_data: dict) -> dict:
    """处理消息 - 清晰的逻辑"""
    # 1. 验证
    validated_data = validate_message_data(message_data)

    # 2. 解析
    parsed_content = parse_message_content(validated_data["content"])

    # 3. 处理
    agent = get_agent()
    response = await agent.chat(
        parsed_content["text"],
        parsed_content["images"],
    )

    # 4. 格式化
    return format_response(response)

def validate_message_data(data: dict) -> dict:
    """验证消息数据"""
    if not data.get("content"):
        raise ValueError("Content is required")
    if not data.get("sender_id"):
        raise ValueError("Sender ID is required")
    return data

def parse_message_content(content) -> dict:
    """解析消息内容"""
    if isinstance(content, str):
        return {"text": content, "images": []}
    elif isinstance(content, list):
        text = ""
        images = [c for c in content if c.get("type") == "image"]
        return {"text": text, "images": images}
    else:
        raise ValueError(f"Unsupported content type: {type(content)}")

def format_response(response) -> dict:
    """格式化响应"""
    return {
        "text": response.text,
        "images": response.images,
        "timestamp": datetime.now().isoformat(),
    }
```

### 2.2 引入策略模式

#### 重构前：大量条件判断

```python
async def send_message(channel_type: str, message: dict):
    """发送消息 - 大量 if-else"""
    if channel_type == "feishu":
        client = FeishuClient()
        await client.send(message)
    elif channel_type == "dingtalk":
        client = DingTalkClient()
        await client.send(message)
    elif channel_type == "qq":
        client = QQClient()
        await client.send(message)
    # ... 更多渠道
```

#### 重构后：策略模式

```python
# 1. 定义策略接口
class MessageSender(ABC):
    @abstractmethod
    async def send(self, message: dict) -> bool:
        pass

# 2. 实现具体策略
class FeishuSender(MessageSender):
    async def send(self, message: dict) -> bool:
        client = FeishuClient()
        return await client.send(message)

class DingTalkSender(MessageSender):
    async def send(self, message: dict) -> bool:
        client = DingTalkClient()
        return await client.send(message)

# 3. 策略工厂
class SenderFactory:
    _senders = {
        "feishu": FeishuSender,
        "dingtalk": DingTalkSender,
        "qq": QQSender,
    }

    @classmethod
    def get_sender(cls, channel_type: str) -> MessageSender:
        sender_class = cls._senders.get(channel_type)
        if not sender_class:
            raise ValueError(f"Unknown channel type: {channel_type}")
        return sender_class()

# 4. 使用策略
async def send_message(channel_type: str, message: dict):
    sender = SenderFactory.get_sender(channel_type)
    return await sender.send(message)
```

### 2.3 使用装饰器简化代码

```python
# 1. 重试装饰器
from functools import wraps
import asyncio

def retry(
    max_attempts: int = 3,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
):
    """重试装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        wait_time = backoff_factor ** attempt
                        logger.warning(
                            f"Attempt {attempt + 1} failed, "
                            f"retrying in {wait_time}s: {e}"
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"All {max_attempts} attempts failed")
            raise last_exception
        return wrapper
    return decorator

# 使用装饰器
@retry(max_attempts=3, exceptions=(TimeoutError, ConnectionError))
async def fetch_with_retry(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# 2. 缓存装饰器
from functools import lru_cache
import hashlib
import pickle

def async_cache(ttl: int = 3600):
    """异步缓存装饰器"""
    cache = {}

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            key = hashlib.md5(
                pickle.dumps((args, kwargs))
            ).hexdigest()

            # 检查缓存
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < ttl:
                    return result

            # 执行函数
            result = await func(*args, **kwargs)

            # 存入缓存
            cache[key] = (result, time.time())

            return result
        return wrapper
    return decorator

@async_cache(ttl=600)  # 缓存 10 分钟
async def get_user_profile(user_id: str):
    # 获取用户信息，会缓存 10 分钟
    return await database.fetch_user(user_id)
```

---

## 内存管理

### 3.1 减少内存占用

```python
# ❌ 不好：一次性加载所有数据
async def load_all_users():
    users = await db.execute("SELECT * FROM users")
    # 假设有 100 万用户，全部加载到内存
    return users

# ✅ 优化：分批加载
async def load_users_batch(batch_size: int = 1000):
    offset = 0
    while True:
        batch = await db.execute(
            f"SELECT * FROM users LIMIT {batch_size} OFFSET {offset}"
        )
        if not batch:
            break
        yield batch
        offset += batch_size

# 使用生成器
async for batch in load_users_batch():
    # 每次只处理 1000 条
    process_batch(batch)
```

### 3.2 及时释放资源

```python
# ❌ 不好：没有释放资源
async def process_large_file(file_path: str):
    f = open(file_path, 'rb')
    data = f.read()  # 大文件占用内存
    result = process_data(data)
    # 文件没有关闭
    return result

# ✅ 优化：使用上下文管理器
async def process_large_file(file_path: str):
    async with aiofiles.open(file_path, 'rb') as f:
        # 分块读取
        while chunk := await f.read(8192):  # 8KB 块
            result = process_chunk(chunk)
            yield result
    # 文件自动关闭
```

### 3.3 使用弱引用

```python
import weakref
from typing import WeakKeyDictionary

# ❌ 不好：强引用导致内存泄漏
class Cache:
    def __init__(self):
        self._cache = {}  # 强引用

    def get(self, key):
        return self._cache.get(key)

    def set(self, key, value):
        self._cache[key] = value

# ✅ 优化：使用弱引用
class WeakCache:
    def __init__(self):
        self._cache = weakref.WeakValueDictionary()

    def get(self, key):
        return self._cache.get(key)

    def set(self, key, value):
        self._cache[key] = value
        # 当对象不再被使用时，自动从缓存中移除
```

---

## 并发处理

### 4.1 异步编程最佳实践

```python
# ❌ 不好：阻塞事件循环
async def blocking_operation():
    time.sleep(5)  # 阻塞整个事件循环
    return "done"

# ✅ 优化：使用异步 sleep
async def non_blocking_operation():
    await asyncio.sleep(5)  # 不阻塞
    return "done"

# ❌ 不好：串行执行
async def fetch_multiple_urls(urls):
    results = []
    for url in urls:
        result = await fetch_url(url)
        results.append(result)
    return results

# ✅ 优化：并发执行
async def fetch_multiple_urls(urls):
    tasks = [fetch_url(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### 4.2 使用线程池执行 CPU 密集任务

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

# CPU 密集任务
def cpu_intensive_task(data: bytes) -> str:
    # 处理数据（CPU 密集）
    return process_data(data)

# ❌ 不好：在事件循环中执行
async def process_slow(data: bytes):
    # 会阻塞事件循环
    result = cpu_intensive_task(data)
    return result

# ✅ 优化：使用进程池
async def process_fast(data: bytes):
    loop = asyncio.get_event_loop()
    with ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(
            pool,
            cpu_intensive_task,
            data,
        )
    return result
```

### 4.3 使用信号量限制并发

```python
import asyncio

class RateLimiter:
    """速率限制器"""
    def __init__(self, rate: int, per: float = 1.0):
        self.rate = rate
        self.per = per
        self.semaphore = asyncio.Semaphore(rate)
        self.reset_time = per
        self.tasks = []

    async def __aenter__(self):
        await self.semaphore.acquire()
        return self

    async def __aexit__(self, *args):
        await asyncio.sleep(self.reset_time)
        self.semaphore.release()

# 使用
async def fetch_with_rate_limit(urls, rate: int = 10):
    limiter = RateLimiter(rate=rate, per=1.0)

    async def fetch_one(url):
        async with limiter:
            return await fetch_url(url)

    tasks = [fetch_one(url) for url in urls]
    return await asyncio.gather(*tasks)
```

---

## 缓存优化

### 5.1 多级缓存

```python
from typing import Optional

class MultiLevelCache:
    """多级缓存系统"""

    def __init__(self):
        self.l1_cache = {}  # 内存缓存
        self.l2_cache = {}  # Redis 缓存
        self.l1_ttl = 60    # L1 缓存 1 分钟
        self.l2_ttl = 3600  # L2 缓存 1 小时

    async def get(self, key: str) -> Optional[str]:
        # 1. 尝试 L1 缓存
        if key in self.l1_cache:
            value, timestamp = self.l1_cache[key]
            if time.time() - timestamp < self.l1_ttl:
                return value
            else:
                del self.l1_cache[key]

        # 2. 尝试 L2 缓存
        l2_value = await self._get_from_l2(key)
        if l2_value:
            # 回填 L1 缓存
            self.l1_cache[key] = (l2_value, time.time())
            return l2_value

        # 3. 缓存未命中
        return None

    async def set(self, key: str, value: str):
        # 写入 L1 和 L2
        self.l1_cache[key] = (value, time.time())
        await self._set_to_l2(key, value)

    async def _get_from_l2(self, key: str) -> Optional[str]:
        # 从 Redis 获取
        return await self.redis.get(key)

    async def _set_to_l2(self, key: str, value: str):
        # 存入 Redis
        await self.redis.setex(key, self.l2_ttl, value)
```

### 5.2 智能缓存失效

```python
class SmartCache:
    """智能缓存系统"""

    def __init__(self, max_size: int = 1000):
        self.cache = {}
        self.access_time = {}
        self.max_size = max_size

    async def get(self, key: str):
        if key in self.cache:
            # 更新访问时间
            self.access_time[key] = time.time()
            return self.cache[key]
        return None

    async def set(self, key: str, value: str):
        # 缓存已满，淘汰最少使用的项
        if len(self.cache) >= self.max_size:
            # 找到最少使用的键
            lru_key = min(self.access_time, key=self.access_time.get)
            del self.cache[lru_key]
            del self.access_time[lru_key]

        self.cache[key] = value
        self.access_time[key] = time.time()

    async def invalidate(self, pattern: str):
        """按模式失效缓存"""
        keys_to_delete = [
            key for key in self.cache
            if fnmatch.fnmatch(key, pattern)
        ]
        for key in keys_to_delete:
            del self.cache[key]
            del self.access_time[key]
```

---

## 监控与分析

### 6.1 性能监控

```python
import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def monitor_performance(func):
    """性能监控装饰器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            elapsed = time.time() - start_time
            logger.info(
                f"{func.__name__} executed in {elapsed:.3f}s"
            )

            # 性能预警
            if elapsed > 1.0:
                logger.warning(
                    f"{func.__name__} is slow ({elapsed:.3f}s)"
                )

    return wrapper

# 使用
@monitor_performance
async def slow_function():
    await asyncio.sleep(2)
```

### 6.2 内存监控

```python
import psutil
import asyncio

class MemoryMonitor:
    """内存监控"""

    def __init__(self, threshold_mb: int = 1024):
        self.threshold_mb = threshold_mb
        self.process = psutil.Process()

    async def monitor(self, interval: int = 60):
        """定期检查内存使用"""
        while True:
            memory_mb = self.process.memory_info().rss / 1024 / 1024

            if memory_mb > self.threshold_mb:
                logger.warning(
                    f"High memory usage: {memory_mb:.1f}MB"
                )

                # 触发内存清理
                await self.cleanup()

            await asyncio.sleep(interval)

    async def cleanup(self):
        """清理内存"""
        # 清理缓存
        # 压缩记忆
        # 释放资源
        logger.info("Performing memory cleanup")
```

### 6.3 性能基准测试

```python
import pytest
import asyncio

@pytest.mark.benchmark
async def test_file_search_performance(benchmark):
    """基准测试文件搜索"""

    async def search():
        from copaw.agents.tools.file_search import grep_search
        return await grep_search(
            pattern="import",
            path="src/copaw/",
            is_regex=False,
        )

    # 运行多次取平均
    result = benchmark(search)
    assert result is not None
```

---

## 优化案例

### 案例 1：优化 Agent 启动时间

```python
# 优化前：每次启动都加载所有技能
class CoPawAgent:
    def __init__(self, config):
        # 串行加载所有技能
        for skill_dir in skill_dirs:
            self._load_skill(skill_dir)  # 慢

# 优化后：懒加载 + 并行加载
class CoPawAgent:
    def __init__(self, config):
        self._skill_dirs = skill_dirs
        self._loaded_skills = {}

    async def get_skill(self, skill_name: str):
        """按需加载技能"""
        if skill_name not in self._loaded_skills:
            # 并行加载多个技能
            tasks = [
                self._load_skill_async(d)
                for d in self._skill_dirs
            ]
            await asyncio.gather(*tasks)
        return self._loaded_skills[skill_name]
```

### 案例 2：优化消息处理吞吐量

```python
# 优化前：串行处理消息
async def process_messages(messages):
    results = []
    for msg in messages:
        result = await agent.chat(msg)
        results.append(result)
    return results

# 优化后：批量处理
async def process_messages_batch(messages, batch_size=10):
    results = []

    for i in range(0, len(messages), batch_size):
        batch = messages[i:i+batch_size]

        # 并行处理一个批次
        tasks = [agent.chat(msg) for msg in batch]
        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)

    return results
```

---

## 优化检查清单

### 性能检查清单

- [ ] 识别了性能瓶颈
- [ ] 使用了合适的数据结构
- [ ] 优化了 I/O 操作
- [ ] 使用了并发处理
- [ ] 实现了缓存机制
- [ ] 减少了内存占用
- [ ] 添加了性能监控
- [ ] 进行了基准测试

### 代码质量检查清单

- [ ] 遵循了代码规范
- [ ] 添加了类型注解
- [ ] 编写了文档字符串
- [ ] 实现了错误处理
- [ ] 编写了单元测试
- [ ] 进行了代码审查
- [ ] 更新了相关文档

---

## 总结

### 优化的核心原则

1. **测量优先**：先测量，后优化
2. **瓶颈优先**：优化真正的瓶颈
3. **小步快跑**：渐进式优化
4. **保持可读**：不牺牲代码可读性
5. **持续监控**：建立监控机制

### 优化工具箱

```python
# 性能分析
- cProfile
- line_profiler
- memory_profiler

# 监控工具
- Prometheus
- Grafana
- Sentry

# 优化技巧
- 异步编程
- 并发处理
- 缓存机制
- 批量操作
- 懒加载
```

---

**持续优化，追求卓越！** ⚡
