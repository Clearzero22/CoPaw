# CoPaw 文档中心

欢迎来到 CoPaw 项目文档中心。这里包含了项目的所有技术文档、开发指南和最佳实践。

## 📚 文档目录

### 🚀 快速开始
- [项目概述](../README.md) - CoPaw 是什么，能做什么
- [快速安装](../README.md#快速安装) - 5 分钟快速上手
- [开发指南](../DEVELOPMENT.md) - 开发环境设置和工作流程

### 💻 开发文档

#### 前端开发
- [添加新侧栏和页面](./frontend/ADD_NEW_SIDEBAR_PAGE.md) - 如何添加新的侧栏菜单项和页面
- [前端开发指南](./frontend/FRONTEND_DEVELOPMENT.md) - 前端架构、组件开发规范
- [热重载设置](./frontend/HOT_RELOAD_SETUP.md) - 前端热重载配置

#### 后端开发
- [后端开发指南](./backend/BACKEND_DEVELOPMENT.md) - 后端架构、API 开发规范
- [Agent 开发](./backend/AGENT_DEVELOPMENT.md) - 如何开发自定义 Agent
- [技能开发](./backend/SKILL_DEVELOPMENT.md) - 技能系统开发指南

#### 系统架构
- [架构设计](./architecture/ARCHITECTURE.md) - 系统整体架构设计
- [数据库设计](./architecture/DATABASE.md) - 数据模型和存储设计
- [安全设计](./architecture/SECURITY.md) - 安全机制和权限控制

### 📖 用户文档
- [用户指南](../website/public/docs/user-guide.md) - 终端用户使用指南
- [配置参考](../website/public/docs/configuration.md) - 完整的配置选项参考
- [CLI 命令参考](../website/public/docs/cli.md) - 命令行工具完整文档

### 🤝 贡献指南
- [贡献指南](../CONTRIBUTING_zh.md) - 如何为项目做贡献
- [代码规范](./CONTRIBUTING/CODE_STYLE.md) - 代码风格和规范
- [提交规范](./CONTRIBUTING/COMMIT_CONVENTION.md) - Git 提交信息规范
- [Pull Request 指南](./CONTRIBUTING/PR_GUIDE.md) - 如何提交 PR

### 🔧 运维文档
- [部署指南](./deployment/DEPLOYMENT.md) - 生产环境部署指南
- [监控和日志](./deployment/MONITORING.md) - 系统监控和日志管理
- [故障排查](./deployment/TROUBLESHOOTING.md) - 常见问题和解决方案

### 📝 项目管理
- [路线图](../website/public/docs/roadmap.en.md) - 项目发展路线图
- [变更日志](../CHANGELOG.md) - 版本更新记录
- [发布流程](./project/RELEASE_PROCESS.md) - 版本发布流程

---

## 📂 文档结构

```
CoPaw/
├── README.md                   # 项目首页
├── DEVELOPMENT.md              # 开发指南（根目录，向后兼容）
├── docs/                       # 文档中心
│   ├── README.md              # 本文件 - 文档导航
│   ├── frontend/              # 前端开发文档
│   │   ├── ADD_NEW_SIDEBAR_PAGE.md
│   │   ├── FRONTEND_DEVELOPMENT.md
│   │   └── HOT_RELOAD_SETUP.md
│   ├── backend/               # 后端开发文档
│   │   ├── BACKEND_DEVELOPMENT.md
│   │   ├── AGENT_DEVELOPMENT.md
│   │   └── SKILL_DEVELOPMENT.md
│   ├── architecture/          # 架构设计文档
│   │   ├── ARCHITECTURE.md
│   │   ├── DATABASE.md
│   │   └── SECURITY.md
│   ├── contributing/          # 贡献相关文档
│   │   ├── CODE_STYLE.md
│   │   ├── COMMIT_CONVENTION.md
│   │   └── PR_GUIDE.md
│   ├── deployment/            # 部署运维文档
│   │   ├── DEPLOYMENT.md
│   │   ├── MONITORING.md
│   │   └── TROUBLESHOOTING.md
│   └── project/               # 项目管理文档
│       ├── RELEASE_PROCESS.md
│       └── ROADMAP.md
└── website/public/docs/       # 用户文档（官网）
    ├── user-guide.md
    ├── configuration.md
    └── cli.md
```

---

## 🎯 快速查找

### 我想...

| 我想... | 查看文档 |
|---------|----------|
| 快速开始开发 | [开发指南](../DEVELOPMENT.md) |
| 添加新页面 | [添加新侧栏和页面](./frontend/ADD_NEW_SIDEBAR_PAGE.md) |
| 开发新技能 | [技能开发指南](./backend/SKILL_DEVELOPMENT.md) |
| 了解架构 | [架构设计](./architecture/ARCHITECTURE.md) |
| 贡献代码 | [贡献指南](../CONTRIBUTING_zh.md) |
| 部署上线 | [部署指南](./deployment/DEPLOYMENT.md) |
| 解决问题 | [故障排查](./deployment/TROUBLESHOOTING.md) |

---

## 📝 文档规范

### 文档编写指南

1. **使用 Markdown**：所有文档使用 Markdown 格式
2. **清晰标题**：使用分级标题（#、##、###）组织内容
3. **代码示例**：提供可运行的代码示例，指定语言
4. **图表说明**：使用 ASCII 图表或 Mermaid 图表
5. **保持更新**：代码变更时同步更新文档

### 文档模板

创建新文档时，请使用以下模板：

```markdown
# 文档标题

## 概述
简要描述文档内容和目标读者

## 前置条件
- 需要了解的知识
- 需要安装的工具

## 详细内容
### 主题 1
说明和示例

### 主题 2
说明和示例

## 常见问题
Q: 常见问题
A: 解答

## 相关资源
- [相关文档](链接)
- [外部参考](链接)
```

---

## 🔄 文档维护

### 更新频率

- **开发文档**：随功能变更即时更新
- **用户文档**：每次发布时更新
- **架构文档**：重大架构变更时更新

### 责任分工

- **前端文档**：前端团队维护
- **后端文档**：后端团队维护
- **架构文档**：架构师维护
- **用户文档**：产品团队维护

---

## 📮 反馈和贡献

如果你发现文档有错误或需要补充：

1. **简单修改**：直接提交 PR
2. **重大变更**：先提交 Issue 讨论
3. **新建文档**：先讨论文档结构

### 文档 Issue 标签

- `documentation` - 文档相关
- `docs: improvement` - 文档改进
- `docs: bug` - 文档错误
- `docs: missing` - 文档缺失

---

## 🔗 外部资源

- **官网**：https://copaw.agentscope.io/
- **GitHub**：https://github.com/agentscope-ai/CoPaw
- **Discord**：https://discord.gg/eYMpfnkG8h
- **AgentScope 文档**：https://agentscope.io/

---

**最后更新**：2026-03-26
**文档版本**：v1.0.0
