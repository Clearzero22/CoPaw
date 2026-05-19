# CoPaw Frontend Dev Server - No Proxy (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File dev-no-proxy.ps1

# Clear proxy environment variables
$env:http_proxy = ""
$env:https_proxy = ""
$env:all_proxy = ""
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""
$env:ALL_PROXY = ""

Write-Host "🚀 Starting Vite dev server (proxy disabled)" -ForegroundColor Cyan
Write-Host "📍 URL:    http://localhost:5173/" -ForegroundColor Cyan
Write-Host "🔗 API:    http://127.0.0.1:8088/api" -ForegroundColor Cyan
Write-Host ""

npm run dev:proxy
