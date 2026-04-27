#!/bin/bash
# 使用 uv 创建轻量级的独立 Python 环境打包
# 优势：
# 1. 比 conda-pack 更快
# 2. 更小的体积
# 3. 更好的兼容性

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION=$(python3 -c "import sys; sys.path.insert(0, '$REPO_ROOT/src'); from copaw.__version__ import __version__; print(__version__)")

echo "================================"
echo "CoPaw UV 独立版构建"
echo "================================"
echo "版本: $VERSION"
echo "仓库: $REPO_ROOT"
echo

DIST_DIR="$REPO_ROOT/dist"
OUTPUT_DIR="$DIST_DIR/CoPaw-Standalone-$VERSION"

echo "[1/5] 清理旧构建..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "[2/5] 使用 uv 创建独立的 Python 环境..."
# 使用 uv 创建独立的 Python 环境（不依赖系统 Python）
uv venv "$OUTPUT_DIR/python" --python 3.12

echo "[3/5] 安装 CoPaw 及依赖..."
# 使用 uv 安装 CoPaw（从源码，包含前端）
uv pip install -e "$REPO_ROOT[full]" --python "$OUTPUT_DIR/python/bin/python"

echo "[4/5] 复制前端资源..."
# 确保前端已构建
if [ ! -f "$REPO_ROOT/console/dist/index.html" ]; then
    echo "构建前端..."
    cd "$REPO_ROOT/console"
    bun install && bun run build
    cd "$REPO_ROOT"
fi

# 前端已通过 setuptools 包含在 copaw 包中
echo "✓ 前端已包含"

echo "[5/5] 创建启动脚本..."

# Windows 启动脚本
cat > "$OUTPUT_DIR/启动 CoPaw.bat" << 'EOF'
@echo off
setlocal

REM 设置 CoPaw 数据目录
if not defined COPAW_DATA_DIR set "COPAW_DATA_DIR=%USERPROFILE%\.copaw"

REM 添加打包的 Python 到 PATH
set "PATH=%~dp0python\Scripts;%~dp0python;%PATH%"

echo ====================================
echo CoPaw 独立版
echo ====================================
echo 数据目录: %COPAW_DATA_DIR%
echo.
echo 正在启动 CoPaw...
echo 浏览器将自动打开 http://localhost:8088
echo.
echo 按 Ctrl+C 停止
echo ====================================
echo.

REM 启动 CoPaw
"%~dp0python\python.exe" -m copaw app

pause
EOF

# Linux/macOS 启动脚本
cat > "$OUTPUT_DIR/start-copaw.sh" << 'EOF'
#!/bin/bash
# CoPaw 启动脚本

# 设置数据目录
export COPAW_DATA_DIR="${COPAW_DATA_DIR:-$HOME/.copaw}"

# 添加打包的 Python 到 PATH
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$DIR/python/bin:$PATH"

echo "===================================="
echo "CoPaw 独立版"
echo "===================================="
echo "数据目录: $COPAW_DATA_DIR"
echo ""
echo "正在启动 CoPaw..."
echo "浏览器将自动打开 http://localhost:8088"
echo ""
echo "按 Ctrl+C 停止"
echo "===================================="
echo ""

# 启动 CoPaw
cd "$DIR"
"$DIR/python/bin/python" -m copaw app
EOF
chmod +x "$OUTPUT_DIR/start-copaw.sh"

# 创建 README
cat > "$OUTPUT_DIR/README.txt" << EOF
# CoPaw 独立版 v$VERSION

## 快速开始

### Windows:
双击 \`启动 CoPaw.bat\`

### Linux/macOS:
运行 \`./start-copaw.sh\`

浏览器会自动打开 http://localhost:8088

## 特点

- ✓ 包含完整的 Python 环境
- ✓ 所有依赖已安装
- ✓ 无需用户安装 Python
- ✓ 开箱即用

## 目录结构

\`\`\`
CoPaw-Standalone-$VERSION/
├── python/              # 独立的 Python 环境
├── 启动 CoPaw.bat       # Windows 启动脚本
├── start-copaw.sh       # Linux/macOS 启动脚本
└── README.txt           # 本文件
\`\`\`

## 数据存储

所有用户数据保存在:
- Windows: \`%USERPROFILE%\\\\.copaw\`
- Linux/macOS: \`~/.copaw\`

## 系统要求

- Windows 10+, macOS 12+, 或 Linux
- 约 500MB 磁盘空间（Python 环境）
- 网络连接（用于 AI 模型）

## 获取帮助

- 文档: https://github.com/agentscope-ai/CoPaw
- 问题: GitHub Issues

## 许可证

Apache License 2.0
EOF

echo "创建压缩包..."
cd "$DIST_DIR"
if command -v zip &> /dev/null; then
    zip -r "CoPaw-Standalone-$VERSION.zip" "CoPaw-Standalone-$VERSION"
    echo "✓ 压缩包创建完成: CoPaw-Standalone-$VERSION.zip"
else
    echo "⚠ zip 命令不可用，跳过压缩"
fi

echo
echo "================================"
echo "构建完成！"
echo "================================"
echo "输出: $OUTPUT_DIR"
echo "压缩包: $DIST_DIR/CoPaw-Standalone-$VERSION.zip"
echo
echo "使用方法:"
echo "1. 解压到任意目录"
echo "2. 运行启动脚本（Windows: 启动 CoPaw.bat）"
echo "3. 浏览器访问 http://localhost:8088"
echo "================================"
