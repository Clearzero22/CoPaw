# CoPaw 下载与安装指南

## 🚀 快速下载（推荐）

### Windows/macOS/Linux 精简版 ⭐

**适合**：使用云端 AI API（OpenAI、Claude、Gemini 等）的用户

| 文件 | 大小 | 说明 | 下载 |
|------|------|------|------|
| `CoPaw-Lite-0.2.0.zip` | 450MB | ✅ **推荐**<br>无需 Python<br>开箱即用 | [下载](https://github.com/agentscope-ai/CoPaw/releases/download/v0.2.0/CoPaw-Lite-0.2.0.zip) |

**使用方法**：
1. 下载并解压 `CoPaw-Lite-0.2.0.zip`
2. Windows: 双击 `启动 CoPaw.bat`
3. Linux/macOS: 运行 `./start-copaw.sh`
4. 浏览器访问 http://localhost:8088

---

### 完整版（含本地 AI 模型）

**适合**：有 NVIDIA GPU、需要本地运行 AI 模型的用户

| 文件 | 大小 | 说明 | 下载 |
|------|------|------|------|
| `CoPaw-Standalone-0.2.0.zip` | 5.7GB | 包含 PyTorch<br>本地 LLM 支持 | [下载](https://github.com/agentscope-ai/CoPaw/releases/download/v0.2.0/CoPaw-Standalone-0.2.0.zip) |

**系统要求**：
- NVIDIA GPU（推荐 8GB+ VRAM）
- CUDA 11.8+ 支持
- 约 10GB 磁盘空间

---

## 📋 版本对比

| 特性 | 精简版 | 完整版 |
|------|--------|--------|
| **大小** | 450MB | 5.7GB |
| **Python** | ✅ 内置 | ✅ 内置 |
| **云端 API** | ✅ 全部支持 | ✅ 全部支持 |
| **本地 AI** | ❌ 不支持 | ✅ 支持 |
| **GPU 加速** | ❌ 不支持 | ✅ 支持（NVIDIA）|
| **适用场景** | 95% 用户 | 专业用户/开发者 |
| **下载时间** | ~2分钟（100Mbps） | ~10分钟（100Mbps）|

---

## 🔧 传统安装方式

### pip 安装

如果你已有 Python 环境：

```bash
pip install copaw
copaw init --defaults
copaw app
```

### 脚本自动安装

**无需配置 Python，一行命令搞定：**

**macOS / Linux：**
```bash
curl -fsSL https://copaw.agentscope.io/install.sh | bash
```

**Windows (CMD)：**
```CMD
curl -fsSL https://copaw.agentscope.io/install.bat -o install.bat && install.bat
```

**Windows (PowerShell)：**
```powershell
irm https://copaw.agentscope.io/install.ps1 | iex
```

---

## 🌐 云端部署（可选）

### ModelScope 一键部署

[![ModelScope](https://img.shields.io/badge/ModelScope-部署-orange.svg)](https://modelscope.cn/studios/fork?target=AgentScope/CoPaw)

无需本地安装，直接在云端运行 CoPaw：

1. 访问 [CoPaw ModelScope](https://modelscope.cn/studios/fork?target=AgentScope/CoPaw)
2. 点击"运行"
3. 配置 API Key
4. 开始使用

---

## 📖 安装后配置

### 1. 配置 AI API Key

首次启动后，在控制台配置你的 AI 服务商：

**支持的 AI 提供商**：
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Opus)
- Google Gemini
- 阿里云百炼
- 智谱 AI (ChatGLM)
- 月之暗面 (Kimi)
- DeepSeek
- 其他兼容 OpenAI API 的服务

### 2. 配置渠道（可选）

如需在钉钉、飞书、QQ 等应用中使用 CoPaw：

1. 进入控制台 → 渠道管理
2. 选择对应的渠道
3. 按照指引配置
4. 测试连接

### 3. 数据目录

所有用户数据保存在：

- Windows: `C:\Users\你的用户名\.copaw`
- Linux/macOS: `~/.copaw`

包含：
- 配置文件
- Agent 工作空间
- 聊天历史
- 记忆数据

---

## 🆚 安装方式对比

| 方式 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **精简版 ZIP** | 无需 Python<br>解压即用<br>离线可用 | 体积较大 | ⭐⭐⭐⭐⭐ |
| **脚本安装** | 自动管理依赖<br>始终最新 | 需要网络连接 | ⭐⭐⭐⭐ |
| **pip 安装** | 灵活可控<br>适合开发者 | 需懂 Python | ⭐⭐⭐ |
| **云端部署** | 无需安装<br>随时随地 | 数据在云端 | ⭐⭐⭐⭐ |

---

## 🛠️ 故障排查

### Windows 用户

**问题**：双击启动脚本后闪退

**解决**：
1. 右键 `启动 CoPaw.bat` → 编辑
2. 在最后添加一行 `pause`
3. 保存后重新运行，查看错误信息

**问题**：提示"找不到 Python"

**解决**：确认下载的是精简版或完整版，不是便携版

### macOS 用户

**问题**：无法打开 "CoPaw"

**解决**：
1. 右键点击 → 打开
2. 或在系统设置 → 隐私与安全性 → 允许

### Linux 用户

**问题**：权限被拒绝

**解决**：
```bash
chmod +x start-copaw.sh
./start-copaw.sh
```

---

## 📞 获取帮助

- 📚 [完整文档](https://copaw.agentscope.io/)
- 💬 [Discord 社区](https://discord.gg/eYMpfnkG8h)
- 🐛 [GitHub Issues](https://github.com/agentscope-ai/CoPaw/issues)
- 📧 [钉钉群](https://qr.dingtalk.com/action/joingroup?code=v1,k1,OmDlBXpjW+I2vWjKDsjvI9dhcXjGZi3bQiojOq3dlDw=&_dt_no_comment=1&origin=11)

---

## 📅 版本历史

- **v0.2.0** (2026-03-24): Agent 间通信，内置 QA Agent，多模态支持
- **v0.1.0** (2026-03-18): 首个稳定版本
- **v0.0.7** (2026-03-12): 性能优化
- 更多版本见 [发布说明](https://agentscope-ai.github.io/CoPaw/release-notes)

---

**最后更新**: 2026-04-27  
**许可证**: Apache License 2.0
