# CoPaw 代码实例与模式详解

## 一、渠道系统实现模式

### 1.1 基础渠道抽象

所有渠道都继承自 `BaseChannel`，实现了统一的消息处理流程。

```python
# src/copaw/app/channels/base.py

class BaseChannel(ABC):
    """所有渠道的抽象基类"""

    channel: ChannelType

    # 是否使用管理器队列
    uses_manager_queue: bool = True

    def __init__(
        self,
        process: ProcessHandler,           # 消息处理函数
        on_reply_sent: OnReplySent = None,  # 回复发送回调
        show_tool_details: bool = True,     # 显示工具详情
        filter_tool_messages: bool = False, # 过滤工具消息
        filter_thinking: bool = False,      # 过滤思考过程
        dm_policy: str = "open",            # 私信策略
        group_policy: str = "open",         # 群聊策略
        allow_from: Optional[list] = None,  # 允许的用户列表
        deny_message: str = "",             # 拒绝消息
        require_mention: bool = False,      # 需要@提及
    ):
        self._process = process
        self._renderer = MessageRenderer(self._render_style)
        # 防抖动机制
        self._debounce_seconds: float = 0.0
        self._debounce_pending: Dict[str, List[Any]] = {}
        self._debounce_timers: Dict[str, asyncio.Task[None]] = {}
```

**关键特性**：
- 统一的消息处理接口
- 可配置的渲染样式
- 内置防抖动机制
- 访问控制策略

### 1.2 飞书渠道实现

```python
# src/copaw/app/channels/feishu/channel.py

class FeishuChannel(BaseChannel):
    """飞书渠道实现

    使用 lark-oapi WebSocket 长连接接收事件
    通过 Open API (tenant_access_token) 发送消息
    支持文本、图片、文件
    """

    channel = ChannelType.FEISHU

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 飞书特定的初始化
        self._client = lark.Client(...)
        self._event_queue = asyncio.Queue()
        self._nickname_cache = OrderedDict()

    async def consume_one(self) -> None:
        """消费一条消息"""
        try:
            event = await self._event_queue.get()
            await self._handle_feishu_event(event)
        except Exception as e:
            logger.error(f"Error consuming event: {e}")

    async def _handle_feishu_event(self, event: dict) -> None:
        """处理飞书事件"""
        event_type = event.get("header", {}).get("event_type")

        if event_type == "im.message.receive_v1":
            await self._handle_message_event(event)
        elif event_type == "im.message.status_v1":
            await self._handle_status_event(event)

    async def _handle_message_event(self, event: dict) -> None:
        """处理消息事件"""
        # 提取消息内容
        content = self._extract_message_content(event)

        # 构建请求
        request = self._build_agent_request(event, content)

        # 处理消息
        await self._process(request)
```

**实现要点**：
1. **事件驱动**：使用 WebSocket 接收实时事件
2. **消息解析**：统一的消息内容提取
3. **会话管理**：维护会话状态和用户信息
4. **错误处理**：完善的异常捕获和日志

### 1.3 消息渲染器

```python
# src/copaw/app/channels/renderer.py

class MessageRenderer:
    """跨平台消息渲染器"""

    def __init__(self, style: RenderStyle):
        self.style = style

    def render(self, content: List[ContentType]) -> str:
        """渲染内容为平台特定的格式"""
        rendered_parts = []

        for part in content:
            if isinstance(part, TextContent):
                rendered_parts.append(self._render_text(part))
            elif isinstance(part, ImageContent):
                rendered_parts.append(self._render_image(part))
            elif isinstance(part, FileContent):
                rendered_parts.append(self._render_file(part))
            # ... 其他类型

        return "\n".join(rendered_parts)

    def _render_text(self, content: TextContent) -> str:
        """渲染文本内容"""
        text = content.text
        # Markdown 格式化
        text = self._format_markdown(text)
        # 代码块高亮
        text = self._highlight_code(text)
        # 链接处理
        text = self._process_links(text)
        return text
```

---

## 二、工具系统实现

### 2.1 文件搜索工具

```python
# src/copaw/agents/tools/file_search.py

async def grep_search(
    pattern: str,
    path: Optional[str] = None,
    is_regex: bool = False,
    case_sensitive: bool = True,
    context_lines: int = 0,
    include_pattern: Optional[str] = None,
) -> ToolResponse:
    """搜索文件内容

    Args:
        pattern: 搜索字符串或正则表达式
        path: 搜索路径（默认 WORKING_DIR）
        is_regex: 是否为正则表达式
        case_sensitive: 是否区分大小写
        context_lines: 上下文行数（类似 grep -C）
        include_pattern: 文件名匹配模式（如 *.py）
    """
    # 1. 解析和验证参数
    if not pattern:
        return _make_response("Error: No search `pattern` provided.")

    root_or_err = _resolve_search_root(path)
    if isinstance(root_or_err, ToolResponse):
        return root_or_err
    search_root: Path = root_or_err

    # 2. 编译正则表达式
    flags = 0 if case_sensitive else re.IGNORECASE
    try:
        regex = re.compile(
            pattern if is_regex else re.escape(pattern),
            flags,
        )
    except re.error as e:
        return _make_response(f"Error: Invalid regex pattern — {e}")

    # 3. 在线程池中执行搜索
    cancel = threading.Event()

    def _worker() -> tuple[list[str], str]:
        try:
            return _walk_and_grep(
                search_root,
                regex,
                context_lines,
                cancel,
                include_pattern,
            )
        except Exception as exc:
            return [], f"error: {exc}"

    try:
        match_lines, status = await asyncio.wait_for(
            asyncio.to_thread(_worker),
            timeout=_GREP_TIMEOUT,
        )
    except asyncio.TimeoutError:
        cancel.set()
        return _make_response(
            f"Error: Search timed out after {_GREP_TIMEOUT}s"
        )

    # 4. 格式化结果
    if status.startswith("error:"):
        result = f"Error: grep failed — {status}"
    elif not match_lines:
        result = f"No matches found for pattern: {pattern}"
    else:
        result = "\n".join(match_lines)
        if status.startswith("truncated:"):
            reason = status.split(":", 1)[1].strip()
            result += f"\n\n(Results truncated due to {reason})"

    return _make_response(result)
```

**实现亮点**：
1. **异步执行**：使用 `asyncio.to_thread` 避免阻塞
2. **超时控制**：30 秒超时防止长时间运行
3. **取消机制**：使用 `threading.Event` 支持中途取消
4. **智能限制**：最大匹配数、文件大小、输出字符数限制
5. **二进制跳过**：自动跳过已知二进制格式

### 2.2 Shell 命令执行工具

```python
# src/copaw/agents/tools/shell.py

async def execute_shell_command(
    command: str,
    timeout: int = 60,
    cwd: Optional[Path] = None,
) -> ToolResponse:
    """执行 Shell 命令

    重要：执行前请考虑操作系统差异。

    Args:
        command: 要执行的命令
        timeout: 超时时间（秒）
        cwd: 工作目录（默认 WORKING_DIR）
    """
    # 1. 准备执行环境
    cmd = (command or "").strip()
    working_dir = cwd or get_current_workspace_dir() or WORKING_DIR

    # 确保 venv Python 在 PATH 中
    env = os.environ.copy()
    python_bin_dir = str(Path(sys.executable).parent)
    env["PATH"] = python_bin_dir + os.pathsep + env.get("PATH", "")

    try:
        # 2. 平台特定的执行逻辑
        if sys.platform == "win32":
            # Windows: 使用线程池避免 asyncio subprocess 限制
            returncode, stdout_str, stderr_str = await asyncio.to_thread(
                _execute_subprocess_sync,
                cmd,
                str(working_dir),
                timeout,
                env,
            )
        else:
            # Unix: 使用 asyncio subprocess
            proc = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(working_dir),
                env=env,
                start_new_session=True,
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=timeout,
                )
                stdout_str = smart_decode(stdout)
                stderr_str = smart_decode(stderr)
                returncode = proc.returncode

            except asyncio.TimeoutError:
                # 超时处理：杀死整个进程组
                pgid = os.getpgid(proc.pid)
                os.killpg(pgid, signal.SIGTERM)
                try:
                    await asyncio.wait_for(proc.wait(), timeout=2)
                except asyncio.TimeoutError:
                    os.killpg(pgid, signal.SIGKILL)

                returncode = -1
                stderr_str = (
                    f"⚠️ TimeoutError: Command execution exceeded "
                    f"the timeout of {timeout} seconds."
                )

        # 3. 格式化输出
        if returncode == 0:
            response_text = stdout_str or "Command executed successfully (no output)."
            if stderr_str:
                response_text += f"\n[stderr]\n{stderr_str}"
        else:
            response_text = f"Command failed with exit code {returncode}."
            if stdout_str:
                response_text += f"\n[stdout]\n{stdout_str}"
            if stderr_str:
                response_text += f"\n[stderr]\n{stderr_str}"

        return ToolResponse(content=[TextBlock(type="text", text=response_text)])

    except Exception as e:
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: Shell command execution failed due to \n{e}"
            )]
        )
```

**实现亮点**：
1. **跨平台支持**：Windows 和 Unix 不同实现
2. **超时处理**：精确的超时控制和进程清理
3. **进程组管理**：确保子进程也被正确终止
4. **编码处理**：智能解码输出内容
5. **环境隔离**：独立的执行环境配置

**Windows 特殊处理**：
```python
def _execute_subprocess_sync(
    cmd: str,
    cwd: str,
    timeout: int,
    env: dict | None = None,
) -> tuple[int, str, str]:
    """Windows 专用同步执行

    使用临时文件重定向而非管道，避免子进程继承句柄导致阻塞。
    """
    # 清理 LLM 产生的转义字符
    cmd = _sanitize_win_cmd(cmd)
    wrapped = f'cmd /D /S /C "{cmd}"'

    # 创建临时文件
    stdout_fd, stdout_path = tempfile.mkstemp(prefix="copaw_out_")
    stderr_fd, stderr_path = tempfile.mkstemp(prefix="copaw_err_")

    # 执行命令
    proc = subprocess.Popen(
        wrapped,
        shell=False,
        stdout=stdout_fd,
        stderr=stderr_fd,
        cwd=cwd,
        env=env,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )

    # 等待完成
    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        _kill_process_tree_win32(proc.pid)

    # 读取输出
    stdout_str = _read_temp_file(stdout_path)
    stderr_str = _read_temp_file(stderr_path)

    # 清理临时文件
    os.unlink(stdout_path)
    os.unlink(stderr_path)

    return proc.returncode, stdout_str, stderr_str
```

---

## 三、模型提供商管理

### 3.1 提供商管理器

```python
# src/copaw/providers/provider_manager.py

class ProviderManager:
    """统一管理所有模型提供商"""

    def __init__(self):
        # 内置提供商
        self._builtin_providers: Dict[str, Provider] = {
            "dashscope": OpenAIProvider(...),
            "openai": OpenAIProvider(...),
            "anthropic": AnthropicProvider(...),
            "gemini": GeminiProvider(...),
            "ollama": OllamaProvider(...),
        }
        # 自定义提供商
        self._custom_providers: Dict[str, Provider] = {}

    def list_providers(self) -> List[ProviderInfo]:
        """列出所有提供商"""
        providers = []
        for provider in self._builtin_providers.values():
            providers.append(ProviderInfo(
                id=provider.id,
                name=provider.name,
                type="builtin",
                models=provider.list_models(),
            ))
        for provider in self._custom_providers.values():
            providers.append(ProviderInfo(
                id=provider.id,
                name=provider.name,
                type="custom",
                models=provider.list_models(),
            ))
        return providers

    def get_provider(self, provider_id: str) -> Provider:
        """获取指定的提供商"""
        if provider_id in self._builtin_providers:
            return self._builtin_providers[provider_id]
        if provider_id in self._custom_providers:
            return self._custom_providers[provider_id]
        raise ValueError(f"Provider not found: {provider_id}")

    async def get_models(
        self,
        provider_id: str,
        api_key: Optional[str] = None,
    ) -> List[ModelInfo]:
        """获取提供商的模型列表"""
        provider = self.get_provider(provider_id)
        return await provider.fetch_models(api_key)

    def add_custom_provider(self, provider: Provider) -> None:
        """添加自定义提供商"""
        self._custom_providers[provider.id] = provider

    def remove_custom_provider(self, provider_id: str) -> None:
        """删除自定义提供商"""
        if provider_id in self._custom_providers:
            del self._custom_providers[provider_id]
```

### 3.2 OpenAI 兼容提供商

```python
# src/copaw/providers/openai_provider.py

class OpenAIProvider(Provider):
    """OpenAI 兼容的提供商实现"""

    def __init__(
        self,
        id: str,
        name: str,
        base_url: str,
        api_key_header: str = "Authorization",
    ):
        self.id = id
        self.name = name
        self.base_url = base_url
        self.api_key_header = api_key_header

    async def fetch_models(
        self,
        api_key: Optional[str] = None,
    ) -> List[ModelInfo]:
        """从 API 获取模型列表"""
        headers = {}
        if api_key:
            headers[self.api_key_header] = f"Bearer {api_key}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/models",
                headers=headers,
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

        models = []
        for model_data in data.get("data", []):
            models.append(ModelInfo(
                id=model_data["id"],
                name=model_data["id"],
                supports_image=self._check_image_support(model_data),
                supports_video=self._check_video_support(model_data),
                probe_source="api",
            ))
        return models

    def create_chat_model(
        self,
        model_id: str,
        api_key: str,
        **kwargs,
    ) -> ChatModelBase:
        """创建聊天模型实例"""
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )
        return OpenAIChatModelCompat(
            client=client,
            model=model_id,
            **kwargs,
        )
```

---

## 四、技能系统实现

### 4.1 技能信息结构

```python
# src/copaw/agents/skills_manager.py

class SkillInfo(BaseModel):
    """技能信息结构

    references 和 scripts 字段表示目录树结构：
    - 文件表示为 {filename: None}
    - 目录表示为 {dirname: {nested_structure}}
    """
    name: str
    description: str = ""
    content: str              # SKILL.md 内容
    source: str               # "builtin", "customized", 或 "active"
    path: str                 # 技能路径
    references: dict[str, Any] = {}  # 参考文档树
    scripts: dict[str, Any] = {}     # 脚本文件树
```

### 4.2 技能目录结构

```
skill_name/
├── SKILL.md          # 技能定义（必需）
├── __init__.py       # Python 入口（可选）
├── requirements.txt  # 依赖列表（可选）
├── references/       # 参考文档（可选）
│   ├── doc1.md
│   └── doc2.md
└── scripts/          # 辅助脚本（可选）
    ├── script1.py
    └── script2.sh
```

### 4.3 技能文档格式

```markdown
# 技能名称

简短描述（一句话）。

## 详细描述

详细说明技能的功能和用途。

## 依赖

### 外部工具
- tool_name: 工具描述
  - 安装方法：安装命令

### Python 包
- package_name>=version: 包描述

## 安装说明

安装步骤说明。

## 使用说明

使用示例和说明。
```

### 4.4 Cron 技能示例

```markdown
# cron

内置定时任务技能。为 CoPaw 添加定时任务能力，可以按 cron 表达式定期执行任务。

## 依赖

无外部依赖。

## 使用说明

### 创建定时任务

使用自然语言描述或 cron 表达式创建定时任务：

```
每天早上 9 点发送新闻摘要
```

或

```
创建一个定时任务，表达式 0 9 * * *，提示词是发送今天的新闻摘要
```

### 列出任务

```
列出所有定时任务
```

### 删除任务

```
删除定时任务 [任务ID]
```

### 任务表达式格式

支持标准 cron 表达式：
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 星期几 (0-6, 0=周日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小时 (0-23)
└───────── 分钟 (0-59)
```

示例：
- `0 9 * * *` - 每天 9 点
- `*/30 * * * *` - 每 30 分钟
- `0 9 * * 1-5` - 周一到周五 9 点
- `0 9,18 * * *` - 每天 9 点和 18 点
```

---

## 五、Agent 初始化流程

### 5.1 工作空间初始化

```python
# src/copaw/app/workspace.py

class Workspace:
    """Agent 工作空间"""

    def __init__(
        self,
        agent_id: str,
        workspace_dir: Path,
    ):
        self.agent_id = agent_id
        self.workspace_dir = workspace_dir
        self.runner = None
        self.agent_config = None

    async def start(self) -> None:
        """启动工作空间"""
        # 1. 加载配置
        config = load_config()
        self.agent_config = config.agents.profiles[self.agent_id]

        # 2. 创建运行器
        self.runner = AgentAppRunner(
            agent_id=self.agent_id,
            agent_config=self.agent_config,
            workspace_dir=self.workspace_dir,
        )

        # 3. 初始化 Agent
        await self.runner.initialize()

        # 4. 启动服务
        await self.runner.start()

    async def stop(self) -> None:
        """停止工作空间"""
        if self.runner:
            await self.runner.stop()
```

### 5.2 Agent 创建

```python
# src/copaw/agents/react_agent.py

class CoPawAgent(ToolGuardMixin, ReActAgent):
    """CoPaw 核心代理"""

    def __init__(
        self,
        agent_config: AgentProfileConfig,
        env_context: Optional[str] = None,
        enable_memory_manager: bool = True,
        mcp_clients: Optional[List[Any]] = None,
        memory_manager: Optional[MemoryManager] = None,
        request_context: Optional[dict[str, str]] = None,
        namesake_strategy: NamesakeStrategy = "skip",
        workspace_dir: Path | None = None,
    ):
        # 1. 创建模型和格式化器
        model, formatter = create_model_and_formatter(agent_config)

        # 2. 构建系统提示
        system_prompt = build_system_prompt_from_working_dir(
            agent_config,
            workspace_dir,
        )

        # 3. 初始化父类
        super().__init__(
            name=agent_config.name,
            model=model,
            system_prompt=system_prompt,
            formatter=formatter,
        )

        # 4. 初始化记忆管理
        if enable_memory_manager:
            self.memory_manager = memory_manager or MemoryManager(
                workspace_dir=workspace_dir,
            )
            self.memory_hooks = [
                MemoryCompactionHook(self.memory_manager),
            ]
        else:
            self.memory_manager = None
            self.memory_hooks = []

        # 5. 加载技能
        self.skills_manager = SkillsManager(
            workspace_dir=workspace_dir,
            builtin_skills_dir=get_builtin_skills_dir(),
        )
        self.skills_manager.load_skills()

        # 6. 注册工具
        self._register_builtin_tools(namesake_strategy)
        self._register_skill_tools()

        # 7. 初始化 MCP 客户端
        if mcp_clients:
            self._register_mcp_tools(mcp_clients)

    def _register_builtin_tools(
        self,
        namesake_strategy: NamesakeStrategy,
    ) -> None:
        """注册内置工具"""
        tools = [
            read_file,
            write_file,
            edit_file,
            grep_search,
            glob_search,
            execute_shell_command,
            desktop_screenshot,
            view_image,
            browser_use,
            get_current_time,
            get_token_usage,
        ]

        for tool in tools:
            try:
                self.register_tool(
                    tool,
                    namesake_strategy=namesake_strategy,
                )
            except Exception as e:
                logger.warning(f"Failed to register tool {tool}: {e}")
```

---

## 六、多模态处理

### 6.1 内容类型定义

```python
from agentscope_runtime.engine.schemas.agent_schemas import (
    TextContent,
    ImageContent,
    VideoContent,
    AudioContent,
    FileContent,
    RefusalContent,
)

# 文本内容
text = TextContent(
    text="Hello, world!",
)

# 图片内容
image = ImageContent(
    url="https://example.com/image.png",
    detail="high",
)

# 视频内容
video = VideoContent(
    url="https://example.com/video.mp4",
)

# 音频内容
audio = AudioContent(
    url="https://example.com/audio.wav",
)

# 文件内容
file = FileContent(
    filename="document.pdf",
    url="https://example.com/document.pdf",
)
```

### 6.2 多模态消息处理

```python
# src/copaw/agents/utils.py

async def process_file_and_media_blocks_in_message(
    message: Msg,
) -> Msg:
    """处理消息中的文件和媒体块"""
    processed_blocks = []

    for block in message.content:
        if isinstance(block, ImageBlock):
            # 处理图片
            image_url = await _upload_image(block.image)
            processed_blocks.append(ImageContent(url=image_url))

        elif isinstance(block, AudioBlock):
            # 处理音频
            audio_url = await _upload_audio(block.audio)
            processed_blocks.append(AudioContent(url=audio_url))

        elif isinstance(block, VideoBlock):
            # 处理视频
            video_url = await _upload_video(block.video)
            processed_blocks.append(VideoContent(url=video_url))

        elif isinstance(block, FileBlock):
            # 处理文件
            file_url = await _upload_file(block.file)
            processed_blocks.append(FileContent(
                filename=block.filename,
                url=file_url,
            ))

        else:
            # 其他类型直接保留
            processed_blocks.append(block)

    message.content = processed_blocks
    return message
```

---

## 七、错误处理模式

### 7.1 工具错误处理

```python
from agentscope.tool import ToolResponse
from agentscope.message import TextBlock

async def safe_tool_function(
    param: str,
) -> ToolResponse:
    """带有完善错误处理的工具函数"""
    try:
        # 1. 参数验证
        if not param:
            return ToolResponse(
                content=[TextBlock(
                    type="text",
                    text="Error: Parameter 'param' is required.",
                )],
            )

        # 2. 执行逻辑
        result = await do_something(param)

        # 3. 成功响应
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Success: {result}",
            )],
        )

    except ValueError as e:
        # 业务逻辑错误
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: Invalid parameter - {e}",
            )],
        )

    except PermissionError as e:
        # 权限错误
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: Permission denied - {e}",
            )],
        )

    except Exception as e:
        # 未预期的错误
        logger.exception("Unexpected error in safe_tool_function")
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"Error: An unexpected error occurred - {e}",
            )],
        )
```

### 7.2 渠道错误处理

```python
class BaseChannel(ABC):
    async def _safe_send(self, content: Any) -> bool:
        """安全发送消息，带有重试机制"""
        max_retries = 3
        retry_delay = 1.0

        for attempt in range(max_retries):
            try:
                await self._send_message(content)
                return True

            except httpx.TimeoutError:
                logger.warning(
                    f"Timeout sending message (attempt {attempt + 1}/{max_retries})"
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (2 ** attempt))
                else:
                    raise

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    # 速率限制，等待重试
                    retry_after = int(e.response.headers.get("Retry-After", 5))
                    await asyncio.sleep(retry_after)
                    continue
                else:
                    # 其他 HTTP 错误
                    logger.error(f"HTTP error: {e}")
                    return False

            except Exception as e:
                logger.exception(f"Unexpected error sending message: {e}")
                return False

        return False
```

---

## 八、性能优化模式

### 8.1 懒加载模式

```python
class MultiAgentManager:
    """多代理管理器 - 懒加载实现"""

    def __init__(self):
        self._agents: Dict[str, Workspace] = {}
        self._lock = asyncio.Lock()

    async def get_agent(self, agent_id: str) -> Workspace:
        """获取代理（懒加载）"""
        async with self._lock:
            # 缓存命中
            if agent_id in self._agents:
                return self._agents[agent_id]

            # 按需创建
            config = load_config()
            if agent_id not in config.agents.profiles:
                raise ValueError(f"Agent not found: {agent_id}")

            agent_ref = config.agents.profiles[agent_id]
            workspace = Workspace(
                agent_id=agent_id,
                workspace_dir=agent_ref.workspace_dir,
            )
            await workspace.start()
            self._agents[agent_id] = workspace
            return workspace
```

### 8.2 连接池模式

```python
class HttpClientPool:
    """HTTP 客户端连接池"""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """获取客户端实例（单例）"""
        if self._client is None:
            limits = httpx.Limits(
                max_connections=100,
                max_keepalive_connections=20,
            )
            timeout = httpx.Timeout(10.0, connect=5.0)
            self._client = httpx.AsyncClient(
                limits=limits,
                timeout=timeout,
            )
        return self._client

    async def close(self) -> None:
        """关闭连接池"""
        if self._client:
            await self._client.aclose()
            self._client = None
```

### 8.3 缓存模式

```python
from functools import lru_cache
from typing import Optional

class ModelCapabilityCache:
    """模型能力缓存"""

    def __init__(self, ttl: int = 3600):
        self._cache: Dict[str, tuple[dict, float]] = {}
        self._ttl = ttl

    def get(self, model_id: str) -> Optional[dict]:
        """获取缓存的模型能力"""
        if model_id in self._cache:
            capabilities, timestamp = self._cache[model_id]
            if time.time() - timestamp < self._ttl:
                return capabilities
            else:
                del self._cache[model_id]
        return None

    def set(self, model_id: str, capabilities: dict) -> None:
        """缓存模型能力"""
        self._cache[model_id] = (capabilities, time.time())

# 使用示例
capability_cache = ModelCapabilityCache()

async def get_model_capabilities(model_id: str) -> dict:
    """获取模型能力（带缓存）"""
    cached = capability_cache.get(model_id)
    if cached:
        return cached

    # 从 API 获取
    capabilities = await fetch_capabilities_from_api(model_id)
    capability_cache.set(model_id, capabilities)
    return capabilities
```

---

## 九、安全模式

### 9.1 路径验证

```python
from pathlib import Path

def validate_file_path(
    file_path: str,
    allowed_dir: Path,
) -> Optional[Path]:
    """验证文件路径是否在允许的目录内"""
    try:
        path = Path(file_path).resolve()
        allowed = allowed_dir.resolve()

        # 检查路径是否在允许的目录内
        try:
            path.relative_to(allowed)
            return path
        except ValueError:
            logger.warning(
                f"Path traversal attempt: {file_path} is outside {allowed_dir}"
            )
            return None

    except Exception as e:
        logger.error(f"Invalid path {file_path}: {e}")
        return None
```

### 9.2 命令过滤

```python
DANGEROUS_COMMANDS = frozenset([
    "rm -rf /",
    "mkfs",
    "dd if=/dev/zero",
    ":(){ :|:& };:",  # fork bomb
    "chmod 000",
])

def is_safe_command(command: str) -> bool:
    """检查命令是否安全"""
    cmd_lower = command.lower().strip()

    # 检查危险命令
    for dangerous in DANGEROUS_COMMANDS:
        if dangerous in cmd_lower:
            return False

    return True
```

---

## 总结

CoPaw 的代码展示了以下核心模式：

1. **抽象模式**：通过基类定义统一接口
2. **组合模式**：灵活组合不同功能模块
3. **工厂模式**：动态创建模型和工具实例
4. **策略模式**：不同渠道采用不同处理策略
5. **观察者模式**：事件驱动的消息处理
6. **缓存模式**：提高性能和减少 API 调用
7. **安全模式**：多层安全防护机制

这些模式使得 CoPaw 既功能强大又易于扩展。
