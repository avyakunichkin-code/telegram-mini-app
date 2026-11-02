# platform — инфраструктура приложений

Общий **код** Game и Plan, не общие данные — [ADR-016](../../docs/decisions/ADR-016-two-products-shared-fincore.md) п.2 и п.5, срез SPL-302 ([`PLAN_game-plan-split`](../../docs/plans/PLAN_game-plan-split.md)). Импорт — `tvoy_platform` (имя `platform` занято stdlib).

## Правила

- Без доменов: не импортирует `app.*` (игра), `plan_api`, `fincore` — проверяет `tests/test_platform_db.py::test_platform_knows_no_domains`.
- У каждого приложения свой секрет, свой `iss`/`aud`, своя БД. Пакет только даёт инструменты.
- Изменения — аддитивные: тесты пакета входят в backend pytest (`testpaths` в `backend/pytest.ini`); игра на `platform` пока **не переведена** (SPL-301 — отдельный срез с balance diff = 0).

## Модули

| Модуль | Что |
|--------|-----|
| `tokens` | `TokenIssuer(secret, issuer, audience, ttl)`: `issue(sub, **claims)` / `verify(token)` → claims или `InvalidToken`. HS256 фиксирован, `iss`/`aud`/`exp`/`sub` обязательны — токен другого приложения или без `iss` (текущий токен игры) отклоняется. `secret_from_env` — в проде пустой или шаблонный секрет = ошибка старта |
| `db` | `Database(url)`: engine (SQLite в памяти — `StaticPool`; `postgres://` → psycopg 3), `session()` с commit/rollback, `get_session` для `Depends`, `ping()` |
| `migrations` | `migrate(engine, dir)`: файлы `NNNN_<slug>.sql` по порядку, каждый один раз, учёт в `schema_migrations`. Схема — только этим путём, не при старте API |
| `health` | `health_router(db, app_name, **extra)`: `GET /api/health` → 200 / 503, текст ошибки БД наружу не отдаётся |

Argon2id и формат ошибок API — в SPL-301, когда на пакет переходит игра: Plan паролей не хранит (вход по коду из письма).

## Тесты

```bash
cd packages/platform && py -3 -m pytest -q      # отдельно
cd backend && py -3 -m pytest -q                # вместе с игрой и fincore
```

Установка в приложение — `-e ../../packages/platform` в его `requirements.txt` (сейчас — `apps/plan-api`).
