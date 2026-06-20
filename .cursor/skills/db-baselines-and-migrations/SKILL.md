---
name: db-baselines-and-migrations
description: >-
  PostgreSQL: baseline DDL, incremental migrations, db.sh, seeds vs SQL.
  Use when editing backend/migrations/*.sql, models.py, app/seeds/, ensure_schema in main.py, or regenerating 0000_schema_baseline.sql.
argument-hint: "[baseline | migration | seed | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# DB Baselines and Migrations (PostgreSQL)

## Прочитай сначала (ТВОЙ ХОД)

- [`backend/migrations/README.md`](../../../backend/migrations/README.md) — режимы migrate, prod, новый `00NN_*.sql`
- [`backend/scripts/db.sh`](../../../backend/scripts/db.sh) — **единая точка входа** (migrate / seed / bootstrap)
- [`backend/app/seeds/runner.py`](../../../backend/app/seeds/runner.py) — что наполняется на старте API
- [`backend/scripts/dump_schema_baseline.py`](../../../backend/scripts/dump_schema_baseline.py) — перегенерация baseline

**Куда писать:** `backend/migrations/`, `backend/app/seeds/`, `backend/scripts/`, [`backend/main.py`](../../../backend/main.py) (`ensure_schema_compatibility`).  
**Satellites:** `test-driven-development`; при смене контракта/каталога — `documentation-and-adrs`, `game-economy-and-victory` (цели победы).  
**Дальше:** `test-driven-development`, `game-economy-and-victory`, `code-review-and-quality`, `documentation-and-adrs` (см. `catalog.yaml` → `next_skill`).

## Три слоя (не смешивать)

| Слой | Где | Когда |
|------|-----|--------|
| **Schema** | `0000_schema_baseline.sql` + `00NN_*.sql` + `create_all` + `ensure_schema_compatibility()` | Таблицы, колонки, индексы, FK |
| **Seeds** | `app/seeds/*`, `seed_all()` на startup | Справочники, шаблоны старта, `victory_goals`, каталог событий из YAML |
| **Runtime patch** | `main.py` `ensure_schema_compatibility()` | Только лёгкие `ADD COLUMN` для уже существующих prod-БД без полного migrate |

**Контент событий** — только `data/events/mvp11/*.yaml` → `ensure_mvp11_event_catalog` (не SQL, не baseline). См. ADR-008.

**When NOT primary:** authoring YAML → **create-event**; логика периода без DDL → **game-economy-and-victory**.

## Термины

- **Baseline**: `0000_schema_baseline.sql` — *только DDL* (итоговая схема для пустой БД).
- **Incremental**: `0044_*.sql`, … в корне `migrations/` (после squash `0002…0043` в [`archive/`](../../../backend/migrations/archive/README.md)).
- **Seed**: идемпотентный upsert в Python; безопасен на **каждом** старте API.

## Prod / Render (типовой путь)

1. **Деплой API** — на startup: `create_all` → `ensure_schema_compatibility()` (в т.ч. таблицы без ORM) → `seed_all()`.
2. **Отдельный migrate** — если в релизе есть новый `00NN_*.sql` и БД уже жила без redeploy-only DDL:

   ```bash
   export DATABASE_URL="postgresql://..."
   bash backend/scripts/db.sh migrate
   ```

3. **Пустая БД локально / CI:** `bash backend/scripts/db.sh bootstrap` (= baseline-only migrate + seed).

На prod с **уже накатанной** историей: **не** перегонять весь `0000` повторно — только новые инкременты (или полагаться на startup, если изменение покрыто `ensure_schema` + seed).

## Правила (must-follow)

### 1) Baseline — строго DDL-only

В `0000_schema_baseline.sql` запрещены: `INSERT` / `UPDATE` / `DELETE`, маркеры `-- >>> 00xx_*.sql`, backfill-блоки.

Наполнение — в **сидах** (`runner.py`) или в инкременте с пометкой **DATA MIGRATION**.

### 2) Таблицы без SQLAlchemy-модели

Пример: **`victory_goals`** (каталог целей по `template_key`; читает `app/victory/goals_store.py`).

- DDL: в **baseline** и/или `00NN_*.sql`, плюс `ensure_victory_goals_table()` при отсутствии таблицы на старте.
- Данные: **`app/seeds/victory_goals.py`** из `VICTORY_CONFIG_BY_TEMPLATE_KEY` (не DML в baseline).
- `create_all` **не** создаёт такие таблицы — не забывать DDL.

### 3) Индексы и UNIQUE

- Не дублировать индекс на `id` при `PRIMARY KEY (id)`.
- FK на natural key (`template_key`, `chain_key`, …): в родителе **`UNIQUE`** на те же колонки **до** FK.

### 4) Schema vs data-migration

Data-migration в `00NN_*.sql`: заголовок **DATA MIGRATION**, идемпотентность (`ON CONFLICT`, узкий `WHERE`).

### 5) Идемпотентность инкрементов

`CREATE … IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, осознанные `DROP` — только с обоснованием.

### 6) Перегенерация baseline

```bash
python backend/scripts/dump_schema_baseline.py --models-only
```

Затем **вручную** добавить в baseline таблицы **без** ORM (если есть), прогнать валидатор. Сверка с моделями:

```bash
python backend/scripts/verify_schema_baseline.py
```

`verify_schema_baseline` проверяет только таблицы из `models.py`; каталоги вне ORM — отдельный чеклист в skill.

## Seeds (канон)

| Модуль | Назначение |
|--------|------------|
| `seed_reference_data` | категории расходов |
| `seed_catalogs` | `game_starter_templates`, capital/liability templates, **`victory_goals`** |
| `seed_events` | YAML mvp11 → `event_definitions` |

Вызов: startup `main.py` → `seed_all`; CLI: `bash backend/scripts/db.sh seed`.

## Команды (bash)

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"

# Схема: baseline + инкременты в корне migrations/
bash backend/scripts/db.sh migrate

# Только baseline (пустая БД)
bash backend/scripts/db.sh migrate --baseline-only

# Сиды (включая events из YAML)
bash backend/scripts/db.sh seed

# Пустая БД: schema + seeds
bash backend/scripts/db.sh bootstrap

# Перегенерация / проверка baseline
bash backend/scripts/db.sh baseline-dump
bash backend/scripts/db.sh baseline-verify

# Статика без БД
bash .cursor/skills/db-baselines-and-migrations/scripts/validate_baseline.sh backend/migrations/0000_schema_baseline.sql
```

## Чеклист перед коммитом DB-изменений

- [ ] Baseline без DML и без `-- >>>`
- [ ] Новый `00NN_*.sql` — следующий номер после `ls backend/migrations/*.sql`
- [ ] `models.py` согласован (если таблица в ORM)
- [ ] Каталоги/цели победы — сид, не baseline DML
- [ ] Таблица без ORM: baseline + `ensure_schema` или инкремент + seed
- [ ] `bash … validate_baseline.sh` для правок `0000_*`
- [ ] `pytest` после migrate/логики

## Анти‑паттерны

- DML в baseline; склейка baseline + archive миграций
- Ожидать, что `create_all` поднимет `victory_goals` и прочие non-ORM каталоги
- Контент событий в `migrations/*.sql`
- Массовый `UPDATE` без `WHERE`

## Доп. материалы

- [reference.md](reference.md) — expand/contract, data-migration, non-ORM checklist

## Согласование изменений

Перед записью SQL, seeds или правок `main.py`: **Могу записать эти изменения?** — если пользователь не дал явное «делай» / «запиши».

## Verification

- [ ] Пустая БД: `bootstrap` или migrate + startup без `UndefinedTable`
- [ ] Baseline проходит `validate_baseline.sh`
- [ ] Инкременты идемпотентны там, где заявлено

**Verdict:** PASS | FAIL | CONCERNS | COMPLETE

## Следующий шаг

После DDL/seeds — `test-driven-development`; при `victory_goals` — `game-economy-and-victory`; перед merge — `code-review-and-quality`; новая граница домена — `documentation-and-adrs`.
