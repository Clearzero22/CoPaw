# 常见问题解答 (FAQ)

> 快速解决使用 CoPaw 时遇到的问题

## 📄 文档列表

### [常见问题解答](./faq.md)
**完整的 FAQ 文档** - 覆盖所有常见问题和解决方案

**内容概要**：
- 🔧 安装问题（pip 失败、命令找不到、系统依赖）
- ⚙️ 配置问题（API 密钥、配置文件位置、重置配置）
- 💡 使用问题（Console 访问、Agent 不回复、切换本地模型）
- 📡 渠道问题（钉钉、飞书、QQ 连接失败）
- ⚡ 性能问题（响应慢、内存高、CPU 高）
- 💻 开发问题（技能加载、工具调用、测试失败）
- 🔍 错误排查（通用流程、获取帮助）

---

## 🎯 快速查找

### 安装相关

#### pip install 失败
→ [安装问题 - pip install 失败](./faq.md#❓-问题pip-install-失败)

#### Windows 命令找不到
→ [安装问题 - Windows 找不到命令](./faq.md#❓-问题windows-安装后找不到-copaw-命令)

#### macOS 安全警告
→ [安装问题 - macOS 无法验证](./faq.md#❓-问题macos-提示无法验证开发者)

#### Linux 缺少依赖
→ [安装问题 - Linux 缺少依赖](./faq.md#❓-问题linux-缺少依赖)

### 配置相关

#### 如何配置 API 密钥
→ [配置问题 - 如何配置 api 密钥](./faq.md#❓-问题如何配置-api-密钥)

#### 配置文件位置
→ [配置问题 - 配置文件在哪里](./faq.md#❓-问题配置文件在哪里)

#### 重置配置
→ [配置问题 - 如何重置配置](./faq.md#❓-问题如何重置配置)

### 使用相关

#### 无法访问 Console
→ [使用问题 - 无法访问 console](./faq.md#❓-问题启动后无法访问-console)

#### Agent 不回复
→ [使用问题 - agent 不回复消息](./faq.md#❓-问题agent-不回复消息)

#### 切换本地模型
→ [使用问题 - 如何切换到本地模型](./faq.md#❓-问题如何切换到本地模型)

### 渠道相关

#### 钉钉连接失败
→ [渠道问题 - 钉钉渠道连接失败](./faq.md#❓-问题钉钉渠道连接失败)

#### 飞书收不到消息
→ [渠道问题 - 飞书渠道收不到消息](./faq.md#❓-问题飞书渠道收不到消息)

#### QQ 机器人无响应
→ [渠道问题 - qq 机器人无响应](./faq.md#❓-问题qq-机器人无响应)

### 性能相关

#### 响应速度慢
→ [性能问题 - 响应速度慢](./faq.md#❓-问题响应速度慢)

#### 内存占用高
→ [性能问题 - 内存占用过高](./faq.md#❓-问题内存占用过高)

#### CPU 占用高
→ [性能问题 - cpu 占用率高](./faq.md#❓-问题cpu-占用率高)

---

## 🔥 热门问题

### Top 5 最常见问题

#### 1. Agent 不回复 🔥

**快速解决**：
```bash
# 检查 API 密钥
cat ~/.copaw/working.secret/providers.yaml

# 测试网络
ping dashscope.aliyuncs.com

# 查看日志
tail -f ~/.copaw/logs/copaw.log
```

#### 2. 找不到 copaw 命令 🔥

**快速解决**：
```bash
# Windows
echo %PATH%

# 重新打开终端或手动添加到 PATH
%USERPROFILE%\.copaw\bin

# 或使用
python -m copaw
```

#### 3. Console 无法访问 🔥

**快速解决**：
```bash
# 检查服务
ps aux | grep copaw

# 检查端口
lsof -i :8088

# 尝试其他端口
copaw app --port 8089
```

#### 4. 渠道连接失败 🔥

**快速解决**：
```bash
# 测试连接
copaw channels test feishu

# 检查配置
cat ~/.copaw/channels.yaml

# 查看日志
tail -f ~/.copaw/logs/copaw.log | grep -i channel
```

#### 5. 内存占用过高 🔥

**快速解决**：
```bash
# 压缩记忆
copaw agents compact default

# 清理缓存
rm -rf ~/.copaw/cache/*

# 重启服务
copaw shutdown
copaw app
```

---

## 💡 使用技巧

### 技巧 1：快速诊断

```bash
# 一键诊断脚本
cat > ~/diagnose_copaw.sh <<'EOF'
#!/bin/bash
echo "=== CoPaw 诊断 ==="

echo "1. 检查进程"
ps aux | grep -i copaw || echo "CoPaw 未运行"

echo "2. 检查端口"
lsof -i :8088 || echo "端口 8088 未被占用"

echo "3. 检查配置"
ls -la ~/.copaw/config.yaml || echo "配置文件不存在"

echo "4. 检查日志"
tail -n 10 ~/.copaw/logs/copaw.log

echo "5. 检查版本"
copaw --version
EOF

chmod +x ~/diagnose_copaw.sh
~/diagnose_copaw.sh
```

### 技巧 2：重置一切

```bash
# 完全重置 CoPaw
copaw shutdown
rm -rf ~/.copaw/working/*
rm -rf ~/.copaw/working.secret/*

# 重新初始化
copaw init --defaults
copaw app
```

### 技巧 3：安全模式

```bash
# 使用最小配置启动
export LOG_LEVEL=debug
export COPAW_SAFE_MODE=1
copaw app --port 8089
```

---

## 🔗 相关文档

- **[调试指南](../07-debugging/)** - 深入调试问题
- **[使用指南](../01-getting-started/usage-examples.md)** - 基本使用
- **[代码修改指南](../06-advanced/code-modification-guide.md)** - 自定义修复

---

## 📞 获取帮助

如果 FAQ 没有解决你的问题：

1. **搜索 GitHub Issues**
   - https://github.com/agentscope-ai/CoPaw/issues
   - 使用关键词搜索

2. **加入社区**
   - Discord: https://discord.gg/eYMpfnkG8h
   - 钉钉群（扫描 README 中的二维码）

3. **提新 Issue**
   - 描述问题
   - 提供环境信息
   - 附上错误日志

---

**快速找到解决方案，继续使用 CoPaw！** ✨
