#!/usr/bin/env python3
"""
使用 PyInstaller 创建独立的 CoPaw 可执行文件
无需用户预装 Python

构建产物：
- CoPaw.exe: Windows 独立可执行文件（包含 Python 解释器和所有依赖）
- 大小约 150-200MB
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def install_pyinstaller():
    """安装 PyInstaller"""
    print("[1/6] 检查 PyInstaller...")
    try:
        import PyInstaller
        print(f"✓ PyInstaller 已安装: {PyInstaller.__version__}")
        return True
    except ImportError:
        print("安装 PyInstaller...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "pyinstaller"],
            check=True
        )
        print("✓ PyInstaller 安装完成")
        return True

def create_spec_file(repo_root, version):
    """创建 PyInstaller spec 文件"""
    print("[2/6] 创建 PyInstaller 配置...")

    spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

import sys
from pathlib import Path

# CoPaw 版本
copaw_version = "{version}"

# 获取控制台前端路径
console_dir = Path(r"{repo_root}/src/copaw/console")
if not console_dir.exists():
    console_dir = Path(r"{repo_root}/console/dist")

# 数据文件
datas = [
    (str(console_dir), "copaw/console"),  # 前端资源
    (str(Path(r"{repo_root}/src/copaw/agents/md_files")), "copaw/agents/md_files"),
    (str(Path(r"{repo_root}/src/copaw/agents/skills")), "copaw/agents/skills"),
    (str(Path(r"{repo_root}/src/copaw/tokenizer")), "copaw/tokenizer"),
    (str(Path(r"{repo_root}/src/copaw/security")), "copaw/security"),
]

# 隐藏导入（CoPaw 使用的动态导入模块）
hiddenimports = [
    "copaw.cli.main",
    "copaw.app._app",
    "copaw.agents.react_agent",
    "copaw.agents.memory",
    "copaw.app.channels.*",
    "agentscope",
    "agentscope.*",
    "reme",
    "reme.*",
    "playwright",
    "playwright.sync_api",
    "lark_oapi",
    "dingtalk.stream",
    "discord.py",
    "telegram.ext",
    "aiofiles",
    "apscheduler",
    "uvicorn",
    "fastapi",
    "pydantic",
    "transformers",
    "certifi",
    "websockets",
]

# 二进制文件
binaries = []

# PyInstaller 配置
a = Analysis(
    [str(Path(r"{repo_root}/src/copaw/__main__.py"))],
    pathex=[str(Path(r"{repo_root}/src"))],
    datas=datas,
    binaries=binaries,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={{},
    runtime_hooks=[],
    excludes=[
        # 排除不需要的包以减小大小
        "tkinter",
        "matplotlib",
        "pandas",
        "numpy.tests",
        "scipy",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="CoPaw",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # 使用 UPX 压缩（如果可用）
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 显示控制台窗口，方便调试
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(Path(r"{repo_root}/scripts/pack/assets/icon.ico")) if Path(r"{repo_root}/scripts/pack/assets/icon.ico").exists() else None,
    version_file=None,
)
'''

    spec_file = repo_root / "scripts" / "pack" / "copaw.spec"
    spec_file.write_text(spec_content, encoding="utf-8")
    print(f"✓ Spec 文件创建完成: {spec_file}")
    return spec_file

def build_executable(repo_root, spec_file):
    """使用 PyInstaller 构建可执行文件"""
    print("[3/6] 构建可执行文件（这可能需要 5-10 分钟）...")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--clean",
        str(spec_file),
        "--distpath", str(repo_root / "dist"),
        "--workpath", str(repo_root / "build"),
    ]

    print(f"运行: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=repo_root)

    if result.returncode != 0:
        print("✗ 构建失败")
        return False

    print("✓ 可执行文件构建完成")
    return True

def create_installer(repo_root, version):
    """创建简单的安装包（可选）"""
    print("[4/6] 创建安装包...")

    dist_dir = repo_root / "dist"
    exe_file = dist_dir / "CoPaw.exe"

    if not exe_file.exists():
        print(f"✗ 可执行文件不存在: {exe_file}")
        return False

    # 创建简单的 ZIP 包
    import zipfile
    zip_file = dist_dir / f"CoPaw-Standalone-{version}.zip"

    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 添加可执行文件
        zf.write(exe_file, "CoPaw.exe")

        # 创建启动脚本
        launcher = """@echo off
REM CoPaw 独立版启动器
echo ====================================
echo CoPaw v{VERSION}
echo ====================================
echo.
echo 正在启动 CoPaw...
echo 浏览器将自动打开 http://localhost:8088
echo.
echo 按 Ctrl+C 停止 CoPaw
echo ====================================
echo.

REM 设置数据目录
if not defined COPAW_DATA_DIR set "COPAW_DATA_DIR=%USERPROFILE%\\.copaw"

REM 启动 CoPaw
"%~dp0CoPaw.exe" app

pause
""".replace("{VERSION}", version)

        zf.writestr("启动 CoPaw.bat", launcher)

        # 创建 README
        readme = f"""# CoPaw 独立版 v{version}

## 快速开始

1. 双击 `启动 CoPaw.bat` 或直接运行 `CoPaw.exe`
2. 浏览器会自动打开 http://localhost:8088
3. 开始使用 CoPaw！

## 特点

- ✓ 无需安装 Python
- ✓ 包含所有依赖
- ✓ 开箱即用
- ✓ 前端界面已内置

## 数据存储

所有数据保存在: `%USERPROFILE%\\.copaw`

## 系统要求

- Windows 10 或更高版本
- 约 200MB 磁盘空间

## 获取帮助

- 文档: https://github.com/agentscope-ai/CoPaw
- 问题: GitHub Issues

## 许可证

Apache License 2.0
"""
        zf.writestr("README.txt", readme)

    file_size_mb = zip_file.stat().st_size / (1024 * 1024)
    print(f"✓ 安装包创建完成: {zip_file}")
    print(f"  大小: {file_size_mb:.1f} MB")
    return True

def main():
    """主构建流程"""
    repo_root = Path(__file__).parent.parent.parent

    # 获取版本
    version_file = repo_root / "src" / "copaw" / "__version__.py"
    version = "0.0.0"
    if version_file.exists():
        content = version_file.read_text()
        import re
        match = re.search(r'__version__\s*=\s*"([^"]+)"', content)
        if match:
            version = match.group(1)

    print("="*50)
    print("CoPaw 独立可执行文件构建")
    print("="*50)
    print(f"版本: {version}")
    print(f"仓库: {repo_root}")
    print()

    try:
        # 构建步骤
        install_pyinstaller()
        spec_file = create_spec_file(repo_root, version)

        if not build_executable(repo_root, spec_file):
            sys.exit(1)

        create_installer(repo_root, version)

        print()
        print("="*50)
        print("构建完成！")
        print("="*50)
        print(f"输出: {repo_root / 'dist' / 'CoPaw.exe'}")
        print(f"压缩包: {repo_root / 'dist' / f'CoPaw-Standalone-{version}.zip'}")
        print()
        print("使用方法:")
        print("1. 解压 ZIP 文件")
        print("2. 双击 '启动 CoPaw.bat' 或 'CoPaw.exe'")
        print("3. 浏览器访问 http://localhost:8088")
        print("="*50)

    except subprocess.CalledProcessError as e:
        print(f"\n✗ 构建失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
