---
name: db-baselines-and-migrations
description: >-
  Defines project rules for PostgreSQL schema baselines and incremental migrations.
  Use when editing backend/migrations/*.sql, changing SQLAlchemy models, regenerating schema baselines, or reviewing DB/index/constraint changes.
argument-hint: "[baseline | migration | review]"
user-invocable: true
---

# DB Baselines and Migrations (PostgreSQL)

## Прочитай сначала (ТВОЙ ХОД)

- `backend/migrations/README.md`
- `backend/scripts/dump_schema_baseline.py`

**Куда писать:** `backend/migrations/`. **Дальше:** `test-driven-development`, `documentation-and-adrs` (если меняется контракт/данные).

## Цель

Схема должна подниматься **детерминированно** и **быстро** на пустой БД, а миграции — быть **безопасными**, **обратимо‑предсказуемыми** и **проверяемыми**.

## Термины

- **Baseline**: `0000_schema_baseline.sql` — *только DDL*, без сидов/контентных апдейтов.
- **Incremental migration**: `00xx_*.sql` — изменения схемы и (иногда) data-migration.
- **Seed/контент**: наполнение справочников/событий — не часть baseline; живёт в сидерах приложения или отдельных миграциях данных с явной маркировкой.

## Правила (must-follow)

### 1) Baseline — строго DDL-only

В `0000_schema_baseline.sql` запрещены:

- `INSERT`, `UPDATE`, `DELETE`
- «контентные» `ALTER TABLE ...` из истории миграций (baseline должен уже содержать итоговую схему через `CREATE TABLE ...`)
- любые «Backfill» блоки

Если нужно стартовое наполнение — делай это **в сидерах приложения** или в отдельной **data-migration** (см. ниже).

### 2) Не создавай индексы, которые уже существуют из-за PK/UNIQUE

- `PRIMARY KEY (id)` в Postgres **уже создаёт индекс**. Индексы вида `CREATE INDEX ... ON table (id)` — почти всегда мусор.
- `UNIQUE (...)` создаёт уникальный индекс: не добавляй дублирующий `CREATE UNIQUE INDEX` с теми же колонками, если это не частичный/с другим order/opclass.

### 3) Индексы по FK — делай осознанно

Postgres **не** создаёт индекс автоматически на FK-колонках.

- Если FK используется в join/filter (`WHERE ..._id = ?`) — индекс обычно нужен.
- Если таблица маленькая/редко читается — индекс может быть лишним.

### 4) Разделяй schema-migration и data-migration

Если в миграции есть DML (апдейт данных):

- пометь это в заголовке файла как **DATA MIGRATION**
- делай апдейт **идемпотентным** (повторный прогон не должен ломать данные)
- избегай «тихих» массовых перезаписей без `WHERE`‑ограничений

### 5) Идемпотентность — по умолчанию

Для `00xx_*.sql`:

- `CREATE TABLE IF NOT EXISTS ...`
- `CREATE INDEX IF NOT EXISTS ...`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`

Если операция не идемпотентна — это должно быть **обосновано** и **проверено** (например, `DROP COLUMN`).

### 6) Порядок DDL

В baseline и миграциях:

- типы/таблицы-родители → таблицы-дети → индексы → foreign keys (если выносишь отдельно)
- избегай «склейки» baseline + куски старых миграций в один файл

### 7) UNIQUE обязателен для ссылок на “natural key”

Если `FOREIGN KEY` ссылается **не на PK**, а на «естественный ключ» (`chain_key`, `template_key`, и т.п.), то в таблице-родителе **должен быть**
`UNIQUE(...)` (или `PRIMARY KEY(...)`) **на ровно эти колонки**.

Практическое правило:

- Если видишь `REFERENCES parent (some_key)` и `some_key` не PK — добавь `UNIQUE (some_key)` в `CREATE TABLE parent` (или отдельным `ALTER TABLE ... ADD CONSTRAINT ... UNIQUE`, но **до** создания FK).

Иначе Postgres упадёт ошибкой вида: `there is no unique constraint matching given keys for referenced table`.

## Чеклист перед коммитом DB изменений

- [ ] **Baseline** не содержит `INSERT/UPDATE/DELETE`
- [ ] Нет индексов `... (id)` на PK
- [ ] Уникальности оформлены либо `UNIQUE (...)`, либо `CREATE UNIQUE INDEX ...` (без дублей)
- [ ] Любой FK на “natural key” ссылается на `UNIQUE/PK` в таблице-родителе
- [ ] Для горячих FK добавлены индексы (и наоборот — нет лишних)
- [ ] Для data-migration есть явный маркер и `WHERE`‑ограничения
- [ ] Скрипт запускается на пустой БД без ручных шагов
- [ ] Для «разрушительных» изменений (rename/drop/тип) выбран безопасный путь (см. expand/contract в `reference.md`)

## Анти‑паттерны (запрещено/нежелательно)

- «Baseline = baseline + история миграций + сиды» в одном файле
- Индексы на `id` при PK
- DML в baseline
- Массивные `UPDATE` без `WHERE`
- Миграции, которые «работают только один раз» без фикса идемпотентности/гейта
- «Тихое» удаление/переименование колонок без переходного периода в коде

## Red flags (остановись и перепроверь)

- В baseline появились `-- >>> 00xx_*.sql` маркеры или DML — значит файл «склеен» с историей миграций
- Миграция меняет данные без возможности оценить объём (`UPDATE` без узкого `WHERE`)
- Добавлен индекс “на всякий случай” без запроса/эндпоинта, который его использует
- Изменение типа/семантики поля без backfill и двойного чтения/записи

## Команды (bash)

## Bootstrap workflow (schema → seeds → events)

Цель: на пустой PostgreSQL получить **схему** + **минимальные справочники/каталоги** для работы приложения.

Порядок:

1. **Schema**: применить baseline (+ новые миграции, если есть).
2. **Seeds (reference + catalogs)**: идемпотентный upsert из кода.
3. **Events catalog**: синхронизация из YAML канона (`data/events/mvp11`) в PostgreSQL.
   Делается сидером (idempotent), **не** через baseline и не через миграции.

### Перегенерировать baseline

```bash
python backend/scripts/dump_schema_baseline.py --models-only
```

### Создать схему на пустой БД (baseline через psql)

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/0000_schema_baseline.sql
```

### Применить базовое наполнение (seeds)

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
python backend/scripts/seed_db.py
```

### Синхронизировать каталог событий (YAML → PostgreSQL)

```bash
export DATABASE_URL="postgresql://USER:PASS@HOST:5432/DBNAME"
python backend/scripts/sync_events_catalog.py
```

### Быстрая статическая проверка baseline (без БД)

```bash
bash .cursor/skills/db-baselines-and-migrations/scripts/validate_baseline.sh backend/migrations/0000_schema_baseline.sql
```

## Доп. материалы

- Подробная памятка и примеры: [reference.md](reference.md)

## Статус репозитория (важно)

Если текущий `backend/migrations/0000_schema_baseline.sql` содержит DML/маркеры миграций (часто бывает при «склейке» baseline + history),
то сначала приведи baseline к DDL-only (перегенерация + вырезание хвоста), и только потом полагайся на валидатор.

---

## Verification (после выполнения задачи)

- [ ] Baseline: DDL-only, без `-- >>> 00xx_*.sql`
- [ ] Миграции: читабельны, упорядочены, без дублей индексов/уникальностей
- [ ] Для data-migration: есть гейты/идемпотентность/оценка объёма затронутых строк
- [ ] Ничего не удалено “навсегда” без переходного периода (если это не сознательный breaking change)

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS** или **COMPLETE**.
