# syntax=docker/dockerfile:1

# ==============================================================================
# Этап 1: Сборка фронтенда (React + Vite)
# ==============================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Кэширование зависимостей Node.js
COPY app/package.json app/package-lock.json ./
RUN npm ci

# Копирование исходников фронтенда и сборка
COPY app/ ./
RUN npm run build

# ==============================================================================
# Этап 2: Сборка бэкенда (Go API)
# ==============================================================================
FROM golang:1.25-alpine AS backend-builder

WORKDIR /build

RUN apk add --no-cache git ca-certificates tzdata

# Кэширование Go-модулей
COPY go.mod go.sum ./
RUN go mod download

# Копирование исходников бэкенда и сборка статического бинарника
COPY cmd/ ./cmd/
COPY internal/ ./internal/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/api ./cmd/api

# ==============================================================================
# Этап 3: Финальный образ (Nginx + Go API)
# ==============================================================================
FROM alpine:3.21

# Установка Nginx, сертификатов CA и часовых поясов
RUN apk --no-cache add nginx ca-certificates tzdata

WORKDIR /app

# 1. Копируем скомпилированный Go бинарник
COPY --from=backend-builder /build/api /app/api

# 2. Копируем собранную статику фронтенда (Vite собирает в dist/public)
COPY --from=frontend-builder /app/dist/public /usr/share/nginx/html

# 3. Конфигурация Nginx: отдача SPA и проксирование API-запросов к Go
RUN cat <<'EOF' > /etc/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout 65;

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    server {
        listen 80;
        server_name localhost;

        # Фронтенд: раздача статики и поддержка HTML5 History API (SPA)
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Бэкенд: проксирование запросов к Go API
        # Запросы вида /api/users/auth/login транслируются в /users/auth/login на 127.0.0.1:8080
        location /api/ {
            proxy_pass http://127.0.0.1:8080/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 4. Скрипт одновременного запуска Go API и Nginx с корректным завершением (Graceful Shutdown)
RUN cat <<'EOF' > /app/entrypoint.sh
#!/bin/sh

# Остановка обоих сервисов при получении сигналов SIGTERM / SIGINT
stop_all() {
    echo "Остановка сервисов..."
    kill -TERM "$API_PID" 2>/dev/null
    nginx -s quit 2>/dev/null
    wait "$API_PID" 2>/dev/null
    exit 0
}

trap stop_all TERM INT

# Запуск Go бэкенда в фоновом режиме на 127.0.0.1:8080
/app/api &
API_PID=$!

# Запуск Nginx на переднем плане (порт 80)
nginx -g "daemon off;" &
NGINX_PID=$!

# Ожидание остановки Nginx
wait "$NGINX_PID"
EOF

RUN chmod +x /app/entrypoint.sh

# Единый порт для доступа к приложению (и фронтенд, и API через /api/)
EXPOSE 80

ENV GIN_MODE=release

ENTRYPOINT ["/app/entrypoint.sh"]
