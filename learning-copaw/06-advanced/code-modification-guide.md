# CoPaw 代码修改指南

> 从小改动到大重构，安全高效地修改 CoPaw 代码

## 📋 目录
1. [修改前的准备](#修改前的准备)
2. [常见修改场景](#常见修改场景)
3. [修改流程](#修改流程)
4. [测试与验证](#测试与验证)
5. [提交代码](#提交代码)

---

## 修改前的准备

### 1.1 理解项目结构

在修改代码前，先了解相关模块的结构：

```bash
# 查看项目结构
tree src/copaw/ -L 2

# 查找相关文件
find src/copaw/ -name "*.py" | grep -i "keyword"

# 搜索关键代码
rg "function_name" src/copaw/
```

### 1.2 创建开发分支

**重要**：永远不要直接在 main 分支修改代码！

```bash
# 确保当前是干净的
git status

# 更新主分支
git checkout main
git pull origin main

# 创建功能分支
git checkout -b feat/your-modification-name

# 或修复分支
git checkout -b fix/issue-description
```

### 1.3 备份当前配置

```bash
# 备份配置文件
cp -r ~/.copaw ~/.copaw.backup.$(date +%Y%m%d)

# 记录当前版本
copaw --version > ~/copaw-version.txt
```

---

## 常见修改场景

### 场景 1：修复 Bug

#### 步骤 1：定位问题

```python
# 假设修复：渠道连接超时问题
# 问题位置：src/copaw/app/channels/feishu/channel.py

# 1. 查看现有代码
rg "timeout" src/copaw/app/channels/feishu/channel.py -C 3

# 2. 理解上下文
Read src/copaw/app/channels/feishu/channel.py
```

#### 步骤 2：分析问题

```python
# 当前代码（有问题）
async def _connect_with_timeout(self, timeout: int = 10):
    try:
        await self._client.connect()
    except asyncio.TimeoutError:
        # 问题：没有重试机制
        raise
```

#### 步骤 3：实施修复

```python
# 修复后的代码
async def _connect_with_timeout(
    self,
    timeout: int = 10,
    max_retries: int = 3,
) -> bool:
    """带重试的连接

    Args:
        timeout: 单次连接超时时间
        max_retries: 最大重试次数

    Returns:
        bool: 连接是否成功
    """
    for attempt in range(max_retries):
        try:
            await asyncio.wait_for(
                self._client.connect(),
                timeout=timeout,
            )
            return True

        except asyncio.TimeoutError:
            if attempt < max_retries - 1:
                # 指数退避
                await asyncio.sleep(2 ** attempt)
                logger.warning(
                    f"Connection timeout, retrying "
                    f"({attempt + 1}/{max_retries})"
                )
            else:
                logger.error("Connection failed after all retries")
                return False

        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False

    return False
```

#### 步骤 4：更新相关调用

```python
# 更新调用方
async def _start_websocket(self) -> None:
    """启动 WebSocket 连接"""
    success = await self._connect_with_timeout(
        timeout=self.timeout,
        max_retries=3,
    )

    if not success:
        raise ConnectionError("Failed to connect to Feishu")
```

---

### 场景 2：添加新功能

#### 示例：添加新的文件工具

```python
# 1. 在 src/copaw/agents/tools/ 创建新文件
# touch src/copaw/agents/tools/file_diff.py

# 2. 实现工具
from agentscope.message import TextBlock
from agentscope.tool import ToolResponse
from pathlib import Path
import difflib

async def diff_files(
    file1: str,
    file2: str,
    context_lines: int = 3,
) -> ToolResponse:
    """比较两个文件的差异

    Args:
        file1: 第一个文件路径
        file2: 第二个文件路径
        context_lines: 显示的上下文行数

    Returns:
        ToolResponse: 文件差异
    """
    try:
        # 读取文件
        path1 = Path(file1)
        path2 = Path(file2)

        if not path1.exists():
            return ToolResponse(
                content=[TextBlock(
                    type="text",
                    text=f"Error: File not found: {file1}"
                )]
            )

        if not path2.exists():
            return ToolResponse(
                content=[TextBlock(
                    type="text",
                    text=f"Error: File not found: {file2}"
                )]
            )

        content1 = path1.read_text(encoding="utf-8")
        content2 = path2.read_text(encoding="utf-8")

        # 生成差异
        diff = difflib.unified_diff(
            content1.splitlines(keepends=True),
            content2.splitlines(keepends=True),
            fromfile=str(path1),
            tofile=str(path2),
            lineterm="",
            n=context_lines,
        )

        diff_text = "".join(diff)

        if not diff_text:
            diff_text = "Files are identical"

        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=diff_text
            )]
        )

    except Exception as e:
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: {e}"
            )]
        )
```

#### 注册新工具

```python
# src/copaw/agents/react_agent.py

# 1. 导入新工具
from .tools.file_diff import diff_files

# 2. 在 _register_builtin_tools 中注册
def _register_builtin_tools(self, namesake_strategy: str):
    """注册内置工具"""
    tools = [
        # ... 现有工具
        read_file,
        write_file,
        edit_file,
        diff_files,  # 新增
        # ...
    ]

    for tool in tools:
        self.register_tool(tool, namesake_strategy=namesake_strategy)
```

---

### 场景 3：优化现有代码

#### 示例：优化文件搜索性能

```python
# 优化前：src/copaw/agents/tools/file_search.py
async def grep_search_old(
    pattern: str,
    path: Optional[str] = None,
) -> ToolResponse:
    """旧的实现 - 读取所有文件到内存"""
    search_root = _resolve_search_root(path)
    matches = []

    # 问题：一次性读取所有文件
    for file_path in search_root.rglob("*"):
        if file_path.is_file():
            content = file_path.read_text()
            if pattern in content:
                matches.append(str(file_path))

    return _make_response("\n".join(matches))

# 优化后：流式处理
async def grep_search_new(
    pattern: str,
    path: Optional[str] = None,
    max_results: int = 100,
) -> ToolResponse:
    """优化后的实现 - 流式读取，限制结果"""
    search_root = _resolve_search_root(path)
    matches = []

    # 优化 1：使用生成器，避免一次性加载
    def file_generator():
        for file_path in search_root.rglob("*"):
            if file_path.is_file() and _is_text_file(file_path):
                yield file_path

    # 优化 2：限制结果数量
    for file_path in file_generator():
        if len(matches) >= max_results:
            break

        try:
            # 优化 3：按块读取大文件
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if pattern in line:
                        matches.append(f"{file_path}:{line}")
                        break  # 找到第一个匹配就继续
        except (OSError, UnicodeDecodeError):
            continue

    result = "\n".join(matches[:max_results])
    if len(matches) >= max_results:
        result += f"\n(Showing first {max_results} results)"

    return _make_response(result)
```

---

### 场景 4：重构代码结构

#### 示例：提取公共逻辑

```python
# 重构前：重复的连接逻辑
class FeishuChannel(BaseChannel):
    async def _connect(self):
        # 设置客户端
        self._client = lark.Client(
            app_id=self.app_id,
            app_secret=self.app_secret,
        )
        await self._client.start()

class QQChannel(BaseChannel):
    async def _connect(self):
        # 几乎相同的代码
        self._client = QQClient(
            app_id=self.app_id,
            app_secret=self.app_secret,
        )
        await self._client.start()

# 重构后：提取基类方法
class BaseChannel(ABC):
    async def _connect(self):
        """通用连接逻辑"""
        self._client = self._create_client()
        await self._start_client()

    @abstractmethod
    def _create_client(self):
        """创建客户端（子类实现）"""
        pass

    @abstractmethod
    async def _start_client(self):
        """启动客户端（子类实现）"""
        pass

class FeishuChannel(BaseChannel):
    def _create_client(self):
        return lark.Client(
            app_id=self.app_id,
            app_secret=self.app_secret,
        )

    async def _start_client(self):
        await self._client.start()
```

---

## 修改流程

### 完整的修改流程

```bash
# 1. 创建分支
git checkout -b feat/add-diff-tool

# 2. 修改代码
# 使用你喜欢的编辑器修改代码

# 3. 格式化代码
black src/copaw/agents/tools/file_diff.py

# 4. 代码检查
ruff check src/copaw/agents/tools/file_diff.py

# 5. 运行测试
pytest tests/agents/test_tools.py -v

# 6. 手动测试
copaw app
# 在 Console 中测试新功能

# 7. 提交代码
git add src/copaw/agents/tools/file_diff.py
git add src/copaw/agents/react_agent.py
git commit -m "feat: add file diff comparison tool"

# 8. 推送分支
git push origin feat/add-diff-tool

# 9. 创建 Pull Request
# 在 GitHub 上创建 PR
```

---

## 测试与验证

### 单元测试

```python
# tests/agents/test_tools/test_file_diff.py

import pytest
from pathlib import Path
from copaw.agents.tools.file_diff import diff_files

@pytest.mark.asyncio
async def test_diff_files_identical(tmp_path):
    """测试相同文件的比较"""
    # 创建测试文件
    file1 = tmp_path / "test1.txt"
    file2 = tmp_path / "test2.txt"

    content = "Hello, World!"
    file1.write_text(content, encoding="utf-8")
    file2.write_text(content, encoding="utf-8")

    # 测试
    result = await diff_files(str(file1), str(file2))

    assert "identical" in result.content[0].text.lower()

@pytest.mark.asyncio
async def test_diff_files_different(tmp_path):
    """测试不同文件的比较"""
    file1 = tmp_path / "test1.txt"
    file2 = tmp_path / "test2.txt"

    file1.write_text("Hello", encoding="utf-8")
    file2.write_text("World", encoding="utf-8")

    result = await diff_files(str(file1), str(file2))

    assert "Hello" in result.content[0].text
    assert "World" in result.content[0].text
```

### 集成测试

```python
# tests/integration/test_agent_with_diff.py

import pytest
from copaw.agents.react_agent import CoPawAgent
from copaw.config.config import AgentProfileConfig

@pytest.mark.asyncio
async def test_agent_can_use_diff_tool():
    """测试 Agent 可以使用 diff 工具"""
    config = AgentProfileConfig(
        name="test_agent",
        model_provider="openai",
        model_name="gpt-4",
        workspace_dir="/tmp/test_agent",
    )

    agent = CoPawAgent(agent_config=config)

    # 检查工具是否注册
    assert "diff_files" in agent.tool_registry.tools

@pytest.mark.asyncio
async def test_diff_tool_execution():
    """测试工具执行"""
    from pathlib import Path

    # 创建测试文件
    tmp = Path("/tmp/test_diff")
    tmp.mkdir(exist_ok=True)

    file1 = tmp / "a.txt"
    file2 = tmp / "b.txt"

    file1.write_text("A\nB\nC")
    file2.write_text("A\nX\nC")

    # 执行工具
    result = await diff_files(str(file1), str(file2))

    # 验证结果
    assert "X" in result.content[0].text
```

### 手动测试清单

```markdown
## 手动测试清单

### 功能测试
- [ ] 新功能在 Console 中正常工作
- [ ] 各种渠道中都能使用
- [ ] 错误输入有合理的提示
- [ ] 性能表现良好

### 兼容性测试
- [ ] 现有功能没有回归
- [ ] 不同 Python 版本都能运行
- [ ] 不同操作系统都能运行

### 文档测试
- [ ] 更新了相关文档
- [ ] 添加了使用示例
- [ ] 更新了 CHANGELOG
```

---

## 提交代码

### Commit 规范

```bash
# 好的 Commit 消息格式
git commit -m "feat(tools): add file diff comparison tool

- Add diff_files tool to compare two files
- Show unified diff with configurable context
- Handle large files efficiently
- Add comprehensive error handling

Closes #123"
```

### Pull Request 模板

```markdown
## Description
简要描述你的更改

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## How Has This Been Tested?
请描述测试过程

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

---

## 代码审查要点

### 自我审查清单

```python
# ✅ 好的代码示例
async def process_file(
    file_path: str,
    max_size: int = 10 * 1024 * 1024,  # 10MB
) -> Dict[str, Any]:
    """处理文件，带完整的类型注解和文档

    Args:
        file_path: 文件路径
        max_size: 最大文件大小（字节）

    Returns:
        包含处理结果的字典

    Raises:
        ValueError: 文件不存在
        PermissionError: 没有读取权限
    """
    # 参数验证
    if not file_path:
        raise ValueError("file_path is required")

    # 资源管理
    async with aiofiles.open(file_path, 'r') as f:
        content = await f.read()

    # 业务逻辑
    result = {"size": len(content)}
    return result

# ❌ 需要改进的代码
async def process(f):  # 缺少类型注解
    # 缺少文档
    if not f:  # 不清晰的变量名
        x = open(f).read()  # 没有使用异步，没有资源管理
    return x  # 没有错误处理
```

### 常见问题

**问题 1：缺少错误处理**
```python
# ❌ 不好
result = risky_operation()

# ✅ 好
try:
    result = await risky_operation()
except TimeoutError:
    logger.error("Operation timed out")
    raise
except Exception as e:
    logger.exception("Unexpected error")
    raise
```

**问题 2：硬编码值**
```python
# ❌ 不好
timeout = 60  # 魔法数字

# ✅ 好
DEFAULT_TIMEOUT = 60  # 常量定义
timeout = DEFAULT_TIMEOUT
```

**问题 3：不合理的返回值**
```python
# ❌ 不好
def get_user():
    if not found:
        return None  # 需要调用方检查 None
    return user

# ✅ 好
def get_user() -> User:
    if not found:
        raise UserNotFoundError("User not found")
    return user
```

---

## 总结

### 修改代码的关键步骤

1. **准备**：理解代码、创建分支、备份配置
2. **定位**：找到需要修改的代码
3. **分析**：理解现有逻辑和问题所在
4. **实施**：编写代码、遵循规范
5. **测试**：单元测试、集成测试、手动测试
6. **提交**：规范的 Commit、详细的 PR
7. **审查**：代码审查、修复问题

### 最佳实践

- ✅ 小步快跑：频繁提交，每次改动小
- ✅ 测试驱动：先写测试，再写代码
- ✅ 代码审查：提交前自我审查
- ✅ 文档更新：同步更新文档
- ✅ 向后兼容：考虑现有用户

### 避免的做法

- ❌ 直接修改 main 分支
- ❌ 一次性大改动
- ❌ 跳过测试
- ❌ 不写 Commit 消息
- ❌ 不更新文档

---

**开始修改 CoPaw 代码吧！** 🔧
