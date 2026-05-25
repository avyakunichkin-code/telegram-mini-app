# SQL-миграции (без Alembic)

Идемпотентные скрипты в этой папке. Порядок — **лексикографический по имени файла** (`0002_…`, `0003_…`, …).

## Запуск

**Windows (рекомендуется):**

```powershell
cd backend
$env:DATABASE_URL = "postgresql://USER:PASS@HOST:5432/DBNAME"
.\migrate.ps1
```

**Вручную (любая ОС):**

```bash
export DATABASE_URL="postgresql://..."
for f in migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

После SQL при старте API `backend/main.py` выполняет **лёгкую автомиграцию** (`ensure_schema_compatibility`) — добавление отдельных колонок без отдельного файла, если так уже сделано для похожих полей.

## Новая миграция

1. Взять **следующий свободный номер** (сейчас последний: `0037_*`; смотреть `ls migrations/*.sql`).
2. Имя: `NNNN_short_snake_case.sql` (латиница, одна тема на файл).
3. Писать **идемпотентно**, где возможно:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (PostgreSQL)
   - `INSERT … ON CONFLICT … DO UPDATE`
   - `UPDATE`/`DELETE` с явным `WHERE`, без «сломать всё»
4. Синхронизировать **`backend/app/models.py`** и при необходимости блок в **`main.py`** (если колонку нужно поднять на старых БД без ручного psql).
5. Прогнать локально: `.\migrate.ps1`, затем `python main.py` / pytest.

## Когда SQL vs только `main.py`

| Ситуация | Где |
|----------|-----|
| Новая таблица, сиды, массовый UPDATE каталога | **`.sql`** в `migrations/` |
| Одна колонка на существующей таблице, как у `save_kind` | **`.sql`** + дублирующий guard в **`main.py`** (dev/prod без пропуска psql) |
| Только dev-окружение, временный костыль | Избегать; предпочитать SQL |

## Prod

См. [`docs/ops/DEPLOY.md`](../../docs/ops/DEPLOY.md): Internal `DATABASE_URL` на Render, `.\migrate.ps1` из каталога `backend/`.

## Не коммитить

- `_d.json`, `_t.json` — служебные заготовки, не миграции.
- Alembic в проекте **не используется**.

## Связанные решения

- **`save_kind` / Game vs Plan:** [`docs/decisions/ADR-001-save-kind-remove-light-hardcore.md`](../../docs/decisions/ADR-001-save-kind-remove-light-hardcore.md), миграция `0004_save_kind_game_templates.sql`.
- **Victory v2 / tutorial chain:** [`docs/decisions/ADR-002-victory-engine-and-template-config.md`](../../docs/decisions/ADR-002-victory-engine-and-template-config.md) — `0036_victory_invest_goal_order.sql` (порядок целей в JSON).
- **Разблокировка механик:** [`docs/decisions/ADR-004-mechanics-unlock-victory-chain.md`](../../docs/decisions/ADR-004-mechanics-unlock-victory-chain.md) — `0037_harder_invest_unlock_after_cushion.sql`.
- **Снятие XP/level:** [`docs/decisions/ADR-003-remove-character-progression.md`](../../docs/decisions/ADR-003-remove-character-progression.md) — `0031_remove_character_progression.sql`.
- Эпик G1: [`docs/specs/features/SPEC_game-plan.md`](../../docs/specs/features/SPEC_game-plan.md).
