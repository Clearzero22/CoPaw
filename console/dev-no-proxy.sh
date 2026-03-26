#!/bin/bash
# CoPaw 前端开发服务器启动脚本（禁用系统代理）

# 临时禁用系统代理
unset http_proxy
unset https_proxy
unset all_proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset ALL_PROXY

echo "🚀 启动 Vite 开发服务器（已禁用系统代理）"
echo "📍 访问地址: http://localhost:5173/"
echo "🔗 后端 API: http://127.0.0.1:8088/api"
echo ""

# 启动 Vite 开发服务器
npm run dev:proxy
