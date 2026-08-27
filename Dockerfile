# ── Stage 1: Wayfinder codegen (PHP) ──────────────────────────────────────────
# El plugin de Vite para Wayfinder invoca `php artisan`, que no está disponible
# en el stage de Node. Aquí generamos los helpers TS de rutas/acciones para que
# el build del frontend sea autocontenido (no depende de que el host los tenga).
# La imagen `composer` ya trae PHP + composer + git + unzip + ext-zip.
FROM composer:2 AS codegen

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-progress --prefer-dist --no-dev --no-scripts

COPY . .
RUN cp .env.example .env \
    && php artisan key:generate --no-interaction \
    && php artisan package:discover --ansi \
    && php artisan wayfinder:generate --with-form

# ── Stage 2: Frontend (Node) ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Helpers generados por Wayfinder desde el stage anterior.
COPY --from=codegen /app/resources/js/actions ./resources/js/actions
COPY --from=codegen /app/resources/js/routes ./resources/js/routes
COPY --from=codegen /app/resources/js/wayfinder ./resources/js/wayfinder

RUN npm run build

# ── Stage 3: PHP/Apache (runtime) ─────────────────────────────────────────────
FROM php:8.4-apache

# ── Dependencias del sistema ───────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpng-dev \
        libjpeg62-turbo-dev \
        libwebp-dev \
        libzip-dev \
        libxml2-dev \
        libonig-dev \
        zip \
        unzip \
        git \
        curl \
        default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# ── Extensiones PHP ───────────────────────────────────────────────────────────
RUN docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install \
        pdo_mysql \
        gd \
        zip \
        mbstring \
        xml \
        bcmath \
        fileinfo \
        opcache

# ── Apache: habilitar mod_rewrite + vhost ─────────────────────────────────────
RUN a2enmod rewrite \
    && echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername
COPY docker/apache/laravel.conf /etc/apache2/sites-available/000-default.conf

# ── Composer v2 ───────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── Composer deps (capa separada para cache de Docker) ────────────────────────
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

# ── Assets y helpers generados desde los stages anteriores ────────────────────
COPY --from=frontend /app/public/build ./public/build
COPY --from=codegen /app/resources/js/actions ./resources/js/actions
COPY --from=codegen /app/resources/js/routes ./resources/js/routes
COPY --from=codegen /app/resources/js/wayfinder ./resources/js/wayfinder

# ── Scripts post-install (requieren artisan) ──────────────────────────────────
RUN php artisan package:discover --ansi

# ── Entrypoint: espera la BD, migra y arranca Apache ──────────────────────────
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# ── Permisos www-data ─────────────────────────────────────────────────────────
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

ENTRYPOINT ["entrypoint"]
CMD ["apache2-foreground"]
