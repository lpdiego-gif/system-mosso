#!/bin/sh
set -e

# ── Espera a que la base de datos acepte conexiones ───────────────────────────
# docker-compose ya usa `depends_on: condition: service_healthy`, pero el
# healthcheck de MariaDB responde antes de terminar de importar el dump de
# /docker-entrypoint-initdb.d, así que reintentamos aquí.
if [ -n "$DB_HOST" ]; then
    echo "Esperando a la base de datos en ${DB_HOST}:${DB_PORT:-3306}..."
    tries=0
    until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT:-3306}', '${DB_USERNAME:-root}', getenv('DB_PASSWORD') ?: '');" 2>/dev/null; do
        tries=$((tries + 1))
        if [ "$tries" -ge 60 ]; then
            echo "La base de datos no respondió tras 60 intentos; abortando." >&2
            exit 1
        fi
        sleep 2
    done
fi

# ── Migraciones ──────────────────────────────────────────────────────────────
# Con el dump ya importado, esto solo aplica migraciones realmente pendientes:
# el esquema histórico ya está en la tabla `migrations` del dump, y las
# migraciones que tocan tablas del dump tienen guardas `Schema::hasTable()`
# para ser no-ops en una BD vacía.
php artisan migrate --force --no-interaction

# ── Caché de configuración (opcional, no bloqueante) ─────────────────────────
# No se cachean rutas: `routes/settings.php` tiene una ruta con Closure
# (.well-known/passkey-endpoints) que `route:cache` no puede serializar.
php artisan config:cache || php artisan config:clear

# ── Permisos (el volumen de storage puede montarse con otro owner) ───────────
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

exec "$@"
