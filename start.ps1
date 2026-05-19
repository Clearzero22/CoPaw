# CoPaw Startup Script (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = [System.IO.Path]::GetTempPath()
$LogFile = Join-Path $LogDir "copaw_backend.log"

Write-Host ""
Write-Host "🚀 Starting CoPaw..." -ForegroundColor Cyan
Write-Host ""

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

$uvCmd = Get-Command uv -ErrorAction SilentlyContinue
if (-not $uvCmd) {
    Write-Host "❌ uv not installed. Run: pip install uv" -ForegroundColor Red
    exit 1
}

$bunCmd = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bunCmd) {
    Write-Host "❌ bun not installed. Run: npm install -g bun" -ForegroundColor Red
    exit 1
}

# Sync Python dependencies
Write-Host "📥 Syncing Python dependencies..."
$syncJob = Start-Job -ScriptBlock {
    Set-Location $using:ProjectDir
    uv sync --dev --all-extras 2>&1 | Out-Null
}

# Install frontend dependencies
Write-Host "📥 Syncing frontend dependencies..."
$consoleDir = Join-Path $ProjectDir "console"
$installJob = Start-Job -ScriptBlock {
    Set-Location $using:consoleDir
    bun install 2>&1 | Out-Null
}

# Wait for both
$syncJob | Wait-Job | Out-Null
Write-Host "✅ Python dependencies synced"
$installJob | Wait-Job | Out-Null
Write-Host "✅ Frontend dependencies synced"

# Check port 8088
$portInUse = Get-NetTCPConnection -LocalPort 8088 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 8088 is already in use" -ForegroundColor Yellow
    $reply = Read-Host "Kill old process and restart? (y/N)"
    if ($reply -match "^[Yy]$") {
        Write-Host "🛑 Stopping old process..."
        Get-Process -Id $portInUse.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
    } else {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 1
    }
}

# Start backend
Write-Host "🔧 Starting backend..."
Set-Location $ProjectDir
$proc = Start-Process -FilePath "uv" -ArgumentList "run", "copaw", "app" `
    -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile

# Wait for backend
Write-Host "⏳ Waiting for backend..."
for ($i = 1; $i -le 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:8088/" -TimeoutSec 2 -UseBasicParsing
        Write-Host "✅ Backend started (PID: $($proc.Id))"
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

# Verify
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8088/" -TimeoutSec 5 -UseBasicParsing
} catch {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Write-Host "Log: Get-Content $LogFile -Tail 50" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ CoPaw started successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 URL:       http://localhost:8088/" -ForegroundColor Cyan
Write-Host "📝 Log file:  $LogFile" -ForegroundColor Cyan
Write-Host "🛑 To stop:   ./stop.ps1" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process "http://localhost:8088/"
