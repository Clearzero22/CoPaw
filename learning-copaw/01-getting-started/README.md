# 快速开始

欢迎使用 CoPaw！本目录帮助你快速上手 CoPaw 的使用。

## 📄 文档列表

### [使用指南和实战案例](./usage-examples.md)
**推荐首先阅读** - 从安装到实战的完整指南

**内容概要**：
- 🚀 三步快速启动
- 💡 5 大常见使用场景
- 🔧 高级用法和技巧
- 🔌 各渠道配置详解
- 🛠️ 技能开发示例
- 🐛 故障排查指南

---

## 🎯 学习目标

通过本章学习，你将能够：

✅ 在 5 分钟内完成 CoPaw 安装和启动
✅ 理解 CoPaw 的核心功能
✅ 配置消息渠道（钉钉、飞书、QQ 等）
✅ 创建和管理 Agent
✅ 开发自定义技能
✅ 解决常见问题

---

## 📖 快速导航

### 我想...

#### 🏃‍♂️ 立即开始
→ [三步启动](./usage-examples.md#快速开始)

#### 🤖 创建我的第一个 Agent
→ [场景一：个人助手](./usage-examples.md#场景一个人助手)

#### 📱 接入微信/钉钉/飞书
→ [场景五：多渠道部署](./usage-examples.md#场景五多渠道部署)

#### ⏰ 设置定时任务
→ [场景二：定时新闻推送](./usage-examples.md#场景二定时新闻推送)

#### 🔧 开发自定义技能
→ [高级用法：自定义技能](./usage-examples.md#31-自定义技能)

#### 🐛 遇到问题
→ [故障排查](./usage-examples.md#故障排查)

---

## 💻 命令速查

```bash
# 安装
pip install copaw

# 初始化
copaw init --defaults

# 启动
copaw app

# 管理 Agent
copaw agents list
copaw agents create --name "我的助手"

# 管理渠道
copaw channels list
copaw channels add feishu

# 管理模型
copaw models list
copaw models download Qwen/Qwen2-7B-GGUF

# 定时任务
copaw cron list --agent-id default
```

---

## 🔗 相关文档

- **[功能详解](../02-features/)** - 了解完整功能
- **[系统架构](../03-architecture/)** - 理解设计架构
- **[开发指南](../04-development/)** - 参与开发

---

**开始你的 CoPaw 之旅吧！** 🚀
