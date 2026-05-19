# CoPaw 文档整理执行方案

## 🎯 整理目标

1. **根目录精简** - 只保留 5-7 个核心文档
2. **docs/ 统一** - 所有用户/开发文档集中
3. **消除重复** - 每个文档只有一个权威版本
4. **清晰导航** - 用户能快速找到需要的文档

---

## 📋 整理清单

### 第一步: 根目录精简

**保留**:
- ✅ README.md - 项目主 README
- ✅ README_zh.md - 中文 README
- ✅ CLAUDE.md - AI 助手指南
- ✅ CONTRIBUTING.md - 贡献指南
- ✅ DEVELOPMENT.md - 开发指南
- ✅ SECURITY.md - 安全政策

**移除**:
- ❌ README_ja.md - 日语 README（已过时，内容在 website/）
- ❌ docs/README.md - 与主 README 重复

### 第二步: docs/ 结构优化

**当前结构** → **目标结构**:

```
docs/
├── getting-started/         # 新建：快速开始
│   ├── installation.md       # 从 scripts/install.md 迁移
│   ├── quickstart.md         # 从 README.md 提取
│   └── first-run.md          # 新建
│
├── user-guide/              # 新建：用户指南
│   ├── channels/             # 从 docs/integrations/ 移动
│   ├── agents/               # 新建：Agent 配置
│   ├── skills/               # 从 docs/project/ 移动
│   └── integrations/        # 保持现有
│
├── development/             # 新建：开发者文档
│   ├── setup.md              # 从 DEVELOPMENT.md 整合
│   ├── architecture/         # 移动 docs/architecture/*
│   ├── testing/             # 新建
│   └── building/             # 保持现有 BUILD_*.md
│       ├── BUILD_GUIDE.md
│       ├── BUILD_PROCESS.md
│       └── BUILD_METHODS_COMPARISON.md
│
├── reference/               # 新建：参考文档
│   ├── cli/                  # 新建：CLI 参考
│   ├── configuration/        # 新建：配置参考
│   ├── api/                  # 新建：API 文档
│   └── channels/             # 从 docs/integrations/ 提取
│
├── integrations/            # 保持现有
│   ├── README.md
│   ├── dify-n8n.md
│   ├── crawler.md
│   └── xiyouzhaoci.md
│
├── specs/                   # 保持现有
│   └── superpowers/
│
├── releases/                # 新建：发布说明
│   └── CHANGELOG.md         # 从 docs/CHANGELOG.md 移动
│
├── frontend/                # 保持现有（前端开发者文档）
│   └── ...
│
└── README.md                # 简化为索引
```

### 第三步: 处理特殊目录

#### console/ 目录

**问题**: 有 2361 个 .md 文件（包括 node_modules）

**解决**:
```bash
# 确保 .gitignore 包含
console/node_modules/

# 只保留前端相关文档
console/README.md
console/HOT_RELOAD_GUIDE.md
console/SELECTOR_CREATION_GUIDE.md
```

#### website/ 目录

**说明**: Docusaurus 项目，docs/ 会自动生成到 public/docs/

**处理**:
- 保留 website/README.md（项目说明）
- 其他文档不手动维护，由 Docusaurus 生成

#### learning-*/ 目录

**问题**: 学习笔记分散在多个目录

**解决**:
```bash
# 移动到 experiments/ 目录
mkdir -p experiments/docs
mv learning-copaw/* experiments/docs/ 2>/dev/null || true
mv learning-CoPaw/* experiments/docs/ 2>/dev/null || true
mv learning-copaw-browser/* experiments/docs/ 2>/dev/null || true

# 添加到 .gitignore
echo "experiments/" >> .gitignore
```

#### scripts/ 目录

**整理**:
```
scripts/
├── README.md               # 脚本使用指南
└── pack/
    ├── README.md           # 打包说明（保留中文版）
    ├── README_zh.md        # 删除（合并到 README.md）
    ├── build_lite.sh
    └── build_with_uv.sh
```

---

## 🔧 具体执行步骤

### 步骤 1: 创建新目录结构

```bash
cd docs

# 创建新目录
mkdir -p getting-started
mkdir -p user-guide/{channels,agents,skills}
mkdir -p development/{setup,architecture,testing,building}
mkdir -p reference/{cli,configuration,api,channels}
mkdir -p releases
```

### 步骤 2: 移动和重组文档

```bash
# 移动 CHANGELOG
mv CHANGELOG.md releases/

# 移动架构文档
mv architecture/* development/architecture/ 2>/dev/null || true

# 移动前端文档（保持现有结构）
# docs/frontend/ 已经很好了

# 移动集成文档到用户指南
# docs/integrations/ → docs/user-guide/integrations/

# 移动项目文档到用户指南
# docs/project/ → docs/user-guide/skills/
```

### 步骤 3: 创建关键文档

**创建 docs/getting-started/quickstart.md**:
```markdown
# CoPaw 快速开始

## 安装

**推荐方式**（独立版本，无需 Python）:
1. 下载 [CoPaw-Lite-0.2.0.zip](../releases/latest)
2. 解压到任意目录
3. 双击启动脚本
4. 浏览器打开 http://localhost:8088

**传统方式**（需要 Python）:
\`\`\`bash
pip install copaw
copaw init --defaults
copaw app
\`\`\`

## 首次运行

1. 配置 AI API Key
2. 选择要启用的渠道
3. 创建或配置 Agent
4. 开始使用！

## 下一步

- [完整安装指南](installation.md)
- [渠道配置指南](../user-guide/channels/)
- [Agent 配置指南](../user-guide/agents/)
```

### 步骤 4: 更新根目录 README

简化根目录，添加清晰导航：

```markdown
# CoPaw

**[文档中心](docs/)** | [贡献指南](CONTRIBUTING.md) | [开发指南](DEVELOPMENT.md)

## 快速开始

[独立版本（推荐）](docs/README_DOWNLOADS.md) | [pip 安装](docs/getting-started/installation.md) | [脚本安装](docs/getting-started/script-install.md)

## 文档

- **用户指南**: [channels](docs/user-guide/channels/), [agents](docs/user-guide/agents/), [skills](docs/user-guide/skills/)
- **开发者**: [开发设置](docs/development/setup.md), [架构](docs/development/architecture/), [构建](docs/development/building/)
- **集成**: [Dify](docs/integrations/dify-n8n.md), [爬虫](docs/integrations/crawler.md), [西窝早辞](docs/integrations/xiyouzhaoci.md)

...

## 链接

- 文档: https://copaw.agentscope.io/
- Discord: https://discord.gg/eYMpfnkG8h
...
```

---

## ✅ 验证清单

完成整理后确认：

- [ ] 根目录只有 5-7 个 .md 文件
- [ ] docs/README.md 提供清晰的文档索引
- [ ] 每个 CLAUDE.md 引用都有效
- [ ] 没有重复的 README.md
- [ ] 所有内部链接正确
- [ ] 外部文档链接正确

---

## 📊 预期效果

**整理前**:
- 根目录: 8 个 .md 文件
- docs/: 26 个 .md 文件
- 总计: 192+ 个 .md 文件

**整理后**:
- 根目录: 6 个 .md 文件
- docs/: ~40 个 .md 文件（去除重复）
- 清晰的分类层级结构
- 易于导航和维护

---

**执行时间**: 1-1.5 小时  
**复杂度**: 中等  
**风险**: 低（只是移动和重组）
