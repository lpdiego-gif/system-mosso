# update.ps1 - Corre esto despues de cada "git pull" para dejar tu entorno
# local al dia (dependencias PHP/JS, migraciones, caches).
#
# Uso:  .\update.ps1

Write-Host "==> git pull" -ForegroundColor Cyan
git pull origin main

Write-Host "==> Dependencias PHP (composer, dentro del contenedor)" -ForegroundColor Cyan
docker compose exec app composer install

Write-Host "==> Dependencias frontend (npm)" -ForegroundColor Cyan
npm install
npm run build

Write-Host "==> Migraciones de base de datos" -ForegroundColor Cyan
docker compose exec app php artisan migrate --force

Write-Host "==> Limpiando caches de Laravel (config/route/view)" -ForegroundColor Cyan
docker compose exec app php artisan optimize:clear

Write-Host "==> Levantando contenedores" -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "Listo. Revisa a mano si .env.example tiene variables nuevas" -ForegroundColor Yellow
Write-Host "que debas copiar a tu .env (el .env nunca se sincroniza por git)." -ForegroundColor Yellow
