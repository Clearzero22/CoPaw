# 🚀 CoPaw 完整服务启动指南

## 🎉 恭喜！所有服务已成功启动

### 📊 服务运行状态总览

```
┌─────────────────────────────────────────────────────────────┐
│                  CoPaw 项目服务架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 前端层 (5173)                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Vite 开发服务器 (热更新)                             │  │
│  │  - React 18 + TypeScript                            │  │
│  │  - Ant Design 5 UI 组件                              │  │
│  │  - 端口: 5173                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ API 代理                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  后端 API 层 (8088)                                   │  │
│  │  - FastAPI 后端                                      │  │
│  │  - Python 3.10                                       │  │
│  │  - 静态文件服务                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  业务逻辑层                                            │  │
│  │  - Agent 管理器                                       │  │
│  │  - 渠道系统 (飞书、钉钉、QQ等)                        │  │
│  │  - 技能系统                                          │  │
│  └───────────┬───────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  爬虫代理层 (8888)                                   │  │
│  │  - HTTP 请求转发                                      │  │
│  │  - 参数验证                                          │  │
│  │  - 错误处理                                          │  │
│  └───────────┬───────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  爬虫 API 服务 (8888)                                │  │
│  │  - FastAPI + Playwright                              │  │
│  │  - Python 3.12                                       │  │
│  │  - Amazon 产品数据爬取                               │  │
│  └───────────┬───────────────────────────────────────────┘  │
│              ↓                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 数据库 (5433)                            │  │
│  │  - 产品数据存储                                       │  │
│  │  - 爬虫任务记录                                      │  │
│  │  - 通知消息                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 服务访问地址

### 开发环境访问

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端开发服务器** | http://localhost:5173/ | 🔥 热更新、快速开发 |
| **后端集成页面** | http://localhost:8088/ | 生产构建、完整功能 |
| **爬虫 API 文档** | http://localhost:8888/docs | Swagger UI |
| **CoPaw API** | http://localhost:8088/api/ | REST API |

### 网络访问

```
本地访问:
  - http://localhost:5173/  (前端)
  - http://localhost:8088/   (后端)

局域网访问:
  - http://192.168.1.225:5173/  (前端)
  - http://192.168.1.225:8088/   (后端)
```

---

## 📋 服务管理命令

### 🚀 启动所有服务

```bash
#!/bin/bash
# 一键启动脚本

echo "=== 启动 CoPaw 所有服务 ==="

# 1. 启动 PostgreSQL 数据库
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler
docker-compose up -d

# 2. 启动爬虫 API 服务
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler
nohup .venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 > /tmp/crawler_api.log 2>&1 &
echo "爬虫 API 启动中..."

# 3. 启动 CoPaw 主服务
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
nohup uv run copaw app > /tmp/copaw_backend.log 2>&1 &
echo "CoPaw 主服务启动中..."

# 4. 启动前端开发服务器
cd console
nohup bun run dev > /tmp/console_frontend.log 2>&1 &
echo "前端开发服务器启动中..."

# 5. 等待服务就绪
sleep 10

# 6. 验证服务状态
echo ""
echo "=== 服务状态验证 ==="
curl -s http://localhost:8088/ > /dev/null && echo "✅ CoPaw 后端正常" || echo "❌ CoPaw 后端异常"
curl -s http://localhost:5173/ > /dev/null && echo "✅ 前端开发服务器正常" || echo "❌ 前端开发服务器异常"
curl -s http://localhost:8888/health > /dev/null && echo "✅ 爬虫 API 正常" || echo "❌ 爬虫 API 异常"
docker ps | grep amazon_crawler_db > /dev/null && echo "✅ PostgreSQL 正常" || echo "❌ PostgreSQL 异常"

echo ""
echo "=== 访问地址 ==="
echo "前端开发服务器: http://localhost:5173/"
echo "后端集成页面:   http://localhost:8088/"
echo "爬虫 API 文档:  http://localhost:8888/docs"
```

### 🛑 停止所有服务

```bash
#!/bin/bash
# 一键停止脚本

echo "=== 停止 CoPaw 所有服务 ==="

# 1. 停止前端开发服务器
pkill -f "vite.*5173"
echo "✅ 前端开发服务器已停止"

# 2. 停止 CoPaw 主服务
pkill -f "copaw app"
echo "✅ CoPaw 主服务已停止"

# 3. 停止爬虫 API
pkill -f "uvicorn.*8888"
echo "✅ 爬虫 API 已停止"

# 4. 停止 PostgreSQL
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler
docker-compose down
echo "✅ PostgreSQL 已停止"

echo ""
echo "=== 所有服务已停止 ==="
```

### 🔄 重启服务

```bash
# 快速重启
pkill -f "copaw app" && sleep 2 && nohup uv run copaw app > /tmp/copaw_backend.log 2>&1 &

# 重启前端
pkill -f "vite.*5173" && sleep 2 && cd console && nohup bun run dev > /tmp/console_frontend.log 2>&1 &

# 重启爬虫
pkill -f "uvicorn.*8888" && sleep 2 && cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler && nohup .venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 > /tmp/crawler_api.log 2>&1 &
```

---

## 🔍 服务状态检查

### 查看进程状态

```bash
# 查看所有相关进程
ps aux | grep -E "copaw|vite|uvicorn" | grep -v grep

# 查看端口占用
lsof -i :8088  # CoPaw 后端
lsof -i :5173  # 前端开发服务器
lsof -i :8888  # 爬虫 API
lsof -i :5433  # PostgreSQL
```

### 查看日志

```bash
# CoPaw 后端日志
tail -f /tmp/copaw_backend_new.log

# 前端开发服务器日志
tail -f /tmp/console_frontend.log

# 爬虫 API 日志
tail -f /tmp/crawler_api.log

# PostgreSQL 日志
docker logs -f amazon_crawler_db
```

### 健康检查

```bash
# CoPaw 后端
curl http://localhost:8088/

# 前端开发服务器
curl http://localhost:5173/

# 爬虫 API
curl http://localhost:8888/health

# PostgreSQL
docker exec -it amazon_crawler_db pg_isready -U amazon
```

---

## 🧪 功能测试

### 1. 前端热更新测试

```bash
# 修改前端文件
vim console/src/App.tsx

# 观察浏览器自动刷新
# Vite 会自动检测文件变化并热更新
```

### 2. API 代理测试

```bash
# 通过前端开发服务器访问后端 API
curl http://localhost:5173/api/agents

# 应该返回 Agent 列表
```

### 3. 爬虫集成测试

```bash
# 通过 CoPaw 代理访问爬虫
curl http://localhost:8088/api/crawler/products/stats/overview

# 直接访问爬虫 API
curl http://localhost:8888/api/products/stats/overview
```

### 4. 数据库连接测试

```bash
# 连接到 PostgreSQL
docker exec -it amazon_crawler_db psql -U amazon -d amazon_crawler

# 查询产品数量
SELECT COUNT(*) FROM products;
```

---

## 🛠️ 开发工作流

### 前端开发

```bash
# 1. 启动前端开发服务器
cd console
bun run dev

# 2. 在浏览器中打开
open http://localhost:5173/

# 3. 开始开发
# - 修改源代码会自动热更新
# - CSS 修改会自动注入
# - 组件修改会自动刷新
```

### 后端开发

```bash
# 1. 启动 CoPaw 后端
uv run copaw app

# 2. 测试 API
curl http://localhost:8088/api/agents

# 3. 查看日志
tail -f /tmp/copaw_backend_new.log
```

### 爬虫开发

```bash
# 1. 启动爬虫 API
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler
.venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8888 --reload

# 2. 访问 API 文档
open http://localhost:8888/docs

# 3. 测试爬虫功能
curl -X POST http://localhost:8888/api/scraping/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "laptop", "max_pages": 1}'
```

---

## 🐛 常见问题解决

### 问题 1: 前端无法启动

```bash
# 检查端口占用
lsof -i :5173

# 杀死占用进程
kill -9 $(lsof -ti :5173)

# 重新启动
cd console
bun run dev
```

### 问题 2: API 代理失败

```bash
# 检查后端是否运行
curl http://localhost:8088/api/agents

# 检查 Vite 代理配置
cat console/vite.config.ts | grep -A 5 "proxy:"

# 应该显示:
# proxy: {
#   "/api": {
#     "target": "http://localhost:8088"
#   }
# }
```

### 问题 3: 爬虫连接失败

```bash
# 检查爬虫服务
curl http://localhost:8888/health

# 检查配置
cat src/copaw/app/routers/crawler.py | grep CRAWLER_BASE

# 应该显示: http://localhost:8888
```

### 问题 4: 数据库连接失败

```bash
# 检查容器状态
docker ps | grep amazon_crawler_db

# 重启容器
docker-compose restart postgres

# 查看日志
docker logs amazon_crawler_db
```

---

## 📊 性能监控

### 内存使用

```bash
# 查看所有服务内存占用
ps aux | grep -E "copaw|vite|uvicorn" | awk '{print $2, $6/1024 "MB", $11}'

# 预期输出:
# PID  内存(MB) 命令
# 273942 480.0 copaw app
# 377392 200.0 vite --port 5173
# 270559 94.0 uvicorn api.main:app
```

### CPU 使用

```bash
# 实时监控 CPU 使用
top -p $(pgrep -d',' -o "copaw|vite|uvicorn")

# 或使用 htop
htop -p $(pgrep -d',' -o "copaw|vite|uvicorn")
```

---

## 🎉 总结

### ✅ 已启动服务

1. ✅ **CoPaw 前端开发服务器** (5173) - Vite + React
2. ✅ **CoPaw 后端主服务** (8088) - FastAPI + Python
3. ✅ **爬虫 API 服务** (8888) - FastAPI + Playwright
4. ✅ **PostgreSQL 数据库** (5433) - Docker 容器

### 🔗 服务集成

- ✅ 前端 ↔ 后端: Vite 代理正常工作
- ✅ 后端 ↔ 爬虫: HTTP 代理配置正确
- ✅ 爬虫 ↔ 数据库: 连接正常，数据可访问

### 🎯 下一步

您现在可以：
1. **开发前端**: 修改代码后自动热更新
2. **开发后端**: 修改代码后需重启
3. **测试集成**: 通过代理访问所有服务
4. **查看文档**: http://localhost:8888/docs

---

**服务启动时间**: 2026-04-29 00:35  
**服务状态**: ✅ 全部运行正常  
**开发环境**: ✅ 已就绪

祝您使用愉快！🚀
