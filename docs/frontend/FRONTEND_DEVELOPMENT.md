# 🔥 CoPaw 前端热加载快速指南

## 🚀 快速开始

### 方法 1: 一键启动（推荐）

```bash
# 1. 启动后端（终端 1）
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
uv run copaw app

# 2. 启动前端热加载（终端 2）- 使用一键脚本
bash scripts/dev.sh
```

### 方法 2: 手动启动

```bash
# 1. 启动后端（终端 1）
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
uv run copaw app

# 2. 启动前端热加载（终端 2）
cd console
npm run dev:proxy

# 3. 访问开发服务器
open http://localhost:5173/
```

## 📋 命令速查表

| 任务 | 命令 | 说明 |
|------|------|------|
| **启动热加载** | `bash scripts/dev.sh` | 一键启动前端开发服务器 |
| **手动启动** | `cd console && npm run dev:proxy` | 使用代理配置启动 |
| **构建前端** | `cd console && npm run build` | 生产环境构建 |
| **监听构建** | `cd console && npm run watch` | 自动监听文件变化并构建 |
| **代码检查** | `cd console && npm run lint` | ESLint 代码检查 |
| **格式化** | `cd console && npm run format` | Prettier 代码格式化 |

## 🎯 热加载原理

```
开发模式：
浏览器 → Vite (5173) → 代理 → CoPaw Backend (8088)
              ↓ 毫秒级热更新

生产模式：
浏览器 → CoPaw Backend (8088) → 静态文件
```

## ⚙️ 配置文件

- **开发配置**: [`console/vite.config.dev.ts`](console/vite.config.dev.ts) - 包含 API 代理配置
- **生产配置**: [`console/vite.config.ts`](console/vite.config.ts) - 生产环境配置
- **详细指南**: [`console/HOT_RELOAD_GUIDE.md`](console/HOT_RELOAD_GUIDE.md) - 完整文档

## 🛠️ 开发工作流

```
1. 🚀 启动后端
   └─ uv run copaw app

2. 🔥 启动前端热加载
   └─ bash scripts/dev.sh

3. 💻 开发
   ├─ 修改代码
   ├─ 保存 (自动热更新)
   └─ 浏览器查看效果

4. 📦 测试完成后
   ├─ npm run build
   ├─ cp -R dist/. ../src/copaw/console/
   └─ 重启后端验证
```

## 📂 项目结构

```
console/
├── src/
│   ├── api/          # API 调用
│   ├── components/   # 可复用组件
│   ├── layouts/      # 布局组件
│   ├── pages/        # 页面组件
│   └── ...
├── public/           # 静态资源
├── vite.config.ts           # 生产配置
├── vite.config.dev.ts       # 开发配置（热加载）
└── HOT_RELOAD_GUIDE.md      # 详细指南
```

## 💡 常见问题

### Q: 热加载不生效？
**A:** 确保使用 `npm run dev:proxy` 或 `bash scripts/dev.sh`

### Q: API 请求失败？
**A:** 检查后端是否在 `http://127.0.0.1:8088` 运行

### Q: 构建后看不到变化？
**A:** 需要重启后端，因为 Python 不支持前端资源热加载

## 📚 更多信息

- 📖 [完整热加载指南](console/HOT_RELOAD_GUIDE.md)
- 🎨 [前端架构分析](console/FRONTEND_ARCHITECTURE.md)
- 🌐 [官方文档](https://copaw.agentscope.io/)

## 🎉 开始开发

现在你可以在浏览器中访问 **http://localhost:5173/** 开始开发了！

修改任何 `console/src/` 下的文件，都会自动热更新到浏览器。
