#!/usr/bin/env python3
"""
Simple portable Windows build script
Creates a self-contained CoPaw package with embedded frontend
Can be run on Linux/macOS to build for Windows
"""

import os
import sys
import shutil
import subprocess
import zipfile
from pathlib import Path

def get_version(repo_root):
    """Get version from __version__.py"""
    version_file = repo_root / "src" / "copaw" / "__version__.py"
    if version_file.exists():
        content = version_file.read_text()
        import re
        match = re.search(r'__version__\s*=\s*"([^"]+)"', content)
        if match:
            return match.group(1)
    return "0.0.0"

def ensure_frontend(repo_root):
    """Build and copy frontend if needed"""
    console_dist = repo_root / "console" / "dist"
    console_dest = repo_root / "src" / "copaw" / "console"

    print("[Step 1/5] Checking console frontend...")

    # Build frontend if not built
    if not (console_dist / "index.html").exists():
        print("Building frontend with bun...")
        subprocess.run(
            ["bun", "install"],
            cwd=console_dist.parent,
            check=True
        )
        subprocess.run(
            ["bun", "run", "build"],
            cwd=console_dist.parent,
            check=True
        )

    # Copy to console directory
    if not (console_dest / "index.html").exists():
        print("Copying frontend to console directory...")
        console_dest.mkdir(parents=True, exist_ok=True)
        shutil.copytree(console_dist, console_dest, dirs_exist_ok=True)

    print("✓ Frontend ready")

def create_portable_structure(repo_root, version):
    """Create portable directory structure"""
    dist_dir = repo_root / "dist"
    portable_dir = dist_dir / f"CoPaw-Windows-Portable-{version}"

    print(f"\n[Step 2/5] Creating portable directory structure...")

    # Clean old build
    if portable_dir.exists():
        shutil.rmtree(portable_dir)

    # Create directories
    dirs = [
        portable_dir / "copaw",
        portable_dir / "data",
        portable_dir / "logs",
    ]
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)

    print(f"✓ Created structure at {portable_dir}")
    return portable_dir

def copy_source(repo_root, portable_dir):
    """Copy CoPaw source code"""
    print("\n[Step 3/5] Copying CoPaw source code...")

    copaw_src = repo_root / "src" / "copaw"
    copaw_dest = portable_dir / "copaw"

    if copaw_dest.exists():
        shutil.rmtree(copaw_dest)

    shutil.copytree(copaw_src, copaw_dest)

    # Copy pyproject.toml and setup.py for package installation
    shutil.copy2(repo_root / "pyproject.toml", portable_dir)
    shutil.copy2(repo_root / "setup.py", portable_dir)

    print("✓ Source code copied")

def create_scripts(portable_dir, version):
    """Create startup scripts"""
    print("\n[Step 4/5] Creating startup scripts...")

    # Main launcher
    launcher = """@echo off
REM CoPaw Portable Launcher
setlocal

REM Set CoPaw home to current directory
set "COPAW_HOME=%~dp0"
set "COPAW_DATA_DIR=%~dp0data"
set "COPAW_LOG_DIR=%~dp0logs"

REM Create directories if not exist
if not exist "%COPAW_DATA_DIR%" mkdir "%COPAW_DATA_DIR%"
if not exist "%COPAW_LOG_DIR%" mkdir "%COPAW_LOG_DIR%"

REM Check if Python is available
where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    echo Please install Python 3.10 or later from https://www.python.org/
    pause
    exit /b 1
)

REM Set COPAW_PORT to avoid conflicts
if not defined COPAW_PORT set "COPAW_PORT=8088"

echo ====================================
echo CoPaw Portable Edition v{VERSION}
echo ====================================
echo Data directory: %COPAW_DATA_DIR%
echo Log directory: %COPAW_LOG_DIR%
echo Web interface: http://localhost:%COPAW_PORT%
echo.
echo Starting CoPaw...
echo Press Ctrl+C to stop
echo ====================================
echo.

REM Install dependencies on first run
if not exist "%~dp0.installed" (
    echo Installing dependencies...
    python -m pip install --upgrade pip
    python -m pip install -e "%~dp0copaw"
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    type nul > "%~dp0.installed"
    echo Dependencies installed successfully!
    echo.
)

REM Start CoPaw
cd /d "%~dp0copaw"
python -m copaw app

pause
""".replace("{VERSION}", version)

    (portable_dir / "CoPaw.bat").write_text(launcher, encoding="ascii")

    # Developer launcher
    dev_launcher = """@echo off
REM CoPaw Portable Developer Launcher
setlocal

set "COPAW_HOME=%~dp0"
set "COPAW_DATA_DIR=%~dp0data"
set "COPAW_LOG_DIR=%~dp0logs"
set "COPAW_LOG_LEVEL=debug"

if not exist "%COPAW_DATA_DIR%" mkdir "%COPAW_DATA_DIR%"
if not exist "%COPAW_LOG_DIR%" mkdir "%COPAW_LOG_DIR%"

where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    pause
    exit /b 1
)

if not defined COPAW_PORT set "COPAW_PORT=8088"

echo ====================================
echo CoPaw Portable Developer Mode v{VERSION}
echo ====================================
echo Log level: %COPAW_LOG_LEVEL%
echo.

cd /d "%~dp0copaw"
python -m copaw app

pause
""".replace("{VERSION}", version)

    (portable_dir / "CoPaw-Dev.bat").write_text(dev_launcher, encoding="ascii")

    # README
    readme = f"""# CoPaw Portable Edition v{version}

## Quick Start

1. Double-click `CoPaw.bat` to start CoPaw
2. Open your browser and go to: http://localhost:8088
3. Press Ctrl+C in the console window to stop

## Requirements

- Windows 10 or later
- Python 3.10 or later (https://www.python.org/)
- Internet connection (for AI models and integrations)

## Directory Structure

- `copaw/` - CoPaw application source code
- `data/` - User data, configurations, and workspace
- `logs/` - Application logs

## Launcher Files

- `CoPaw.bat` - Standard launcher (recommended)
- `CoPaw-Dev.bat` - Developer launcher with debug logging

## First Run

On first run, CoPaw will:
1. Install Python dependencies (may take a few minutes)
2. Create necessary directories
3. Start the web interface

## Troubleshooting

If CoPaw doesn't start:
1. Check that Python is installed: `python --version`
2. Run `CoPaw-Dev.bat` to see detailed error logs
3. Check `logs/` directory for error logs

## Data Location

All your data is stored in the `data/` directory:
- Configuration: `data/config.json`
- Agent workspaces: `data/workspaces/`
- Chat history: `data/workspaces/*/chats.json`

## Updates

To update CoPaw:
1. Download the latest portable version
2. Copy your `data/` directory to the new version
3. Run `CoPaw.bat`

## More Information

- Project: https://github.com/agentscope-ai/CoPaw
- Documentation: https://github.com/agentscope-ai/CoPaw/blob/main/README.md

## License

CoPaw is licensed under the Apache License 2.0
"""

    (portable_dir / "README.txt").write_text(readme, encoding="utf-8")

    print("✓ Startup scripts created")

def create_zip(repo_root, portable_dir, version):
    """Create ZIP archive"""
    print("\n[Step 5/5] Creating ZIP archive...")

    dist_dir = repo_root / "dist"
    zip_file = dist_dir / f"CoPaw-Windows-Portable-{version}.zip"

    if zip_file.exists():
        zip_file.unlink()

    # Create ZIP
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_path in portable_dir.rglob('*'):
            if file_path.is_file():
                arcname = file_path.relative_to(portable_dir.parent)
                zf.write(file_path, arcname)

    # Get file size
    file_size_mb = zip_file.stat().st_size / (1024 * 1024)

    print(f"\n{'='*40}")
    print("Build completed successfully!")
    print(f"{'='*40}")
    print(f"Output: {zip_file}")
    print(f"Size: {file_size_mb:.2f} MB")
    print(f"\nTo use:")
    print("1. Extract the ZIP to any directory")
    print("2. Double-click CoPaw.bat to start")
    print("3. Open http://localhost:8088 in your browser")
    print(f"{'='*40}\n")

def main():
    """Main build process"""
    repo_root = Path(__file__).parent.parent.parent

    print("="*40)
    print("CoPaw Windows Portable Build")
    print("="*40)
    print(f"Repository root: {repo_root}")

    # Get version
    version = get_version(repo_root)
    print(f"Version: {version}")

    try:
        # Build steps
        ensure_frontend(repo_root)
        portable_dir = create_portable_structure(repo_root, version)
        copy_source(repo_root, portable_dir)
        create_scripts(portable_dir, version)
        create_zip(repo_root, portable_dir, version)

    except subprocess.CalledProcessError as e:
        print(f"\nERROR: Command failed: {e.cmd}")
        print(f"Exit code: {e.returncode}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
