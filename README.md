# Findesk — Управленческий финансовый учёт

SaaS для управленческого финансового учёта малого и среднего бизнеса Казахстана.  
ДДС, ОПиУ, Баланс, ИИ-агент, Kaspi/Halyk импорт, Telegram-уведомления.

## Стек

- **Next.js 14** (App Router, TypeScript)
- **Prisma + PostgreSQL** (Supabase в production)
- **NextAuth.js v5** (JWT strategy)
- **shadcn/ui + Tailwind CSS**
- **Recharts** (графики)
- **Vercel AI SDK + Anthropic** (ИИ-агент)
- **Resend** (email дайджест)
- **Telegram Bot API** (согласование платежей)

---

## Деплой на Vercel + Supabase

### 1. Supabase — создать БД

1. Зарегистрироваться на [supabase.com](https://supabase.com)
2. Создать новый проект (регион: Frankfurt или Singapore)
3. **Settings → Database → Connection string** → скопировать URI
4. Вставить в `DATABASE_URL` и `DIRECT_URL`

### 2. Настроить переменные окружения

Скопировать `.env.example` в `.env.local` и заполнить:

```bash
cp .env.example .env.local
```

Ключевые переменные:
| Переменная | Где получить |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database |
| `DIRECT_URL` | То же, что DATABASE_URL |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) |
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) в Telegram |
| `CRON_SECRET` | `openssl rand -base64 32` |

### 3. Применить миграции БД

```bash
# Production (не dev!)
npx prisma migrate deploy

# Заполнить начальными данными
npx prisma db seed
```

### 4. Деплой на Vercel

1. Импортировать репозиторий на [vercel.com](https://vercel.com)
2. **Framework Preset**: Next.js (автоопределение)
3. Добавить все переменные из `.env.example` в **Environment Variables**
4. Нажать **Deploy**

### 5. Настроить Telegram Webhook (после деплоя)

```bash
curl "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url=https://findesk.kz/api/telegram/webhook"
```

### 6. Настроить домен для Resend (email)

1. Зарегистрироваться на [resend.com](https://resend.com)
2. Добавить домен `findesk.kz` → DNS-записи
3. Скопировать API-ключ в `RESEND_API_KEY`

---

## Локальная разработка

```bash
# Установить зависимости
npm install

# Запустить PostgreSQL (или использовать Supabase local)
# Применить схему
npx prisma db push

# Заполнить тестовыми данными
npx prisma db seed

# Запустить dev-сервер
npm run dev
```

Приложение доступно на [http://localhost:3000](http://localhost:3000)

Тестовые данные: `admin@demo.com` / `password123`

---

## Структура проекта

```
app/
├── (landing)/          # Публичный лендинг
├── (auth)/             # Логин / регистрация
├── (dashboard)/        # Основное приложение
│   ├── page.tsx        # Дашборд
│   ├── transactions/   # Транзакции
│   ├── cashflow/       # ДДС
│   ├── pnl/            # ОПиУ
│   ├── balance/        # Баланс
│   ├── debts/          # Обязательства
│   ├── budgets/        # Бюджет план/факт
│   ├── calendar/       # Платёжный календарь
│   ├── ai/             # ИИ-агент
│   ├── approvals/      # Согласование платежей
│   └── settings/       # Настройки
└── api/                # API маршруты
lib/
├── auth.ts             # NextAuth config
├── prisma.ts           # Prisma client
├── plan-limits.ts      # Тарифные ограничения
├── telegram.ts         # Telegram Bot API
├── digest.ts           # Email дайджест
└── parsers/
    └── kaspi-parser.ts # Kaspi/Halyk CSV парсер
```

---

## Переменные окружения

Все переменные описаны в [`.env.example`](.env.example).

## Лицензия

MIT
