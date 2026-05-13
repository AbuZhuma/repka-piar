# Repka

Маркетплейс репетиторов (Phase 1).

## Стек

- **Frontend:** Next.js 15 (React 19, TypeScript, next-intl, Radix UI, SCSS)
- **Backend:** Rust (Axum 0.7, SQLx, JWT, Argon2)
- **DB:** PostgreSQL 16

## Быстрый старт

```bash
docker-compose up -d
```

Сервисы:

| Сервис    | URL / порт                  |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8080        |
| Postgres  | localhost:5432               |

Учётные данные БД (dev): `repka` / `repka_dev`, db=`repka`.

## Health-check

```bash
curl http://localhost:8080/health     # backend
curl http://localhost:3000/api/health # frontend
```

Оба должны вернуть `{"status":"ok"}`.

## Локальная разработка (без Docker для приложений)

```bash
# Только Postgres в Docker
docker-compose up -d postgres

# Бэк
cd backend
cp .env.example .env
cargo run

# Фронт
cd frontend
cp .env.local.example .env.local
pnpm install
pnpm dev
```

## Структура

```
frontend/   # Next.js 15
backend/    # Rust + Axum
  migrations/  # SQLx миграции
```

## Логи

```bash
docker logs repka-piar-backend-1 -f
docker logs repka-piar-postgres-1 -f
```
