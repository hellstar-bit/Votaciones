# Script de instalación para Windows
Write-Host "📦 Instalando dependencias..." -ForegroundColor Green

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no instalado. Descargar de: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Instalar NestJS CLI globalmente
npm install -g @nestjs/cli@latest

# Backend
Write-Host "🔧 Instalando backend..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Frontend  
Write-Host "🎨 Instalando frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "✅ Instalación completada!" -ForegroundColor Green
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configurar MySQL" -ForegroundColor White
Write-Host "2. Copiar .env files:" -ForegroundColor White
Write-Host "   copy backend\.env.example backend\.env" -ForegroundColor Gray
Write-Host "   copy frontend\.env.example frontend\.env.local" -ForegroundColor Gray
Write-Host "3. Editar archivos .env con tus credenciales" -ForegroundColor White
Write-Host "4. Ejecutar: .\scripts\start-dev.ps1" -ForegroundColor White
