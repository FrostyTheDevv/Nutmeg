# Start Lavalink Server
Write-Host "🚀 Starting Lavalink v4 Server..." -ForegroundColor Cyan
Write-Host "📋 Configuration: application.yml" -ForegroundColor Gray
Write-Host "🔌 Port: 2333" -ForegroundColor Gray
Write-Host "🔑 Password: youshallnotpass" -ForegroundColor Gray
Write-Host ""

# Check if Java is available
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "✅ Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java not found! Please install Java 17 or higher." -ForegroundColor Red
    Write-Host "Download from: https://adoptium.net/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "Starting Lavalink..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Start Lavalink with optimized settings
java -Xmx1G -jar Lavalink_v4.jar
