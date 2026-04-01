# CoPaw Browser Use - 会话持久化限制深度分析

## 问题概述

CoPaw 的 `browser_use` 工具当前**不支持**浏览器会话持久化，这意味着每次启动浏览器都是临时会话，登录状态、Cookies 和其他浏览器数据在关闭后会丢失。

---

## 技术分析

### 当前实现

**位置**: [browser_control.py:796](src/copaw/agents/tools/browser_control.py#L796)

```python
# 标准模式: async Playwright
async_playwright = _ensure_playwright_async()
pw = await async_playwright().start()
pw_browser = await pw.chromium.launch(**launch_kwargs)

# ⚠️ 关键问题: 不支持 user_data_dir
context = await pw_browser.new_context()  # 无参数，临时上下文
```

**问题根源**:
1. `new_context()` 调用时没有传递任何参数
2. Playwright 默认创建临时浏览器配置文件
3. 浏览器关闭后，所有数据被清除

### 预期的实现 (未实现)

```python
# 应该支持的实现
context = await pw_browser.new_context(
    user_data_dir="/path/to/browser/profile",
    accept_downloads=True,
    viewport={"width": 1920, "height": 1080}
)
```

**如果实现**:
- 浏览器数据会保存到指定目录
- 登录状态会在重启后保持
- Cookies、LocalStorage、SessionStorage 会持久化
- 浏览器扩展可以被安装和使用

---

## Playwright Context 详解

### 什么是 Browser Context?

在 Playwright 中，**Browser Context** 是一个隔离的浏览器会话环境：

```python
# Browser: 浏览器进程 (一个或多个)
#   └── Context: 隔离的会话环境 (多个)
#       └── Page: 实际的网页标签页 (多个)
```

**Context 的特性**:
- **Cookie 隔离**: 每个 Context 有独立的 Cookie 存储
- **LocalStorage 隔离**: 每个 Context 有独立的 LocalStorage
- **Session 隔离**: 会话数据不共享
- **轻量级**: 创建 Context 比创建 Browser 快得多

### user_data_dir 参数的作用

```python
context = await browser.new_context(
    user_data_dir="/path/to/profile"
)
```

**user_data_dir 提供**:
1. **持久化 Cookies**: 登录状态保持
2. **LocalStorage 持久化**: 网站设置保留
3. **SessionStorage 持久化**: 会话数据保留
4. **缓存持久化**: 加载速度更快
5. **浏览器扩展**: 可以安装和使用扩展
6. **证书和权限**: 保存 SSL 证书和网站权限

**目录结构**:
```
/path/to/profile/
├── Default/
│   ├── Cookies       # Cookies 数据库
│   ├── Local Storage # LocalStorage 数据
│   ├── Session Storage # SessionStorage 数据
│   ├── Cache         # 浏览器缓存
│   ├── Preferences   # 浏览器设置
│   └── ...
└── ...
```

---

## 影响范围

### 受限功能

| 功能 | 当前状态 | 影响 |
|------|----------|------|
| 登录状态保持 | ❌ 不支持 | 每次启动需要重新登录 |
| Cookies 保存 | ❌ 不支持 | 网站偏好设置丢失 |
| 浏览器扩展 | ❌ 不支持 | 无法使用扩展功能 |
| 缓存利用 | ❌ 不支持 | 每次都是冷启动加载 |
| 自动填充 | ❌ 不支持 | 表单数据不保存 |
| 浏览历史 | ❌ 不支持 | 无浏览记录 |

### 受限场景

**场景 1: 需要登录的服务**
```json
// ❌ 无法保持登录状态
{"action": "start", "headed": true}
{"action": "open", "url": "https://gmail.com"}
// 需要每次手动登录
```

**场景 2: 需要浏览历史的操作**
```json
// ❌ 无浏览历史
{"action": "navigate_back"}  // 可能无历史可退
```

**场景 3: 需要浏览器扩展**
```json
// ❌ 无法安装或使用扩展
// 无法使用广告拦截器、翻译工具等
```

---

## 解决方案和变通方法

### 方案 1: 保持会话活跃 (推荐)

**原理**: 一次启动，完成所有操作，避免重启浏览器。

**实现**:
```python
# Agent 工作流程
async def complete_workflow():
    # 1. 启动浏览器 (只启动一次)
    await browser_use(action="start", headed=True)

    try:
        # 2. 完成所有操作
        await browser_use(action="open", url="https://example.com")
        await browser_use(action="wait", ms=2000)
        await browser_use(action="snapshot")

        # ... 更多操作 ...

    finally:
        # 3. 所有操作完成后才关闭
        await browser_use(action="stop")
```

**优点**:
- 简单直接
- 不需要修改代码
- 适合短期任务

**缺点**:
- 长期运行可能占用资源
- 进程崩溃会丢失状态
- 无法跨进程共享状态

### 方案 2: 使用系统浏览器

**原理**: 使用已登录的系统浏览器，继承其登录状态。

**实现**:
```bash
# 设置环境变量
export COPAW_BROWSER_USE_DEFAULT=1
```

**代码**:
```json
// 使用系统默认浏览器 (Chrome/Edge)
{"action": "start", "headed": true}
// 会使用系统浏览器的配置文件
```

**优点**:
- 可以使用已登录的系统浏览器
- 浏览器扩展可用
- 用户熟悉的界面

**缺点**:
- 依赖系统浏览器安装
- 可能源于权限问题
- 无法完全自动化 (需要系统登录)

### 方案 3: 手动 Cookie 管理

**原理**: 手动保存和恢复 Cookies，绕过持久化限制。

**实现**:
```python
# 保存 Cookies
async def save_cookies(page_id: str, path: str):
    page = _get_page(page_id)
    cookies = await page.context.cookies()
    with open(path, 'w') as f:
        json.dump(cookies, f)

# 恢复 Cookies
async def restore_cookies(page_id: str, path: str):
    page = _get_page(page_id)
    with open(path, 'r') as f:
        cookies = json.load(f)
    await page.context.add_cookies(cookies)
```

**使用流程**:
```python
# 首次登录
await browser_use(action="start", headed=True)
await browser_use(action="open", url="https://example.com")
# ... 手动登录 ...
await save_cookies("default", "/tmp/cookies.json")
await browser_use(action="stop")

# 后续使用
await browser_use(action="start")
await browser_use(action="open", url="https://example.com")
await restore_cookies("default", "/tmp/cookies.json")
# 已经是登录状态
```

**优点**:
- 可以保持登录状态
- 可以跨进程共享
- 灵活的存储位置

**缺点**:
- 只保存 Cookies，不保存 LocalStorage
- 需要额外代码
- Cookies 可能过期

### 方案 4: 修改源码 (高级)

**原理**: 修改 `browser_control.py` 添加 `user_data_dir` 支持。

**修改位置** [browser_control.py:796](src/copaw/agents/tools/browser_control.py#L796):

```python
# 当前代码
context = await pw_browser.new_context()

# 修改为
user_data_dir = kwargs.get("user_data_dir", "")
context_args = {}
if user_data_dir:
    context_args["user_data_dir"] = user_data_dir

context = await pw_browser.new_context(**context_args)
```

**同时更新函数签名** [browser_control.py:314](src/copaw/agents/tools/browser_control.py#L314):

```python
async def browser_use(
    action: str,
    # ... 其他参数
    user_data_dir: str = "",  # 新增参数
    # ...
) -> ToolResponse:
```

**优点**:
- 完整的持久化支持
- 所有浏览器特性可用
- 一次性修改，永久受益

**缺点**:
- 需要修改核心代码
- 需要维护自定义版本
- 升级时可能冲突

---

## 推荐方案对比

| 方案 | 难度 | 效果 | 维护成本 | 推荐度 |
|------|------|------|----------|--------|
| 保持会话活跃 | 低 | 中 | 低 | ⭐⭐⭐ |
| 系统浏览器 | 低 | 高 | 低 | ⭐⭐⭐⭐ |
| 手动 Cookie 管理 | 中 | 中 | 中 | ⭐⭐ |
| 修改源码 | 高 | 高 | 高 | ⭐⭐⭐⭐⭐ |

**推荐策略**:
1. **短期任务**: 使用"保持会话活跃"
2. **日常使用**: 使用"系统浏览器"
3. **长期运行**: 实现"手动 Cookie 管理"
4. **完整功能**: 考虑"修改源码"

---

## 代码示例

### 完整的 Cookie 管理实现

```python
import json
import os
from pathlib import Path

class CookieManager:
    """Cookie 管理器"""

    def __init__(self, cookie_dir: str = "/tmp/copaw_cookies"):
        self.cookie_dir = Path(cookie_dir)
        self.cookie_dir.mkdir(parents=True, exist_ok=True)

    def get_cookie_path(self, page_id: str, url: str) -> str:
        """生成 Cookie 文件路径"""
        domain = url.split("/")[2]
        return str(self.cookie_dir / f"{page_id}_{domain}.json")

    async def save_cookies(self, page, page_id: str, url: str):
        """保存 Cookies"""
        from copaw.agents.tools.browser_control import _get_page

        cookie_path = self.get_cookie_path(page_id, url)
        cookies = await page.context.cookies()

        with open(cookie_path, 'w') as f:
            json.dump({
                "cookies": cookies,
                "timestamp": time.time(),
                "url": url
            }, f, indent=2)

        print(f"✅ Cookies saved to {cookie_path}")

    async def load_cookies(self, page, page_id: str, url: str):
        """加载 Cookies"""
        cookie_path = self.get_cookie_path(page_id, url)

        if not os.path.exists(cookie_path):
            print(f"⚠️ No saved cookies found for {url}")
            return False

        with open(cookie_path, 'r') as f:
            data = json.load(f)

        await page.context.add_cookies(data["cookies"])
        print(f"✅ Cookies loaded from {cookie_path}")
        return True
```

**使用示例**:
```python
# 初始化
manager = CookieManager()

# 首次使用
await browser_use(action="start", headed=True)
await browser_use(action="open", url="https://example.com")
# ... 手动登录 ...
page = _get_page("default")
await manager.save_cookies(page, "default", "https://example.com")
await browser_use(action="stop")

# 后续使用
await browser_use(action="start")
await browser_use(action="open", url="https://example.com")
page = _get_page("default")
await manager.load_cookies(page, "default", "https://example.com")
# 已登录状态
```

---

## 未来展望

### 可能的改进

1. **添加 user_data_dir 支持** (最需要)
   - 修改 `new_context()` 调用
   - 添加参数到 `browser_use` 函数
   - 更新文档和示例

2. **自动会话管理**
   - 检测登录状态
   - 自动保存/恢复会话
   - 智能会话复用

3. **分布式浏览器管理**
   - 支持远程浏览器
   - 云端浏览器服务 (BrowserBase, etc.)
   - 浏览器池管理

4. **增强的 Cookie 管理**
   - 自动检测 Cookie 过期
   - 智能刷新机制
   - 跨设备同步

### 社区贡献

如果需要 `user_data_dir` 支持，可以：

1. **提交 Issue**: 在 CoPaw GitHub 仓库提出需求
2. **Pull Request**: 实现并提交代码
3. **讨论方案**: 在社区讨论最佳实现方式

---

## 总结

CoPaw 的 browser_use 工具目前不支持会话持久化，这是由其实现方式决定的。虽然限制了某些使用场景，但通过上述变通方法，大部分需求仍然可以得到满足。

**关键要点**:
1. 理解限制的根源 (Playwright context 创建方式)
2. 根据场景选择合适的解决方案
3. 优先使用简单的变通方法
4. 考虑长期维护成本

**推荐做法**:
- 日常使用: `COPAW_BROWSER_USE_DEFAULT=1` 使用系统浏览器
- 短期任务: 保持会话活跃，避免频繁重启
- 长期运行: 实现 Cookie 管理机制
- 完整需求: 考虑修改源码添加 `user_data_dir` 支持

通过合理的设计和实现，即使在没有原生持久化的情况下，仍然可以构建稳定可靠的浏览器自动化解决方案。
