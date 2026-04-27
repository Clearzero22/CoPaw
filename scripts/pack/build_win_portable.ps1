# Simple portable Windows build - no NSIS required
# Creates a self-contained CoPaw package with embedded frontend
# Requires: uv, Python 3.10+, node/npm (for console frontend)

$ErrorActionPreference = "Stop"
$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
Set-Location $RepoRoot

Write-Host "[CoPaw Portable Build] Starting..." -ForegroundColor Green
Write-Host "[CoPaw Portable Build] Repository root: $RepoRoot"

$DistDir = Join-Path $RepoRoot "dist"
$PortableDir = Join-Path $DistDir "CoPaw-Windows-Portable"
$VersionFile = Join-Path $RepoRoot "src\copaw\__version__.py"

# Get version
$Version = "0.0.0"
if (Test-Path $VersionFile) {
    $content = Get-Content $VersionFile -Raw
    if ($content -match '__version__\s*=\s*"([^"]+)"') {
        $Version = $Matches[1]
    }
}
Write-Host "[CoPaw Portable Build] Version: $Version"

# Step 1: Ensure frontend is built
Write-Host "`n[Step 1/5] Building console frontend..." -ForegroundColor Cyan
$ConsoleDist = Join-Path $RepoRoot "console\dist"
$ConsoleDest = Join-Path $RepoRoot "src\copaw\console"

if (-not (Test-Path $ConsoleDist\index.html)) {
    Write-Host "Building frontend with bun..." -ForegroundColor Yellow
    Push-Location $RepoRoot\console
    bun install
    bun run build
    Pop-Location
}

# Copy frontend to package
if (-not (Test-Path $ConsoleDest\index.html)) {
    Write-Host "Copying frontend to console directory..."
    New-Item -ItemType Directory -Force -Path $ConsoleDest | Out-Null
    Copy-Item -Path "$ConsoleDist\*" -Destination $ConsoleDest -Recurse -Force
}

# Step 2: Create portable directory structure
Write-Host "`n[Step 2/5] Creating portable directory structure..." -ForegroundColor Cyan
Remove-Item -Path $PortableDir -Recurse -Force -ErrorAction SilentlyContinue
$Dirs = @(
    "$PortableDir\copaw",
    "$PortableDir\copaw\python",
    "$PortableDir\data",
    "$PortableDir\logs"
)
foreach ($dir in $Dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Step 3: Copy CoPaw source code
Write-Host "`n[Step 3/5] Copying CoPaw source code..." -ForegroundColor Cyan
Copy-Item -Path "$RepoRoot\src\copaw" -Destination "$PortableDir\copaw\" -Recurse -Force

# Step 4: Create startup scripts
Write-Host "`n[Step 4/5] Creating startup scripts..." -ForegroundColor Cyan

# Main launcher
$Launcher = @"
@echo off
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
echo CoPaw Portable Edition v$Version
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
if not exist "%~dp0\.installed" (
    echo Installing dependencies...
    python -m pip install --upgrade pip
    python -m pip install -e "%~dp0copaw"
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    type nul > "%~dp0\.installed"
    echo Dependencies installed successfully!
    echo.
)

REM Start CoPaw
cd /d "%~dp0copaw"
python -m copaw app

pause
"@
$Launcher | Set-Content -Path "$PortableDir\CoPaw.bat" -Encoding ASCII

# Developer launcher (with console output)
$DevLauncher = @"
@echo off
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
echo CoPaw Portable Developer Mode v$Version
echo ====================================
echo Log level: %COPAW_LOG_LEVEL%
echo.

cd /d "%~dp0copaw"
python -m copaw app

pause
"@
$DevLauncher | Set-Content -Path "$PortableDir\CoPaw-Dev.bat" -Encoding ASCII

# README
$Readme = @"
# CoPaw Portable Edition v$Version

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
"@
$Readme | Set-Content -Path "$PortableDir\README.txt" -Encoding ASCII

# Step 5: Create ZIP archive
Write-Host "`n[Step 5/5] Creating ZIP archive..." -ForegroundColor Cyan
$ZipFile = Join-Path $DistDir "CoPaw-Windows-Portable-$Version.zip"
if (Test-Path $ZipFile) {
    Remove-Item -Path $ZipFile -Force
}

# Use PowerShell's Compress-Archive (Windows 10+)
Compress-Archive -Path "$PortableDir\*" -DestinationPath $ZipFile -CompressionLevel Optimal

# Get file size
$FileSize = (Get-Item $ZipFile).Length / 1MB

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Output: $ZipFile"
Write-Host "Size: $($FileSize.ToString('F2')) MB"
Write-Host "`nTo use:"
Write-Host "1. Extract the ZIP to any directory"
Write-Host "2. Double-click CoPaw.bat to start"
Write-Host "3. Open http://localhost:8088 in your browser"
Write-Host "========================================`n"
