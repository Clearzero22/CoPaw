# CoPaw 关键实现细节详解

## 目录
1. [消息处理流程](#消息处理流程)
2. [Agent 生命周期](#agent-生命周期)
3. [工具注册与调用](#工具注册与调用)
4. [记忆系统](#记忆系统)
5. [配置管理](#配置管理)
6. [WebSocket 连接管理](#websocket-连接管理)
7. [文件上传处理](#文件上传处理)
8. [错误恢复机制](#错误恢复机制)

---

## 消息处理流程

### 1.1 渠道消息接收

```python
# src/copaw/app/channels/base.py

class BaseChannel(ABC):
    async def consume_one(self) -> None:
        """消费一条消息（子类实现）"""
        raise NotImplementedError

    async def _process_message(self, payload: dict) -> None:
        """处理接收到的消息"""
        # 1. 解析会话信息
        session_id = self.resolve_session_id(
            sender_id=payload.get("sender_id"),
            meta=payload.get("meta", {}),
        )

        # 2. 构建请求
        request = self._build_agent_request(payload, session_id)

        # 3. 调用处理函数
        await self._process(request)

    def resolve_session_id(
        self,
        sender_id: str,
        meta: dict,
    ) -> str:
        """解析会话 ID（子类实现）"""
        raise NotImplementedError
```

### 1.2 飞书渠道消息处理

```python
# src/copaw/app/channels/feishu/channel.py

class FeishuChannel(BaseChannel):
    def resolve_session_id(
        self,
        sender_id: str,
        meta: dict,
    ) -> str:
        """飞书会话 ID 解析

        优先级：
        1. thread_id（回复消息）
        2. chat_id（群聊）
        3. sender_id（私聊）
        """
        # 回复消息：使用 thread_id
        if "thread_id" in meta:
            return f"feishu_thread_{meta['thread_id']}"

        # 群聊：使用 chat_id
        chat_type = meta.get("chat_type", "")
        if chat_type == "group":
            return f"feishu_group_{meta['chat_id']}"

        # 私聊：使用 sender_id
        return f"feishu_dm_{sender_id}"

    async def _handle_message_event(self, event: dict) -> None:
        """处理飞书消息事件"""
        # 1. 提取事件数据
        event_data = event.get("event", {})
        message_id = event_data.get("message", {}).get("message_id")
        chat_id = event_data.get("message", {}).get("chat_id")
        sender_id = event_data.get("sender", {}).get("sender_id")

        # 2. 获取消息内容
        content_type = event_data.get("message", {}).get("message_type")

        if content_type == "text":
            content = self._extract_text_content(event_data)
        elif content_type == "image":
            content = await self._extract_image_content(event_data)
        elif content_type == "file":
            content = await self._extract_file_content(event_data)
        else:
            content = TextContent(text="")

        # 3. 构建请求
        request = AgentRequest(
            query=content,
            session_id=self.resolve_session_id(
                sender_id=sender_id,
                meta={"chat_id": chat_id, "message_id": message_id},
            ),
            user_id=sender_id,
            channel="feishu",
            metadata={
                "chat_id": chat_id,
                "message_id": message_id,
            },
        )

        # 4. 处理消息
        await self._process(request)
```

### 1.3 消息渲染与发送

```python
# src/copaw/app/channels/renderer.py

class MessageRenderer:
    def render(
        self,
        content: List[ContentType],
        style: RenderStyle,
    ) -> str:
        """渲染内容为平台格式"""
        rendered = []

        for part in content:
            if isinstance(part, TextContent):
                rendered.append(self._render_text(part.text))

            elif isinstance(part, ImageContent):
                if style.show_tool_details:
                    rendered.append(f"[图片: {part.url}]")

            elif isinstance(part, ToolCallContent):
                if not style.filter_tool_messages:
                    rendered.append(self._render_tool_call(part))

            elif isinstance(part, ThinkingContent):
                if not style.filter_thinking:
                    rendered.append(f"💭 {part.text}")

        return "\n".join(rendered)

    def _render_text(self, text: str) -> str:
        """渲染文本（Markdown 处理）"""
        # 代码块处理
        text = re.sub(
            r"```(\w+)?\n(.*?)```",
            lambda m: f"```\n{m.group(2)}\n```",
            text,
            flags=re.DOTALL,
        )

        # 链接处理
        text = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            r"\1: \2",
            text,
        )

        return text
```

---

## Agent 生命周期

### 2.1 Agent 初始化流程

```python
# src/copaw/agents/react_agent.py

class CoPawAgent(ToolGuardMixin, ReActAgent):

    def __init__(self, agent_config, workspace_dir, **kwargs):
        # 阶段 1: 基础配置
        self.agent_config = agent_config
        self.workspace_dir = workspace_dir

        # 阶段 2: 创建模型
        self.model, self.formatter = create_model_and_formatter(
            agent_config.model_provider,
            agent_config.model_name,
            agent_config.api_key,
        )

        # 阶段 3: 构建系统提示
        system_prompt = build_system_prompt_from_working_dir(
            agent_config,
            workspace_dir,
        )

        # 阶段 4: 初始化父类
        super().__init__(
            name=agent_config.name,
            model=self.model,
            system_prompt=system_prompt,
        )

        # 阶段 5: 初始化记忆管理
        self.memory_manager = MemoryManager(workspace_dir)
        self.memory_hooks = [
            BootstrapHook(self.workspace_dir),
            MemoryCompactionHook(self.memory_manager),
        ]

        # 阶段 6: 加载技能
        self.skills_manager = SkillsManager(workspace_dir)
        self.skills_manager.load_skills()

        # 阶段 7: 注册工具
        self._register_all_tools()

    def _register_all_tools(self):
        """注册所有工具"""
        # 内置工具
        for tool in BUILTIN_TOOLS:
            self.register_tool(tool)

        # 技能工具
        for skill in self.skills_manager.list_skills():
            if skill.tools:
                for tool in skill.tools:
                    self.register_tool(tool)

        # MCP 工具
        for mcp_client in self.mcp_clients:
            for tool in mcp_client.list_tools():
                self.register_tool(tool)
```

### 2.2 Agent 运行流程

```python
class CoPawAgent(ToolGuardMixin, ReActAgent):

    async def _acting(
        self,
        memory: InMemoryMemory,
        tool_registry: Toolkit,
        **kwargs,
    ) -> Msg:
        """执行动作（重写自 ReActAgent）"""

        # 1. 触发前置钩子
        for hook in self.memory_hooks:
            await hook.before_acting(self, memory)

        # 2. 调用父类方法
        try:
            response = await super()._acting(
                memory=memory,
                tool_registry=tool_registry,
                **kwargs,
            )
        except Exception as e:
            logger.error(f"Error in _acting: {e}")
            response = Msg(
                role="assistant",
                content=f"抱歉，执行时出错：{e}",
            )

        # 3. 触发后置钩子
        for hook in self.memory_hooks:
            await hook.after_acting(self, memory, response)

        # 4. 保存到记忆
        if self.memory_manager:
            await self.memory_manager.save_interaction(response)

        return response
```

---

## 工具注册与调用

### 3.1 工具注册

```python
# src/copaw/agents/react_agent.py

class CoPawAgent(ToolGuardMixin, ReActAgent):

    def _register_builtin_tools(self, namesake_strategy: str):
        """注册内置工具

        Args:
            namesake_strategy: 同名工具处理策略
                - "override": 覆盖已有工具
                - "skip": 跳过已有工具
                - "raise": 抛出异常
                - "rename": 重命名新工具
        """
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
                logger.debug(f"Registered tool: {tool.name}")

            except Exception as e:
                logger.warning(
                    f"Failed to register tool {tool.name}: {e}"
                )

    def _register_skill_tools(self):
        """注册技能工具"""
        for skill_info in self.skills_manager.list_skills():
            skill_dir = Path(skill_info.path)

            # 加载技能的 __init__.py
            init_file = skill_dir / "__init__.py"
            if init_file.exists():
                spec = importlib.util.spec_from_file_location(
                    skill_info.name,
                    init_file,
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                # 注册技能导出的工具
                if hasattr(module, "tools"):
                    for tool in module.tools:
                        self.register_tool(tool)
```

### 3.2 工具调用

```python
# src/copaw/agents/tool_guard_mixin.py

class ToolGuardMixin:

    async def _reasoning(
        self,
        memory: InMemoryMemory,
        tool_registry: Toolkit,
        **kwargs,
    ) -> Msg:
        """推理阶段（带工具安全检查）"""

        # 1. 调用原始推理
        msg = await super()._reasoning(
            memory=memory,
            tool_registry=tool_registry,
            **kwargs,
        )

        # 2. 检查工具调用
        for block in msg.content:
            if isinstance(block, ToolCallBlock):
                tool_name = block.tool_name

                # 安全检查
                if not self._is_tool_allowed(tool_name):
                    # 替换为拒绝响应
                    block.tool_name = None
                    block.arguments = {}
                    block.response = RefusalContent(
                        reason=f"工具 {tool_name} 不允许执行"
                    )

        return msg

    def _is_tool_allowed(self, tool_name: str) -> bool:
        """检查工具是否允许执行"""
        # 检查黑名单
        if tool_name in self.tool_blacklist:
            return False

        # 检查敏感路径
        if tool_name in ["read_file", "write_file", "edit_file"]:
            # 获取参数中的路径
            # 检查是否在允许的目录内
            pass

        return True
```

---

## 记忆系统

### 4.1 记忆管理器

```python
# src/copaw/agents/memory/manager.py

class MemoryManager:
    """记忆管理器"""

    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir
        self.memory_dir = workspace_dir / "memory"
        self.memory_dir.mkdir(parents=True, exist_ok=True)

        self.md_manager = AgentMdManager(workspace_dir)

    async def save_interaction(self, msg: Msg) -> None:
        """保存交互到记忆"""
        # 1. 提取关键信息
        key_points = self._extract_key_points(msg)

        # 2. 生成记忆文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"memory_{timestamp}.md"

        # 3. 写入记忆
        content = self._format_memory_content(key_points)
        self.md_manager.write_memory_md(filename, content)

    def _extract_key_points(self, msg: Msg) -> List[str]:
        """提取关键信息"""
        key_points = []

        for block in msg.content:
            if isinstance(block, TextBlock):
                # 使用 LLM 提取关键点
                key_points.extend(
                    self._extract_from_text(block.text)
                )

        return key_points

    async def search_memory(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[dict]:
        """搜索记忆"""
        # 1. 读取所有记忆文件
        memory_files = self.md_manager.list_memory_mds()

        # 2. 计算相关性
        results = []
        for file_info in memory_files:
            content = self.md_manager.read_memory_md(
                file_info["filename"]
            )
            score = self._calculate_relevance(query, content)

            if score > 0:
                results.append({
                    "filename": file_info["filename"],
                    "content": content,
                    "score": score,
                })

        # 3. 排序并返回
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
```

### 4.2 记忆压缩钩子

```python
# src/copaw/agents/hooks/memory_compaction.py

class MemoryCompactionHook:

    def __init__(
        self,
        memory_manager: MemoryManager,
        max_memories: int = 100,
    ):
        self.memory_manager = memory_manager
        self.max_memories = max_memories

    async def after_acting(
        self,
        agent: CoPawAgent,
        memory: InMemoryMemory,
        response: Msg,
    ):
        """动作后触发压缩"""
        # 1. 检查记忆数量
        memory_files = self.memory_manager.md_manager.list_memory_mds()

        if len(memory_files) < self.max_memories:
            return

        # 2. 压缩记忆
        await self._compact_memories()

    async def _compact_memories(self):
        """压缩记忆文件"""
        # 1. 读取所有记忆
        memories = []
        for file_info in self.memory_manager.md_manager.list_memory_mds():
            content = self.memory_manager.md_manager.read_memory_md(
                file_info["filename"]
            )
            memories.append({
                "filename": file_info["filename"],
                "content": content,
                "modified_time": file_info["modified_time"],
            })

        # 2. 按时间排序，保留最近的
        memories.sort(
            key=lambda x: x["modified_time"],
            reverse=True
        )

        # 3. 删除旧记忆
        for memory in memories[self.max_memories:]:
            self.memory_manager.md_manager.delete_memory_md(
                memory["filename"]
            )

        # 4. 生成摘要
        summary = await self._generate_summary(memories[:self.max_memories])

        # 5. 保存摘要
        timestamp = datetime.now().strftime("%Y%m%d")
        self.memory_manager.md_manager.write_memory_md(
            f"summary_{timestamp}.md",
            summary,
        )
```

---

## 配置管理

### 5.1 配置结构

```python
# src/copaw/config/config.py

class CoPawConfig(BaseModel):
    """CoPaw 主配置"""
    version: str = "0.2.0"
    agents: AgentProfilesConfig
    channels: List[ChannelConfig]
    tools: ToolsConfig
    server: ServerConfig

class AgentProfileConfig(BaseModel):
    """Agent 配置"""
    name: str
    description: str = ""
    model_provider: str
    model_name: str
    workspace_dir: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048

class ChannelConfig(BaseModel):
    """渠道配置"""
    type: ChannelType
    enabled: bool = True
    config: Dict[str, Any] = {}

class ToolsConfig(BaseModel):
    """工具配置"""
    builtin_tools: Dict[str, ToolConfig] = {}
    skills: List[str] = []
    mcp_clients: List[MCPClientConfig] = []

class ToolConfig(BaseModel):
    """工具配置"""
    enabled: bool = True
    display_to_user: bool = True
    options: Dict[str, Any] = {}
```

### 5.2 配置加载

```python
# src/copaw/config/utils.py

def load_config() -> CoPawConfig:
    """加载配置"""
    config_path = get_config_path()

    # 1. 读取主配置文件
    config_file = config_path / "config.yaml"
    if not config_file.exists():
        # 使用默认配置
        config = CoPawConfig()
        save_config(config)
        return config

    with open(config_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # 2. 加载 Agent 配置
    agents_dir = config_path / "agents"
    agents_data = {}
    if agents_dir.exists():
        for agent_file in agents_dir.glob("*.yaml"):
            agent_name = agent_file.stem
            with open(agent_file, "r", encoding="utf-8") as f:
                agents_data[agent_name] = yaml.safe_load(f)

    data["agents"] = {"profiles": agents_data}

    # 3. 加载渠道配置
    channels_file = config_path / "channels.yaml"
    if channels_file.exists():
        with open(channels_file, "r", encoding="utf-8") as f:
            data["channels"] = yaml.safe_load(f)

    # 4. 加载工具配置
    tools_file = config_path / "tools.yaml"
    if tools_file.exists():
        with open(tools_file, "r", encoding="utf-8") as f:
            data["tools"] = yaml.safe_load(f)

    # 5. 验证并创建配置对象
    config = CoPawConfig(**data)
    return config

def save_config(config: CoPawConfig) -> None:
    """保存配置"""
    config_path = get_config_path()
    config_path.mkdir(parents=True, exist_ok=True)

    # 1. 保存主配置
    config_file = config_path / "config.yaml"
    with open(config_file, "w", encoding="utf-8") as f:
        yaml.dump(
            config.model_dump(exclude={"agents", "channels", "tools"}),
            f,
            allow_unicode=True,
        )

    # 2. 保存 Agent 配置
    agents_dir = config_path / "agents"
    agents_dir.mkdir(exist_ok=True)
    for agent_id, agent_config in config.agents.profiles.items():
        agent_file = agents_dir / f"{agent_id}.yaml"
        with open(agent_file, "w", encoding="utf-8") as f:
            yaml.dump(
                agent_config.model_dump(),
                f,
                allow_unicode=True,
            )

    # 3. 保存渠道配置
    channels_file = config_path / "channels.yaml"
    with open(channels_file, "w", encoding="utf-8") as f:
        yaml.dump(config.channels, f, allow_unicode=True)

    # 4. 保存工具配置
    tools_file = config_path / "tools.yaml"
    with open(tools_file, "w", encoding="utf-8") as f:
        yaml.dump(config.tools.model_dump(), f, allow_unicode=True)
```

---

## WebSocket 连接管理

### 6.1 飞书 WebSocket 连接

```python
# src/copaw/app/channels/feishu/channel.py

class FeishuChannel(BaseChannel):

    async def _start_websocket(self) -> None:
        """启动 WebSocket 连接"""
        # 1. 创建 WebSocket 客户端
        ws_client = lark.ws.Client(
            app_id=self.app_id,
            app_secret=self.app_secret,
        )

        # 2. 设置事件处理器
        ws_client.on(
            lark.ws.P2ImMessageReceiveV1,
            self._handle_message_event,
        )

        # 3. 启动连接
        await ws_client.start()

        self._ws_client = ws_client

    async def _handle_ws_event(self, event: dict) -> None:
        """处理 WebSocket 事件"""
        try:
            # 1. 解析事件
            event_type = event.get("header", {}).get("event_type")

            # 2. 根据事件类型分发
            if event_type == "im.message.receive_v1":
                await self._handle_message_event(event)
            elif event_type == "im.message.status_v1":
                await self._handle_status_event(event)
            elif event_type == "application.bot.menu_v6":
                await self._handle_menu_event(event)

        except Exception as e:
            logger.error(f"Error handling ws event: {e}")

    async def _stop_websocket(self) -> None:
        """停止 WebSocket 连接"""
        if self._ws_client:
            await self._ws_client.stop()
            self._ws_client = None
```

### 6.2 WebSocket 重连机制

```python
# src/copaw/app/channels/base.py

class BaseChannel(ABC):

    async def _maintain_connection(self) -> None:
        """维护连接（带重连）"""
        while self._running:
            try:
                # 1. 建立连接
                await self._connect()

                # 2. 等待断开
                await self._wait_for_disconnect()

            except Exception as e:
                logger.error(f"Connection error: {e}")

                # 3. 指数退避重连
                await self._backoff_reconnect()

    async def _backoff_reconnect(self) -> None:
        """指数退避重连"""
        delay = 1  # 初始延迟 1 秒
        max_delay = 60  # 最大延迟 60 秒

        while self._running:
            try:
                logger.info(f"Reconnecting in {delay}s...")
                await asyncio.sleep(delay)

                await self._connect()
                logger.info("Reconnected successfully")
                return

            except Exception as e:
                logger.error(f"Reconnect failed: {e}")
                delay = min(delay * 2, max_delay)
```

---

## 文件上传处理

### 7.1 文件上传接口

```python
# src/copaw/app/routers/files.py

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    agent_id: str = Header(...),
) -> Dict[str, str]:
    """上传文件"""
    # 1. 验证 Agent
    config = load_config()
    if agent_id not in config.agents.profiles:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. 创建保存目录
    media_dir = Path(DEFAULT_MEDIA_DIR) / agent_id
    media_dir.mkdir(parents=True, exist_ok=True)

    # 3. 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = media_dir / filename

    # 4. 保存文件
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {e}"
        )

    # 5. 返回 URL
    file_url = f"/media/{agent_id}/{filename}"
    return {"url": file_url, "filename": filename}

@router.get("/media/{agent_id}/{filename}")
async def get_media(
    agent_id: str,
    filename: str,
) -> FileResponse:
    """获取媒体文件"""
    file_path = Path(DEFAULT_MEDIA_DIR) / agent_id / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)
```

### 7.2 图片处理

```python
# src/copaw/app/utils/image.py

async def process_uploaded_image(
    file_content: bytes,
    filename: str,
    max_size: tuple = (1920, 1080),
    quality: int = 85,
) -> tuple[bytes, str]:
    """处理上传的图片

    Returns:
        (处理后的内容, MIME 类型)
    """
    # 1. 识别图片格式
    image = Image.open(io.BytesIO(file_content))
    mime_type = Image.MIME.get(image.format, "image/jpeg")

    # 2. 调整大小
    if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
        image.thumbnail(max_size, Image.LANCZOS)

    # 3. 转换格式（如果需要）
    if image.format not in ["JPEG", "PNG", "GIF", "WEBP"]:
        output_format = "JPEG"
        mime_type = "image/jpeg"
    else:
        output_format = image.format
        mime_type = Image.MIME.get(image.format, "image/jpeg")

    # 4. 压缩
    output = io.BytesIO()
    image.save(output, format=output_format, quality=quality)
    processed_content = output.getvalue()

    return processed_content, mime_type
```

---

## 错误恢复机制

### 8.1 Agent 错误恢复

```python
# src/copaw/app/workspace.py

class Workspace:

    async def handle_agent_error(self, error: Exception) -> None:
        """处理 Agent 错误"""
        logger.error(f"Agent error: {error}")

        # 1. 分析错误类型
        if isinstance(error, MemoryError):
            # 内存错误：压缩记忆
            await self._compact_memory()

        elif isinstance(error, TimeoutError):
            # 超时错误：增加超时时间
            await self._increase_timeout()

        elif isinstance(error, ConnectionError):
            # 连接错误：重试
            await self._retry_connection()

        else:
            # 其他错误：记录并继续
            await self._log_error(error)

    async def _compact_memory(self) -> None:
        """压缩记忆"""
        if self.agent.memory_manager:
            await self.agent.memory_manager.compact()

    async def _increase_timeout(self) -> None:
        """增加超时时间"""
        current_timeout = self.agent_config.timeout
        new_timeout = min(current_timeout * 2, 300)  # 最大 5 分钟
        self.agent_config.timeout = new_timeout
        logger.info(f"Increased timeout to {new_timeout}s")

    async def _retry_connection(self) -> int:
        """重试连接"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                await asyncio.sleep(2 ** attempt)  # 指数退避
                await self.runner.restart()
                return 0
            except Exception as e:
                logger.error(f"Retry {attempt + 1} failed: {e}")

        return -1
```

### 8.2 渠道错误恢复

```python
# src/copaw/app/channels/base.py

class BaseChannel(ABC):

    async def _handle_send_error(
        self,
        content: Any,
        error: Exception,
    ) -> bool:
        """处理发送错误"""
        logger.error(f"Send error: {error}")

        # 1. 根据错误类型处理
        if isinstance(error, RateLimitError):
            # 速率限制：等待后重试
            await self._handle_rate_limit(error)
            return await self._retry_send(content)

        elif isinstance(error, TimeoutError):
            # 超时：重试
            return await self._retry_send(content)

        elif isinstance(error, AuthenticationError):
            # 认证错误：重新认证
            await self._reauthenticate()
            return await self._retry_send(content)

        else:
            # 其他错误：记录并失败
            return False

    async def _handle_rate_limit(self, error: RateLimitError) -> None:
        """处理速率限制"""
        retry_after = error.retry_after or 5
        logger.warning(f"Rate limited, waiting {retry_after}s")
        await asyncio.sleep(retry_after)

    async def _retry_send(self, content: Any) -> bool:
        """重试发送"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                await self._send_message(content)
                return True
            except Exception as e:
                logger.error(f"Retry {attempt + 1} failed: {e}")
                await asyncio.sleep(2 ** attempt)

        return False
```

---

## 总结

CoPaw 的实现展示了以下关键技术：

1. **消息处理**：统一的抽象接口，灵活的消息渲染
2. **生命周期管理**：清晰的初始化、运行、关闭流程
3. **工具系统**：插件式架构，动态注册
4. **记忆管理**：自动压缩，智能搜索
5. **配置管理**：分层配置，热更新支持
6. **连接管理**：自动重连，错误恢复
7. **文件处理**：安全上传，格式转换
8. **错误恢复**：分类处理，自动恢复

这些实现细节使得 CoPaw 成为一个稳定、可靠、易扩展的 AI Agent 系统。
