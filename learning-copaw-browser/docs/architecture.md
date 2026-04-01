# CoPaw 浏览器自动化系统架构详解

## 系统概述

CoPaw 的浏览器自动化系统是一个基于 **Playwright** 构建的强大工具，允许 AI Agent 通过自然语言指令控制浏览器进行网页交互、数据提取、自动化测试等操作。

### 核心特性

- **双模式运行**: 支持 async/sync Playwright 混合模式
- **多页面管理**: 一个浏览器实例管理多个页面 (page_id)
- **ARIA 快照**: 智能页面结构解析，生成可交互的元素引用
- **会话隔离**: 进程级全局状态管理，支持多用户/多任务
- **空闲看门狗**: 自动清理空闲浏览器会话 (默认 30 分钟)
- **跨平台支持**: Chromium/WebKit 浏览器，检测系统默认浏览器

---

## 核心架构组件

### 1. 全局状态管理 (`_state`)

**位置**: [browser_control.py:84-104](src/copaw/agents/tools/browser_control.py#L84-L104)

```python
_state: dict[str, Any] = {
    # Playwright 核心对象
    "playwright": None,      # Playwright 实例
    "browser": None,         # 浏览器实例
    "context": None,         # 浏览器上下文 (⚠️ 不支持 user_data_dir)

    # 页面管理
    "pages": {},             # page_id -> Page 对象
    "refs": {},              # 元素引用映射 (page_id -> ref -> element)
    "refs_frame": {},        # 快照时的 frame 引用

    # 监听数据
    "console_logs": {},      # 控制台日志
    "network_requests": {},  # 网络请求记录

    # 交互状态
    "pending_dialogs": {},   # 待处理的对话框
    "pending_file_choosers": {},  # 文件选择器

    # 配置
    "headless": True,        # 是否无头模式
    "current_page_id": None, # 当前活动页面
    "page_counter": 0,       # 页面计数器 (单调递增)

    # 生命周期管理
    "last_activity_time": 0.0,    # 最后活动时间
    "_idle_task": None,           # 空闲看门狗任务
    "_last_browser_error": None,  # 最后错误信息

    # 混合模式同步句柄
    "_sync_browser": None,
    "_sync_context": None,
    "_sync_playwright": None,
}
```

**关键设计点**:
- **单浏览器多页面**: 一个浏览器进程管理多个页面，节省资源
- **元素引用系统**: 使用 `e1`, `e2` 等引用标识元素，避免脆弱的选择器
- **活动追踪**: 记录最后活动时间，实现自动清理

---

### 2. browser_use 主函数

**位置**: [browser_control.py:314-360](src/copaw/agents/tools/browser_control.py#L314-L360)

**函数签名**:
```python
async def browser_use(
    action: str,           # 操作类型
    url: str = "",         # URL (open/navigate)
    page_id: str = "default",  # 页面 ID
    selector: str = "",    # CSS 选择器
    text: str = "",        # 输入文本
    code: str = "",        # 执行代码
    wait: int = 0,         # 等待毫秒
    ref: str = "",         # 元素引用 (e1, e2, ...)
    headed: bool = False,  # 是否显示浏览器窗口
    # ... 30+ 参数
) -> ToolResponse:
```

**支持的操作** (共 24 种):

| 操作 | 功能 | 典型用途 |
|------|------|----------|
| `start` | 启动浏览器 | 初始化会话 |
| `stop` | 停止浏览器 | 清理资源 |
| `open` | 打开新页面 | 访问网址 |
| `navigate` | 页面导航 | 跳转 URL |
| `snapshot` | 页面快照 | 获取 ARIA 结构 |
| `click` | 点击元素 | 交互操作 |
| `type` | 输入文本 | 表单填写 |
| `fill` | 填写表单 | 批量输入 |
| `screenshot` | 截图 | 视觉验证 |
| `extract` | 提取数据 | 数据采集 |
| `eval` | 执行 JS | 自定义脚本 |
| `pdf` | 导出 PDF | 文档生成 |
| `tabs` | 标签页管理 | 多标签操作 |
| `wait_for` | 等待条件 | 智能等待 |
| `resize` | 调整窗口 | 响应式测试 |
| `upload` | 文件上传 | 表单提交 |
| `drag` | 拖拽元素 | 复杂交互 |
| `hover` | 悬停 | 测试悬停效果 |
| `select` | 选择选项 | 下拉框操作 |
| `press_key` | 按键 | 键盘操作 |
| `console` | 控制台日志 | 调试信息 |
| `network` | 网络请求 | API 监控 |
| `install` | 安装浏览器 | 环境配置 |

---

### 3. 页面快照系统 (browser_snapshot.py)

**位置**: [browser_snapshot.py](src/copaw/agents/tools/browser_snapshot.py)

**核心功能**: 将网页转换为结构化的 ARIA 树，生成可交互的元素引用。

**工作流程**:

```python
# 1. 获取页面 ARIA 树
aria_tree = await page.accessibility.snapshot()

# 2. 构建角色映射
role_snapshot = build_role_snapshot_from_aria(aria_tree)

# 3. 生成元素引用 (e1, e2, e3, ...)
for element in flattened_tree:
    ref = f"e{counter}"
    refs[ref] = {
        "role": element.role,
        "name": element.name,
        "nth": element.nth,
    }

# 4. 返回可读的树状结构
return format_tree(role_snapshot)
```

**输出示例**:
```
page
├── heading [Amazon]
├── textbox [Search] (e1)
├── button [Go] (e2)
└── link [Sign in] (e3)
```

**关键特性**:
- **语义化引用**: 使用 `e1` 而不是 `#nav > div:nth-child(2) > a`
- **ARIA 兼容**: 支持无障碍标准，更稳定
- **自动去重**: 相同元素合并显示
- **上下文保留**: 记录 frame 信息

---

### 4. ReAct Agent 集成

**位置**: [react_agent.py](src/copaw/agents/react_agent.py#L211)

**集成方式**:

```python
from .tools import browser_use

class ReActAgent:
    def __init__(self):
        self.tools = {
            "browser_use": browser_use,
            "edit_file": edit_file,
            "grep_search": grep_search,
            # ... 其他工具
        }

    async def run(self, query: str):
        # ReAct 循环:
        # 1. Thought: 分析任务
        # 2. Action: 调用 browser_use
        # 3. Observation: 查看结果
        # 4. 重复直到完成
```

**决策示例**:
```
User: "搜索 Amazon 的 bed 产品"

Thought: 需要使用浏览器访问 Amazon
Action: browser_use(action="start", headed=True)
Observation: 浏览器已启动

Thought: 打开 Amazon 搜索页面
Action: browser_use(action="open", url="https://amazon.com/s?k=bed")
Observation: 页面已加载，看到搜索结果

Thought: 提取产品信息
Action: browser_use(action="snapshot")
Observation: [看到产品列表]

Thought: 点击第一个产品
Action: browser_use(action="click", ref="e5")
...
```

---

## 生命周期管理

### 启动流程

```
用户调用 browser_use(action="start", headed=True)
    ↓
browser_use 函数接收请求
    ↓
分发到 _action_start(headed=True)
    ↓
_ensure_browser() 检查浏览器状态
    ↓
选择浏览器类型:
    - 系统 Chromium (COPAW_BROWSER_USE_DEFAULT=1)
    - Playwright Chromium (默认)
    - WebKit (macOS fallback)
    ↓
启动浏览器进程
    ↓
创建上下文 context = await browser.new_context()
    ↓
附加监听器 (console, network, dialog)
    ↓
启动空闲看门狗 (30 分钟超时)
    ↓
返回成功响应
```

**关键代码** [browser_control.py:796](src/copaw/agents/tools/browser_control.py#L796):
```python
# ⚠️ 不支持 user_data_dir - 会话无法持久化
context = await pw_browser.new_context()
```

### 空闲清理机制

**位置**: [browser_control.py:119-142](src/copaw/agents/tools/browser_control.py#L119-L142)

```python
_BROWSER_IDLE_TIMEOUT = 1800.0  # 30 分钟

async def _idle_watchdog(idle_seconds: float = _BROWSER_IDLE_TIMEOUT):
    while True:
        await asyncio.sleep(idle_seconds)
        idle_time = time.monotonic() - _state["last_activity_time"]
        if idle_time >= idle_seconds:
            # 自动关闭浏览器
            await _action_stop()
            break

def _touch_activity() -> None:
    """每次操作都会更新活动时间"""
    _state["last_activity_time"] = time.monotonic()
```

---

## 元素引用系统

### 传统方法 vs CoPaw 方法

**❌ 传统 CSS 选择器**:
```python
# 脆弱，页面结构改变就失效
element = page.click("#nav > div:nth-child(2) > div > ul > li:nth-child(1) > a")
```

**✅ CoPaw 元素引用**:
```python
# 稳定，基于 ARIA 角色
browser_use(action="click", ref="e5")  # e5 = "搜索按钮"
```

### 引用生成流程

```python
# 1. 获取 ARIA 树
aria_tree = await page.accessibility.snapshot()

# 2. 扁平化并编号
elements = []
def traverse(node, depth=0):
    elements.append({
        "ref": f"e{len(elements)+1}",
        "role": node["role"],
        "name": node["name"],
        "depth": depth
    })
    for child in node["children"]:
        traverse(child, depth+1)

traverse(aria_tree)

# 3. 构建引用映射
refs = {e["ref"]: e for e in elements}

# 4. 用户可以通过引用交互
browser_use(action="click", ref="e5")
```

**引用查找** [browser_control.py:487-520](src/copaw/agents/tools/browser_control.py#L487-L520):
```python
async def _get_locator_by_ref(page, ref: str, page_id: str):
    refs = _get_refs(page_id)
    if ref not in refs:
        raise ValueError(f"未知引用: {ref}")

    ref_data = refs[ref]
    role = ref_data["role"]
    name = ref_data.get("name")
    nth = ref_data.get("nth", 0)

    # 使用 ARIA 角色定位
    locator = page.get_by_role(role, name=name)
    if nth > 0:
        locator = locator.nth(nth)

    return locator
```

---

## 会话持久化限制

### ⚠️ 当前限制

**问题**: browser_use **不支持** `user_data_dir` 参数

**影响**:
- ❌ 每次启动都是全新浏览器配置文件
- ❌ 登录状态无法保存
- ❌ Cookies 在关闭后丢失
- ❌ 需要每次重新登录

**原因**: [browser_control.py:796](src/copaw/agents/tools/browser_control.py#L796)
```python
# 不支持持久化的上下文创建
context = await pw_browser.new_context()

# 应该是 (但未实现):
# context = await pw_browser.new_context(
#     user_data_dir="/path/to/profile"
# )
```

### 解决方案

**方案 1: 保持会话活跃**
```python
# 一次启动，完成所有操作
browser_use(action="start", headed=True)
# ... 执行多个操作
browser_use(action="stop")  # 最后才关闭
```

**方案 2: 使用系统浏览器**
```bash
# 设置环境变量使用系统 Chrome
export COPAW_BROWSER_USE_DEFAULT=1
uv run copaw app
```

**方案 3: 手动 Cookie 管理**
```python
# 保存 Cookies
cookies = await page.context.cookies()
save_to_file("cookies.json", cookies)

# 恢复 Cookies
await page.context.add_cookies(load_from_file("cookies.json"))
```

---

## 监听和调试

### 控制台日志监听

**位置**: [browser_control.py:1720-1765](src/copaw/agents/tools/browser_control.py#L1720-L1765)

```python
def _attach_page_listeners(page, page_id: str):
    async def handle_console(msg):
        _state["console_logs"][page_id].append({
            "level": msg.type,
            "text": msg.text,
            "timestamp": time.time()
        })

    page.on("console", handle_console)
```

**获取日志**:
```python
browser_use(action="console", page_id="default")
# 返回:
# {
#   "ok": true,
#   "logs": [
#     {"level": "error", "text": "Failed to load", "timestamp": ...}
#   ]
# }
```

### 网络请求监听

**位置**: [browser_control.py:1767-1820](src/copaw/agents/tools/browser_control.py#L1767-L1820)

```python
async def handle_request(request):
    _state["network_requests"][page_id].append({
        "url": request.url,
        "method": request.method,
        "resource_type": request.resource_type
    })

context.on("request", handle_request)
```

**获取请求**:
```python
browser_use(action="network", page_id="default")
# 返回所有网络请求记录
```

---

## 配置和环境

### 环境变量

| 变量 | 作用 | 默认值 |
|------|------|--------|
| `COPAW_BROWSER_USE_DEFAULT` | 使用系统浏览器 | `"1"` |
| `PLAYWRIGHT_BROWSERS_PATH` | 浏览器安装路径 | Playwright 默认 |
| `HEADLESS` | 无头模式 | `"true"` |

### 浏览器选择逻辑

**位置**: [browser_control.py:760-795](src/copaw/agents/tools/browser_control.py#L760-L795)

```python
# 1. 检查系统默认浏览器
if os.environ.get("COPAW_BROWSER_USE_DEFAULT", "1") == "1":
    kind, path = get_system_default_browser()
    if kind == "chromium" and path:
        # 使用系统 Chrome/Edge/Chromium
        browser = await pw.chromium.launch(executable_path=path)
    elif kind == "webkit":
        # 使用 Safari (macOS)
        browser = await pw.webkit.launch()

# 2. 回退到 Playwright 浏览器
else:
    if sys.platform == "darwin":
        # macOS 优先 WebKit
        browser = await pw.webkit.launch()
    else:
        # Linux/Windows 使用 Chromium
        browser = await pw.chromium.launch()
```

---

## 性能优化

### 资源管理

1. **单浏览器多页面**: 避免启动多个浏览器进程
2. **空闲清理**: 自动关闭不活跃的浏览器
3. **延迟加载**: 按需启动浏览器
4. **连接复用**: Playwright 复用浏览器连接

### 并发控制

```python
# page_counter 确保页面 ID 不重复
_page_counter = 0

def _next_page_id() -> str:
    global _page_counter
    _page_counter += 1
    return f"page_{_page_counter}"
```

---

## 安全考虑

### 权限管理

```python
# 工具守卫 (ToolGuardMixin)
class ToolGuardMixin:
    def check_permission(self, tool_name: str, action: str):
        # 检查工具调用权限
        # 记录操作日志
        # 验证参数安全性
```

### 沙箱隔离

- 浏览器运行在独立进程
- 网络请求可被监控和过滤
- 文件上传需要用户确认

---

## 扩展和自定义

### 添加新操作

```python
async def _action_custom(page_id: str, param: str) -> ToolResponse:
    """自定义操作"""
    page = _get_page(page_id)

    # 实现自定义逻辑
    result = await page.do_something(param)

    return _tool_response(json.dumps({"ok": True, "result": result}))

# 在 browser_use 函数中注册
if action == "custom":
    return await _action_custom(page_id, param)
```

### 自定义快照解析

```python
from browser_snapshot import build_role_snapshot_from_aria

# 扩展 ARIA 解析
def custom_snapshot_builder(aria_tree):
    snapshot = build_role_snapshot_from_aria(aria_tree)

    # 添加自定义字段
    snapshot["custom_field"] = extract_custom_data(aria_tree)

    return snapshot
```

---

## 总结

### CoPaw 浏览器自动化系统的核心优势

1. **智能元素引用**: 基于语义而非脆弱选择器
2. **多页面管理**: 高效的资源利用
3. **自动清理**: 防止资源泄漏
4. **跨平台支持**: 自动检测最佳浏览器
5. **监听调试**: 内置日志和网络监控
6. **AI 集成**: 与 ReAct Agent 无缝集成

### 当前限制

1. **会话持久化**: 不支持 user_data_dir
2. **单进程全局状态**: 无法在同一进程运行多个独立浏览器
3. **依赖 Playwright**: 需要安装 Playwright 浏览器

### 未来改进方向

1. 添加 user_data_dir 支持实现会话持久化
2. 支持分布式浏览器管理
3. 增强的 Cookie 和会话管理
4. 支持更多浏览器类型 (Firefox)
5. 云端浏览器集成 (BrowserBase, etc.)

---

**相关文件**:
- 主实现: [browser_control.py](src/copaw/agents/tools/browser_control.py)
- 快照系统: [browser_snapshot.py](src/copaw/agents/tools/browser_snapshot.py)
- ReAct 集成: [react_agent.py](src/copaw/agents/react_agent.py)
- 配置: [config.py](src/copaw/config/config.py)
