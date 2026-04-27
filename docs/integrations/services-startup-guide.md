# CoPaw 第三方服务启动指南

本文档详细说明如何启动 CoPaw 集成的所有第三方服务。

## 目录

- [服务启动概览](#服务启动概览)
- [Amazon 爬虫服务](#amazon-爬虫服务)
- [Dify AI 工作流](#dify-ai-工作流)
- [N8n 自动化工具](#n8n-自动化工具)
- [完整启动流程](#完整启动流程)

---

## 服务启动概览

### 服务依赖关系

```
CoPaw 主系统 (必需启动)
    │
    ├─→ Amazon 爬虫 (可选)
    ├─→ Dify AI (可选)
    └─→ N8n 自动化 (可选)
```

---

## Amazon 爬虫服务

### Docker Compose 启动（推荐）

```bash
# 进入项目目录
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 测试服务
curl http://localhost:8000/health
```

### 手动启动

```bash
# 启动 API
.venv/bin/python -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# 测试连接
curl http://localhost:8000/health
```

---

## Dify AI 工作流

### Docker 启动

```bash
# 克隆项目
git clone https://github.com/langgenius/dify.git
cd dify/docker

# 复制配置
cp .env.example .env

# 启动服务
docker-compose up -d

# 访问控制台
http://localhost/
```

### 配置 API 密钥

```bash
# 1. 访问 Dify 控制台
# 2. 进入 Settings → API
# 3. 创建 API Key
# 4. 在 CoPaw 中配置密钥
```

---

## N8n 自动化工具

### 全局安装

```bash
# 安装
npm install -g n8n

# 启动
n8n start

# 访问
http://localhost:5678
```

### Docker 启动

```bash
# 启动容器
docker run -d -p 5678:5678 n8nio/n8n

# 访问
http://localhost:5678
```

---

## 完整启动流程

### 一键启动脚本

```bash
#!/bin/bash
echo "=== 启动 CoPaw 服务 ==="

# 1. 启动爬虫
cd /home/clearzero22/github_projects/01_ai_project/00_project_ai/amazon_crawler
docker-compose up -d

# 2. 启动 CoPaw
cd /home/clearzero22/github_projects/01_ai_project/CoPaw
.venv/bin/copaw app > /tmp/copaw.log 2>&1 &

# 3. 启动前端
cd console
bun run dev > /tmp/console.log 2>&1 &

echo "所有服务启动完成"
```

### 服务地址

| 服务 | 地址 |
|------|------|
| CoPaw 后端 | http://localhost:8088 |
| CoPaw 前端 | http://localhost:5173 |
| 爬虫 API | http://localhost:8000 |
| Dify | http://localhost |
| N8n | http://localhost:5678 |

---

## 快速参考

### 启动命令

```bash
# 爬虫服务
cd amazon_crawler && docker-compose up -d

# Dify 服务
cd dify/docker && docker-compose up -d

# N8n 服务
n8n start

# CoPaw 主系统
cd CoPaw && .venv/bin/copaw app
```

### 停止命令

```bash
# 爬虫服务
cd amazon_crawler && docker-compose down

# Dify 服务
cd dify/docker && docker-compose down

# N8n 服务
pm2 stop n8n

# CoPaw 主系统
pkill -f "copaw app"
```

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-27
