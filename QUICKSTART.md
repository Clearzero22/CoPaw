# CoPaw 快速启动指南

## 🚀 一键启动

```bash
# 方式 1: 使用启动脚本（推荐）
./start.sh

# 方式 2: 手动启动
uv sync --dev --all-extras
cd console && bun install && cd ..
nohup uv run copaw app > /tmp/copaw_backend.log 2>&1 &
```

## 🛑 停止服务

```bash
# 方式 1: 使用停止脚本（推荐）
./stop.sh

# 方式 2: 手动停止
pkill -f "copaw app"

# 方式 3: 释放端口
fuser -k 8088/tcp
```

## 📊 服务状态

```bash
# 查看进程
ps aux | grep copaw

# 查看端口
lsof -i :8088

# 查看日志
tail -f /tmp/copaw_backend.log
```

## 🌐 访问应用

- **应用地址**: http://localhost:8088/
- **API 文档**: http://localhost:8088/docs
- **健康检查**: http://localhost:8088/health

## 📝 常见问题

### 1. 端口被占用

```bash
# 查找占用进程
lsof -i :8088

# 终止进程
kill <PID>

# 或使用脚本自动处理
./start.sh  # 会提示是否终止旧进程
```

### 2. 依赖缺失

```bash
# 安装 Python 依赖
uv sync --dev --all-extras

# 安装前端依赖
cd console && bun install
```

### 3. 浏览器无法访问

```bash
# 检查后端是否启动
curl http://localhost:8088/

# 查看日志
tail -f /tmp/copaw_backend.log

# 重启服务
./stop.sh && ./start.sh
```

## 🔧 开发模式

### 启动前端开发服务器

```bash
cd console
bun run dev
# 访问: http://localhost:5173
```

### 运行测试

```bash
# 运行所有测试
uv run pytest

# 运行特定测试
uv run pytest tests/unit/

# 带覆盖率报告
uv run pytest --cov=src/copaw
```

### 代码格式化

```bash
# Python
black src/ tests/
isort src/ tests/

# 前端
cd console
bun run lint
bun run format
```

## 📦 项目结构

```
CoPaw/
├── src/copaw/          # 后端源代码
├── console/            # 前端源代码
├── tests/              # 测试代码
├── docs/               # 文档
├── scripts/            # 构建脚本
├── start.sh            # 启动脚本
├── stop.sh             # 停止脚本
├── pyproject.toml      # Python 配置
└── package.json        # 前端配置
```

## 🎯 快速命令

```bash
# 启动
./start.sh

# 停止
./stop.sh

# 重启
./stop.sh && ./start.sh

# 查看日志
tail -f /tmp/copaw_backend.log

# 打开浏览器
xdg-open http://localhost:8088/
```

---

**提示**: 首次运行会自动安装所有依赖，后续启动会跳过此步骤。
