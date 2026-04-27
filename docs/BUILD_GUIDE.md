# CoPaw Windows 版本构建指南

本文档记录如何构建 CoPaw 的 Windows 独立版本，无需用户预装 Python 环境。

## 📋 构建前准备

### 系统要求
- Linux/macOS/WSL 构建环境
- Python 3.10+
- bun（前端构建）
- uv（Python 包管理器）
- 至少 10GB 可用磁盘空间

### 安装依赖

```bash
# 安装 uv
pip install uv

# 安装 bun（前端构建）
curl -fsSL https://bun.sh/install | bash

# 或在 Linux 上
wget -qO- https://bun.sh/install | bash
```

---

## 🚀 快速构建（推荐）

### 构建精简版（450MB，推荐）

```bash
# 1. 进入项目根目录
cd /path/to/CoPaw

# 2. 构建前端
cd console
bun install
bun run build
cd ..

# 3. 构建精简版
bash scripts/pack/build_lite.sh

# 4. 输出文件
# dist/CoPaw-Lite-0.2.0.zip (450MB)
```

### 构建完整版（5.7GB，含本地 AI）

```bash
# 构建完整版（包含 PyTorch、CUDA 等）
bash scripts/pack/build_with_uv.sh

# 输出文件
# dist/CoPaw-Standalone-0.2.0.zip (5.7GB)
```

---

## 📊 版本对比

| 版本 | 大小 | 适用场景 | 包含内容 |
|------|------|----------|----------|
| **精简版** | 450MB | ⭐ 推荐：使用云端 API 的用户 | 核心功能 + 内置 Python 环境 |
| 完整版 | 5.7GB | 有 GPU、需要本地 AI 模型 | 全部功能 + PyTorch + CUDA |
| 便携版 | 25MB | 开发者、已有 Python 环境 | 仅源代码，需用户安装 Python |

---

## 🔧 构建脚本详解

### 1. 精简版构建脚本

**文件**: `scripts/pack/build_lite.sh`

**核心逻辑**:
```bash
# 1. 创建独立 Python 环境（使用 uv）
uv venv "$OUTPUT_DIR/python" --python 3.12

# 2. 安装核心依赖（排除 PyTorch 等大型包）
uv pip install -r /tmp/copaw_lite_requirements.txt --python "$OUTPUT_DIR/python/bin/python"

# 3. 从源码安装 copaw（不安装依赖）
uv pip install -e "$REPO_ROOT" --python "$OUTPUT_DIR/python/bin/python" --no-deps

# 4. 创建启动脚本
# - Windows: 启动 CoPaw.bat
# - Linux/macOS: start-copaw.sh

# 5. 打包成 ZIP
zip -r "CoPaw-Lite-$VERSION.zip" "CoPaw-Lite-$VERSION"
```

**排除的依赖**（节省约 5GB）:
- `nvidia` (2.7GB) - CUDA GPU 支持
- `torch` (1.1GB) - PyTorch
- `triton` (639MB) - GPU 编译器
- `llvmlite` (161MB) - numba 依赖
- `llama_cpp` (18MB) - 本地 LLM

### 2. 完整版构建脚本

**文件**: `scripts/pack/build_with_uv.sh`

**区别**: 安装 `copaw[full]`，包含所有可选依赖

```bash
uv pip install -e "$REPO_ROOT[full]" --python "$OUTPUT_DIR/python/bin/python"
```

---

## 🐛 常见问题

### 1. 磁盘空间不足

**问题**: 构建时提示 "No space left on device"

**解决**:
```bash
# 清理 uv 缓存
uv cache clean --force

# 检查空间
df -h

# 如果仍不足，清理其他缓存
rm -rf ~/.cache/pip
```

### 2. 缺少依赖

**问题**: 启动时提示 "socksio not found"

**解决**: 在 `build_lite.sh` 的 requirements.txt 中添加：
```
httpx[socks]>=0.27.0
socksio>=1.0.0
```

### 3. 前端未构建

**问题**: 前端资源未包含

**解决**:
```bash
cd console
bun install
bun run build
cd ..

# 确认前端已构建
ls console/dist/index.html
```

### 4. 构建后测试失败

**问题**: 启动后无法访问 Web 界面

**解决**:
```bash
# 检查日志
tail -50 /tmp/copaw_lite.log

# 检查端口是否被占用
lsof -i :8088

# 尝试使用其他端口
export COPAW_PORT=8089
./start-copaw.sh
```

---

## 📦 输出文件结构

### 精简版解压后结构

```
CoPaw-Lite-0.2.0/
├── python/                    # 独立 Python 环境
│   ├── bin/                  # 可执行文件
│   │   ├── python
│   │   └── ...
│   ├── lib/                  # Python 包
│   │   └── python3.12/
│   │       └── site-packages/
│   │           ├── agentscope/
│   │           ├── copaw/
│   │           └── ... (221 个包)
│   └── pyvenv.cfg
├── 启动 CoPaw.bat             # Windows 启动脚本
├── start-copaw.sh             # Linux/macOS 启动脚本
└── README.txt                 # 使用说明
```

---

## 🧪 测试验证

### 启动测试

```bash
# 解压后进入目录
cd dist/CoPaw-Lite-0.2.0

# 启动（Linux/macOS）
./start-copaw.sh

# 或 Windows
# 双击"启动 CoPaw.bat"

# 检查是否成功
curl http://localhost:8088/
```

### 预期输出

```
====================================
CoPaw 精简版（不含本地 AI 模型）
====================================
数据目录: /home/user/.copaw

支持的 AI 提供商：
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude)
  - Google Gemini
  - 阿里云百炼

正在启动 CoPaw...
浏览器将自动打开 http://localhost:8088

按 Ctrl+C 停止
====================================

INFO:     Uvicorn running on http://127.0.0.1:8088
```

---

## 📋 构建检查清单

在发布前，确认以下项目：

- [ ] 前端已构建（`console/dist/index.html` 存在）
- [ ] 精简版构建成功（`dist/CoPaw-Lite-0.2.0.zip`）
- [ ] ZIP 文件大小合理（约 450MB）
- [ ] 启动脚本测试通过
- [ ] Web 服务可以访问（http://localhost:8088）
- [ ] 代理启动成功（日志显示 "3/3 agents started"）
- [ ] README 文档完整

---

## 🚢 发布流程

### 1. 准备发布

```bash
# 1. 确认版本号
cat src/copaw/__version__.py

# 2. 创建 Git 标签（可选）
git tag -a v0.2.0 -m "CoPaw v0.2.0 精简版"
git push origin v0.2.0

# 3. 检查构建产物
ls -lh dist/CoPaw-Lite-0.2.0.zip
```

### 2. 上传到 GitHub Releases

```bash
# 使用 GitHub CLI
gh release create v0.2.0 \
  --title "CoPaw v0.2.0 - 精简版" \
  --notes "CoPaw 精简版，无需预装 Python，开箱即用！" \
  dist/CoPaw-Lite-0.2.0.zip
```

### 3. 更新文档

在 README.md 中添加下载说明：

```markdown
## 下载

### Windows/macOS/Linux 精简版（推荐）
- [CoPaw-Lite-0.2.0.zip](https://github.com/agentscope-ai/CoPaw/releases/download/v0.2.0/CoPaw-Lite-0.2.0.zip) (450MB)
- 无需预装 Python，解压即用
- 支持所有主流云端 AI API

### 完整版（含本地 AI 模型）
- [CoPaw-Standalone-0.2.0.zip](https://github.com/agentscope-ai/CoPaw/releases/download/v0.2.0/CoPaw-Standalone-0.2.0.zip) (5.7GB)
- 包含 PyTorch 和本地 AI 模型支持
- 需要 NVIDIA GPU 才能发挥最佳性能
```

---

## 🔗 相关文档

- [构建方法对比](BUILD_METHODS_COMPARISON.md) - 不同构建方案的详细对比
- [Windows 便携版使用指南](WINDOWS_PORTABLE_BUILD.md) - Windows 用户使用说明
- [官方 README](../README.md) - CoPaw 项目说明

---

## 📞 获取帮助

如果遇到构建问题：

1. 检查本文档的"常见问题"部分
2. 查看构建日志：`build_lite.log`
3. 搜索 GitHub Issues
4. 提交新的 Issue（附上构建日志）

---

## 📅 更新历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-04-27 | v0.2.0 | 初始版本，创建精简版和完整版构建脚本 |

---

**最后更新**: 2026-04-27  
**维护者**: CoPaw 开发团队
