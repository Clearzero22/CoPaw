# CoPaw Stop Script (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File stop.ps1

Write-Host ""
Write-Host "🛑 Stopping CoPaw..." -ForegroundColor Cyan
Write-Host ""

# Find copaw processes
$processes = Get-Process -Name "python", "uvicorn" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "copaw" -or $_.CommandLine -match "uvicorn" }

if (-not $processes) {
    # Fallback: check port 8088
    $conn = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $processes = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    }
}

if (-not $processes) {
    Write-Host "ℹ️  No running CoPaw processes found" -ForegroundColor Yellow
    exit 0
}

Write-Host "📋 Found processes:"
$processes | Format-Table Id, ProcessName, CPU -AutoSize
Write-Host ""

# Graceful stop
Write-Host "🔄 Stopping gracefully..."
$processes | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Verify
$conn = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "⚠️  Port 8088 still in use" -ForegroundColor Yellow
    $reply = Read-Host "Force kill? (y/N)"
    if ($reply -match "^[Yy]$") {
        Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "✅ Port 8088 released" -ForegroundColor Green
}

# Final check
$conn = Get-NetTCPConnection -LocalPort 8088 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ CoPaw stopped completely" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "❌ Some processes still running" -ForegroundColor Red
    exit 1
}
