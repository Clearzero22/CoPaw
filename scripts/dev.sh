#!/bin/bash
# CoPaw 开发环境一键启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONSOLE_DIR="$PROJECT_ROOT/console"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CoPaw 前端热加载开发环境启动${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查依赖
echo -e "${YELLOW}🔍 检查依赖...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

# 检查后端是否运行
if ! lsof -Pi :8088 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ 后端未运行 (端口 8088)${NC}"
    echo -e "${YELLOW}请先启动后端: cd $PROJECT_ROOT && uv run copaw app${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查完成${NC}"
echo ""

# 进入 console 目录
cd "$CONSOLE_DIR"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装 npm 依赖...${NC}"
    npm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
    echo ""
fi

# 检查开发配置文件
if [ ! -f "vite.config.dev.ts" ]; then
    echo -e "${RED}❌ 缺少 vite.config.dev.ts${NC}"
    exit 1
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🚀 启动 Vite 开发服务器${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 访问地址: http://localhost:5173/${NC}"
echo -e "${BLUE}🔗 后端 API: http://127.0.0.1:8088/api${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "  - 修改前端代码会自动热更新"
echo -e "  - 按 Ctrl+C 停止开发服务器"
echo -e "  - 后端需要在另一个终端运行"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 启动开发服务器
npm run dev:proxy
