# CoPaw Browser Use - 常见使用模式

## 目录

1. [基础操作](#基础操作)
2. [数据提取模式](#数据提取模式)
3. [表单交互](#表单交互)
4. [多页面管理](#多页面管理)
5. [错误处理](#错误处理)
6. [性能优化](#性能优化)
7. [完整示例](#完整示例)

---

## 基础操作

### 1. 启动和关闭浏览器

```json
// 启动可见浏览器
{"action": "start", "headed": true}

// 启动无头浏览器 (默认)
{"action": "start"}

// 关闭浏览器
{"action": "stop"}
```

**最佳实践**:
- 开发阶段使用 `headed: true` 便于调试
- 生产环境使用无头模式提高性能
- 完成所有操作后再关闭浏览器

### 2. 页面导航

```json
// 打开新页面
{"action": "open", "url": "https://example.com"}

// 在当前页面导航
{"action": "navigate", "url": "https://example.com/page2"}

// 后退
{"action": "navigate_back"}

// 刷新 (使用 navigate)
{"action": "navigate", "url": window.location.href}
```

### 3. 页面快照

```json
// 获取页面结构
{"action": "snapshot"}
```

**输出示例**:
```
page
├── heading [Welcome] (e1)
├── textbox [Email] (e2)
├── textbox [Password] (e3)
└── button [Login] (e4)
```

---

## 数据提取模式

### 模式 1: 提取单个文本

```json
// 1. 获取快照找到元素
{"action": "snapshot"}

// 2. 使用选择器提取
{"action": "extract", "selector": "h1"}
```

**完整流程**:
```
1. start → 2. open → 3. snapshot → 4. extract → 5. stop
```

### 模式 2: 提取多个元素

```json
// 提取所有产品标题
{"action": "extract", "selector": ".product-title"}

// 提取所有价格
{"action": "extract", "selector": ".price"}
```

**处理结果**:
```python
# Agent 需要解析返回的 HTML/文本
results = response.extracted_text
items = parse_multiple_items(results)
```

### 模式 3: 使用 JavaScript 提取复杂数据

```json
{
  "action": "eval",
  "code": "Array.from(document.querySelectorAll('.product')).map(p => ({title: p.querySelector('h2').textContent, price: p.querySelector('.price').textContent}))"
}
```

**优势**:
- 一次性提取结构化数据
- 可以进行数据转换
- 减少多次交互

### 模式 4: 表格数据提取

```json
// 提取整个表格
{"action": "extract", "selector": "table"}

// 或使用 JavaScript
{
  "action": "eval",
  "code": "Array.from(document.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent))"
}
```

---

## 表单交互

### 模式 1: 逐字段填写

```json
// 1. 获取快照
{"action": "snapshot"}

// 2. 填写每个字段
{"action": "type", "selector": "#email", "text": "user@example.com"}
{"action": "type", "selector": "#password", "text": "secret123"}

// 3. 提交
{"action": "click", "selector": "button[type='submit']"}
```

### 模式 2: 批量表单填写 (推荐)

```json
{
  "action": "fill",
  "fields": {
    "#email": "user@example.com",
    "#password": "secret123",
    "#name": "John Doe"
  }
}
```

**优势**:
- 一次操作完成多个字段
- 自动处理焦点变化
- 更高效

### 模式 3: 下拉框选择

```json
{
  "action": "select",
  "selector": "#country",
  "value": "United States"
}
```

**或使用 JavaScript**:
```json
{
  "action": "eval",
  "code": "document.querySelector('#country').value = 'US'; document.querySelector('#country').dispatchEvent(new Event('change'))"
}
```

### 模式 4: 文件上传

```json
{
  "action": "upload",
  "paths": ["/path/to/file1.pdf", "/path/to/file2.jpg"]
}
```

**注意**: 需要先点击上传按钮触发文件选择器。

### 模式 5: 复选框和单选按钮

```json
// 勾选复选框
{"action": "click", "selector": "#terms"}

// 选择单选按钮
{"action": "click", "selector": "input[name='plan'][value='premium']"}
```

---

## 多页面管理

### 场景 1: 对比多个网页

```json
// 页面 1
{"action": "open", "url": "https://example1.com", "page_id": "page1"}
{"action": "extract", "selector": "h1", "page_id": "page1"}

// 页面 2
{"action": "open", "url": "https://example2.com", "page_id": "page2"}
{"action": "extract", "selector": "h1", "page_id": "page2"}

// 对比数据
// Agent 可以使用提取的数据进行对比
```

### 场景 2: 标签页管理

```json
// 打开新标签页
{"action": "tabs", "tab_action": "new"}

// 切换到指定标签页
{"action": "tabs", "tab_action": "switch", "index": 1}

// 关闭当前标签页
{"action": "tabs", "tab_action": "close"}

// 获取所有标签页信息
{"action": "tabs", "tab_action": "list"}
```

### 场景 3: 页面间导航流程

```json
// 1. 主页
{"action": "open", "url": "https://example.com", "page_id": "main"}

// 2. 从主页打开产品页 (在新页面)
{"action": "click", "ref": "e5", "page_id": "main", "open_in_new_tab": true}

// 3. 切换到新页面
{"action": "tabs", "tab_action": "switch", "index": 1}

// 4. 在产品页操作
{"action": "snapshot"}

// 5. 返回主页
{"action": "tabs", "tab_action": "switch", "index": 0}
```

---

## 错误处理

### 模式 1: 元素未找到

```json
// ❌ 错误: 直接点击可能失败
{"action": "click", "selector": "#button"}

// ✅ 正确: 先等待元素出现
{"action": "wait_for", "selector": "#button", "timeout": 5000}
{"action": "click", "selector": "#button"}
```

### 模式 2: 页面加载超时

```json
// 等待特定条件
{
  "action": "wait_for",
  "state": "load",  // load, domcontentloaded, networkidle
  "timeout": 10000
}

// 或等待元素可见
{
  "action": "wait_for",
  "selector": "#content",
  "timeout": 10000
}
```

### 模式 3: 对话框处理

```json
// 自动处理所有对话框
{"action": "handle_dialog", "accept": true}

// 处理特定类型对话框
{
  "action": "handle_dialog",
  "dialog_type": "alert",  // alert, confirm, prompt
  "accept": true,
  "prompt_text": "Optional text for prompt"
}
```

### 模式 4: 重试机制

```python
# Agent 层面的重试逻辑
max_retries = 3
for attempt in range(max_retries):
    try:
        browser_use(action="click", ref="e10")
        break
    except Exception as e:
        if attempt == max_retries - 1:
            raise
        await asyncio.sleep(1)
```

---

## 性能优化

### 技巧 1: 减少快照次数

```json
// ❌ 不推荐: 每次操作前都快照
{"action": "snapshot"}
{"action": "click", "ref": "e1"}
{"action": "snapshot"}
{"action": "click", "ref": "e2"}
{"action": "snapshot"}

// ✅ 推荐: 只在需要时快照
{"action": "snapshot"}
{"action": "click", "ref": "e1"}
{"action": "click", "ref": "e2"}
{"action": "snapshot"}  // 只在最终状态快照
```

### 技巧 2: 使用批量操作

```json
// ❌ 不推荐: 多次单独提取
{"action": "extract", "selector": ".title[1]"}
{"action": "extract", "selector": ".title[2]"}
{"action": "extract", "selector": ".title[3]"}

// ✅ 推荐: 一次性提取所有
{"action": "eval", "code": "Array.from(document.querySelectorAll('.title')).map(t => t.textContent)"}
```

### 技巧 3: 并行页面操作

```python
# 同时在多个页面操作
async def parallel_tasks():
    task1 = browser_use(action="open", url="url1", page_id="p1")
    task2 = browser_use(action="open", url="url2", page_id="p2")
    await asyncio.gather(task1, task2)
```

### 技巧 4: 停止不必要的资源加载

```json
// 使用 JavaScript 阻止图片加载
{
  "action": "eval",
  "code": "(() => { const style = document.createElement('style'); style.innerHTML = 'img { display: none !important; }'; document.head.appendChild(style); })()"
}
```

---

## 完整示例

### 示例 1: Amazon 产品搜索

```json
// 1. 启动浏览器
{"action": "start", "headed": true}

// 2. 打开 Amazon 搜索
{"action": "open", "url": "https://www.amazon.com/s?k=wireless+mouse"}

// 3. 等待加载
{"action": "wait", "ms": 3000}

// 4. 获取页面快照
{"action": "snapshot"}

// 5. 提取前 10 个产品信息
{
  "action": "eval",
  "code": "Array.from(document.querySelectorAll('[data-component-type=\"s-search-result\"]')).slice(0, 10).map(p => ({title: p.querySelector('h2')?.textContent, price: p.querySelector('.a-price')?.textContent}))"
}

// 6. 点击第一个产品
{"action": "click", "ref": "e15"}

// 7. 等待产品页加载
{"action": "wait", "ms": 2000}

// 8. 截图保存
{"action": "screenshot", "path": "/tmp/product.png"}

// 9. 关闭浏览器
{"action": "stop"}
```

### 示例 2: 表单填写和提交

```json
// 1. 打开注册页面
{"action": "open", "url": "https://example.com/register"}

// 2. 快照查看表单结构
{"action": "snapshot"}

// 3. 批量填写表单
{
  "action": "fill",
  "fields": {
    "#username": "john_doe",
    "#email": "john@example.com",
    "#password": "SecurePass123!",
    "#confirm-password": "SecurePass123!"
  }
}

// 4. 同意条款
{"action": "click", "selector": "#terms"}

// 5. 提交表单
{"action": "click", "selector": "button[type='submit']"}

// 6. 等待响应
{"action": "wait_for", "selector": ".success-message", "timeout": 5000}

// 7. 验证成功
{"action": "extract", "selector": ".success-message"}
```

### 示例 3: 数据抓取 - 价格监控

```json
// 1. 启动
{"action": "start"}

// 2. 打开产品页面
{"action": "open", "url": "https://example.com/product/123"}

// 3. 提取价格信息
{
  "action": "eval",
  "code": "({price: document.querySelector('.price')?.textContent, title: document.querySelector('h1')?.textContent, stock: document.querySelector('.stock')?.textContent})"
}

// 4. 保存到文件
{
  "action": "eval",
  "code": "require('fs').writeFileSync('/tmp/price-data.json', JSON.stringify({price: document.querySelector('.price')?.textContent, timestamp: Date.now()}))"
}

// 5. 关闭
{"action": "stop"}
```

### 示例 4: 多页面数据对比

```json
// 1. 启动
{"action": "start"}

// 2. 打开多个网站
{"action": "open", "url": "https://site1.com/product", "page_id": "site1"}
{"action": "open", "url": "https://site2.com/product", "page_id": "site2"}
{"action": "open", "url": "https://site3.com/product", "page_id": "site3"}

// 3. 从每个页面提取价格
{"action": "extract", "selector": ".price", "page_id": "site1"}
{"action": "extract", "selector": ".price", "page_id": "site2"}
{"action": "extract", "selector": ".price", "page_id": "site3"}

// 4. Agent 可以对比三个价格并给出建议

// 5. 关闭所有
{"action": "stop"}
```

### 示例 5: 自动化测试流程

```json
// 测试登录功能

// 1. 启动
{"action": "start", "headed": false}

// 2. 打开登录页
{"action": "open", "url": "https://example.com/login"}

// 3. 测试空用户名
{"action": "fill", "fields": {"#password": "test"}}
{"action": "click", "selector": "button[type='submit']"}
{"action": "wait_for", "selector": ".error", "timeout": 2000}

// 4. 验证错误消息
{"action": "extract", "selector": ".error"}

// 5. 测试正确登录
{"action": "fill", "fields": {"#username": "test", "#password": "test"}}
{"action": "click", "selector": "button[type='submit']"}
{"action": "wait_for", "selector": ".dashboard", "timeout": 2000}

// 6. 验证登录成功
{"action": "extract", "selector": ".dashboard"}

// 7. 截图记录
{"action": "screenshot", "path": "/tmp/test-result.png"}

// 8. 关闭
{"action": "stop"}
```

---

## 调试技巧

### 1. 截图调试

```json
// 在关键步骤截图
{"action": "screenshot", "path": "/tmp/step1.png"}
{"action": "click", "ref": "e5"}
{"action": "screenshot", "path": "/tmp/step2.png"}
```

### 2. 控制台日志

```json
// 获取控制台错误
{"action": "console", "page_id": "default"}

// 清空日志
{"action": "console", "page_id": "default", "clear": true}
```

### 3. 网络请求监控

```json
// 查看所有 API 请求
{"action": "network", "page_id": "default"}

// 过滤特定请求
// (需要在返回结果中手动过滤)
```

### 4. 元素高亮

```json
// 高亮元素便于调试
{
  "action": "eval",
  "code": "document.querySelector('button').style.border = '3px solid red'"
}
```

---

## 注意事项和最佳实践

### ✅ 推荐做法

1. **使用元素引用**: `{"action": "click", "ref": "e5"}` 而不是复杂选择器
2. **等待加载**: 页面导航后总是添加适当等待
3. **批量操作**: 使用 `fill` 而不是多次 `type`
4. **错误处理**: 使用 `wait_for` 确保元素存在
5. **资源清理**: 完成后调用 `stop` 释放资源

### ❌ 避免做法

1. **硬编码等待**: 避免固定长度的 `wait`，优先用 `wait_for`
2. **过度快照**: 只在需要时获取页面快照
3. **忽略错误**: 始终检查操作返回的 `ok` 字段
4. **浏览器泄漏**: 确保在异常情况下也关闭浏览器
5. **并发冲突**: 同一页面避免并发操作

---

## 总结

CoPaw 的 browser_use 提供了强大的浏览器自动化能力，关键是：

1. **理解元素引用系统**: 使用快照获取的引用而不是选择器
2. **合理使用等待**: 确保页面加载完成再操作
3. **批量操作**: 减少交互次数提高效率
4. **错误处理**: 预期和处理可能的失败情况
5. **资源管理**: 及时关闭浏览器释放资源

通过掌握这些模式和最佳实践，可以构建稳定、高效的浏览器自动化流程。
