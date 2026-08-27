# ── PHP/Apache ────────────────────────────────────────────────────────────────
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
RUN a2enmod rewrite
COPY docker/apache/laravel.conf /etc/apache2/sites-available/000-default.conf

# ── Composer v2 ───────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── Directorio de trabajo ──────────────────────────────────────────────────────
WORKDIR /var/www/html

# ── Composer deps (capa separada para cache de Docker) ────────────────────────
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY . .

# ── Assets precompilados (ejecutar "npm run build" localmente antes de docker build) ──
COPY public/build ./public/build

# ── Scripts post-install (requieren artisan) ──────────────────────────────────
RUN php artisan package:discover --ansi

# ── Permisos www-data ─────────────────────────────────────────────────────────
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80
