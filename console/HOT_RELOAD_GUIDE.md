# 🚀 CoPaw 前端热加载开发指南

## 📋 目录
1. [快速开始](#快速开始)
2. [热加载方案](#热加载方案)
3. [详细配置](#详细配置)
4. [常见问题](#常见问题)

---

## 🎯 快速开始

### 前置条件
- ✅ CoPaw 后端已在 `http://127.0.0.1:8088` 运行
- ✅ Node.js 和 npm 已安装

### 一键启动热加载开发环境

```bash
# 1. 确保后端运行（在终端1）
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
uv run copaw app

# 2. 启动前端热加载（在终端2）
cd /home/clearzero22/github_projects/01_ai_project/CoPaw/console
npm run dev:proxy

# 3. 访问开发服务器
# 打开浏览器: http://localhost:5173/
```

---

## 🔥 热加载方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Vite 开发服务器** | ⚡ 毫秒级热更新<br>🔧 完整的调试工具<br>📊 详细的错误信息 | 需要两个终端 | 日常开发 |
| **构建监听模式** | 🔄 自动重新构建<br>📦 直接集成到后端 | 🐌 较慢（秒级）<br>需要重启后端 | 集成测试 |
| **手动构建** | 🎯 生产环境一致 | 🛠️ 手动操作繁琐 | 最终验证 |

---

## ⚙️ 方案 1: Vite 开发服务器（推荐）

### 原理
```
浏览器 → Vite Dev Server (5173) → 代理 → CoPaw Backend (8088)
              ↓ 快速热更新
```

### 启动步骤

**终端 1 - 启动后端：**
```bash
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
uv run copaw app
```

**终端 2 - 启动前端开发服务器：**
```bash
cd /home/clearzero22/github_projects/01_ai_project/CoPaw/console
npm run dev:proxy
```

**浏览器访问：**
```
http://localhost:5173/
```

### 特性
- ✅ **毫秒级热更新** - 修改代码后立即在浏览器看到效果
- ✅ **模块热替换 (HMR)** - 保留 React 状态
- ✅ **完整的开发工具** - React DevTools、Vue DevTools
- ✅ **详细的错误信息** - 源码级别的错误定位
- ✅ **API 代理** - 自动转发 /api 请求到后端

### 配置文件

已创建的 `vite.config.dev.ts` 包含：
- 🔄 API 代理配置（/api → http://127.0.0.1:8088）
- 🔌 WebSocket 代理支持
- 🌐 网络访问配置（0.0.0.0）

---

## 🔄 方案 2: 构建监听模式

### 原理
```
文件修改 → 自动构建 → 复制到 Python 包 → 后端重载
```

### 启动步骤

**终端 1 - 启动后端：**
```bash
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
uv run copaw app
```

**终端 2 - 启动构建监听：**
```bash
cd /home/clearzero22/github_projects/01_ai_project/CoPaw/console
npm run watch
```

**终端 3 - 启动自动复制（可选）：**
```bash
# 使用 watch 命令监控文件变化并自动复制
npx watch "cp -R dist/. ../../src/copaw/console/" dist/
```

### 特性
- ✅ **自动构建** - 文件保存后自动重新构建
- ✅ **集成到后端** - 构建产物自动复制到 Python 包
- ⚠️ **需要重启后端** - Python 不支持前端资源热加载
- 🐌 **较慢** - 每次修改都需要完整构建

---

## 🛠️ 方案 3: 手动构建流程

### 适用场景
- 🎯 生产环境验证
- 🔍 最终集成测试
- 📦 准备发布

### 构建步骤

```bash
# 1. 构建前端
cd /home/clearzero22/github_projects/01_ai_project/CoPaw/console
npm run build

# 2. 复制到 Python 包
mkdir -p ../../src/copaw/console
cp -R dist/. ../../src/copaw/console/

# 3. 重启后端
# Ctrl+C 停止当前进程
cd ../..
uv run copaw app
```

---

## 📂 文件监听脚本（进阶）

### 创建自动复制脚本

**文件：** `scripts/watch-and-copy.sh`

```bash
#!/bin/bash

# CoPaw 前端自动复制脚本
cd "$(dirname "$0")/../console"

echo "🔍 监控前端文件变化..."
echo "📦 构建产物将自动复制到后端"
echo "⚠️  后端需要手动重启才能看到变化"
echo ""

# 使用 fswatch 监控文件变化（需要安装 fswatch）
# brew install fswatch  # macOS
# apt install fswatch   # Linux

fswatch -o dist/ | while read num; do
    echo "📝 检测到文件变化，复制构建产物..."
    cp -R dist/. ../../src/copaw/console/
    echo "✅ 复制完成！请重启后端查看变化。"
done
```

### 使用方式

```bash
# 1. 启动构建监听
cd console
npm run watch

# 2. 在另一个终端启动自动复制
bash scripts/watch-and-copy.sh

# 3. 修改前端文件后，等待构建完成，然后重启后端
```

---

## 🎨 开发工作流推荐

### 日常开发流程

```
1. 启动后端
   ├─ 终端 1: uv run copaw app

2. 启动前端开发服务器
   ├─ 终端 2: npm run dev:proxy
   └─ 浏览器: http://localhost:5173/

3. 开发过程
   ├─ 修改代码
   ├─ 保存文件 (自动热更新)
   └─ 浏览器查看效果

4. 测试完成后
   ├─ npm run build
   ├─ cp -R dist/. ../../src/copaw/console/
   └─ 重启后端验证
```

### 新功能开发流程

```
1. 设计阶段
   └─ 使用 Vite 开发服务器快速迭代

2. 开发阶段
   ├─ 热加载开发
   ├─ 浏览器测试
   └─ API 调试

3. 集成测试
   ├─ 完整构建
   ├─ 后端集成
   └─ 端到端测试

4. 代码审查
   ├─ npm run lint
   ├─ npm run format
   └─ npm run build
```

---

## ❓ 常见问题

### Q1: 热加载不生效？
**A:** 检查以下几点：
1. 确认使用 `npm run dev:proxy` 而不是 `npm run dev`
2. 检查后端是否在 `http://127.0.0.1:8088` 运行
3. 清除浏览器缓存（Ctrl+Shift+R）

### Q2: API 请求失败？
**A:** 确认：
1. 后端已启动
2. 使用 `npm run dev:proxy` 启动（配置了代理）
3. 检查浏览器控制台的网络请求

### Q3: WebSocket 连接失败？
**A:** Vite 开发服务器的 WebSocket 代理已配置，如果仍有问题：
1. 检查后端 WebSocket 端点
2. 确认 `vite.config.dev.ts` 中的代理配置正确

### Q4: 构建后看不到变化？
**A:**
1. 确保执行了 `cp -R dist/. ../../src/copaw/console/`
2. 重启后端进程
3. 清除浏览器缓存

### Q5: 如何调试生产版本？
**A:** 使用构建预览：
```bash
npm run build
npm run preview
# 访问 http://localhost:4173/
```

---

## 🔧 调试技巧

### 1. React DevTools
```bash
# 安装浏览器扩展
# Chrome: React Developer Tools
# Firefox: React Developer Tools
```

### 2. 网络请求调试
```javascript
// 在浏览器控制台
localStorage.setItem('debug', 'copaw:*');
```

### 3. 性能分析
```bash
# 构建时生成分析报告
npm run build -- --mode development --analyze
```

---

## 📚 相关资源

- [Vite 热模块替换 (HMR)](https://vitejs.dev/guide/features.html#hot-module-replacement)
- [React 快速刷新](https://react.dev/reference/react/ReactDOM#refresh)
- [CoPaw 开发文档](https://copaw.agentscope.io/)

---

## 🎯 总结

| 任务 | 推荐方案 | 命令 |
|------|----------|------|
| **日常开发** | Vite 开发服务器 | `npm run dev:proxy` |
| **集成测试** | 构建监听 | `npm run watch` |
| **生产验证** | 完整构建 | `npm run build` |
| **代码检查** | Lint + Format | `npm run lint && npm run format` |

**推荐配置：**
- 💻 开发：使用 Vite 开发服务器（毫秒级热更新）
- 🔄 调试：保持后端运行，独立重启前端
- 📦 集成：完成功能后完整构建一次
- 🚀 发布：使用生产模式构建

---

## 📞 需要帮助？

- 📖 [CoPaw 官方文档](https://copaw.agentscope.io/)
- 💬 [Discord 社区](https://discord.gg/eYMpfnkG8h)
- 🐛 [GitHub Issues](https://github.com/agentscope-ai/CoPaw/issues)
