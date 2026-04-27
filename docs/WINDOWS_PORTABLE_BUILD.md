# CoPaw Windows 便携版使用指南

## 下载与安装

### 当前版本
- **文件名**: `CoPaw-Windows-Portable-0.2.0.zip`
- **大小**: 约 25 MB
- **位置**: `dist/CoPaw-Windows-Portable-0.2.0.zip`

### 安装步骤
1. 下载 ZIP 文件到任意目录
2. 解压缩到任意位置（建议：`C:\CoPaw` 或 `D:\CoPaw`）
3. 进入解压后的目录

## 快速开始

### 方法一：双击启动
1. 双击 `CoPaw.bat` 文件
2. 等待首次依赖安装（约 2-5 分钟）
3. 浏览器自动打开 http://localhost:8088

### 方法二：开发者模式（带调试日志）
1. 双击 `CoPaw-Dev.bat` 文件
2. 查看详细的运行日志
3. 适合问题排查和开发调试

## 系统要求

### 必需
- **操作系统**: Windows 10 或更高版本
- **Python**: 3.10 或更高版本（未安装可从 python.org 下载）
- **网络**: 需要连接互联网（用于 AI 模型和集成功能）

### 可选
- **Node.js**: 如需重新构建前端
- **Git**: 如需从源码更新

## 目录结构

```
CoPaw-Windows-Portable-0.2.0/
├── CoPaw.bat           # 主启动脚本
├── CoPaw-Dev.bat       # 开发者启动脚本
├── README.txt          # 使用说明
├── setup.py            # Python 安装配置
├── pyproject.toml      # Python 项目配置
├── copaw/              # CoPaw 源代码
│   ├── app/            # 应用程序核心
│   ├── agents/         # AI 代理
│   ├── console/        # Web 前端（已构建）
│   └── ...
├── data/               # 用户数据目录
│   ├── config.json     # 配置文件
│   └── workspaces/     # 代理工作空间
└── logs/               # 应用日志目录
```

## 首次运行

首次运行时，CoPaw 会自动：
1. 创建 `data/` 和 `logs/` 目录
2. 安装 Python 依赖包（可能需要几分钟）
3. 初始化配置文件
4. 启动 Web 界面

### 依赖安装过程
```
Installing dependencies...
# 下载并安装以下主要依赖：
# - FastAPI, Uvicorn (Web 服务器)
# - Agentscope (AI 框架)
# - Playwright (浏览器自动化)
# - 其他必要的库

Dependencies installed successfully!
```

## 使用 Web 界面

启动后，浏览器会自动打开 http://localhost:8088

### 主要功能
- **聊天界面**: 与 AI 助手对话
- **代理管理**: 配置和管理多个 AI 代理
- **渠道集成**: 连接 Feishu、DingTalk、Discord 等
- **技能系统**: 扩展 AI 能力
- **工作空间**: 管理不同项目的数据和配置

## 数据管理

### 数据位置
所有用户数据存储在 `data/` 目录中：

```
data/
├── config.json         # 全局配置
└── workspaces/         # 代理工作空间
    ├── default/        # 默认代理
    │   ├── agent.json  # 代理配置
    │   ├── MEMORY.md   # 长期记忆
    │   └── chats.json  # 聊天历史
    └── ...
```

### 备份数据
定期备份 `data/` 目录即可保存所有数据：
```bash
# 创建备份
xcopy data C:\CoPawBackup\data /E /I /H /Y
```

### 迁移到新版本
1. 下载新版本的便携版
2. 解压到新目录
3. 复制旧版本的 `data/` 目录到新版本
4. 启动新版本

## 配置

### 端口配置
默认端口：8088

修改端口：
```cmd
set COPAW_PORT=9090
CoPaw.bat
```

### 日志级别
默认：INFO

开发者模式：DEBUG

### 环境变量
- `COPAW_HOME`: CoPaw 安装目录
- `COPAW_DATA_DIR`: 数据目录（默认：`./data`）
- `COPAW_LOG_DIR`: 日志目录（默认：`./logs`）
- `COPAW_PORT`: Web 服务端口（默认：8088）
- `COPAW_LOG_LEVEL`: 日志级别（默认：INFO）

## 故障排查

### 问题 1：Python 未找到
**症状**: 双击启动后显示 "Python not found in PATH"

**解决方法**:
1. 从 https://www.python.org/ 下载 Python 3.10+
2. 安装时勾选 "Add Python to PATH"
3. 重启命令提示符
4. 重新运行 CoPaw

### 问题 2：端口被占用
**症状**: 启动失败，提示端口 8088 已被使用

**解决方法**:
```cmd
# 方法 1：使用其他端口
set COPAW_PORT=9090
CoPaw.bat

# 方法 2：停止占用端口的程序
netstat -ano | findstr :8088
taskkill /PID <进程ID> /F
```

### 问题 3：依赖安装失败
**症状**: 首次运行时报错 "Failed to install dependencies"

**解决方法**:
1. 检查网络连接
2. 使用开发者模式查看详细错误：
   ```cmd
   CoPaw-Dev.bat
   ```
3. 手动安装依赖：
   ```cmd
   python -m pip install --upgrade pip
   python -m pip install -e copaw
   ```

### 问题 4：Web 界面无法访问
**症状**: 启动成功但浏览器打不开

**解决方法**:
1. 手动打开浏览器访问：http://localhost:8088
2. 检查防火墙设置
3. 查看日志文件：`logs/copaw_startup.log`

## 高级用法

### 命令行模式
```cmd
# 初始化配置
python -m copaw init --defaults

# 启动应用
python -m copaw app

# 查看版本
python -m copaw --version
```

### 集成到系统服务
使用 NSSM (Non-Sucking Service Manager)：
```cmd
# 下载 NSSM: https://nssm.cc/download
nssm install CoPaw "C:\CoPaw\CoPaw.bat"
nssm start CoPaw
```

### 多实例运行
```cmd
# 实例 1：端口 8088
set COPAW_PORT=8088
set COPAW_DATA_DIR=C:\CoPaw1\data
start CoPaw.bat

# 实例 2：端口 8089
set COPAW_PORT=8089
set COPAW_DATA_DIR=C:\CoPaw2\data
start CoPaw.bat
```

## 更新与卸载

### 更新
1. 下载最新版本
2. 备份 `data/` 目录
3. 解压新版本
4. 恢复 `data/` 目录

### 卸载
1. 停止 CoPaw（Ctrl+C）
2. 删除整个 CoPaw 目录
3. 删除用户数据目录（如需要）：
   ```
   %USERPROFILE%\.copaw\
   ```

## 获取帮助

- **文档**: https://github.com/agentscope-ai/CoPaw
- **问题反馈**: GitHub Issues
- **日志文件**: `logs/copaw_startup.log`

## 许可证

CoPaw 采用 Apache License 2.0 许可证
