# CoPaw 构建流程文档

本文档记录 CoPaw Windows 独立版本的完整构建过程，便于后续维护和复现。

## 📅 构建记录

**构建日期**: 2026-04-27  
**构建版本**: v0.2.0  
**构建环境**: Linux (Manjaro)  
**构建者**: Assistant

---

## 🎯 构建目标

创建无需用户预装 Python 的 CoPaw Windows 独立版本，支持：
- ✅ 开箱即用（解压即运行）
- ✅ 体积合理（< 500MB）
- ✅ 包含所有核心功能
- ✅ 支持主流云端 AI API

---

## 📝 构建步骤

### 步骤 1: 环境准备

```bash
# 检查工具版本
python3 --version    # Python 3.10+
bun --version        # bun 1.3+
uv --version         # uv 0.10.4+

# 确认前端已构建
ls console/dist/index.html

# 如果未构建，执行：
cd console
bun install
bun run build
cd ..
```

### 步骤 2: 创建构建脚本

**文件**: `scripts/pack/build_lite.sh`

**关键配置**:
```bash
# 创建独立 Python 环境
uv venv "$OUTPUT_DIR/python" --python 3.12

# 排除的大型依赖
# - nvidia (2.7GB) - CUDA GPU 支持
# - torch (1.1GB) - PyTorch
# - triton (639MB) - GPU 编译器
# - llvmlite (161MB) - numba 依赖
# - llama_cpp (18MB) - 本地 LLM

# 核心依赖列表
cat > /tmp/copaw_lite_requirements.txt << 'EOF'
agentscope==1.0.17
agentscope-runtime==1.1.1
httpx[socks]>=0.27.0
discord-py>=2.3
dingtalk-stream>=0.24.3
uvicorn>=0.40.0
playwright>=1.49.0
# ... 其他核心依赖
EOF
```

### 步骤 3: 执行构建

```bash
bash scripts/pack/build_lite.sh
```

**构建时间**: 约 3-5 分钟  
**磁盘使用**: 峰值约 8GB

### 步骤 4: 验证构建结果

```bash
# 检查文件大小
ls -lh dist/CoPaw-Lite-0.2.0.zip
# 预期: 约 450MB

# 解压测试
unzip -q dist/CoPaw-Lite-0.2.0.zip -d /tmp/test

# 启动测试
cd /tmp/test/CoPaw-Lite-0.2.0
./start-copaw.sh &

# 验证 Web 服务
curl http://localhost:8088/
```

### 步骤 5: 检查依赖完整性

```bash
# 检查关键包
du -sh dist/CoPaw-Lite-0.2.0/python/lib/python3.12/site-packages/* | sort -hr | head -10

# 预期最大包:
# playwright (131MB) - 必需，浏览器自动化
# chromadb (57MB) - 必需，向量数据库
# onnxruntime (49MB) - 必需，模型推理
# lark_oapi (45MB) - 必需，飞书集成
```

---

## 🐛 遇到的问题与解决方案

### 问题 1: 磁盘空间不足

**错误信息**:
```
No space left on device (os error 28)
```

**原因**: 完整版构建需要约 8GB 临时空间

**解决**:
```bash
# 清理 uv 缓存
uv cache clean --force

# 清理了 29.6GB
# 释放后可用空间: 25GB
```

### 问题 2: 缺少 socksio 依赖

**错误信息**:
```
Using SOCKS proxy, but the 'socksio' package is not installed
```

**原因**: `httpx` 需要 `[socks]` 额外选项

**解决**: 修改 requirements.txt
```diff
- httpx>=0.27.0
+ httpx[socks]>=0.27.0
+ socksio>=1.0.0
```

### 问题 3: 前端资源未包含

**原因**: setuptools 配置正确，前端会自动包含

**验证**:
```bash
# 检查前端是否在包中
ls dist/CoPaw-Lite-0.2.0/python/lib/python3.12/site-packages/copaw/console/index.html
```

---

## 📊 构建结果对比

| 版本 | 构建时间 | ZIP 大小 | 解压后 | 状态 |
|------|----------|----------|--------|------|
| 精简版 | 3-5 分钟 | 450MB | 766MB | ✅ 成功 |
| 完整版 | 10-15 分钟 | 5.7GB | 5.4GB | ✅ 成功 |
| 便携版 | 1-2 分钟 | 25MB | 100MB | ✅ 成功 |

---

## 🔄 持续集成建议

### 自动化构建脚本

可以创建 GitHub Actions 工作流：

```yaml
name: Build Standalone Release

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Setup UV
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
        
      - name: Build Frontend
        run: |
          cd console
          bun install
          bun run build
          
      - name: Build Lite Version
        run: bash scripts/pack/build_lite.sh
        
      - name: Upload Release Asset
        uses: softprops/action-gh-release@v1
        with:
          files: dist/CoPaw-Lite-*.zip
```

### 版本管理

1. 更新 `src/copaw/__version__.py`
2. 更新 CHANGELOG.md
3. 创建 Git tag: `git tag v0.2.1`
4. 推送 tag: `git push origin v0.2.1`
5. GitHub Actions 自动构建

---

## 📋 发布检查清单

发布前确认：

- [ ] 前端已构建 (`console/dist/index.html`)
- [ ] 版本号已更新 (`__version__.py`)
- [ ] 构建脚本已测试
- [ ] 启动脚本可执行
- [ ] README 文档完整
- [ ] 在 3 个平台测试过（Windows/Linux/macOS）
- [ ] 已创建 GitHub Release
- [ ] 已上传构建产物
- [ ] 已更新下载文档

---

## 🚀 未来改进方向

1. **体积优化**
   - 考虑排除 pandas (42MB) - 非核心功能
   - 考虑排除 transformers (47MB) - 仅在需要时安装
   - 预计可再减少 100MB

2. **构建优化**
   - 使用 GitHub Actions 自动化
   - 并行构建多个版本
   - 自动化测试

3. **用户体验**
   - 创建 .exe 安装程序（使用 NSIS）
   - 添加自动更新功能
   - 提供安装后首次运行向导

---

## 📞 维护联系人

**构建维护**: CoPaw 开发团队  
**问题反馈**: [GitHub Issues](https://github.com/agentscope-ai/CoPaw/issues)

---

## 📚 相关文档

- [构建指南](BUILD_GUIDE.md) - 详细构建说明
- [构建方法对比](BUILD_METHODS_COMPARISON.md) - 不同方案对比
- [下载指南](README_DOWNLOADS.md) - 用户下载说明

---

**文档创建**: 2026-04-27  
**最后更新**: 2026-04-27
