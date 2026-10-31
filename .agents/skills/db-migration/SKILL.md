---
name: db-migration
description: Change PostgreSQL schema, incremental SQL migrations or seed ownership while keeping the baseline DDL-only; excludes event content authoring.
---

# db-migration

Пример: «новая колонка модели». Не primary: новый YAML event.
Прочитай backend/migrations/README.md, backend/scripts/db.sh и app/models.py; следующий номер возьми из актуальных migrations. DDL baseline, идемпотентные increments и startup seeds — разные слои. PostgreSQL startup не создаёт схему; SQLite create_all только тестовый путь. Таблица без ORM тоже требует DDL и seed. Natural-key FK требует UNIQUE; backfill с WHERE и повторным прогоном. Не склеивай archive с baseline. Проверь tests/test_schema_canon.py, pytest и на изолированном PostgreSQL migrate/repeat при наличии разрешённого стенда. Отсутствие PostgreSQL назови пробелом, SQLite не эквивалентен. Продакшн migrate в эту задачу не входит.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
