# Matching — Inicia todos los servicios (Windows)
Write-Host "=== Matching: configurando base de datos ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm run db:setup

Write-Host "=== Matching: iniciando frontend + backend + python ===" -ForegroundColor Cyan
npm run dev
