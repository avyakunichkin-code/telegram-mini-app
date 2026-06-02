# Reference: DB Baselines and Migrations

## Слои и ответственность

```
┌─────────────────────────────────────────────────────────┐
│ 0000_schema_baseline.sql + 00NN_*.sql (psql / db.sh)   │  DDL
├─────────────────────────────────────────────────────────┤
│ Base.metadata.create_all + ensure_schema_compatibility  │  ORM + light patch
├─────────────────────────────────────────────────────────┤
│ app.seeds.runner.seed_all (каждый startup)              │  DML upsert
└─────────────────────────────────────────────────────────┘
```

## Таблицы вне `models.py` (чеклист)

При добавлении каталога только в SQL:

1. `CREATE TABLE` в новом `00NN_*.sql` **и** в `0000_schema_baseline.sql` (при следующем squash/dump).
2. `ensure_*_table()` в seed или `ensure_schema_compatibility()` для prod, где migrate не гоняли.
3. Идемпотентный upsert в `app/seeds/<name>.py`.
4. Читатели (например `goals_store.py`) — ловить `ProgrammingError` / пустой список до первого seed (defense in depth).

Текущий пример: **`victory_goals`** — FK логический на `game_starter_templates.template_key` (UNIQUE в родителе).

## Когда добавлять индекс

- **PK/UNIQUE**: уже индексируются (не дублировать).
- **FK колонки**: индекс при join/filter по ним.
- **Комбинированные**: под конкретный `WHERE` / `ORDER BY`.

## Data-migration

- Идемпотентность: `ON CONFLICT`, `WHERE field IS DISTINCT FROM …`
- Заголовок файла: `-- DATA MIGRATION: кратко что и зачем`
- Оценка объёма: узкий `WHERE`, при необходимости батчи

## Baseline: структура файла

1. Заголовок (как регенерировать: `dump_schema_baseline.py --models-only`)
2. `CREATE TABLE …` (итоговая схема)
3. `CREATE INDEX …` / `UNIQUE` (без дублей PK)
4. Таблицы non-ORM — в конце блока таблиц, до общего блока индексов (как в репо)

## Expand / contract (rename / drop)

1. **Expand** — новое поле nullable / с default
2. **Dual-write** — приложение пишет в оба (если нужно)
3. **Backfill** — data-migration с `WHERE`
4. **Switch reads** — код читает новое
5. **Contract** — `DROP` отдельной миграцией после стабилизации

## `db.sh` vs прямой psql

Предпочитай **`bash backend/scripts/db.sh`** — единые флаги (`--baseline-only`, `--skip-baseline`), маскирование URL в логе.

Прямой `psql -f 0000_…` допустим для отладки одного файла.

## Сверка baseline с моделями

`verify_schema_baseline.py` — подмножество проверки (только ORM-таблицы).  
После `--models-only` dump проверь вручную: `victory_goals` и другие каталоги из archive/инкрементов.

## Render / Internal DATABASE_URL

Host вида `dpg-…-a` без точки — норма для **Internal** URL (только внутри Render). Локально — External URL. См. `main.py` `_validate_database_url` (warning, не fail-fast).
