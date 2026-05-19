#!/bin/bash
# CoPaw 项目启动脚本

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 启动 CoPaw 项目..."
echo ""

# 检查依赖
echo "📦 检查依赖..."
if ! command -v uv &> /dev/null; then
    echo "❌ uv 未安装，请先安装: pip install uv"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "❌ bun 未安装，请先安装: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# 同步 Python 依赖
echo "📥 同步 Python 依赖..."
uv sync --dev --all-extras > /dev/null 2>&1 &
SYNC_PID=$!

# 安装前端依赖
echo "📥 同步前端依赖..."
cd console && bun install > /dev/null 2>&1 &
BUN_PID=$!

cd "$PROJECT_DIR"

# 等待依赖安装完成
wait $SYNC_PID
echo "✅ Python 依赖同步完成"
wait $BUN_PID
echo "✅ 前端依赖同步完成"

# 检查端口占用
if lsof -i :8088 > /dev/null 2>&1; then
    echo "⚠️  端口 8088 已被占用"
    read -p "是否终止旧进程并重启? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 终止旧进程..."
        fuser -k 8088/tcp 2>/dev/null || true
        sleep 2
    else
        echo "❌ 取消启动"
        exit 1
    fi
fi

# 启动后端
echo "🔧 启动后端服务..."
nohup uv run copaw app > /tmp/copaw_backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端启动..."
for i in {1..30}; do
    if curl -s http://localhost:8088/ > /dev/null 2>&1; then
        echo "✅ 后端启动成功 (PID: $BACKEND_PID)"
        break
    fi
    sleep 1
done

# 检查启动状态
if ! curl -s http://localhost:8088/ > /dev/null 2>&1; then
    echo "❌ 后端启动失败"
    echo "查看日志: tail -f /tmp/copaw_backend.log"
    exit 1
fi

# 显示服务信息
echo ""
echo "=========================================="
echo "✅ CoPaw 启动成功！"
echo "=========================================="
echo ""
echo "📱 应用地址:"
echo "   http://localhost:8088/"
echo ""
echo "📊 服务状态:"
ps aux | grep "copaw app" | grep -v grep | awk '{printf "   PID: %s, 内存: %.1f MB\n", $2, $6/1024}'
echo ""
echo "📝 日志文件:"
echo "   后端: tail -f /tmp/copaw_backend.log"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID"
echo "   或: fuser -k 8088/tcp"
echo ""
echo "=========================================="

# 尝试打开浏览器
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:8088/ 2>/dev/null &
elif command -v open >/dev/null 2>&1; then
    open http://localhost:8088/ 2>/dev/null &
fi
