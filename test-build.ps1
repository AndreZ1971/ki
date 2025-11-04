# ===========================
# Lokaler Build-Test
# ===========================

Write-Host "🧪 Testing Docker Build..." -ForegroundColor Green

# 1. Backend installieren
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm install failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Frontend installieren
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm install failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 3. Docker Build testen
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t kaufe-es-agent:test .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green

# 4. Image Größe prüfen
Write-Host "`n📊 Image Info:" -ForegroundColor Cyan
docker images kaufe-es-agent:test

Write-Host "`n✅ Build test complete!" -ForegroundColor Green
Write-Host "🚀 Ready for deployment to Hetzner!" -ForegroundColor Cyan
