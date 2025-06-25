# Script para iniciar desarrollo
Write-Host "🚀 Iniciando entorno de desarrollo..." -ForegroundColor Green

# Verificar archivos .env
if (!(Test-Path "backend\.env")) {
    Write-Host "⚠️ Copiando .env.example a .env en backend..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
}

if (!(Test-Path "frontend\.env.local")) {
    Write-Host "⚠️ Copiando .env.example a .env.local en frontend..." -ForegroundColor Yellow
    Copy-Item "frontend\.env.example" "frontend\.env.local"
}

# Función para verificar puertos
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Verificar puertos
if (Test-Port 3000) {
    Write-Host "⚠️ Puerto 3000 (backend) está ocupado" -ForegroundColor Yellow
}

if (Test-Port 3001) {
    Write-Host "⚠️ Puerto 3001 (frontend) está ocupado" -ForegroundColor Yellow
}

Write-Host "🔧 Iniciando backend en puerto 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"

Start-Sleep -Seconds 3

Write-Host "🎨 Iniciando frontend en puerto 3001..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "✅ Servicios iniciados:" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:3000/api/v1" -ForegroundColor White
Write-Host "🎨 Frontend: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Credenciales iniciales:" -ForegroundColor Yellow
Write-Host "👤 Usuario: admin" -ForegroundColor White
Write-Host "🔒 Password: Admin123!" -ForegroundColor White
