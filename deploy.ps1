# ===========================
# Hetzner Deployment Script (PowerShell)
# ===========================

Write-Host "🚀 Starting Hetzner Deployment..." -ForegroundColor Green

# Configurable image settings (override via env: IMAGE_NAME, TAG, REGISTRY)
$ImageName = if ([string]::IsNullOrWhiteSpace($env:IMAGE_NAME)) { 'app-agent' } else { $env:IMAGE_NAME }
$Tag       = if ([string]::IsNullOrWhiteSpace($env:TAG)) { 'latest' } else { $env:TAG }
$Registry  = if ([string]::IsNullOrWhiteSpace($env:REGISTRY)) { '' } else { $env:REGISTRY }

$DockerImage = "${ImageName}:${Tag}"
if (-not [string]::IsNullOrWhiteSpace($Registry)) {
    $DockerImage = "${Registry}/${DockerImage}"
}

# Ensure docker-compose uses the same values
$env:IMAGE_NAME = $ImageName
$env:TAG = $Tag

# 1. Build Docker Image
Write-Host "📦 Building Docker image: $DockerImage" -ForegroundColor Yellow
docker build -t $DockerImage .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# 2. Deploy via docker-compose
Write-Host "🚢 Deploying with docker-compose..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# 3. Wait for startup
Write-Host "⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Health Check
Write-Host "🔍 Checking health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Service running at http://localhost:3000" -ForegroundColor Cyan
    Write-Host "📊 Status: $($response.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    docker-compose -f docker-compose.production.yml logs
    exit 1
}

# 5. Show recent logs
Write-Host "`n📋 Recent logs:" -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml logs --tail=50
