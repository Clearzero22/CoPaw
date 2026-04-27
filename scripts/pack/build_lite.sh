#!/bin/bash
# 构建 CoPaw 精简版 - 不包含本地 AI 模型
# 只保留核心功能：Web 服务、前端、渠道集成、浏览器自动化

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION=$(python3 -c "import sys; sys.path.insert(0, '$REPO_ROOT/src'); from copaw.__version__ import __version__; print(__version__)")

echo "================================"
echo "CoPaw 精简版构建（无本地 AI 模型）"
echo "================================"
echo "版本: $VERSION"
echo "仓库: $REPO_ROOT"
echo

DIST_DIR="$REPO_ROOT/dist"
OUTPUT_DIR="$DIST_DIR/CoPaw-Lite-$VERSION"

echo "[1/5] 清理旧构建..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "[2/5] 使用 uv 创建独立的 Python 环境..."
uv venv "$OUTPUT_DIR/python" --python 3.12

echo "[3/5] 安装 CoPaw 核心依赖（排除本地 AI 模型）..."
# 创建临时的 requirements.txt，排除大型依赖
cat > /tmp/copaw_lite_requirements.txt << 'EOF'
# CoPaw 核心依赖（手动列出，排除 transformers 等大型包）
agentscope==1.0.17
agentscope-runtime==1.1.1
httpx[socks]>=0.27.0
packaging>=24.0
discord-py>=2.3
dingtalk-stream>=0.24.3
uvicorn>=0.40.0
apscheduler>=3.11.2,<4
playwright>=1.49.0
questionary>=2.1.1
mss>=9.0.0
reme-ai==0.3.1.3
# transformers>=4.30.0  # 排除 - 会拉入 PyTorch
python-dotenv>=1.0.0
python-socks>=2.5.3
socksio>=1.0.0
onnxruntime<1.24
lark-oapi>=1.5.3
python-telegram-bot>=20.0
twilio>=9.10.2
pywebview>=4.0
aiofiles>=24.1.0
paho-mqtt>=2.0.0
wecom-aibot-python-sdk==1.0.1
matrix-nio>=0.24.0
shortuuid>=1.0.0
google-genai>=1.67.0
tzdata>=2024.1
pyyaml>=6.0
json-repair>=0.30.0
EOF

# 安装精简依赖
uv pip install -r /tmp/copaw_lite_requirements.txt --python "$OUTPUT_DIR/python/bin/python"

# 从源码安装 copaw（不安装依赖）
uv pip install -e "$REPO_ROOT" --python "$OUTPUT_DIR/python/bin/python" --no-deps

echo "[4/5] 复制前端资源..."
# 确保前端已构建
if [ ! -f "$REPO_ROOT/console/dist/index.html" ]; then
    echo "构建前端..."
    cd "$REPO_ROOT/console"
    bun install && bun run build
    cd "$REPO_ROOT"
fi

# 前端已通过 setuptools 包含
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
echo CoPaw 精简版（不含本地 AI 模型）
echo ====================================
echo 数据目录: %COPAW_DATA_DIR%
echo.
echo 支持的 AI 提供商：
echo   - OpenAI (GPT-4, GPT-3.5)
echo   - Anthropic (Claude)
echo   - Google Gemini
echo   - 阿里云百炼
echo   - 其他兼容 OpenAI API 的服务
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

# 设置数据目录
export COPAW_DATA_DIR="${COPAW_DATA_DIR:-$HOME/.copaw}"

# 添加打包的 Python 到 PATH
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$DIR/python/bin:$PATH"

echo "===================================="
echo "CoPaw 精简版（不含本地 AI 模型）"
echo "===================================="
echo "数据目录: $COPAW_DATA_DIR"
echo ""
echo "支持的 AI 提供商："
echo "  - OpenAI (GPT-4, GPT-3.5)"
echo "  - Anthropic (Claude)"
echo "  - Google Gemini"
echo "  - 阿里云百炼"
echo "  - 其他兼容 OpenAI API 的服务"
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
# CoPaw 精简版 v$VERSION

## 快速开始

### Windows:
双击 \`启动 CoPaw.bat\`

### Linux/macOS:
运行 \`./start-copaw.sh\`

浏览器会自动打开 http://localhost:8088

## 版本说明

这是**精简版**，不包含本地 AI 模型功能，体积更小。

### ✅ 包含功能

- ✓ Web 控制台界面
- ✓ 多渠道集成（飞书、钉钉、QQ、Discord、Telegram 等）
- ✓ 浏览器自动化
- ✓ 文件操作
- ✓ 定时任务
- ✓ 技能系统
- ✓ 记忆管理

### 🤖 支持的 AI 提供商（使用云端 API）

- OpenAI (GPT-4, GPT-3.5, GPT-4o)
- Anthropic (Claude 3.5 Sonnet, Opus, Haiku)
- Google Gemini
- 阿里云百炼
- 智谱 AI (ChatGLM)
- 月之暗面 (Kimi)
- DeepSeek
- 其他兼容 OpenAI API 的服务

### ❌ 不包含功能

- ✗ 本地 AI 模型（Llama、MLX 等）
- ✗ GPU 加速
- ✗ 本地语音识别（Whisper）

**如需本地 AI 模型，请下载完整版**

## 系统要求

- Windows 10+, macOS 12+, 或 Linux
- 约 500MB 磁盘空间
- 网络连接（使用云端 AI API）

## API Key 配置

首次运行后，在 Web 控制台中配置您的 AI API Key。

## 获取帮助

- 文档: https://github.com/agentscope-ai/CoPaw
- 问题: GitHub Issues

## 许可证

Apache License 2.0
EOF

echo "创建压缩包..."
cd "$DIST_DIR"
if command -v zip &> /dev/null; then
    zip -r "CoPaw-Lite-$VERSION.zip" "CoPaw-Lite-$VERSION"
    echo "✓ 压缩包创建完成: CoPaw-Lite-$VERSION.zip"
else
    echo "⚠ zip 命令不可用，跳过压缩"
fi

echo
echo "================================"
echo "构建完成！"
echo "================================"
echo "输出: $OUTPUT_DIR"
echo "压缩包: $DIST_DIR/CoPaw-Lite-$VERSION.zip"
echo
echo "版本对比:"
echo "  精简版: ~500MB（使用云端 API）"
echo "  完整版: ~5.4GB（包含本地 AI 模型）"
echo
echo "使用方法:"
echo "1. 解压到任意目录"
echo "2. 运行启动脚本（Windows: 启动 CoPaw.bat）"
echo "3. 在控制台配置您的 AI API Key"
echo "4. 浏览器访问 http://localhost:8088"
echo "================================"
