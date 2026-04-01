# 调试指南

本目录提供完整的调试指南，帮助你快速定位和解决问题。

## 📄 文档列表

### [调试完全指南](./debugging-guide.md)
**系统化的调试教程** - 从准备到解决的全流程

**内容概要**：
- 🔧 调试准备（启用调试模式、配置环境、查看日志）
- 📝 日志调试（添加日志、日志级别、模块配置）
- ⏸️ 断点调试（pdb、ipdb、VSCode、异步调试）
- 🌐 远程调试（远程服务器、Docker 容器）
- ⚡ 性能调试（性能分析、内存分析、监控）
- 🐛 常见问题排查（Agent 无响应、渠道连接失败、内存泄漏、消息丢失）

---

## 🎯 调试场景

### 场景 1：功能不工作
→ [常见问题排查 - Agent 无响应](./debuging-guide.md#61-agent-无响应)

**排查步骤**：
1. 检查进程运行状态
2. 查看日志文件
3. 验证配置文件
4. 测试 API 连接
5. 检查模型配置

### 场景 2：性能问题
→ [性能调试](./debuging-guide.md#5-性能调试)

**排查工具**：
- cProfile（性能分析）
- memory_profiler（内存分析）
- tracemalloc（内存跟踪）
- py-spy（采样分析器）

### 场景 3：连接问题
→ [常见问题排查 - 渠道连接失败](./debuging-guide.md#62-渠道连接失败)

**排查步骤**：
1. 检查网络连接
2. 验证凭证配置
3. 查看错误日志
4. 测试 API 端点
5. 重启服务

### 场景 4：内存问题
→ [常见问题排查 - 内存泄漏](./debuging-guide.md#63-内存泄漏)

**排查步骤**：
1. 监控内存使用
2. 分析内存快照
3. 检查缓存策略
4. 优化数据结构
5. 强制垃圾回收

---

## 🛠️ 调试工具箱

### Python 内置工具

```bash
# pdb 调试器
python -m pdb script.py

# cProfile 性能分析
python -m cProfile -o profile.stats script.py

# tracemalloc 内存跟踪
python -m tracemalloc script.py
```

### 第三方工具

```bash
# ipdb（增强的 pdb）
pip install ipdb

# debugpy（VSCode 调试后端）
pip install debugpy

# line_profiler（行级性能分析）
pip install line_profiler

# memory_profiler（内存分析）
pip install memory_profiler

# py-spy（采样分析器）
pip install py-spy
```

### 日志工具

```python
# logging 模块
import logging
logging.basicConfig(level=logging.DEBUG)

# loguru（第三方日志库）
pip install loguru
from loguru import logger
logger.debug("Debug message")
```

---

## 📖 快速参考

### 调试命令速查

```bash
# 启用调试模式
export LOG_LEVEL=debug
copaw app

# 查看实时日志
tail -f ~/.copaw/logs/copaw.log

# 搜索错误日志
grep ERROR ~/.copaw/logs/copaw.log

# 检查进程
ps aux | grep copaw

# 检查端口
lsof -i :8088

# 性能分析
python -m cProfile -s time copaw/cli/main.py app

# 内存分析
python -m memory_profiler copaw/cli/main.py app
```

### pdb 命令速查

```bash
n          # next，下一行（不进入函数）
s          # step，下一行（进入函数）
c          # continue，继续执行
l          # list，显示代码
p x        # print，打印变量 x
w          # where，调用栈
b 10       # break，在第 10 行设置断点
cl         # clear，清除断点
q          # quit，退出
```

---

## 💡 调试技巧

### 技巧 1：橡皮鸭调试法
```python
# 向别人（或橡皮鸭）解释问题
# 在解释过程中，往往能发现bug

def explain_problem():
    """
    我想计算列表的平均值

    输入：numbers = [1, 2, 3, 4, 5]

    步骤 1：计算总和
    total = 0
    for n in numbers:
        total += n

    步骤 2：计算平均值
    average = total / len(numbers)

    返回 average

    等等，我发现问题了！
    如果 numbers 是空列表会怎样？
    """
```

### 技巧 2：最小可复现示例
```python
# 将复杂问题简化为最小示例

# 复杂问题
async def complex_message_processing(message):
    # 100 行代码
    pass

# 简化为最小示例
async def minimal_example():
    message = {"content": "test"}
    await complex_message_processing(message)
```

### 技巧 3：对比调试
```python
# 对比工作版本和有问题版本

# 工作版本
def working_code(x):
    return x + 1

# 有问题的版本
def buggy_code(x):
    return x - 1

# 对比结果
for i in range(10):
    result1 = working_code(i)
    result2 = buggy_code(i)
    if result1 != result2:
        print(f"Found difference at {i}: {result1} vs {result2}")
```

---

## 🔗 相关文档

- **[代码修改指南](../06-advanced/code-modification-guide.md)** - 修复 Bug 的流程
- **[开发工作流](../04-development/development-workflow.md)** - 开发环境配置
- **[代码优化指南](../06-advanced/code-optimization-guide.md)** - 性能问题排查

---

## 📞 获取帮助

如果调试遇到困难：

1. **查看日志**：`~/.copaw/logs/copaw.log`
2. **搜索问题**：GitHub Issues
3. **询问社区**：Discord / 论坛
4. **提供信息**：
   - 操作系统和版本
   - CoPaw 版本
   - 完整错误信息
   - 复现步骤

---

**掌握调试技巧，快速解决问题！** 🐛
