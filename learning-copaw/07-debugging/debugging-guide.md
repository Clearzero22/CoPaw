# CoPaw 调试完全指南

> 从问题定位到解决，系统化的调试方法

## 📋 目录
1. [调试准备](#调试准备)
2. [日志调试](#日志调试)
3. [断点调试](#断点调试)
4. [远程调试](#远程调试)
5. [性能调试](#性能调试)
6. [常见问题排查](#常见问题排查)

---

## 调试准备

### 1.1 启用调试模式

```bash
# 方法 1：通过环境变量
export LOG_LEVEL=debug
export COPAW_DEBUG=1
copaw app

# 方法 2：通过命令行参数
copaw app --log-level debug

# 方法 3：在代码中启用
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 1.2 配置开发环境

**VSCode 启动配置** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CoPaw App",
      "type": "debugpy",
      "request": "launch",
      "module": "copaw.cli.main",
      "args": ["app", "--log-level", "debug"],
      "console": "integratedTerminal",
      "env": {
        "LOG_LEVEL": "debug",
        "COPAW_DEBUG": "1"
      },
      "justMyCode": false
    },
    {
      "name": "Debug CoPaw Agent",
      "type": "debugpy",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      }
    }
  ]
}
```

### 1.3 查看日志文件

```bash
# 查看实时日志
tail -f ~/.copaw/logs/copaw.log

# 查看错误日志
grep ERROR ~/.copaw/logs/copaw.log

# 查看特定模块的日志
grep "agents" ~/.copaw/logs/copaw.log

# 查看最近的日志
tail -n 100 ~/.copaw/logs/copaw.log
```

---

## 日志调试

### 2.1 添加调试日志

```python
# 方法 1：使用 logging 模块
import logging

logger = logging.getLogger(__name__)

async def process_message(message: dict):
    logger.debug(f"Processing message: {message}")

    try:
        result = await do_something(message)
        logger.info(f"Message processed successfully: {result}")
        return result

    except Exception as e:
        logger.error(f"Failed to process message: {e}", exc_info=True)
        raise

# 方法 2：使用 print 调试（快速方法）
def debug_function(x):
    print(f"DEBUG: Input x = {x}")
    result = x * 2
    print(f"DEBUG: Result = {result}")
    return result

# 方法 3：使用结构化日志
import json

def structured_log(level: str, message: str, **kwargs):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message,
        "context": kwargs
    }
    print(json.dumps(log_entry))

# 使用
structured_log("DEBUG", "Processing request",
               user_id="123", action="login")
```

### 2.2 日志级别说明

```python
# 级别从低到高
DEBUG = 10      # 详细信息，通常只在诊断问题时使用
INFO = 20       # 确认事情按预期工作
WARNING = 30    # 警告信息，但程序仍能继续
ERROR = 40      # 错误信息，程序无法执行某些功能
CRITICAL = 50   # 严重错误，程序本身可能无法继续

# 设置日志级别
import logging

# 显示所有级别
logging.basicConfig(level=logging.DEBUG)

# 只显示 WARNING 及以上
logging.basicConfig(level=logging.WARNING)

# 自定义格式
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
```

### 2.3 模块级日志配置

```python
# 为不同模块设置不同的日志级别
import logging

# 配置根日志记录器
logging.basicConfig(level=logging.INFO)

# 为特定模块设置 DEBUG 级别
agents_logger = logging.getLogger('copaw.agents')
agents_logger.setLevel(logging.DEBUG)

# 为渠道模块设置 WARNING 级别
channels_logger = logging.getLogger('copaw.app.channels')
channels_logger.setLevel(logging.WARNING)
```

---

## 断点调试

### 3.1 使用 pdb 断点

```python
# 方法 1：直接设置断点
import pdb; pdb.set_trace()

def complex_function(x, y):
    result = x + y
    pdb.set_trace()  # 程序会在这里暂停
    result *= 2
    return result

# 方法 2：使用 ipdb（更友好）
# pip install ipdb
import ipdb; ipdb.set_trace()

def complex_function(x, y):
    result = x + y
    ipdb.set_trace()  # 程序会在这里暂停
    result *= 2
    return result

# 方法 3：使用 breakpoint()（Python 3.7+）
def complex_function(x, y):
    result = x + y
    breakpoint()  # 程序会在这里暂停
    result *= 2
    return result
```

### 3.2 pdb 常用命令

```bash
# pdb 交互命令

# 查看代码
l          # list，显示当前位置的代码
l 5 10     # 显示第 5-10 行的代码

# 单步执行
n          # next，执行下一行（不进入函数）
s          # step，执行下一行（进入函数）
c          # continue，继续执行直到下一个断点

# 查看变量
p variable  # print，打印变量值
p locals()  # 打印所有局部变量
p globals() # 打印所有全局变量

# 修改变量
p x = 10    # 修改变量 x 的值

# 查看调用栈
w          # where，显示调用栈

# 设置断点
b 10        # 在第 10 行设置断点
b function_name  # 在函数入口设置断点

# 清除断点
cl         # clear，清除所有断点
cl 2        # 清除第 2 个断点

# 退出调试
q          # quit，退出调试器
```

### 3.3 VSCode 断点调试

```python
# 在代码中设置断点
def process_message(message: dict):
    # 点击行号左侧设置断点
    content = message.get("content", "")

    # 条件断点（右键行号 → Add Conditional Breakpoint）
    if len(content) > 1000:  # 只有当 content 长度 > 1000 时才中断
        breakpoint()

    # 日志断点（不中断程序，只输出日志）
    # 右键行号 → Add Logpoint
    result = process(content)
    return result
```

### 3.4 调试异步代码

```python
import asyncio
import pdb

# 调试异步函数需要特殊处理
async def async_function():
    # 方法 1：使用 asyncio.get_event_loop()
    loop = asyncio.get_event_loop()
    debugger = pdb.Pdb()
    debugger.set_trace(sys._getframe())

    await asyncio.sleep(1)
    return "done"

# 方法 2：使用 asyncio.copas
async def async_function():
    # 使用 asyncio.Queue 进行调试
    queue = asyncio.Queue()

    async def debug_task():
        import pdb; pdb.set_trace()
        result = await queue.get()
        return result

    task = asyncio.create_task(debug_task())

    # 继续执行
    await asyncio.sleep(0.1)
    await queue.put("test")

    result = await task
    return result
```

---

## 远程调试

### 4.1 启用远程调试服务器

```python
# 在目标代码中添加调试服务器
import debugpy

# 启动调试服务器
debugpy.listen(5678)
print("Waiting for debugger attach...")
debugpy.wait_for_client()

# 你的代码
async def main():
    debugpy.breakpoint()  # 设置断点
    # 你的代码逻辑
    pass

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 4.2 VSCode 远程调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Remote Attach",
      "type": "debugpy",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}",
          "remoteRoot": "${workspaceFolder}"
        }
      ]
    }
  ]
}
```

### 4.3 Docker 容器内调试

```dockerfile
# Dockerfile
FROM python:3.10-slim

# 安装调试工具
RUN pip install debugpy

# 暴露调试端口
EXPOSE 5678

# 启动应用时启用调试
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "--wait-for-client", "copaw/cli/main.py", "app"]
```

```bash
# 构建 Docker 镜像
docker build -t copaw:debug .

# 运行容器
docker run -p 8088:8088 -p 5678:5678 copaw:debug

# 在 VSCode 中使用 "Python: Remote Attach" 连接到 5678
```

---

## 性能调试

### 5.1 性能分析

```python
import cProfile
import pstats
import io

def profile_function(func):
    """性能分析装饰器"""
    def wrapper(*args, **kwargs):
        # 创建性能分析器
        pr = cProfile.Profile()
        pr.enable()

        # 执行函数
        result = func(*args, **kwargs)

        pr.disable()

        # 输出统计信息
        s = io.StringIO()
        ps = pstats.Stats(pr).sort_stats('cumulative')
        ps.print_stats(20, stream=s)
        print(s.getvalue())

        return result
    return wrapper

# 使用
@profile_function
def slow_function():
    # 你的代码
    pass
```

### 5.2 内存分析

```python
import tracemalloc

def profile_memory(func):
    """内存分析装饰器"""
    def wrapper(*args, **kwargs):
        # 开始跟踪
        tracemalloc.start()

        # 执行函数
        result = func(*args, **kwargs)

        # 获取快照
        snapshot = tracemalloc.take_snapshot()
        top_stats = snapshot.statistics('lineno')

        # 打印前 10 个内存使用
        print("[Memory Profile]")
        for stat in top_stats[:10]:
            print(stat)

        return result
    return wrapper

# 使用
@profile_memory
def memory_intensive_function():
    # 你的代码
    pass
```

### 5.3 异步性能监控

```python
import asyncio
import time
from functools import wraps

def monitor_async_performance(func):
    """异步性能监控装饰器"""
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
@monitor_async_performance
async def slow_async_function():
    await asyncio.sleep(2)
```

---

## 常见问题排查

### 6.1 Agent 无响应

**症状**：发送消息后 Agent 没有回应

**排查步骤**：

```bash
# 1. 检查进程是否运行
ps aux | grep copaw

# 2. 检查端口是否被占用
lsof -i :8088

# 3. 查看日志
tail -f ~/.copaw/logs/copaw.log

# 4. 检查配置
cat ~/.copaw/config.yaml

# 5. 测试 API
curl http://127.0.0.1:8088/api/health

# 6. 检查模型配置
cat ~/.copaw/working.secret/providers.yaml
```

**常见原因**：
- API 密钥未配置或已过期
- 网络连接问题
- 模型服务不可用
- 配置文件损坏

### 6.2 渠道连接失败

**症状**：渠道无法连接或频繁断开

**排查步骤**：

```python
# 添加调试代码
class FeishuChannel(BaseChannel):
    async def _connect_with_debug(self):
        """带调试的连接"""
        logger.debug(f"Connecting to Feishu...")
        logger.debug(f"App ID: {self.app_id}")

        try:
            await self._client.connect()
            logger.info("Connected to Feishu successfully")

        except Exception as e:
            logger.error(f"Connection failed: {e}", exc_info=True)
            logger.debug(f"Client state: {self._client}")
            raise

# 检查网络连接
async def check_network_connectivity():
    import httpx

    hosts = [
        "https://open.feishu.cn",
        "https://api.dingtalk.com",
    ]

    async with httpx.AsyncClient() as client:
        for host in hosts:
            try:
                response = await client.get(host, timeout=5.0)
                print(f"{host}: OK ({response.status_code})")
            except Exception as e:
                print(f"{host}: FAILED ({e})")
```

### 6.3 内存泄漏

**症状**：长时间运行后内存占用持续增长

**排查步骤**：

```python
import tracemalloc
import gc

def check_memory_leak():
    """检查内存泄漏"""
    # 开始跟踪
    tracemalloc.start()

    # 获取初始快照
    snapshot1 = tracemalloc.take_snapshot()

    # 执行可能泄漏的操作
    # ...

    # 强制垃圾回收
    gc.collect()

    # 获取结束快照
    snapshot2 = tracemalloc.take_snapshot()

    # 比较快照
    top_stats = snapshot2.compare_to(snapshot1)[:10]

    print("[Memory Leak Detection]")
    for stat in top_stats:
        print(stat)

# 定期检查内存
async def monitor_memory():
    """定期监控内存"""
    import psutil

    process = psutil.Process()

    while True:
        memory_info = process.memory_info()
        rss_mb = memory_info.rss / 1024 / 1024

        logger.info(f"Memory usage: {rss_mb:.1f}MB")

        if rss_mb > 1024:  # 超过 1GB
            logger.warning("High memory usage detected")
            # 触发内存分析
            check_memory_leak()

        await asyncio.sleep(60)
```

### 6.4 消息丢失

**症状**：部分消息没有被处理

**排查步骤**：

```python
# 添加消息跟踪
async def process_message_with_trace(message: dict):
    """带跟踪的消息处理"""
    message_id = message.get("id", "unknown")
    logger.info(f"[{message_id}] Processing message")

    try:
        # 处理消息
        result = await do_process(message)
        logger.info(f"[{message_id}] Message processed successfully")
        return result

    except Exception as e:
        logger.error(
            f"[{message_id}] Message processing failed: {e}",
            exc_info=True
        )
        raise

# 检查消息队列
async def check_queue_status():
    """检查队列状态"""
    # 获取队列大小
    queue_size = await message_queue.qsize()
    logger.info(f"Current queue size: {queue_size}")

    if queue_size > 1000:
        logger.warning("Message queue is backing up!")
```

---

## 调试技巧

### 技巧 1：二分法调试

```python
def binary_search_bug(start, end):
    """二分法查找问题"""
    if start >= end:
        return

    mid = (start + end) // 2

    print(f"Testing range [{start}, {end}], mid: {mid}")

    # 测试中间位置
    if test_function(mid):
        # 问题在前半部分
        binary_search_bug(start, mid)
    else:
        # 问题在后半部分
        binary_search_bug(mid + 1, end)
```

### 技巧 2：增量调试

```python
# 先测试最简单的版本
def simple_version():
    return "simple"

# 逐步添加功能
def add_feature_1():
    result = simple_version()
    result += " feature1"
    return result

def add_feature_2():
    result = add_feature_1()
    result += " feature2"
    return result

# 如果出错，可以准确定位是哪个功能出问题
```

### 技巧 3：对比调试

```python
# 创建一个可以工作的版本
def working_version(x, y):
    return x + y

# 创建可能有问题的新版本
def new_version(x, y):
    # 新的实现
    return x * y

# 对比结果
x, y = 3, 4
result1 = working_version(x, y)
result2 = new_version(x, y)

print(f"Working: {result1}, New: {result2}")
if result1 != result2:
    print("Results differ!")
```

---

## 调试工具清单

### 必备工具

```bash
# Python 调试器
pip install pdb ipdb debugpy

# 性能分析
pip install line_profiler memory_profiler py-spy

# 日志工具
# Python 内置：logging
# 第三方：loguru

# 网络调试
pip install httpx websockets
```

### VSCode 扩展

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.debugpy",
    "ms-python.pylint",
    "ms-python.vscode-pylance",
    "tamasfe.even-better-toml",
    "github.vscode-pull-request-github"
  ]
}
```

---

## 总结

### 调试流程

```
1. 启用调试模式
   ↓
2. 添加日志/断点
   ↓
3. 运行程序
   ↓
4. 观察行为
   ↓
5. 定位问题
   ↓
6. 修复代码
   ↓
7. 验证修复
   ↓
8. 移除调试代码
```

### 最佳实践

- ✅ **分层调试**：先确认问题在哪一层
- ✅ **最小化问题**：创建可复现的最小案例
- ✅ **保留证据**：记录错误日志、堆栈信息
- ✅ **版本回退**：使用 git bisect 找到问题提交
- ✅ **请求帮助**：准备好可复现的步骤和环境信息

### 避免的做法

- ❌ 不要盲目修改代码
- ❌ 不要忽略错误信息
- ❌ 不要在生产环境直接调试
- ❌ 不要提交调试代码到主分支
- ❌ 不要过度依赖 print 调试

---

**掌握调试技巧，成为问题解决专家！** 🔧
