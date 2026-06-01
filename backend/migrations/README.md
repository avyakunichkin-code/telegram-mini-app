# SQL-миграции (без Alembic)

Два режима:

| Режим | Когда | Что гоняется |
|-------|--------|--------------|
| **Legacy (сейчас)** | Нет `0000_schema_baseline.sql` | Все `migrations/*.sql` по порядку имени |
| **Baseline + delta** | После squash | `0000_schema_baseline.sql` + новые `00NN_*.sql` в корне; старые — в [`archive/`](archive/README.md) |

Порядок — **лексикографический по имени** (`0000_…`, `0002_…`, …). Подпапки (`archive/`) **не** выполняются.

## Запуск

**Windows (рекомендуется):**

```powershell
cd backend
$env:DATABASE_URL = "postgresql://USER:PASS@HOST:5432/DBNAME"
.\migrate.ps1
```

**Пустая БД после squash (только DDL-baseline):**

```powershell
.\migrate.ps1 -BaselineOnly
```

**Старая БД без baseline, только инкременты:**

```powershell
.\migrate.ps1 -SkipBaseline
```

**Linux/macOS (инкременты вручную):**

```bash
export DATABASE_URL="postgresql://..."
for f in migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

После SQL при старте API `backend/main.py` выполняет **лёгкую автомиграцию** (`ensure_schema_compatibility`) и **seeds** (шаблоны, каталог событий из YAML).

## Baseline: одним файлом поднять схему

1. На БД, где уже применены все текущие миграции:

   ```powershell
   .\scripts\dump_schema_baseline.ps1
   ```

   → `migrations/0000_schema_baseline.sql` (`pg_dump --schema-only`).

2. Проверка на **пустой** PostgreSQL: `.\migrate.ps1 -BaselineOnly`, затем `python main.py` / pytest.

3. Опционально перенести историю:

   ```powershell
   .\scripts\archive_incremental_migrations.ps1 -WhatIf
   .\scripts\archive_incremental_migrations.ps1
   ```

   Файлы `0002` … `0043` окажутся в `archive/` (reference, не auto-run).

**Важно:** baseline — **только DDL**. Данные (шаблоны, события) — seeds в `main.py` + sync YAML, не SQL-архив.

**Prod с уже накатанной историей:** baseline повторно не применять; дальше только новые `.sql` в корне `migrations/`.

## Новая миграция

1. Следующий номер: `0044_*` (после squash; смотреть `ls migrations/*.sql`).
2. Имя: `NNNN_short_snake_case.sql` (латиница, одна тема на файл).
3. Писать **идемпотентно**, где возможно:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (PostgreSQL)
   - `INSERT … ON CONFLICT … DO UPDATE`
   - `UPDATE`/`DELETE` с явным `WHERE`
4. Синхронизировать **`backend/app/models.py`** и при необходимости блок в **`main.py`**.
5. Прогнать: `.\migrate.ps1`, затем pytest.

## Когда SQL vs только `main.py`

| Ситуация | Где |
|----------|-----|
| Новая таблица, индексы, **схема** `event_*` | **`.sql`** в `migrations/` |
| **Новое/изменённое событие** (контент) | **`data/events/mvp11/*.yaml`** → sync ([ADR-008](../../docs/decisions/ADR-008-events-catalog-single-source.md)) |
| Массовый одноразовый backfill | **`.sql`** по отдельному решению |
| Одна колонка, как у `save_kind` | **`.sql`** + guard в **`main.py`** |

## Prod

См. [`docs/ops/DEPLOY.md`](../../docs/ops/DEPLOY.md): Internal `DATABASE_URL` на Render, `.\migrate.ps1` из `backend/`.

## Не коммитить

- `_d.json`, `_t.json` — служебные заготовки.
- Alembic **не используется**.

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| [`../scripts/dump_schema_baseline.py`](../scripts/dump_schema_baseline.py) | Baseline: pg_dump или models + migrations |
| [`../scripts/verify_schema_baseline.py`](../scripts/verify_schema_baseline.py) | Сверка baseline с `app.models` |
| [`../scripts/archive_incremental_migrations.ps1`](../scripts/archive_incremental_migrations.ps1) | Перенос инкрементов в `archive/` |

## Связанные решения

- **save_kind:** [ADR-001](../../docs/decisions/ADR-001-save-kind-remove-light-hardcore.md)
- **Victory v2:** [ADR-002](../../docs/decisions/ADR-002-victory-engine-and-template-config.md)
- **Каталог событий:** [ADR-008](../../docs/decisions/ADR-008-events-catalog-single-source.md)
