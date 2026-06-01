# ТВОЙ ХОД — Telegram Mini App

Игра по финансовой грамотности в формате Telegram Mini App: периоды («месяц»), подушка, обязательства, события, инвестиции и страховки MVP.

[![Deploy on Render](https://img.shields.io/badge/Deploy%20on-Render-blue?logo=render)](https://render.com)
[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue?logo=github)](https://avyakunichkin-code.github.io/telegram-mini-app/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-blue?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)

---

## Документация и онбординг

| Что | Где |
|-----|-----|
| Карта `docs/` (foundation, specs, plans, backlog) | [`docs/README.md`](docs/README.md) |
| Быстрый контекст для разработчиков и агентов | [`CLAUDE.md`](CLAUDE.md) |
| Конвейер idea → spec → plan → tasks | [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md) |
| Продукт и экономика MVP | [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) |

Идея и пороги баланса MVP (черновик): [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md).

---

## Возможности (текущий MVP)

- JWT-авторизация (логин и пароль)
- Режимы сохранения **`save_kind`**: `game` (старт из каталога **`game_starter_templates`**) и `plan` (в UI пока заглушка «Скоро»)
- Периоды с таймером: пауза, продолжение, ручной переход к концу периода (`process_period_end`)
- Зарплата **раз в период** по кнопке; не забрал до закрытия — за период не повторяется
- Подушка безопасности, активы и обязательства из шаблонов БД, **два** события с выбором на период
- Инвестиции MVP: депозит (капитализация), облигации (купоны на cash)
- Страховки MVP: покупка и ежемесячная премия
- Прогрессия: **tier событий** от `period_index`; character XP/level сняты ([ADR-003](docs/decisions/ADR-003-remove-character-progression.md)); достижения — backlog M12
- Интеграция Telegram Web App (тема, viewport)

Подробнее по эндпоинтам и папкам: [`CLAUDE.md`](CLAUDE.md).

---

## Архитектура репозитория

### Backend (`backend/`)

- `backend/main.py` — FastAPI, создание таблиц, точечная автомиграция колонок (без Alembic), роутеры
- `backend/app/models.py` — профили (`save_kind`, шаблон старта), финансы, события, инвестиции, страховки
- `backend/app/game/time.py` — якорь и длительность периода
- `backend/app/game/period.py` — экономика закрытия периода, просрочки MVP, счётчик поражения при отрицательном cash три периода подряд

### Frontend (`frontend-react/`)

- React 18 + Vite, `@telegram-apps/telegram-ui`, React Router
- [`frontend-react/src/hooks/useGame.js`](frontend-react/src/hooks/useGame.js) — обзор, время, переход периода, очередь событий
- [`frontend-react/src/components/GameScreen.jsx`](frontend-react/src/components/GameScreen.jsx) — основной игровой экран
- [`frontend-react/README.md`](frontend-react/README.md) — скрипты, деплой на GitHub Pages

---

## Локальный запуск

### Backend

Из каталога `backend`:

```bash
pip install -r requirements.txt
```

Переменные окружения (пример): `DATABASE_URL`, `SECRET_KEY`.

```bash
python main.py
```

На Windows для применения SQL-миграций при наличии `psql`: [`backend/migrate.ps1`](backend/migrate.ps1).

### Frontend

Из каталога `frontend-react`:

```bash
npm install
npm run dev
```

Сборка: `npm run build`. Превью сборки: `npm run preview`.

---

## Игровая механика (кратко)

- **Закрытие периода** списывает обслуживание активов, платежи по обязательствам (при нехватке cash — просрочка без штрафов MVP), базовые расходы «жизни», премии страховок и начисляет инвестдоход по правилам продукта
- **Условия победы MVP** считаются в `GET /api/finance/overview`: подушка ≥ **3 ×** месячных обязательств при нулевой суммарной просрочке и **`net_monthly_cashflow ≥ 0`**; флаг победы **не выставляется раньше** `period_index >= 7` (см. код и [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md))
- **Поражение:** три подряд периода с отрицательным **`cash`** после закрытия периода
- Финансовый «рейтинг» в overview ([`docs/specs/SPEC_ANALYTICS.md`](docs/specs/SPEC_ANALYTICS.md)) не управляет выпадением событий по уровню персонажа

---

## Миграции БД

Alembic не используется. Идемпотентные SQL-файлы в [`backend/migrations/`](backend/migrations/) (нумерация `0002`…`0037+`, см. [`backend/migrations/README.md`](backend/migrations/README.md)).

Запуск под Windows (нужны `psql` и `DATABASE_URL`):

```powershell
cd backend
$env:DATABASE_URL = "postgresql://..."
.\migrate.ps1
```

---

## Деплой (Pre-Alpha / prod)

Пошагово: **[`docs/ops/DEPLOY.md`](docs/ops/DEPLOY.md)** — свой домен `app.*` + API `api.*`, Render без cold start, GitHub Actions, BotFather, smoke.

Кратко:

| Слой | Куда |
|------|------|
| API + PostgreSQL | Render ([`render.yaml`](render.yaml), план Starter+) |
| SPA + лендинг | GitHub Pages (workflow [`.github/workflows/deploy-app.yml`](.github/workflows/deploy-app.yml)) |

Переменные сборки фронта: `VITE_API_BASE_URL`, `VITE_BASE_PATH` — см. [`frontend-react/.env.example`](frontend-react/.env.example).  
Ручной деплой: `cd frontend-react && npm run deploy` (после export env).

---

## Стек технологий

| Слой | Технологии |
|------|-------------|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (`python-jose`), uvicorn |
| Frontend | React 18, Vite 8, `@telegram-apps/telegram-ui`, `@twa-dev/sdk`, axios, React Router |

---

## Лицензия и вклад

См. репозиторий. Для изменений контрактов API синхронизируйте [`frontend-react/src/api.js`](frontend-react/src/api.js) и вызовы в хуках/экранах (согласовано с [`CLAUDE.md`](CLAUDE.md)).
