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
│   ├── src/components/      # компоненты и layout
│   └── src/lib/api.ts       # клиент REST API
├── go.mod
└── README.md
```

## Требования

- Go версии, указанной в [go.mod](go.mod) (сейчас `1.25.1`);
- PostgreSQL 15+ и утилита `psql`;
- Node.js 20+ и npm.

## Быстрый запуск

### 1. Подготовить PostgreSQL

Создайте пользователя и пустую базу данных. Названия ниже приведены как пример:

```sql
CREATE USER finance_user WITH PASSWORD 'change_me';
CREATE DATABASE finance_tracker OWNER finance_user;
```

В PowerShell примените SQL-файлы строго в хронологическом порядке:

```powershell
$env:PGPASSWORD = 'change_me'
Get-ChildItem .\internal\db\migrations\*.sql |
  Sort-Object Name |
  ForEach-Object { psql -v ON_ERROR_STOP=1 -h localhost -U finance_user -d finance_tracker -f $_.FullName }
```

Миграции создают таблицы пользователей, счетов, операций, переводов, категорий, бюджетов, целей, регулярных операций и журнала событий, а также добавляют начальные типы карт, кошельков, категорий и подкатегорий.

### 2. Настроить backend

Создайте файл `internal/config/.env`:

```dotenv
DB_USER=finance_user
DB_PASSWORD=change_me
DB_HOST=localhost:5432
DB_NAME=finance_tracker
JWT_SECRET=replace-with-a-long-random-secret
```

`DB_HOST` может содержать порт. Не добавляйте реальные секреты в Git.

Запустите API из корня репозитория:

```powershell
go run ./cmd/api
```

Сервер будет доступен по адресу `http://localhost:8080`.

> Текущая версия backend пытается загрузить `.env` по абсолютному Windows-пути `D:\Desktop\Project\internal\config\.env`. Если репозиторий расположен в другом месте, перед запуском задайте переменные окружения в оболочке либо сделайте путь в `internal/app/app.go` относительным.

### 3. Настроить и запустить frontend

Создайте `app/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Затем в отдельном терминале:

```powershell
Set-Location app
npm ci
npm run dev
```

Vite выведет адрес локального интерфейса — обычно `http://localhost:5173`. Параметр `VITE_API_BASE_URL` обязателен для разработки: без него клиент обращается к относительному пути `/api`.

## Проверка качества

Backend:

```powershell
go test ./...
```

Frontend:

```powershell
Set-Location app
npm run check
npm run lint
npm run test
npm run build
```

## API

API использует JSON и запущено без префикса версии. Все маршруты, кроме перечисленных в разделе «Публичные», требуют заголовок:

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


