# CoPaw 常见问题解答 (FAQ)

> 快速解决使用 CoPaw 时遇到的问题

## 📋 目录
1. [安装问题](#安装问题)
2. [配置问题](#配置问题)
3. [使用问题](#使用问题)
4. [渠道问题](#渠道问题)
5. [性能问题](#性能问题)
6. [开发问题](#开发问题)
7. [错误排查](#错误排查)

---

## 安装问题

### ❓ 问题：pip install 失败

**症状**：
```
ERROR: Could not find a version that satisfies the requirement
```

**解决方案**：

```bash
# 1. 升级 pip
python -m pip install --upgrade pip

# 2. 使用 uv 安装（推荐）
pip install uv
uv pip install copaw

# 3. 检查 Python 版本（需要 3.10+）
python --version

# 4. 使用脚本安装（自动处理依赖）
curl -fsSL https://copaw.agentscope.io/install.sh | bash
```

---

### ❓ 问题：Windows 安装后找不到 copaw 命令

**症状**：输入 `copaw` 提示"命令不存在"

**解决方案**：

```cmd
# 方法 1：重新打开命令提示符
# 安装后需要重新打开终端

# 方法 2：手动添加到 PATH
# 1. 找到安装目录：
#    %USERPROFILE%\.copaw\bin
# 2. 添加到系统环境变量 PATH
#    控制面板 → 系统 → 高级系统设置 → 环境变量
#    在 PATH 中添加：C:\Users\YourName\.copaw\bin

# 方法 3：使用 python -m
python -m copaw init --defaults
python -m copaw app
```

---

### ❓ 问题：macOS 提示"无法验证开发者"

**症状**：打开 .app 时提示"Apple 不能验证"

**解决方案**：

```bash
# 方法 1：右键打开（推荐）
1. 右键点击 CoPaw.app
2. 按住 Option 键
3. 点击"打开"
4. 后续可以直接双击打开

# 方法 2：系统设置中允许
1. 打开"系统设置" → "隐私与安全性"
2. 找到"CoPaw被阻止"的提示
3. 点击"仍要打开"或"允许"

# 方法 3：移除隔离属性
xattr -cr /Applications/CoPaw.app
```

---

### ❓ 问题：Linux 缺少依赖

**症状**：启动时提示缺少系统库

**解决方案**：

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-dev python3-venv

# CentOS/RHEL
sudo yum install python3-devel python3-venv

# Arch Linux
sudo pacman -S python3
```

---

## 配置问题

### ❓ 问题：如何配置 API 密钥？

**解决方案**：

```bash
# 方法 1：通过 init 配置（推荐）
copaw init
# 按提示选择提供商并输入 API 密钥

# 方法 2：通过 Console 配置
copaw app
# 访问 http://127.0.0.1:8088
# 进入 Settings → Models
# 选择提供商并输入 API 密钥

# 方法 3：通过环境变量
export DASHSCOPE_API_KEY=your_api_key_here
copaw app

# 方法 4：创建 .env 文件
echo "DASHSCOPE_API_KEY=your_api_key" > .env
copaw app
```

---

### ❓ 问题：配置文件在哪里？

**解决方案**：

```bash
# 主配置目录
~/.copaw/

# 配置文件结构
~/.copaw/
├── config.yaml           # 主配置
├── agents/             # Agent 配置
│   ├── default.yaml
│   └── custom.yaml
├── channels.yaml       # 渠道配置
└── tools.yaml          # 工具配置

# 工作目录
~/.copaw/working/
├── agents/             # Agent 工作空间
└── active_skills/     # 激活的技能

# 敏感配置（API 密钥）
~/.copaw/working.secret/
├── providers.yaml      # 提供商密钥
└── channels.yaml       # 渠道密钥
```

---

### ❓ 问题：如何重置配置？

**解决方案**：

```bash
# 方法 1：重新初始化
rm -rf ~/.copaw/working.secret/*
copaw init --defaults

# 方法 2：备份并重置
cp -r ~/.copaw ~/.copaw.backup
rm -rf ~/.copaw/working/*
copaw init --defaults

# 方法 3：重置特定配置
# 只重置提供商配置
rm ~/.copaw/working.secret/providers.yaml
copaw init
```

---

## 使用问题

### ❓ 问题：启动后无法访问 Console

**症状**：`copaw app` 后访问 http://127.0.0.1:8088 无响应

**解决方案**：

```bash
# 1. 检查服务是否启动
ps aux | grep copaw

# 2. 检查端口是否被占用
lsof -i :8088

# 3. 检查防火墙
# Linux
sudo ufw status
sudo ufw allow 8088

# Windows (PowerShell)
New-NetFirewallRule -Direction Inbound -Port 8088 -Action Allow

# 4. 尝试更换端口
copaw app --port 8089

# 5. 查看日志
tail -f ~/.copaw/logs/copaw.log
```

---

### ❓ 问题：Agent 不回复消息

**症状**：发送消息后 Agent 没有任何回应

**解决方案**：

```bash
# 1. 检查模型配置
cat ~/.copaw/working.secret/providers.yaml

# 2. 测试 API 连接
curl -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-max","messages":[{"role":"user","content":"hi"}]}'

# 3. 检查日志
tail -f ~/.copaw/logs/copaw.log | grep -i error

# 4. 验证模型是否启用
copaw app
# 访问 Console → Settings → Models
# 确认模型已启用（toggle 打开）

# 5. 查看当前使用的模型
copaw agents list
```

---

### ❓ 问题：如何切换到本地模型？

**解决方案**：

```bash
# 方法 1：使用 Ollama
# 1. 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. 下载模型
ollama pull qwen2.5:7b

# 3. 配置 CoPaw
copaw init
# 选择 Ollama 作为提供商
# 模型名称输入：qwen2.5:7b

# 4. 启动服务
copaw app

# 方法 2：使用 llama.cpp
pip install 'copaw[llamacpp]'

# 下载模型
copaw models download Qwen/Qwen2-7B-Instruct-GGUF

# 选择模型
copaw models
# 选择 Qwen2-7B-Instruct-GGUF
```

---

## 渠道问题

### ❓ 问题：钉钉渠道连接失败

**症状**：配置钉钉后无法接收消息

**解决方案**：

```bash
# 1. 检查配置
cat ~/.copaw/channels.yaml
# 确认 app_key 和 app_secret 正确

# 2. 验证机器人设置
# 登录钉钉开放平台
# 确认机器人已创建并启用
# 检查消息推送地址

# 3. 测试连接
copaw channels test dingtalk

# 4. 查看日志
tail -f ~/.copaw/logs/copaw.log | grep -i dingtalk

# 5. 检查网络
ping open.feishu.cn
curl -I https://open.dingtalk.com
```

---

### ❓ 问题：飞书渠道收不到消息

**症状**：配置飞书后无法接收消息

**解决方案**：

```bash
# 1. 检查事件订阅
# 登录飞书开放平台
# 应用管理 → 你的应用 → 事件订阅
# 确认已启用事件订阅

# 2. 验证加密配置
cat ~/.copaw/channels.yaml
# 检查 encrypt_key 和 verification_token

# 3. 测试连接
copaw channels test feishu

# 4. 查看日志
tail -f ~/.copaw/logs/copaw.log | grep -i feishu

# 5. 检查订阅事件
# 在飞书开放平台手动触发测试事件
```

---

### ❓ 问题：QQ 机器人无响应

**症状**：QQ 机器人不回复消息

**解决方案**：

```bash
# 1. 确认 QQ 机器人框架
# NapCat / LLOneBot / go-cqhttp 必须先运行

# 2. 检查 WebSocket 连接
# NapCat 默认地址：ws://localhost:3001
# LLOneBot 默认地址：ws://localhost:3001

# 3. 测试连接
copaw channels test qq

# 4. 检查是否需要 @ 机器人
# 在 QQ 中发送消息可能需要 @ 机器人

# 5. 查看日志
tail -f ~/.copaw/logs/copaw.log | grep -i qq
```

---

### ❓ 问题：如何配置多个渠道？

**解决方案**：

```bash
# 方法 1：通过命令行添加
copaw channels add feishu
copaw channels add dingtalk
copaw channels add qq

# 方法 2：通过 Console 添加
copaw app
# 访问 http://127.0.0.1:8088
# 进入 Settings → Channels
# 点击 "Add Channel"

# 方法 3：编辑配置文件
vim ~/.copaw/channels.yaml
```

---

## 性能问题

### ❓ 问题：响应速度慢

**症状**：Agent 回复需要很长时间

**解决方案**：

```bash
# 1. 使用本地模型
# 云模型可能有网络延迟
pip install 'copaw[ollama]'
ollama pull qwen2.5:7b
copaw init  # 选择 Ollama

# 2. 优化模型选择
# 使用更快的模型
# qwen-turbo 比 qwen-max 快
# Qwen2-7B 比 Qwen2-72B 快

# 3. 减少上下文
# 在 Console → Settings → Agents
# 设置 max_tokens 为较小值（如 2048）

# 4. 禁用不需要的工具
# 在 Console → Settings → Tools
# 关闭不常用的工具
```

---

### ❓ 问题：内存占用过高

**症状**：长时间运行后内存占用持续增长

**解决方案**：

```bash
# 1. 压缩记忆
copaw agents compact default

# 2. 调整记忆配置
# 编辑 ~/.copaw/agents/default.yaml
memory:
  max_memories: 50      # 减少记忆数量
  auto_compact: true   # 启用自动压缩

# 3. 清理缓存
rm -rf ~/.copaw/cache/*
copaw app

# 4. 重启服务
copaw shutdown
copaw app
```

---

### ❓ 问题：CPU 占用率高

**症状**：CPU 使用率持续 100%

**解决方案**：

```bash
# 1. 检查是否有死循环
# 查看日志
tail -f ~/.copaw/logs/copaw.log

# 2. 降低并发数
# 编辑配置文件
# 减少同时处理的任务数

# 3. 使用性能分析
python -m cProfile -o profile.stats -m copaw.cli.main app
python -m pstats profile.stats

# 4. 检查是否有技能卡住
copaw skills list
# 禁用有问题的技能
```

---

## 开发问题

### ❓ 问题：技能无法加载

**症状**：自定义技能不被识别

**解决方案**：

```bash
# 1. 检查 SKILL.md 格式
# 确保存在 SKILL.md 且格式正确

# 2. 检查目录结构
ls -la ~/.copaw/working/agents/default/active_skills/your_skill/
# 应该包含：
# - SKILL.md
# - __init__.py (可选)

# 3. 验证 frontmatter
head -n 10 ~/.copaw/working/agents/default/active_skills/your_skill/SKILL.md
# 应该有 ---
# name: ...
# description: ...

# 4. 重启服务
copaw app restart

# 5. 查看技能列表
copaw skills list
```

---

### ❓ 问题：工具调用失败

**症状**：Agent 无法调用某个工具

**解决方案**：

```bash
# 1. 检查工具是否注册
# 在 Console → Settings → Tools
# 查看工具列表

# 2. 检查工具权限
# 文件操作工具可能需要路径权限

# 3. 查看日志
tail -f ~/.copaw/logs/copaw.log | grep -i tool

# 4. 测试工具
# 在 Console 中直接调用工具测试

# 5. 检查工具安全策略
# 文件访问可能被安全策略阻止
```

---

### ❓ 问题：单元测试失败

**症状**：`pytest` 测试报错

**解决方案**：

```bash
# 1. 安装测试依赖
pip install -e ".[dev]"

# 2. 检查测试环境
pytest --collect-only  # 列出所有测试

# 3. 运行特定测试
pytest tests/test_specific.py -v

# 4. 查看详细输出
pytest tests/ -v -s

# 5. 跳过慢速测试
pytest tests/ -k "not slow"

# 6. 只运行失败的测试
pytest tests/ --lf
```

---

## 错误排查

### 🔍 通用排查流程

```
1. 查看日志
   tail -f ~/.copaw/logs/copaw.log

2. 检查配置
   cat ~/.copaw/config.yaml

3. 验证环境
   python --version
   pip list | grep copaw

4. 重启服务
   copaw shutdown
   copaw app

5. 重置配置
   rm -rf ~/.copaw/working/*
   copaw init --defaults
```

### 📋 获取帮助

如果问题仍未解决：

1. **查看文档**
   - [官方文档](https://copaw.agentscope.io/)
   - [API 文档](https://copaw.agentscope.io/docs/)

2. **搜索 Issues**
   - [GitHub Issues](https://github.com/agentscope-ai/CoPaw/issues)
   - 使用关键词搜索

3. **加入社区**
   - [Discord](https://discord.gg/eYMpfnkG8h)
   - [钉钉群](https://qr.dingtalk.com/action/joingroup?code=v1,k1,OmDlBXpjW+I2vWjKDsjvI9dhcXjGZi3bQiojOq3dlDw=&_dt_no_comment=1&origin=11)

4. **提 Issue**
   - 提供详细信息
   - 包含错误日志
   - 说明环境信息

---

## 💡 预防措施

### 定期维护

```bash
# 1. 定期更新
pip install --upgrade copaw

# 2. 清理缓存
rm -rf ~/.copaw/cache/*

# 3. 备份配置
cp -r ~/.copaw ~/.copaw.backup.$(date +%Y%m%d)

# 4. 检查日志大小
du -sh ~/.copaw/logs/
```

### 配置备份

```bash
# 自动备份脚本
cat > ~/backup_copaw.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/copaw-backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
cp -r ~/.copaw "$BACKUP_DIR/"
echo "Backup saved to $BACKUP_DIR"
EOF

chmod +x ~/backup_copaw.sh

# 设置定期备份
crontab -e
# 添加：0 2 * * * ~/backup_copaw.sh
```

---

## 🔗 相关资源

- **[快速开始](../01-getting-started/)** - 基本使用
- **[调试指南](../07-debugging/)** - 深入调试
- **[代码修改指南](../06-advanced/code-modification-guide.md)** - 自定义修改

---

**问题解决了吗？如果还有其他问题，欢迎反馈！** 🤝
