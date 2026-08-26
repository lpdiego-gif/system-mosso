# Levantar el proyecto con Docker

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

---

## 1. Clonar / actualizar el repositorio

```bash
git pull origin main
```

---

## 2. Configurar el archivo `.env`

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Ajusta estos valores (el resto puede quedar como está):

```env
APP_NAME=SystemMosso
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=mosso
DB_USERNAME=mosso_user
DB_PASSWORD=tu_password_segura
```

> **Importante:** `DB_HOST=db` es el nombre del servicio en docker-compose, no `localhost`.

---

## 3. Levantar los contenedores

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos porque descarga las imágenes y compila el proyecto.  
Para ver que todo está corriendo:

```bash
docker compose ps
```

---

## 4. Generar la clave de aplicación

```bash
docker compose exec app php artisan key:generate
```

---

## 5. Ejecutar migraciones (y seeders si los hay)

```bash
docker compose exec app php artisan migrate --force

# Si el proyecto tiene seeders:
docker compose exec app php artisan db:seed --force
```

---

## 6. Crear el enlace de storage

```bash
docker compose exec app php artisan storage:link
```

---

## 7. Abrir el proyecto

[http://localhost:8000](http://localhost:8000)

---

## Comandos útiles del día a día

| Acción | Comando |
|---|---|
| Ver logs en tiempo real | `docker compose logs -f app` |
| Entrar al contenedor | `docker compose exec app bash` |
| Correr artisan | `docker compose exec app php artisan <comando>` |
| Detener contenedores | `docker compose down` |
| Detener y borrar datos de BD | `docker compose down -v` ⚠️ |
| Reconstruir imagen tras cambios | `docker compose up -d --build` |

---

## Notas

- Los datos de MariaDB persisten en el volumen `db_data` aunque hagas `docker compose down`.
- Para borrar completamente la base de datos usa `docker compose down -v` (destructivo).
- Los assets del frontend (Vite/React) deben compilarse **antes** de construir la imagen:  
  `npm run build` → luego `docker compose up -d --build`.
