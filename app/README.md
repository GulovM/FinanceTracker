# Finance Tracker — веб-клиент

SPA на React 19 + TypeScript + Vite 7 для REST API из корня репозитория. Общее описание проекта, API и запуск через Docker — в [корневом README](../README.md).

## Стек

- React 19, React Router 7, TanStack Query 5;
- Tailwind CSS 3 и компоненты shadcn/ui на Radix UI (`src/components/ui`);
- react-hook-form + zod для форм, Recharts для графиков, Sonner для уведомлений.

## Запуск

```powershell
npm ci
npm run dev
```

Dev-сервер доступен на `http://localhost:3000`. Запросы `/api/*` проксируются на `http://localhost:8080` (префикс `/api` отбрасывается), поэтому достаточно запустить backend командой `go run ./cmd/api`.

Чтобы обращаться к API напрямую, задайте адрес в `.env.local` (шаблон — [.env.example](.env.example)):

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Если переменная пуста, клиент использует `/api`. В Docker-образе этот путь обслуживает Nginx.

## Скрипты

| Команда | Назначение |
| --- | --- |
| `npm run dev` | dev-сервер Vite |
| `npm run build` | production-сборка в `dist/public` |
| `npm run preview` | предпросмотр сборки |
| `npm run check` | проверка типов (`tsc -b`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest (тестов пока нет, запуск с `--passWithNoTests`) |

## Структура

```text
src/
├── App.tsx              # маршруты и ProtectedRoute
├── main.tsx             # точка входа
├── pages/               # Dashboard, Transactions, Accounts, Analytics, Budgets,
│                        # Goals, Recurring, Settings, Help, Login, Register, NotFound
├── components/
│   ├── layout/          # AppLayout, Sidebar
│   ├── shared/          # AccountCard, BudgetProgress, MetricCard, TransactionRow
│   └── ui/              # компоненты shadcn/ui
├── hooks/               # useAuth, use-mobile
├── providers/query.tsx  # QueryClientProvider
└── lib/
    ├── api.ts           # REST-клиент, токен, преобразование данных API <-> UI
    └── utils.ts
```

Все страницы, кроме `/login` и `/register`, доступны только авторизованному пользователю: иначе происходит редирект на `/login`. JWT хранится в `localStorage` (`auth_token`), идентификатор пользователя берётся из его payload (`user_id`).

Алиас `@` указывает на `src`, поэтому импорты выглядят как `@/components/ui/button`.
