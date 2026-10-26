# Finance Tracker

Full-stack приложение для учёта личных финансов. Пользователь может вести счета, фиксировать доходы и расходы, переводить деньги между счетами, работать с категориями, бюджетами и накопительными целями. Для регулярных платежей в API встроен фоновый обработчик.

## Возможности

- регистрация, вход по JWT и восстановление ранее удалённого пользователя;
- счета с начальным балансом, пополнением и списанием;
- операции дохода и расхода с категориями, подкатегориями, получателями, торговыми точками и тегами;
- переводы между счетами с атомарным изменением балансов;
- пользовательские категории, подкатегории, теги и торговые точки;
- регулярные операции: ежедневно, еженедельно, ежемесячно или ежегодно; их выполнение проверяется раз в минуту;
- бюджеты по периоду и категориям, включая расчёт потраченной суммы и остатка;
- цели накопления и пополнения целей;
- журнал части пользовательских действий;
- веб-интерфейс с дашбордом, аналитикой, операциями, счетами, бюджетами, целями и настройками.

## Технологии

| Слой | Используемые технологии |
| --- | --- |
| Backend | Go 1.25, Gin, pgx/v5, PostgreSQL |
| Аутентификация | JWT (`github.com/golang-jwt/jwt/v5`), bcrypt |
| Логирование | zerolog |
| Frontend | React 19, TypeScript, Vite 7 |
| UI и данные | Tailwind CSS, Radix UI, TanStack Query, React Router, Recharts |

## Структура проекта

```text
.
├── cmd/api/                 # точка входа Go API
├── internal/
│   ├── app/                 # сборка зависимостей и запуск приложения
│   ├── auth/                # JWT и хеширование паролей
│   ├── db/                  # подключение к PostgreSQL и SQL-миграции
│   ├── domain/              # доменные модели и интерфейсы репозиториев
│   ├── handler/             # HTTP-обработчики Gin и маршруты
│   ├── repo/                # SQL-реализация репозиториев
│   └── service/             # бизнес-правила и фоновые задачи
├── app/                     # React-клиент
│   ├── src/pages/           # страницы приложения
│   ├── src/components/      # компоненты и layout (ui/ — shadcn/ui)
│   ├── src/hooks/           # useAuth и вспомогательные хуки
│   ├── src/providers/       # провайдер TanStack Query
│   └── src/lib/api.ts       # клиент REST API
├── k8s/                     # манифесты Kubernetes (Deployment, ServiceAccount/RBAC)
├── .github/workflows/       # CI/CD (GitHub Actions)
├── dockerfile               # сборка единого образа: Nginx + SPA + Go API
├── docker-compose.yaml      # приложение + PostgreSQL для локального запуска
├── go.mod
└── README.md
```

## Требования

- Go версии, указанной в [go.mod](go.mod) (сейчас `1.25.1`);
- PostgreSQL 15+ (в docker-compose используется 16);
- Node.js 20+ и npm (в Docker-образе — Node 22);
- Docker и Docker Compose — только для контейнерного запуска.

## Конфигурация backend

Backend читает настройки **только из переменных окружения**: файл `.env` приложением не загружается. При локальном запуске задайте переменные в оболочке, а в Docker Compose их подставляет `env_file`. Шаблон — [internal/config/.env.example](internal/config/.env.example).

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `JWT_SECRET` | да | Секрет подписи JWT. Без него приложение завершается сразу после старта |
| `POSTGRES_USER` (или `DB_USER`) | да | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` (или `DB_PASSWORD`) | да | Пароль PostgreSQL |
| `DB_HOST` | да | Адрес БД вместе с портом, например `localhost:5432` или `db:5432` |
| `POSTGRES_DB` (или `DB_NAME`) | да | Имя базы данных |
| `PORT` | нет | Порт API, по умолчанию `8080` |
| `CORS_ALLOWED_ORIGIN` | нет | Значение `Access-Control-Allow-Origin`, по умолчанию `*`. В продакшене задайте конкретный origin |

Не добавляйте реальные секреты в Git.

## Быстрый запуск

### 1. Подготовить PostgreSQL

Создайте пользователя и пустую базу данных. Названия ниже приведены как пример:

```sql
CREATE USER finance_user WITH PASSWORD 'change_me';
CREATE DATABASE finance_tracker OWNER finance_user;
```

Применять миграции вручную не нужно: SQL-файлы из `internal/db/migrations` встроены в бинарник и накатываются через [goose](https://github.com/pressly/goose) при каждом старте API (таймаут — 1 минута). Они создают таблицы пользователей, счетов, операций, переводов, категорий, бюджетов, целей, регулярных операций и журнала событий, а также добавляют начальные типы карт, кошельков, категорий и подкатегорий. Новая миграция добавляется файлом в формате goose с более поздней временной меткой в имени.

### 2. Запустить backend

В PowerShell из корня репозитория:

```powershell
$env:POSTGRES_USER = 'finance_user'
$env:POSTGRES_PASSWORD = 'change_me'
$env:DB_HOST = 'localhost:5432'
$env:POSTGRES_DB = 'finance_tracker'
$env:JWT_SECRET = 'replace-with-a-long-random-secret'
go run ./cmd/api
```

Сервер будет доступен по адресу `http://localhost:8080`. При получении `SIGINT`/`SIGTERM` он корректно завершается (до 15 секунд на закрытие соединений).

### 3. Запустить frontend

```powershell
Set-Location app
npm ci
npm run dev
```

Dev-сервер Vite слушает `http://localhost:3000` и проксирует запросы `/api/*` на `http://localhost:8080`, отрезая префикс `/api`. Поэтому для разработки ничего настраивать не нужно. Если API находится по другому адресу, создайте `app/.env.local` с `VITE_API_BASE_URL=http://host:port` (шаблон — [app/.env.example](app/.env.example)); тогда клиент обращается к нему напрямую, и на backend должен быть разрешён CORS для origin фронтенда. Пустое значение означает использование `/api`.

JWT хранится в `localStorage` под ключом `auth_token`.

## Запуск в Docker

Корневой [dockerfile](dockerfile) собирает один образ из трёх этапов: сборка SPA (Node 22), сборка статического Go-бинарника и финальный Alpine с Nginx. Внутри контейнера Nginx на порту 80 отдаёт SPA (с fallback на `index.html`) и проксирует `/api/` на Go API по адресу `127.0.0.1:8080`. Скрипт-обёртка запускает оба сервиса и завершает их по `SIGTERM`/`SIGINT`.

Локально приложение вместе с PostgreSQL запускается через Compose:

```powershell
Copy-Item internal\config\.env.example internal\config\.env
# в internal\config\.env замените DB_HOST на db:5432, пароль и JWT_SECRET
docker compose up --build
```

Интерфейс будет доступен на `http://localhost:8080` (порт 8080 хоста отображается на порт 80 контейнера), API — по пути `/api/`. Данные PostgreSQL хранятся в `./var/postgres` (каталог исключён из образа через `.dockerignore`).

> Healthcheck БД в [docker-compose.yaml](docker-compose.yaml) жёстко задаёт пользователя `finance_user` и базу `finance_tracker`. Если вы меняете эти значения в `.env`, поправьте и healthcheck.

## CI/CD и Kubernetes

Workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) запускается при push в `main` и состоит из трёх последовательных задач:

1. **test** — `go fmt ./...` и `go vet ./...` (Go `1.25.1`). Тесты не запускаются, их в репозитории пока нет.
2. **build** — сборка Docker-образа и публикация в GitHub Container Registry `ghcr.io/<owner>/<repo>` с тегами `latest` и `sha-<полный commit SHA>`.
3. **deploy** — выполняется на self-hosted runner с PowerShell: настраивает `kubectl` через ServiceAccount, применяет [k8s/deployment/deployment.yml](k8s/deployment/deployment.yml), выставляет образ `sha-<commit>` в `deployment/my-app` (namespace `production`) и ждёт завершения раскатки до 120 секунд.

Для деплоя в настройках репозитория нужны секреты `K8S_SERVER_URL` и `K8S_SECRET_YAML`. ServiceAccount `github-deployer`, роль и токен создаются один раз вручную: `kubectl apply -f k8s/serviceAccount/scaccount.yml`.

Ограничения текущего манифеста:

- `deployment.yml` берёт `JWT_SECRET` и параметры БД из `Secret` `app-env` (`envFrom`), а `CORS_ALLOWED_ORIGIN` задаёт значением. Шаблон Secret — [k8s/secret/secret.example.yml](k8s/secret/secret.example.yml). Создайте его в кластере один раз вручную с реальными значениями (команда `kubectl create secret generic app-env -n production ...` приведена в шаблоне) и не коммитьте настоящий Secret. Без этого Secret pod не запустится. `PORT` задавать не нужно: Nginx проксирует на порт API по умолчанию `8080`. Не вшивайте секреты в образ: он публикуется в GHCR;
- [k8s/service/service.yml](k8s/service/service.yml) создаёт `Service` `my-service` типа NodePort: порт 8088 в кластере, nodePort `30080`, целевой порт контейнера 80. Манифест не применяется workflow автоматически — выполните `kubectl apply -f k8s/service/service.yml` вручную, а права `github-deployer` на `services` уже есть в роли;
- PostgreSQL и `Ingress` в манифестах отсутствуют, БД нужно развернуть отдельно;
- образ в манифесте указан с фиксированным тегом; актуальный тег выставляет шаг `kubectl set image`.

## Проверка качества

Backend:

```powershell
go fmt ./...
go vet ./...
go test ./...
```

Автотестов на Go пока нет, поэтому `go test` лишь проверяет компиляцию пакетов; в CI выполняются `go fmt` и `go vet`.

Frontend (тестов пока нет, `npm run test` запускается с `--passWithNoTests`):

```powershell
Set-Location app
npm run check
npm run lint
npm run test
npm run build
```

## API

API использует JSON и запущено без префикса версии (за Nginx в Docker-образе и через dev-прокси Vite оно доступно под префиксом `/api`). Все маршруты, кроме перечисленных в разделе «Публичные», требуют заголовок:

```http
Authorization: Bearer <JWT>
```

### Публичные маршруты

| Метод | Путь | Назначение |
| --- | --- | --- |
| `POST` | `/users/auth/register` | Регистрация |
| `POST` | `/users/auth/login` | Вход и получение JWT |
| `PATCH` | `/users/auth/restore` | Восстановление удалённого пользователя |

Пример регистрации:

```http
POST /users/auth/register
Content-Type: application/json

{
  "first_name": "Иван",
  "second_name": "Иванов",
  "email": "ivan@example.com",
  "password_hash": "my-password"
}
```

Несмотря на название поля, `password_hash` в запросе содержит обычный пароль: сервер хеширует его bcrypt перед сохранением. Ответ `POST /users/auth/login` содержит объект вида `{"token":"<JWT>"}`.

### Защищённые маршруты

| Ресурс | Маршруты |
| --- | --- |
| Пользователь | `GET /users/:id/get`, `PATCH /users/:id/update`, `DELETE /users/:id/delete` |
| Справочники счетов | `GET /card`, `GET /wallet` |
| Счета | `GET /accounts`, `POST /accounts/`, `GET /accounts/:id`, `PATCH /accounts/:id/update`, `PATCH /accounts/:id/topup`, `PATCH /accounts/:id/withdrow`, `DELETE /accounts/:id` |
| Категории | `GET /category/categories`, `POST /category/add-category`, `PATCH /category/:id/update-category`, `DELETE /category/:id/delete-category` |
| Подкатегории | `GET /category/:id/subcategories`, `POST /category/add-subcategory`, `PATCH /category/:id/update-subcategory`, `DELETE /category/:id/delete-subcategory` |
| Торговые точки | `GET, POST /merchant`, `PATCH, DELETE /merchant/:id` |
| Теги | `GET, POST /tag`, `PATCH, DELETE /tag/:id` |
| Операции | `GET, POST /transactions`, `PATCH, DELETE /transactions/:id` |
| Переводы | `GET, POST /tranfers`, `GET /tranfers/:id` |
| Регулярные операции | `GET, POST /recurring-transactions`, `GET /recurring-transactions/list`, `GET /recurring-transactions/:id`, `PATCH /recurring-transactions/:id`, `PATCH /recurring-transactions/:id/pause`, `PATCH /recurring-transactions/:id/resume`, `DELETE /recurring-transactions/:id/` |
| Бюджеты | `GET, POST /budgets`, `GET, PATCH, DELETE /budgets/:id`, `POST /budgets/:id/categories`, `DELETE /budgets/:id/categories/:category_id`, `GET /budgets/:id/summary` |
| Цели | `GET, POST /goals`, `GET, PATCH /goals/:id`, `PATCH /goals/:id/status`, `GET, POST /goals/:id/contributions`, `DELETE /goal-contributions/:id` |
| Журнал действий | `GET /user-events` |

Обратите внимание на существующее написание пути `/tranfers` и `/accounts/:id/withdrow`: это часть текущего публичного контракта API.

### Примеры запросов

Создание счёта:

```json
{
  "name": "Основная карта",
  "account_type": "Карта",
  "balance": 5000,
  "card_type_id": 1,
  "wallet_type_id": null
}
```

Создание операции:

```json
{
  "account_id": 1,
  "category_id": 2,
  "subcategory_id": null,
  "merchant_id": null,
  "amount": 850,
  "recipient": null,
  "comment": "Продукты",
  "tag_ids": [1, 3]
}
```

Тип операции определяется сервером по выбранной категории. Для получения операций поддерживаются фильтры `account_id`, `category_id`, `merchant_id`, `type`, `date_from`, `date_to`, `min_amount`, `max_amount`, `limit`, `offset`. Даты в query-параметрах передаются в формате `DD-MM-YYYY`.

Создание регулярной операции:

```json
{
  "account_id": 1,
  "category_id": 2,
  "amount": 1500,
  "period_type": "Ежемесячно",
  "interval": 1,
  "day_of_month": 5,
  "start_date": "2026-06-05",
  "end_date": null,
  "timezone": "Asia/Dushanbe",
  "tag_ids": []
}
```

Допустимые периодичности: `Ежедневно`, `Еженедельно`, `Ежемесячно`, `Ежегодно`. Для еженедельного расписания `day_of_week` задаётся числом от `1` (понедельник) до `7` (воскресенье).

## Ключевые правила предметной области

- Сумма дохода или расхода должна быть больше нуля.
- Расход и перевод не допускают отрицательный остаток на исходном счёте.
- Создание, изменение и удаление обычной операции корректируют баланс счёта в одной транзакции PostgreSQL.
- Перевод создаёт две связанные записи операций и меняет балансы обоих счетов в одной транзакции.
- Пользователь видит и изменяет только собственные сущности.
- Удаление ряда сущностей реализовано как мягкое удаление на уровне базы данных.


