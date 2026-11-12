---
layer: plan
epic_id: PR-CI-PG
phase: define
status: draft
owner: engineering
last_reviewed: 2026-11-09
related:
  - PLAN_production-ready.md
---
# PLAN: паритет CI с PostgreSQL

## Проблема
Все backend-тесты идут на SQLite, а схему строят из моделей: `game/api/tests/conftest.py` ставит
`DATABASE_URL=sqlite:///...` и вызывает `Base.metadata.create_all`. Прод — PostgreSQL со схемой из
SQL-миграций (`game/api/migrations/0000_schema_baseline.sql` + `00NN_*.sql`). Ни миграции, ни
поведение PostgreSQL (типы, constraint'ы, транзакции) в CI не проверяются. Модель и миграции могут
разойтись незаметно: тесты зелёные, прод падает. Это же закрывает пункт «GO SQL-аудит» перед выкладкой.

## Срезы
| # | Срез | Результат |
|---|------|-----------|
| 1 ✅ код 2026-11-09 (ждёт первого прогона в GitHub) | Job `Postgres migrations` в `.github/workflows/ci.yml`: сервис `postgres:16`, `bash game/api/scripts/db.sh migrate` на пустой БД | Все миграции применяются с нуля без ошибок |
| 2 ✅ код 2026-11-09 | Тест дрейфа схемы `tests/test_pg_schema_drift.py`: наличие через `db_schema.missing_schema` (уже роняет старт API) + сверка NOT NULL; типы отложены (ложные срабатывания) | Расхождение модель↔SQL = красный CI |
| 3 ✅ код 2026-11-09 | Список `PG_CRITICAL` в `tests/conftest.py` (идемпотентность, закрытие периода и откат, победа, повтор выбора) помечается маркером `pg`; при `TEST_DATABASE_URL` фикстура `db_engine` берёт PostgreSQL (схема из миграций, TRUNCATE перед тестом), иначе те же тесты идут на SQLite | Критичные сценарии проверены на движке прода |
| 4 | Сделать job required в Settings → Branches → main после недели зелёных прогонов | Защита main |

## Решения и риски
- Срез 3 требует маркера (`@pytest.mark.pg`) и правки `conftest.py`: он сейчас жёстко задаёт SQLite
  на импорте. Менять осторожно, остальные тесты остаются на SQLite (быстро).
- Фильтры путей в `ci.yml` (SPL-405): новый job запускать при изменениях `game/api/`, `shared/packages/`,
  `.github/`.
- Если срез 2 найдёт дрейф, это находка аудита, а не повод подгонять тест: сначала разобрать, что
  верно, модель или миграция.

## Готово, когда
Новая миграция, расходящаяся с моделью, валит CI; критичный набор зелёный на PostgreSQL.
