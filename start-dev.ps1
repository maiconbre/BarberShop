# Script para iniciar o ambiente de desenvolvimento local

Write-Host "Iniciando ambiente de desenvolvimento do BarberGR..." -ForegroundColor Green

# Verificar se o arquivo .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "Arquivo .env.local não encontrado. Criando arquivo com configurações padrão..." -ForegroundColor Yellow
    Copy-Item ".env" ".env.local"
    Write-Host "Arquivo .env.local criado. Por favor, verifique as configurações antes de continuar." -ForegroundColor Yellow
    exit
}

# Copiar .env.local para .env para garantir que as configurações locais sejam usadas
Write-Host "Aplicando configurações locais..." -ForegroundColor Cyan
Copy-Item ".env.local" ".env" -Force

# Iniciar o backend em um novo terminal
Write-Host "Iniciando o backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./backend; npm install; npm run dev"

# Aguardar alguns segundos para o backend iniciar
Write-Host "Aguardando o backend iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Iniciar o frontend
Write-Host "Iniciando o frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm install; npm run dev"

Write-Host "Ambiente de desenvolvimento iniciado com sucesso!" -ForegroundColor Green
Write-Host "Backend: http://localhost:6543" -ForegroundColor Magenta
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Magenta