# CoPaw 实战案例与使用示例

## 目录
1. [快速开始](#快速开始)
2. [常见使用场景](#常见使用场景)
3. [高级用法](#高级用法)
4. [渠道配置示例](#渠道配置示例)
5. [技能开发示例](#技能开发示例)
6. [故障排查](#故障排查)

---

## 快速开始

### 1.1 三步启动

```bash
# 1. 安装 CoPaw
pip install copaw

# 2. 初始化配置
copaw init --defaults

# 3. 启动服务
copaw app
```

访问 http://127.0.0.1:8088 即可开始使用！

### 1.2 首次配置

```bash
# 交互式初始化
copaw init

# 按提示操作：
# 1. 选择模型提供商（如 DashScope）
# 2. 输入 API 密钥
# 3. 选择默认模型
# 4. 确认配置

# 启动服务
copaw app
```

### 1.3 验证安装

```bash
# 检查版本
copaw --version

# 列出 Agent
copaw agents list

# 列出模型
copaw models list
```

---

## 常见使用场景

### 2.1 场景一：个人助手

**需求**：创建一个个人助手，帮助管理日常事务

```bash
# 1. 创建个人 Agent
copaw agents create \
  --name "我的助手" \
  --description "我的个人AI助手" \
  --model-provider dashscope \
  --model-name qwen-max

# 2. 启动服务
copaw app

# 3. 在 Console 中与助手对话
```

**对话示例**：

```
用户：帮我整理今天的待办事项

助手：好的，让我帮你整理今天的待办事项。根据你的日历和任务列表：

今天的主要任务：
1. 上午10点：团队周会
2. 下午2点：项目评审
3. 下午4点：代码审查

需要我为这些任务设置提醒吗？
```

### 2.2 场景二：定时新闻推送

**需求**：每天早上9点推送新闻摘要

```bash
# 创建定时任务
copaw cron create \
  --agent-id default \
  --type agent \
  --name "每日新闻" \
  --cron "0 9 * * *" \
  --channel console \
  --text "请总结今天的重要新闻"

# 查看任务
copaw cron list --agent-id default
```

**Cron 表达式说明**：

```
0 9 * * *      # 每天9点
0 */2 * * *    # 每2小时
30 8 * * 1-5   # 工作日早上8:30
0 0 * * 0      # 每周日零点
*/15 * * * *   # 每15分钟
```

### 2.3 场景三：文档处理

**需求**：批量处理 PDF 文档，提取文本内容

```python
# 使用 PDF 技能

from copaw.agents.skills.pdf import extract_text

# 提取文本
text = await extract_text("document.pdf")

# 保存结果
with open("document.txt", "w") as f:
    f.write(text)
```

**在 Console 中使用**：

```
用户：帮我提取 documents/report.pdf 的文本内容

助手：好的，我来帮你提取 PDF 文档的文本内容。

[使用 pdf 技能提取...]

已提取完成！文档共 1234 字，已保存到 documents/report.txt
```

### 2.4 场景四：代码搜索

**需求**：在项目中搜索特定代码模式

```bash
# 在 CoPaw Console 中对话

用户：搜索项目中所有的 API endpoint 定义

助手：好的，让我帮你搜索项目中的 API endpoint。

[使用 grep_search 工具...]

找到以下 API endpoint：
1. src/copaw/app/routers/agent.py:15: @router.post("/chat")
2. src/copaw/app/routers/agents.py:20: @router.get("/")
3. src/copaw/app/routers/config.py:25: @router.put("/update")
...
```

### 2.5 场景五：多渠道部署

**需求**：同时接入钉钉和飞书

```bash
# 1. 配置钉钉渠道
copaw channels add dingtalk
# 按提示输入钉钉机器人的 App Key 和 App Secret

# 2. 配置飞书渠道
copaw channels add feishu
# 按提示输入飞书应用的 App ID 和 App Secret

# 3. 启动服务
copaw app

# 4. 测试渠道
# 在钉钉/飞书中发送消息给机器人
```

---

## 高级用法

### 3.1 自定义技能

**创建一个天气查询技能**

```bash
# 1. 创建技能目录
mkdir -p ~/.copaw/working/agents/default/active_skills/weather

# 2. 创建技能文档
cat > ~/.copaw/working/agents/default/active_skills/weather/SKILL.md <<'EOF'
---
name: weather
description: "查询天气信息"
---

# 天气查询

## 使用说明

当用户询问天气时，使用 browser_use 工具访问天气网站获取信息。

支持的城市：
- 北京
- 上海
- 广州
- 深圳

示例：
- "今天北京天气怎么样？"
- "上海明天会下雨吗？"
EOF

# 3. 重启服务
copaw app restart
```

### 3.2 多 Agent 协作

**创建专门的代码审查 Agent**

```bash
# 1. 创建代码审查 Agent
copaw agents create \
  --name "代码审查员" \
  --description "专注于代码审查和质量检查" \
  --model-provider anthropic \
  --model-name claude-3-5-sonnet-20241022 \
  --system-prompt "你是一个专业的代码审查员，专注于检查代码质量、安全性和最佳实践。"

# 2. 在主 Agent 中调用
# 在 Console 中对话：
```

```
用户：帮我审查 src/copaw/agents/react_agent.py 这个文件

助手：好的，让我请代码审查员来帮你检查这个文件。

[Agent 间通信...]

代码审查员的意见：
1. 整体结构清晰，遵循 SOLID 原则
2. 建议在 _register_builtin_tools 中添加更多错误处理
3. memory_manager 的初始化可以延迟到第一次使用时
4. 建议添加更多的类型注解
...
```

### 3.3 本地模型部署

**使用 Ollama 本地模型**

```bash
# 1. 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. 下载模型
ollama pull qwen2.5:7b

# 3. 配置 CoPaw
copaw init
# 选择 Ollama 作为提供商
# 模型名称填写：qwen2.5:7b

# 4. 启动服务
copaw app
```

**使用 llama.cpp**

```bash
# 1. 安装 CoPaw（带 llama.cpp 支持）
pip install 'copaw[llamacpp]'

# 2. 下载 GGUF 模型
copaw models download Qwen/Qwen2-7B-Instruct-GGUF

# 3. 选择模型
copaw models
# 选择 Qwen2-7B-Instruct-GGUF

# 4. 启动服务
copaw app
```

### 3.4 MCP 客户端集成

**连接 MCP 服务器**

```bash
# 1. 启动 MCP 服务器
# 例如：文件系统 MCP
npx -y @modelcontextprotocol/server-filesystem /path/to/allowed

# 2. 在 Console 中添加 MCP
# 访问 http://127.0.0.1:8088
# 进入 Settings → MCP
# 添加 MCP 客户端：
# - Name: filesystem
# - Type: stdio
# - Command: npx
# - Args: -y @modelcontextprotocol/server-filesystem /path/to/allowed

# 3. 使用 MCP 工具
# 在 Console 中对话：
```

```
用户：列出 /home/user/documents 下的所有文件

助手：好的，让我使用文件系统 MCP 来查看。

[MCP 工具调用...]

找到以下文件：
- report.pdf
- notes.md
- data.json
...
```

---

## 渠道配置示例

### 4.1 钉钉渠道

```yaml
# channels.yaml
channels:
  - type: dingtalk
    enabled: true
    config:
      app_key: "your_app_key"
      app_secret: "your_app_secret"
      # 可选：机器人设置
      webhook_url: "https://oapi.dingtalk.com/robot/send"
      secret: "your_secret"
```

**创建钉钉机器人**：

1. 登录钉钉开放平台 https://open.dingtalk.com/
2. 创建应用 → 机器人
3. 获取 App Key 和 App Secret
4. 设置消息接收地址
5. 配置权限

### 4.2 飞书渠道

```yaml
# channels.yaml
channels:
  - type: feishu
    enabled: true
    config:
      app_id: "your_app_id"
      app_secret: "your_app_secret"
      encrypt_key: "your_encrypt_key"
      verification_token: "your_verification_token"
```

**创建飞书应用**：

1. 登录飞书开放平台 https://open.feishu.cn/
2. 创建企业自建应用
3. 开启机器人能力
4. 配置事件订阅
5. 获取凭证

### 4.3 QQ 渠道

```yaml
# channels.yaml
channels:
  - type: qq
    enabled: true
    config:
      # NapCat/LLOneBot 配置
      ws_url: "ws://localhost:3001"
      # 或 go-cqhttp
      ws_url: "ws://localhost:8080"
```

**QQ 机器人准备**：

1. 安装 NapCat 或 LLOneBot
2. 配置 WebSocket 服务
3. 登录 QQ 账号
4. 配置 CoPaw 连接

### 4.4 Discord 渠道

```yaml
# channels.yaml
channels:
  - type: discord
    enabled: true
    config:
      bot_token: "your_bot_token"
      # 可选：命令前缀
      command_prefix: "/"
```

**创建 Discord 机器人**：

1. 访问 Discord Developer Portal
2. 创建应用程序
3. 创建机器人并获取 Token
4. 添加机器人到服务器
5. 配置权限和意图

---

## 技能开发示例

### 5.1 简单技能：翻译

**创建翻译技能**

```bash
mkdir -p ~/.copaw/working/agents/default/active_skills/translate
```

```markdown
# ~/.copaw/working/agents/default/active_skills/translate/SKILL.md

---
name: translate
description: "文本翻译服务"
---

# 翻译

## 使用说明

当用户需要翻译文本时，使用 browser_use 工具访问在线翻译服务。

支持的语言：
- 中文 ↔ 英文
- 中文 ↔ 日文
- 英文 ↔ 日文

示例：
- "把 'Hello World' 翻译成中文"
- "将这句话翻译成英文：你好世界"
```

### 5.2 复杂技能：数据分析

**创建数据分析技能**

```python
# ~/.copaw/working/agents/default/active_skills/data_analysis/__init__.py

"""数据分析技能"""

import pandas as pd
from agentscope.tool import tool
from agentscope.message import TextBlock
from agentscope.tool import ToolResponse

@tool
def analyze_csv(
    file_path: str,
    operation: str = "summary",
) -> ToolResponse:
    """分析 CSV 文件

    Args:
        file_path: CSV 文件路径
        operation: 操作类型 (summary, head, tail, info)

    Returns:
        分析结果
    """
    try:
        # 读取 CSV
        df = pd.read_csv(file_path)

        # 执行操作
        if operation == "summary":
            result = df.describe().to_string()
        elif operation == "head":
            result = df.head().to_string()
        elif operation == "tail":
            result = df.tail().to_string()
        elif operation == "info":
            result = str(df.info())
        else:
            result = f"未知的操作: {operation}"

        return ToolResponse(
            content=[TextBlock(type="text", text=result)]
        )

    except Exception as e:
        return ToolResponse(
            content=[TextBlock(
                type="text",
                text=f"错误: {e}"
            )]
        )

tools = [analyze_csv]
```

```markdown
# ~/.copaw/working/agents/default/active_skills/data_analysis/SKILL.md

---
name: data_analysis
description: "CSV 数据分析"
---

# 数据分析

## 依赖

Python 包：
- pandas>=2.0.0

## 使用说明

使用 analyze_csv 工具分析 CSV 文件。

支持的操作：
- summary: 统计摘要
- head: 查看前几行
- tail: 查看后几行
- info: 数据框信息

示例：
- "分析 data.csv 的统计信息"
- "查看 sales.csv 的前10行"
```

### 5.3 技能：定时任务

**使用 Cron 技能**

```
用户：每天早上8点提醒我喝水

助手：好的，我来为你创建一个定时提醒任务。

[copaw cron create --type text --cron "0 8 * * *" --text "记得喝水哦！"]

已创建定时任务：
- 名称：每日喝水提醒
- 表达式：0 8 * * *
- 时间：每天早上8点

任务将在每天早上8点发送提醒。
```

### 5.4 技能：新闻摘要

**使用 News 技能**

```
用户：今天有什么科技新闻？

助手：让我为你获取今天的科技新闻。

[使用 browser_use 访问科技日报...]

今日科技新闻要点：

1. AI 技术突破：新一代大语言模型发布
   来源：科技日报
   时间：2小时前

2. 量子计算进展：新型量子处理器问世
   来源：科学网
   时间：4小时前

3. 新能源汽车销量创新高
   来源：汽车之家
   时间：6小时前

需要我详细展开某个新闻吗？
```

---

## 故障排查

### 6.1 常见问题

**问题 1：服务无法启动**

```bash
# 检查端口占用
lsof -i :8088

# 更换端口
copaw app --port 8089

# 检查日志
tail -f ~/.copaw/logs/copaw.log
```

**问题 2：渠道连接失败**

```bash
# 检查配置
cat ~/.copaw/channels.yaml

# 测试网络
ping api.feishu.cn

# 检查密钥
copaw channels list
```

**问题 3：模型调用失败**

```bash
# 检查 API 密钥
cat ~/.copaw/working.secret/providers.yaml

# 测试模型连接
copaw models test

# 查看模型列表
copaw models list
```

### 6.2 调试模式

```bash
# 启用调试日志
export LOG_LEVEL=debug
copaw app

# 查看详细日志
tail -f ~/.copaw/logs/copaw.log | grep DEBUG
```

### 6.3 重置配置

```bash
# 备份当前配置
cp -r ~/.copaw ~/.copaw.backup

# 重新初始化
rm -rf ~/.copaw
copaw init --defaults

# 恢复配置
cp -r ~/.copaw.backup/* ~/.copaw/
```

### 6.4 性能优化

**减少内存使用**：

```python
# 在 Agent 配置中
# ~/.copaw/agents/default.yaml

memory:
  max_memories: 50  # 减少记忆数量
  auto_compact: true
```

**加快响应速度**：

```python
# 使用本地模型
model_provider: ollama
model_name: qwen2.5:7b

# 或减少上下文
max_tokens: 1024
```

---

## 最佳实践

### 7.1 Agent 设计

**单一职责**：
- 为不同任务创建专门的 Agent
- 例如：代码助手、写作助手、翻译助手

**清晰命名**：
- Agent 名称应该描述其用途
- 例如："代码审查员"、"文档助手"

**合理配置**：
- 根据任务选择合适的模型
- 简单任务用小模型，复杂任务用大模型

### 7.2 技能开发

**模块化**：
- 每个技能只做一件事
- 保持技能简单和专注

**文档完善**：
- 清晰的使用说明
- 详细的依赖列表
- 具体的使用示例

**错误处理**：
- 验证输入参数
- 处理异常情况
- 提供有用的错误信息

### 7.3 渠道配置

**渐进式部署**：
- 先在 Console 测试
- 再添加单个渠道
- 最后部署多渠道

**权限控制**：
- 配置允许的用户
- 设置访问策略
- 定期审查权限

**监控日志**：
- 定期检查渠道日志
- 监控错误和异常
- 及时处理问题

---

## 总结

CoPaw 是一个功能强大的个人 AI 助手系统，通过这些实战案例，你可以：

1. **快速上手**：三步启动，立即使用
2. **场景应用**：覆盖多种使用场景
3. **高级定制**：自定义技能和 Agent
4. **多渠道部署**：接入各种消息平台
5. **故障排查**：解决常见问题

开始探索 CoPaw 的无限可能吧！🚀
