#!/bin/bash
# CoPaw 项目停止脚本

echo "🛑 停止 CoPaw 项目..."
echo ""

# 查找并终止 copaw 进程
PIDS=$(pgrep -f "copaw app" || true)

if [ -z "$PIDS" ]; then
    echo "ℹ️  没有运行中的 copaw 进程"
    exit 0
fi

echo "📋 找到以下进程:"
ps aux | grep -E "copaw app|uvicorn" | grep -v grep
echo ""

# 尝试优雅终止
echo "🔄 尝试优雅终止..."
echo "$PIDS" | xargs kill 2>/dev/null || true

# 等待进程退出
sleep 3

# 检查是否还有残留进程
REMAINING=$(pgrep -f "copaw app" || true)
if [ -n "$REMAINING" ]; then
    echo "⚠️  进程未响应，强制终止..."
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 验证
FINAL_CHECK=$(pgrep -f "copaw app" || true)
if [ -z "$FINAL_CHECK" ]; then
    echo "✅ 所有进程已停止"
else
    echo "❌ 部分进程仍在运行:"
    ps aux | grep -E "copaw app|uvicorn" | grep -v grep
    exit 1
fi

# 检查端口
if lsof -i :8088 > /dev/null 2>&1; then
    echo "⚠️  端口 8088 仍被占用"
    echo "🔍 占用进程:"
    lsof -i :8088 | grep LISTEN
    read -p "是否强制释放端口? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        fuser -k 8088/tcp 2>/dev/null || true
        echo "✅ 端口已释放"
    fi
else
    echo "✅ 端口 8088 已释放"
fi

echo ""
echo "=========================================="
echo "✅ CoPaw 已完全停止"
echo "=========================================="
