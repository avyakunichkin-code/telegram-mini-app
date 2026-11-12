---
name: db-migration
description: Change the selected product database schema or SQL migrations, including backfill, repeatability and verification.
---

# db-migration

Определи продукт и его [профиль](../../../docs/engineering/CODEX-PROCESSES.md).
Читай только его модели/репозиторий, миграции и существующий runner; следующий номер
бери из его каталога migrations. Различай DDL, backfill и startup seeds. GAME:
baseline DDL-only, контент событий остаётся YAML. PLAN: отдельная схема и runner
tvoy_platform; не переносить соглашения игрового bootstrap без проверки кода.
Проверь FK/UNIQUE, null/default, повторный запуск и сохранность данных. Используй
синтетические данные. SQLite не доказывает PostgreSQL-совместимость; если нужен
разрешённый изолированный PostgreSQL и его нет, назови пробел. Изменение shared
migration runner требует проверок потребителей. Реальные БД и prod migrate
не разрешаются автоматически задачей изменения схемы.

Общие границы: [AGENTS.md](../../../AGENTS.md).
