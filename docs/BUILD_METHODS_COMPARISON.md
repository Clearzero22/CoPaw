# CoPaw Windows 构建方案对比

针对"用户没有 Python 环境"的问题，我们有以下几种解决方案：

## 方案对比

| 方案 | 输出产物 | 大小 | 是否需要 Python | 安装体验 | 构建复杂度 |
|------|----------|------|-----------------|----------|------------|
| **1. UV 独立环境** | 文件夹 + 启动脚本 | ~300-500MB | ❌ 不需要 | ⭐⭐⭐⭐ 解压即用 | ⭐⭐ 简单 |
| **2. PyInstaller 单文件** | CoPaw.exe | ~150-200MB | ❌ 不需要 | ⭐⭐⭐⭐⭐ 双击运行 | ⭐⭐⭐ 中等 |
| **3. Conda-pack + NSIS** | CoPaw-Setup.exe | ~200-300MB | ❌ 不需要 | ⭐⭐⭐⭐⭐ 安装程序 | ⭐⭐⭐⭐ 复杂 |
| **4. 在线安装脚本** | install.bat | ~10KB | ❌ 自动安装 | ⭐⭐⭐ 需要网络 | ⭐ 简单 |

---

## 方案 1: UV 独立环境（推荐 ✅）

### 特点
- 使用 uv 创建独立的 Python 环境
- 所有依赖打包在文件夹中
- 用户解压后直接运行启动脚本

### 构建命令
```bash
bash scripts/pack/build_with_uv.sh
```

### 输出结构
```
CoPaw-Standalone-0.2.0/
├── python/              # 独立 Python 环境（300-400MB）
│   ├── bin/
│   ├── lib/
│   └── ...
├── 启动 CoPaw.bat       # Windows 启动脚本
├── start-copaw.sh       # Linux/macOS 启动脚本
└── README.txt
```

### 优点
✅ 构建快速（uv 比快 10-100 倍）
✅ 跨平台（同一脚本支持 Windows/Linux/macOS）
✅ 可靠性高（完整 Python 环境）
✅ 易于调试（可直接访问 Python 环境）
✅ 更新方便（替换文件夹即可）

### 缺点
❌ 文件夹较大（300-500MB）
❌ 不是单个 exe（需要启动脚本）
❌ 解压时间较长（大量小文件）

---

## 方案 2: PyInstaller 单文件

### 特点
- 使用 PyInstaller 将所有依赖打包成单个 exe
- 启动时自动解压到临时目录
- 真正的"双击即用"

### 构建命令
```bash
python scripts/pack/build_standalone_exe.py
```

### 输出结构
```
dist/
├── CoPaw.exe                    # 单文件可执行（150-200MB）
└── CoPaw-Standalone-0.2.0.zip   # 包含启动脚本和文档
```

### 优点
✅ 单个 exe 文件
✅ 双击即可运行
✅ 体积相对较小
✅ 专业的软件体验

### 缺点
❌ 首次启动慢（需要解压临时文件）
❌ 可能的兼容性问题（某些依赖可能无法打包）
❌ 调试困难（打包后难以排查问题）
❌ 杀毒软件可能误报
❌ 构建时间长（5-10 分钟）
❌ 更新需要下载整个文件

---

## 方案 3: Conda-pack + NSIS（官方方案）

### 特点
- 使用 conda-pack 打包完整 conda 环境
- 使用 NSIS 创建安装程序
- 正式的软件安装体验

### 构建命令
```powershell
# Windows 上运行
conda run -n copaw-build pwsh -File ./scripts/pack/build_win.ps1
```

### 输出结构
```
dist/
└── CoPaw-Setup-0.2.0.exe    # NSIS 安装程序
```

### 安装后
```
C:\Program Files\CoPaw\
├── python.exe
├── Scripts/
├── CoPaw Desktop.bat
└── copaw/
```

### 优点
✅ 最专业的安装体验
✅ 支持安装/卸载
✅ 创建桌面快捷方式
✅ 注册表集成
✅ 官方方案，经过测试

### 缺点
❌ 需要conda、NSIS 等工具
❌ 仅支持 Windows
❌ 构建最复杂
❌ 需要 Windows 机器构建

---

## 方案 4: 在线安装脚本

### 特点
- 脚本自动下载 Python 和依赖
- 类似于 Python 官方安装程序

### 使用方式
```cmd
curl -fsSL https://copaw.agentscope.io/install.bat -o install.bat
install.bat
```

### 优点
✅ 文件极小（~10KB）
✅ 始终安装最新版本
✅ 无需分发大文件

### 缺点
❌ 需要网络连接
❌ 首次安装时间长（下载依赖）
❌ 企业网络可能被阻止

---

## 推荐方案

### 🏆 最佳选择：方案 1（UV 独立环境）

**理由：**
1. **构建简单**：一个 bash 脚本即可
2. **跨平台**：支持 Windows/Linux/macOS
3. **可靠性高**：完整 Python 环境，无兼容性问题
4. **易于分发**：ZIP 文件，可放在任何地方下载
5. **用户体验好**：解压即用，无需安装

**适用场景：**
- 快速分发版本
- 内网环境（无法在线安装）
- 需要跨平台支持
- 开发和测试版本

### 🥈 备选方案：方案 2（PyInstaller）

**适用场景：**
- 需要单个 exe 文件
- 追求专业软件体验
- 目标用户不熟悉技术

---

## 快速开始

### 使用 UV 方案构建（推荐）

```bash
# 1. 构建独立版本
bash scripts/pack/build_with_uv.sh

# 2. 输出文件
# dist/CoPaw-Standalone-0.2.0.zip

# 3. 用户使用
# - 解压 ZIP
# - 双击"启动 CoPaw.bat"
# - 浏览器访问 http://localhost:8088
```

### 使用 PyInstaller 方案构建

```bash
# 1. 构建单文件 exe
python scripts/pack/build_standalone_exe.py

# 2. 输出文件
# dist/CoPaw.exe (或 CoPaw-Standalone-0.2.0.zip)

# 3. 用户使用
# - 解压 ZIP
# - 双击 CoPaw.exe
# - 浏览器访问 http://localhost:8088
```

---

## 总结

对于"用户没有 Python 环境"的问题：

1. **如果追求简单可靠**：使用 UV 独立环境方案
2. **如果追求专业体验**：使用 PyInstaller 单文件方案
3. **如果需要官方支持**：使用 Conda-pack + NSIS（在 Windows 上构建）

所有方案都无需用户预装 Python，真正做到"开箱即用"。
