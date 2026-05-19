# CoPaw Frontend Dev Server (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ConsoleDir = Join-Path $ProjectRoot "console"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  CoPaw Frontend Hot-Reload Dev Server" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Check dependencies
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "❌ Node.js not installed" -ForegroundColor Red
    exit 1
}

# Check backend
$conn = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Write-Host "❌ Backend not running (port 8088)" -ForegroundColor Red
    Write-Host "Start it first: uv run copaw app" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Dependencies OK" -ForegroundColor Green
Write-Host ""

Set-Location $ConsoleDir

# Install deps if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Check dev config
if (-not (Test-Path "vite.config.dev.ts")) {
    Write-Host "❌ Missing vite.config.dev.ts" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  🚀 Starting Vite dev server" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URL:        http://localhost:5173/" -ForegroundColor Cyan
Write-Host "🔗 Backend:    http://127.0.0.1:8088/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Code changes auto hot-reload"
Write-Host "  - Press Ctrl+C to stop"
Write-Host "  - Backend must run in another terminal"
Write-Host ""

npm run dev:proxy
