# 参考文档

本目录提供详细的代码示例和实现细节参考。

## 📄 文档列表

### [代码实例与模式](./code-examples.md)
**完整的代码示例** - 9 大类代码模式，50+ 实际示例

**内容概要**：
- 🔌 渠道系统实现模式（BaseChannel、飞书渠道、消息渲染）
- 🛠️ 工具系统实现（文件搜索、Shell 命令、安全处理）
- 🤖 模型管理（ProviderManager、OpenAI 兼容）
- 🎨 技能系统（技能结构、文档格式、Cron 技能）
- ⚙️ Agent 初始化（工作空间、Agent 创建）
- 📱 多模态处理（内容类型、消息处理）
- ⚠️ 错误处理（工具错误、渠道错误、重试机制）
- ⚡ 性能优化（懒加载、连接池、缓存）
- 🔒 安全模式（路径验证、命令过滤）

### [实现细节](./implementation-details.md)
**深入的实现细节** - 8 大关键流程，30+ 实现说明

**内容概要**：
- 📨 消息处理流程（接收、解析、处理、发送）
- 🔄 Agent 生命周期（初始化、运行、关闭）
- 🔧 工具注册与调用（注册、调用、安全检查）
- 🧠 记忆系统（管理器、压缩钩子、搜索）
- ⚙️ 配置管理（结构、加载、保存）
- 🔌 WebSocket 连接（飞书、重连机制）
- 📁 文件上传（接口、图片处理）
- 🛡️ 错误恢复（Agent 错误、渠道错误）

---

## 🎯 使用场景

### 场景 1：学习代码实现
→ 阅读 [代码实例与模式](./code-examples.md)
- 理解设计模式
- 学习最佳实践
- 参考实际代码

### 场景 2：深入关键流程
→ 阅读 [实现细节](./implementation-details.md)
- 消息处理流程
- Agent 生命周期
- 工具调用机制

### 场景 3：开发新功能
→ 结合两份文档
- 参考代码示例
- 理解实现细节
- 遵循设计模式

---

## 📖 代码导航

### 按模块查看

#### 渠道系统
- **[BaseChannel 抽象](./code-examples.md#渠道系统实现模式)**
- **[飞书渠道实现](./code-examples.md#飞书渠道实现)**
- **[消息渲染器](./code-examples.md#消息渲染与发送)**
- **[消息处理流程](./implementation-details.md#消息处理流程)**

#### Agent 系统
- **[Agent 初始化](./code-examples.md#agent-初始化流程)**
- **[Agent 生命周期](./implementation-details.md#agent-生命周期)**
- **[工具注册](./implementation-details.md#工具注册与调用)**

#### 工具系统
- **[文件搜索工具](./code-examples.md#文件搜索工具)**
- **[Shell 命令工具](./code-examples.md#shell-命令执行工具)**
- **[工具安全检查](./implementation-details.md#工具注册与调用)**

#### 技能系统
- **[技能信息结构](./code-examples.md#技能系统实现)**
- **[Cron 技能示例](./code-examples.md#cron-技能示例)**
- **[News 技能示例](./code-examples.md#news-技能示例)**

#### 模型系统
- **[ProviderManager](./code-examples.md#模型提供商管理)**
- **[OpenAI 兼容提供商](./code-examples.md#openai-兼容提供商)**

### 按设计模式查看

#### 创建型模式
- **[工厂模式](./code-examples.md#模型工厂)** - ModelFactory
- **[单例模式](./implementation-details.md#配置管理)** - ProviderManager

#### 结构型模式
- **[适配器模式](./code-examples.md#渠道适配)** - Channel 适配
- **[装饰器模式](./code-examples.md#工具装饰)** - Tool Guard

#### 行为型模式
- **[策略模式](./code-examples.md#渠道策略)** - 不同渠道策略
- **[观察者模式](./implementation-details.md#钩子系统)** - Memory Hooks

---

## 🔍 代码查找

### 按文件查找
```
src/copaw/agents/
├── react_agent.py          # 核心 Agent 实现
├── skills_manager.py        # 技能管理
├── tools/                   # 内置工具
│   ├── file_search.py      # 文件搜索
│   ├── shell.py            # Shell 命令
│   └── ...
└── skills/                  # 内置技能
    ├── cron/               # 定时任务
    ├── news/               # 新闻摘要
    └── ...

src/copaw/app/
├── channels/               # 渠道实现
│   ├── base.py            # 基类
│   ├── feishu/            # 飞书
│   ├── qq/                # QQ
│   └── ...
├── routers/               # API 路由
└── workspace/             # 工作空间

src/copaw/providers/        # 模型提供商
├── provider_manager.py    # 提供商管理
├── openai_provider.py     # OpenAI 兼容
└── ...
```

### 按功能查找
- **渠道相关** → `src/copaw/app/channels/`
- **Agent 相关** → `src/copaw/agents/`
- **工具相关** → `src/copaw/agents/tools/`
- **技能相关** → `src/copaw/agents/skills/`
- **模型相关** → `src/copaw/providers/`

---

## 💡 最佳实践

### 1. 错误处理
```python
# 好的做法
async def safe_operation():
    try:
        result = await risky_operation()
        return result
    except TimeoutError:
        logger.error("Timeout")
        raise
    except Exception as e:
        logger.exception("Unexpected error")
        raise
```

### 2. 资源管理
```python
# 使用上下文管理器
async with aiofiles.open(filepath, 'r') as f:
    content = await f.read()
# 文件自动关闭
```

### 3. 异步编程
```python
# 并行执行
results = await asyncio.gather(
    task1(),
    task2(),
    task3(),
)
```

---

## 🔗 相关文档

- **[快速开始](../01-getting-started/)** - 使用 CoPaw
- **[功能详解](../02-features/)** - 了解功能
- **[开发指南](../04-development/)** - 参与开发

---

**深入理解 CoPaw 的实现细节！** 🔧
