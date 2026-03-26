# CoPaw 开发指南

## 项目概述

**CoPaw** 是一个个人 AI 助手，可在本地或云端运行，支持多渠道（钉钉、飞书、QQ、Discord 等）和自定义技能扩展。

| 属性 | 详情 |
|------|------|
| **项目类型** | Python + Web Console (FastAPI + Vue) |
| **Python 版本** | 3.10 - 3.13 |
| **包管理器** | uv (高性能 Rust 实现) |
| **工作目录** | `~/.copaw/` |
| **默认端口** | 8088 |

---

## 项目结构

```
CoPaw/
├── console/              # 前端 (Vue + Vite + TypeScript)
│   ├── src/             # 源代码
│   ├── dist/            # 构建输出 → 复制到 src/copaw/console/
│   └── package.json
├── src/copaw/           # Python 核心代码
│   ├── agents/          # Agent 逻辑
│   ├── app/             # Web 服务 (FastAPI)
│   ├── cli/             # 命令行工具
│   ├── config/          # 配置管理
│   ├── providers/       # LLM 提供商
│   ├── local_models/    # 本地模型支持
│   ├── security/        # 安全机制
│   └── utils/           # 工具函数
├── pyproject.toml       # Python 项目配置
├── tests/               # 测试
└── website/             # 官方文档
```

---

## 快速启动

### 1. 安装依赖

```bash
# 使用 uv 安装所有依赖（包括开发工具和本地模型支持）
uv sync --dev --all-extras
```

### 2. 构建前端

```bash
cd console
npm ci
npm run build
cd ..

# 复制构建输出到 Python 包
mkdir -p src/copaw/console
cp -R console/dist/. src/copaw/console/
```

### 3. 启动应用

```bash
uv run copaw app
```

### 4. 访问

打开浏览器访问：**http://127.0.0.1:8088/**

---

## 一键启动命令

```bash
# 从项目根目录执行完整启动流程
uv sync --dev --all-extras && \
cd console && npm ci && npm run build && cd .. && \
mkdir -p src/copaw/console && \
cp -R console/dist/. src/copaw/console/ && \
uv run copaw app
```

---

## 工作目录结构

CoPaw 的运行数据存储在 `~/.copaw/`：

```
~/.copaw/
├── workspaces/
│   └── default/              # 默认 agent 工作空间
│       ├── agent.json        # agent 配置
│       ├── MEMORY.md         # 长期记忆
│       ├── chats.json        # 聊天记录
│       └── skills/           # 自定义技能
├── config.json               # 全局配置
└── models/                   # 本地模型存储
```

---

## 代码修改与重启

### 修改类型 vs 重启需求

| 修改类型 | 需要重启 | 说明 |
|---------|---------|------|
| **Python 后端代码** | ✅ 是 | `src/copaw/` 下的 `.py` 文件 |
| **前端代码** | ✅ 是 | 需要重新构建 + 重启 |
| **Agent 配置** | ❌ 否 | 自动热重载 (2秒轮询) |
| **技能文件** | ❌ 否 | 自动重载 |
| **环境变量** | ✅ 是 | `.env` 或系统变量 |

### 详细说明

#### 1. Agent 配置 - 自动热重载

修改 `~/.copaw/workspaces/default/agent.json` 后：

```
AgentConfigWatcher started for agent default (poll=2.0s)
```

**无需重启**，2秒内自动生效。

#### 2. 技能文件 - 自动重载

修改 `~/.copaw/workspaces/default/skills/` 下的技能：

**无需重启**，下次调用时自动加载。

#### 3. Python 代码 - 需要重启

```bash
# Ctrl+C 停止当前进程
uv run copaw app
```

#### 4. 前端代码 - 需要重建 + 重启

```bash
cd console && npm run build && cd ..
cp -R console/dist/. src/copaw/console/
# 重启应用
uv run copaw app
```

---

## 常用命令

### CLI 命令

```bash
# 初始化配置
copaw init --defaults

# 启动应用
copaw app

# 管理本地模型
copaw models download Qwen/Qwen3-4B-GGUF
copaw models

# Cron 任务管理
copaw cron list
copaw cron add "0 9 * * *" "daily digest"

# 技能管理
copaw skill list
copaw skill add <skill-path>

# 清理
copaw clean
```

### 开发命令

```bash
# 运行测试
uv run pytest

# 运行特定测试
uv run pytest tests/test_specific.py

# 添加新依赖
uv add package-name

# 激活虚拟环境（可选）
source .venv/bin/activate  # Linux/macOS
```

---

## 配置 API Key

### 方法 1: Console UI（推荐）

1. 打开 http://127.0.0.1:8088/
2. 进入 **Settings** → **Models**
3. 选择提供商（如 DashScope）
4. 输入 **API Key**
5. 启用模型

### 方法 2: 环境变量

```bash
# DashScope
export DASHSCOPE_API_KEY="your-key"

# 或创建 .env 文件
echo "DASHSCOPE_API_KEY=your-key" > .env
```

---

## 核心技术栈

### 后端

- **agentscope** (1.0.17) - Agent 框架
- **agentscope-runtime** (1.1.1) - 运行时
- **FastAPI** + **Uvicorn** - Web 服务
- **APScheduler** - 定时任务
- **ChromaDB** - 向量存储
- **Playwright** - 浏览器自动化

### 前端

- **Vue 3** + **Vite**
- **Ant Design** - UI 组件
- **TypeScript**

### 支持的渠道

DingTalk, Feishu, QQ, Discord, Telegram, iMessage, WeCom, Matrix 等

### 支持的 LLM

**云端**: DashScope, OpenAI, Anthropic, Gemini, DeepSeek, MiniMax, Kimi

**本地**: llama.cpp, MLX, Ollama

---

## 技术亮点

1. **多 Agent 架构** - 支持多个独立 agent 实例
2. **热重载** - agent 配置变更无需重启
3. **零停机重载** - graceful lifecycle management
4. **安全扫描** - 内置技能安全扫描器
5. **多模态** - 支持图片、语音消息
6. **本地优先** - 可完全离线运行

---

## 安全注意事项

⚠️ **CoPaw 可以执行文件操作和命令**

建议：
- 限制允许的用户和渠道
- 使用单独的配置和凭证
- 在沙箱中运行高权限技能
- 定期审查配置和技能
- 将敏感密钥保存在工作目录外

---

## 故障排查

### 端口被占用

```bash
# 查找占用 8088 端口的进程
lsof -i :8088

# 杀死进程
kill -9 <PID>
```

### 清理缓存

```bash
# 清理 uv 缓存
uv cache clean

# 重新安装
uv sync --dev --all-extras
```

### 查看日志

日志在应用运行时显示在终端，可查看详细错误信息。

---

## 相关链接

- **官方文档**: https://copaw.agentscope.io/
- **GitHub**: https://github.com/agentscope-ai/CoPaw
- **Discord**: https://discord.gg/eYMpfnkG8h
