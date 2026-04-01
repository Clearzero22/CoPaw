# CoPaw 开发工作流与最佳实践

## 目录
1. [开发环境搭建](#开发环境搭建)
2. [项目结构](#项目结构)
3. [开发流程](#开发流程)
4. [测试指南](#测试指南)
5. [调试技巧](#调试技巧)
6. [代码规范](#代码规范)
7. [贡献指南](#贡献指南)

---

## 开发环境搭建

### 1.1 基础环境

```bash
# 1. 克隆项目
git clone https://github.com/agentscope-ai/CoPaw.git
cd CoPaw

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -e ".[dev,full]"

# 4. 初始化配置
copaw init --defaults

# 5. 启动服务
copaw app
```

### 1.2 开发依赖

```bash
# 核心依赖
pip install agentscope agentscope-runtime
pip install fastapi uvicorn
pip install pydantic yaml

# 开发工具
pip install pytest pytest-asyncio
pip install black ruff mypy
pip install pre-commit

# 前端开发（需要修改 Console 时）
cd console
npm ci
npm run dev
```

### 1.3 IDE 配置

**VSCode 配置** (`.vscode/settings.json`):

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["tests/"],
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    ".pytest_cache": true
  }
}
```

**推荐插件**:
- Python
- Pylance
- pytest
- YAML
- Tailwind CSS IntelliSense (前端开发)

---

## 项目结构

### 2.1 源码结构

```
src/copaw/
├── agents/              # Agent 相关
│   ├── hooks/          # 生命周期钩子
│   │   ├── bootstrap.py
│   │   └── memory_compaction.py
│   ├── memory/         # 记忆管理
│   │   ├── agent_md_manager.py
│   │   └── manager.py
│   ├── skills/         # 内置技能
│   │   ├── cron/
│   │   ├── news/
│   │   └── ...
│   ├── tools/          # 内置工具
│   │   ├── file_io.py
│   │   ├── file_search.py
│   │   ├── shell.py
│   │   └── ...
│   ├── utils/          # 工具函数
│   ├── command_handler.py
│   ├── model_factory.py
│   ├── prompt.py
│   ├── react_agent.py
│   └── skills_manager.py
│
├── app/                # Web 应用
│   ├── channels/       # 渠道实现
│   │   ├── base.py
│   │   ├── feishu/
│   │   ├── qq/
│   │   └── ...
│   ├── crons/          # 定时任务
│   ├── mcp/            # MCP 客户端
│   ├── routers/        # API 路由
│   │   ├── agent.py
│   │   ├── agents.py
│   │   ├── config.py
│   │   └── ...
│   ├── runner/         # 运行器
│   ├── workspace/      # 工作空间
│   ├── auth.py
│   ├── multi_agent_manager.py
│   └── _app.py
│
├── cli/                # CLI 命令
│   ├── main.py
│   ├── init_cmd.py
│   ├── app_cmd.py
│   ├── agents_cmd.py
│   ├── channels_cmd.py
│   └── ...
│
├── config/             # 配置管理
│   ├── config.py
│   └── utils.py
│
├── console/            # Web 控制台前端
│   └── assets/
│
├── providers/          # 模型提供商
│   ├── provider_manager.py
│   ├── openai_provider.py
│   ├── anthropic_provider.py
│   └── ...
│
├── local_models/       # 本地模型
│   ├── backends/
│   │   ├── llamacpp_backend.py
│   │   └── mlx_backend.py
│   └── manager.py
│
├── security/           # 安全相关
│   ├── tool_guard/
│   └── skill_scanner/
│
├── utils/              # 通用工具
│   ├── logging.py
│   └── ...
│
└── constant.py         # 常量定义
```

### 2.2 配置文件

```
~/.copaw/
├── config.yaml         # 主配置
├── agents/             # Agent 配置
│   ├── default.yaml
│   └── custom.yaml
├── channels.yaml       # 渠道配置
└── tools.yaml          # 工具配置

~/.copaw/working/       # 工作目录
├── agents/             # Agent 工作空间
│   ├── default/
│   │   ├── memory/
│   │   ├── skills/
│   │   └── *.md
│   └── custom/
│
~/.copaw/working.secret/# 敏感配置
├── providers.yaml      # 提供商 API 密钥
└── channels.yaml       # 渠道密钥
```

---

## 开发流程

### 3.1 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feat/your-feature-name

# 2. 开发功能
# 编写代码
# 添加测试
# 更新文档

# 3. 本地测试
pytest tests/
copaw app  # 手动测试

# 4. 代码检查
black src/copaw/
ruff check src/copaw/
mypy src/copaw/

# 5. 提交代码
git add .
git commit -m "feat: add your feature description"

# 6. 推送分支
git push origin feat/your-feature-name

# 7. 创建 Pull Request
```

### 3.2 添加新渠道

```python
# 1. 创建渠道目录
mkdir -p src/copaw/app/channels/mychannel

# 2. 实现渠道类
# src/copaw/app/channels/mychannel/channel.py
from ..base import BaseChannel

class MyChannel(BaseChannel):
    channel = ChannelType.MYCHANNEL

    async def consume_one(self) -> None:
        """实现消息消费逻辑"""
        pass

    def resolve_session_id(
        self,
        sender_id: str,
        meta: dict,
    ) -> str:
        """实现会话 ID 解析"""
        pass

# 3. 添加配置
# src/copaw/config/config.py
class MyChannelConfig(BaseModel):
    app_id: str
    app_secret: str

# 4. 注册渠道
# src/copaw/app/channels/registry.py
ChannelType.MYCHANNEL = "mychannel"
```

### 3.3 添加新技能

```bash
# 1. 创建技能目录
mkdir -p src/copaw/agents/skills/my_skill

# 2. 创建技能文档
cat > src/copaw/agents/skills/my_skill/SKILL.md <<'EOF'
---
name: my_skill
description: "My custom skill"
metadata:
  {
    "builtin_skill_version": "1.0",
    "copaw": {
      "emoji": "🔧",
      "requires": {}
    }
  }
---

# My Skill

## 什么时候用

描述何时使用这个技能。

## 使用说明

详细的使用说明。
EOF

# 3. 实现技能逻辑
cat > src/copaw/agents/skills/my_skill/__init__.py <<'EOF'
"""My custom skill implementation."""

from agentscope.tool import tool

@tool
def my_tool(param: str) -> str:
    """Tool description.

    Args:
        param: Parameter description

    Returns:
        Result description
    """
    return f"Result: {param}"

tools = [my_tool]
EOF
```

### 3.4 添加新工具

```python
# src/copaw/agents/tools/my_tool.py

from agentscope.message import TextBlock
from agentscope.tool import ToolResponse
from pathlib import Path

async def my_custom_tool(
    param1: str,
    param2: int = 10,
) -> ToolResponse:
    """Tool description.

    Args:
        param1: First parameter
        param2: Second parameter (default: 10)

    Returns:
        ToolResponse: Result
    """
    try:
        # 1. 参数验证
        if not param1:
            return ToolResponse(
                content=[TextBlock(
                    type="text",
                    text="Error: param1 is required"
                )]
            )

        # 2. 执行逻辑
        result = f"Processed: {param1} with {param2}"

        # 3. 返回结果
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=result
            )]
        )

    except Exception as e:
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: {e}"
            )]
        )

# 注册工具
# src/copaw/agents/react_agent.py
from .tools.my_tool import my_custom_tool

class CoPawAgent(ToolGuardMixin, ReActAgent):
    def _register_builtin_tools(self):
        # ...
        self.register_tool(my_custom_tool)
```

---

## 测试指南

### 4.1 单元测试

```python
# tests/agents/test_tools.py

import pytest
from copaw.agents.tools.file_search import grep_search

@pytest.mark.asyncio
async def test_grep_search_basic():
    """测试基本搜索功能"""
    result = await grep_search(
        pattern="test",
        path="tests/fixtures/",
    )

    assert "test" in result.content[0].text.lower()

@pytest.mark.asyncio
async def test_grep_search_regex():
    """测试正则表达式搜索"""
    result = await grep_search(
        pattern=r"test\d+",
        path="tests/fixtures/",
        is_regex=True,
    )

    # 验证结果
    assert result.content[0].text

@pytest.mark.asyncio
async def test_grep_search_timeout():
    """测试超时处理"""
    with pytest.raises(Exception):
        await grep_search(
            pattern=".*",
            path="/",  # 大目录
        )
```

### 4.2 集成测试

```python
# tests/integration/test_agent_flow.py

import pytest
from copaw.agents.react_agent import CoPawAgent
from copaw.config.config import AgentProfileConfig

@pytest.mark.asyncio
async def test_agent_basic_flow():
    """测试 Agent 基本流程"""
    # 1. 创建配置
    config = AgentProfileConfig(
        name="test_agent",
        model_provider="openai",
        model_name="gpt-4",
        workspace_dir="/tmp/test_agent",
    )

    # 2. 初始化 Agent
    agent = CoPawAgent(
        agent_config=config,
        workspace_dir=Path("/tmp/test_agent"),
    )

    # 3. 发送消息
    response = await agent.chat("Hello")

    # 4. 验证响应
    assert response.role == "assistant"
    assert len(response.content) > 0
```

### 4.3 渠道测试

```python
# tests/channels/test_feishu_channel.py

import pytest
from copaw.app.channels.feishu.channel import FeishuChannel

@pytest.mark.asyncio
async def test_feishu_session_resolution():
    """测试会话 ID 解析"""
    channel = FeishuChannel(process=mock_process)

    # 群聊
    session_id = channel.resolve_session_id(
        sender_id="user_123",
        meta={"chat_type": "group", "chat_id": "group_456"},
    )
    assert "group_456" in session_id

    # 私聊
    session_id = channel.resolve_session_id(
        sender_id="user_123",
        meta={"chat_type": "p2p"},
    )
    assert "user_123" in session_id
```

### 4.4 运行测试

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/agents/test_tools.py

# 运行特定测试
pytest tests/agents/test_tools.py::test_grep_search_basic

# 显示详细输出
pytest -v

# 显示覆盖率
pytest --cov=src/copaw --cov-report=html

# 并行运行
pytest -n auto
```

---

## 调试技巧

### 5.1 日志调试

```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# 使用日志
logger.debug("Debug information")
logger.info("Information")
logger.warning("Warning")
logger.error("Error")
```

### 5.2 断点调试

```python
# 使用 pdb
import pdb; pdb.set_trace()

# 使用 ipdb（更友好）
import ipdb; ipdb.set_trace()

# VSCode 调试配置
# .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Current File",
            "type": "debugpy",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal",
            "args": ["--debug"]
        }
    ]
}
```

### 5.3 性能分析

```python
import cProfile
import pstats

# 分析函数性能
def profile_function():
    pr = cProfile.Profile()
    pr.enable()

    # 执行代码
    result = your_function()

    pr.disable()

    # 打印统计
    stats = pstats.Stats(pr)
    stats.sort_stats('cumulative')
    stats.print_stats(10)

    return result

# 使用 line_profiler
# @profile
def your_function():
    # 代码
    pass

# 运行
# kernprof -l -v script.py
```

### 5.4 内存分析

```python
import tracemalloc

# 开始跟踪
tracemalloc.start()

# 执行代码
result = your_function()

# 获取快照
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')

# 打印前 10 个
for stat in top_stats[:10]:
    print(stat)
```

### 5.5 常见问题排查

**问题 1：Agent 无响应**

```bash
# 检查日志
tail -f ~/.copaw/logs/copaw.log

# 检查进程
ps aux | grep copaw

# 检查端口
lsof -i :8088
```

**问题 2：渠道连接失败**

```python
# 检查配置
config = load_config()
print(config.channels)

# 检查网络
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.example.com")
    print(response.status_code)
```

**问题 3：内存泄漏**

```python
# 检查记忆数量
from copaw.agents.memory.agent_md_manager import AgentMdManager

md_manager = AgentMdManager(working_dir)
memories = md_manager.list_memory_mds()
print(f"Memory count: {len(memories)}")

# 压缩记忆
await agent.memory_manager.compact()
```

---

## 代码规范

### 6.1 Python 代码风格

```python
# 使用 Black 格式化
# pip install black
black src/copaw/

# 使用 Ruff 检查
# pip install ruff
ruff check src/copaw/

# 使用 mypy 类型检查
# pip install mypy
mypy src/copaw/

# 配置 pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310']

[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
```

### 6.2 命名规范

```python
# 类名：PascalCase
class CoPawAgent:
    pass

# 函数/变量：snake_case
def my_function():
    my_variable = 1

# 常量：UPPER_SNAKE_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 60

# 私有成员：前缀下划线
class MyClass:
    def __init__(self):
        self._private_var = 1

    def _private_method(self):
        pass
```

### 6.3 文档字符串

```python
def function_name(
    param1: str,
    param2: int,
    param3: Optional[str] = None,
) -> Dict[str, Any]:
    """函数简短描述。

    详细描述可以跨多行。

    Args:
        param1: 参数1的描述
        param2: 参数2的描述
        param3: 参数3的描述（可选）

    Returns:
        Dict[str, Any]: 返回值的描述

    Raises:
        ValueError: 当参数无效时
        ConnectionError: 当连接失败时

    Examples:
        >>> result = function_name("test", 10)
        >>> print(result)
        {'key': 'value'}
    """
    pass
```

### 6.4 类型注解

```python
from typing import Dict, List, Optional, Union, Callable, Any

# 基本类型
def example1(name: str, age: int) -> bool:
    return age > 18

# 容器类型
def example2(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}

# 可选类型
def example3(value: Optional[str] = None) -> str:
    return value or "default"

# 联合类型
def example4(value: Union[str, int]) -> str:
    return str(value)

# 回调类型
Callback = Callable[[str, int], bool]

def example5(callback: Callback) -> None:
    callback("test", 10)

# 泛型
from typing import TypeVar, Generic

T = TypeVar('T')

class Container(Generic[T]):
    def __init__(self, value: T):
        self.value = value
```

---

## 贡献指南

### 7.1 贡献流程

```bash
# 1. Fork 项目
# 在 GitHub 上 Fork CoPaw 仓库

# 2. 克隆你的 Fork
git clone https://github.com/your-username/CoPaw.git
cd CoPaw

# 3. 添加上游仓库
git remote add upstream https://github.com/agentscope-ai/CoPaw.git

# 4. 创建功能分支
git checkout -b feat/your-feature

# 5. 开发并测试
# 编写代码
# 运行测试
# 确保通过所有检查

# 6. 提交代码
git add .
git commit -m "feat: add your feature"

# 7. 推送到你的 Fork
git push origin feat/your-feature

# 8. 创建 Pull Request
# 在 GitHub 上创建 PR
```

### 7.2 Commit 规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具

**示例**:
```
feat(agents): add multi-agent collaboration

- Implement inter-agent communication
- Add message routing between agents
- Support parallel task execution

Closes #123
```

### 7.3 PR 模板

```markdown
## Description
简要描述你的更改

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #123

## How Has This Been Tested?
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### 7.4 代码审查清单

- [ ] 代码符合项目规范
- [ ] 有适当的错误处理
- [ ] 有日志记录
- [ ] 有类型注解
- [ ] 有文档字符串
- [ ] 有单元测试
- [ ] 测试覆盖率足够
- [ ] 没有硬编码的值
- [ ] 没有安全漏洞
- [ ] 性能影响可接受

---

## 最佳实践

### 8.1 错误处理

```python
# 好的做法
async def safe_operation():
    try:
        result = await risky_operation()
        return result
    except TimeoutError as e:
        logger.error(f"Timeout: {e}")
        raise
    except Exception as e:
        logger.exception("Unexpected error")
        raise

# 避免的做法
async def unsafe_operation():
    result = await risky_operation()  # 没有错误处理
    return result
```

### 8.2 资源管理

```python
# 好的做法
async def process_file(filepath: str):
    async with aiofiles.open(filepath, 'r') as f:
        content = await f.read()
    # 文件自动关闭

# 好的做法（上下文管理器）
class ResourceManager:
    async def __aenter__(self):
        self.resource = acquire_resource()
        return self.resource

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await release_resource(self.resource)

async with ResourceManager() as resource:
    # 使用资源
    pass
```

### 8.3 异步编程

```python
# 并行执行
async def parallel_tasks():
    results = await asyncio.gather(
        task1(),
        task2(),
        task3(),
        return_exceptions=True,
    )
    return results

# 超时控制
async def with_timeout():
    try:
        result = await asyncio.wait_for(
            long_running_task(),
            timeout=10.0,
        )
        return result
    except asyncio.TimeoutError:
        logger.error("Task timed out")
        raise

# 任务取消
async def cancellable_task():
    task = asyncio.create_task(long_running())

    # 等待一段时间后取消
    await asyncio.sleep(5)
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        logger.info("Task was cancelled")
```

### 8.4 配置管理

```python
# 好的做法：使用配置对象
from copaw.config import load_config

config = load_config()
api_key = config.agents.profiles["default"].api_key

# 避免的做法：硬编码
api_key = "sk-..."  # 不要这样做
```

### 8.5 日志记录

```python
# 好的做法：结构化日志
logger.info(
    "Processing request",
    extra={
        "request_id": req_id,
        "user_id": user_id,
        "action": "process",
    }
)

# 好的做法：适当的日志级别
logger.debug("Detailed debug information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred")
logger.critical("Critical issue")

# 避免的做法：过度日志
logger.info("Step 1")  # 太细粒度
logger.info("Step 2")
logger.info("Step 3")
```

---

## 总结

遵循这些工作流和最佳实践，可以帮助你：

1. **高效开发**：清晰的结构和流程
2. **保证质量**：完善的测试和检查
3. **易于维护**：规范的代码风格
4. **协作友好**：统一的贡献方式
5. **持续改进**：代码审查和反馈

Happy coding! 🚀
