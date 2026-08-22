# q2play — Inicia todos los servicios (Windows)
Write-Host "=== q2play: configurando base de datos ===" -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm run db:setup

Write-Host "=== q2play: iniciando frontend + backend + python ===" -ForegroundColor Cyan
npm run dev
