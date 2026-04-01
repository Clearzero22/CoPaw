# 开发指南

本目录指导你如何参与 CoPaw 的开发。

## 📄 文档列表

### [开发工作流与最佳实践](./development-workflow.md)
**完整的开发指南** - 从环境搭建到贡献代码的全流程

**内容概要**：
- 🔧 开发环境搭建（Python、前端、依赖）
- 📁 项目结构详解
- 🔄 功能开发流程
- ✅ 测试指南（单元测试、集成测试）
- 🐛 调试技巧（日志、断点、性能分析）
- 📝 代码规范（风格、命名、文档）
- 🤝 贡献指南（流程、Commit 规范、PR 模板）
- 💡 最佳实践（错误处理、资源管理、异步编程）

---

## 🎯 开发目标

通过本章学习，你将能够：

✅ 搭建完整的开发环境
✅ 理解项目结构和组织方式
✅ 遵循代码规范和最佳实践
✅ 编写和运行测试
✅ 调试和优化代码
✅ 提交高质量的 Pull Request

---

## 🚀 快速开始

### 1. 环境搭建
```bash
# 克隆项目
git clone https://github.com/agentscope-ai/CoPaw.git
cd CoPaw

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -e ".[dev,full]"

# 初始化配置
copaw init --defaults

# 启动开发服务器
copaw app
```

### 2. 开发流程
```bash
# 1. 创建功能分支
git checkout -b feat/your-feature

# 2. 开发和测试
pytest tests/
copaw app

# 3. 代码检查
black src/copaw/
ruff check src/copaw/

# 4. 提交代码
git add .
git commit -m "feat: add your feature"
git push origin feat/your-feature
```

---

## 📖 开发导航

### 按任务类型查看
- **[添加新渠道](./development-workflow.md#添加新渠道)** - 渠道开发指南
- **[添加新技能](./development-workflow.md#添加新技能)** - 技能开发指南
- **[添加新工具](./development-workflow.md#添加新工具)** - 工具开发指南

### 按开发主题查看
- **[环境搭建](./development-workflow.md#开发环境搭建)** - 开发环境配置
- **[项目结构](./development-workflow.md#项目结构)** - 代码组织
- **[测试指南](./development-workflow.md#测试指南)** - 测试编写
- **[代码规范](./development-workflow.md#代码规范)** - 代码风格

### 按工具查看
- **[调试技巧](./development-workflow.md#调试技巧)** - 日志、断点、性能分析
- **[IDE 配置](./development-workflow.md#ide-配置)** - VSCode 设置
- **[Git 工作流](./development-workflow.md#功能开发流程)** - 分支管理

---

## 🛠️ 开发工具

### 必需工具
- **Python 3.10+**
- **pip / uv** - 包管理
- **Git** - 版本控制

### 推荐工具
- **VSCode** - IDE
- **pytest** - 测试框架
- **black** - 代码格式化
- **ruff** - 代码检查
- **mypy** - 类型检查

### 前端开发（可选）
- **Node.js 18+**
- **npm / pnpm**
- **Vite**

---

## 📝 开发规范

### 代码风格
- 遵循 PEP 8
- 使用 Black 格式化
- 使用 Ruff 检查
- 添加类型注解

### 命名规范
- 类名：PascalCase
- 函数/变量：snake_case
- 常量：UPPER_SNAKE_CASE
- 私有成员：前缀下划线

### 文档规范
- 添加 docstring
- 注释复杂逻辑
- 更新相关文档

---

## 🧪 测试要求

### 测试类型
- **单元测试**: 测试单个函数/类
- **集成测试**: 测试模块交互
- **端到端测试**: 测试完整流程

### 运行测试
```bash
# 所有测试
pytest

# 特定文件
pytest tests/agents/test_tools.py

# 覆盖率
pytest --cov=src/copaw --cov-report=html
```

---

## 🤝 贡献流程

### Pull Request 流程
1. Fork 仓库
2. 创建功能分支
3. 开发和测试
4. 提交 PR
5. 代码审查
6. 合并代码

### Commit 规范
```
<type>(<scope>): <subject>

类型：feat / fix / docs / style / refactor / test / chore

示例：
feat(agents): add multi-agent collaboration
fix(channels): resolve Feishu connection issue
docs(readme): update installation instructions
```

---

## 🔗 相关文档

- **[快速开始](../01-getting-started/)** - 使用 CoPaw
- **[功能详解](../02-features/)** - 了解功能
- **[代码示例](../05-reference/code-examples.md)** - 学习实现

---

**开始为 CoPaw 做贡献吧！** 🛠️
