# Дополнительные инженерные ориентиры из снятый контур-справок

Дата переноса: 2026-11-11. Provenance приведён по разделам; документы не вводят новый runtime-гейт, полномочия или продуктовые решения. Общие процедуры уже перенесены в [CODEX-PROCESSES](../../../../docs/engineering/CODEX-PROCESSES.md), [навыки](../../../../.agents/skills/) и [FRONTEND-REFERENCES](../../../../docs/engineering/FRONTEND-REFERENCES.md). Ниже — детали, которые полезно не потерять при удалении исторических источников.

## Non-ORM схема

Источник: `source-id:skills/db-baselines-and-migrations/reference.md`, `source-id:rules/db-migrations.md`. Текущий канон — [migrations README](../../../api/migrations/README.md), [db_schema.py](../../../api/app/db_schema.py) и schema tests.

Каталог без ORM-модели не появится через `create_all`. При его изменении адресно проверить DDL incremental migration, представление baseline при согласованном обновлении, регистрацию в `RAW_TABLES_BY_DIALECT`, идемпотентный seed и поведение reader до первого seed. Исторический пример — `victory_goals`. `--models-only` dump и ORM verifier могут не покрывать non-ORM таблицы: зелёная проверка ORM не доказывает полноту baseline. Не переносить старую инструкцию «добавить baseline при следующем squash» как разрешение выполнять squash или менять baseline автоматически.

Для natural-key FK проверить UNIQUE родителя; PK/UNIQUE уже создаёт индекс. Backfill ограничивать WHERE и делать идемпотентным. Rename/drop при несовместимости разделять на expand → запись/перенос → switch reads → contract. Это ориентиры выбора миграции, не поручение подключаться к production.

## Визуальные ассеты

Источник: `source-id:skills/_shared/visual-assets-policy.md`. Стиль и имеющиеся файлы — [brandbook](../../reference/brandbook/BRANDBOOK_MQX.md), [asset index](../../reference/brandbook/assets/INDEX.md); процесс — [DESIGN_WORKFLOW](../../../web/src/components/mqx/DESIGN_WORKFLOW.md).

Перед изготовлением нового ассета определить тип, формат, размер/aspect, стиль и путь. Если поручение/утверждённый вариант уже задаёт эти параметры, повторное согласование не требуется. Названия инструментов снятого контура и отдельный blanket approval перед генерацией не перенесены.

Готовый UI использует реальные файлы согласованного стиля; emoji, цветной прямоугольник или внешний placeholder не считать финальным визуальным ассетом. Реалистичный текст для макета допустим. Сначала проверить существующие ассеты и pipeline портретов. Смысловым изображениям дать alt, декоративным — пустой alt. Lab round должен открываться с локальными `./assets/` без 404; generated lab-base/index обновлять генератором. Не копировать `sync-lab.ps1` и старые пути из источника.

## Guidance и admin: сохранённые вопросы ревью

Источники: `source-id:skills/guidance-onboarding/SKILL.md`, `source-id:skills/admin-ops/SKILL.md`. Основные инварианты уже в CODEX-PROCESSES; следующие исторические детали требуют адресной сверки и не объявлены текущими багами:

| Область | Что проверить перед изменением |
|---|---|
| Guidance | `_load_progress` и миграция переименованных id; известные id должны выживать после seed/обновления curriculum |
| Gates | event-chosen счётчик любого периода против gate конкретного периода; не спутать beat и trigger |
| GET guidance | Синхронизация авто-гейтов может коммитить: не вызывать read-builder внутри чужой незавершённой транзакции без проверки |
| FE guidance | Не вызывает ли PATCH-handler повторный refreshOverview поверх refresh в patch; зеркало BE/FE и якоря обновляются вместе |
| Ops funnel | Измеряет ли воронка только spine или также O3 triggers; соответствует ли это названию метрики |
| Stuck scan | Scope видимой выдачи, вечный dedupe и пересечение stuck-типов; `hours_idle` порог или измеренное значение |
| Watchtower | Полнота фильтра stuck при limit/filter в Python; загрузка всех пользователей для funnel |
| Alert transaction | Внешняя отправка не откатывается при rollback вызывающего; не считать savepoint атомарностью Telegram и БД |
| Catalog write | Coercion bool/NaN/мусора; конфликт ключа create с суффиксом против PATCH-ошибки; enum mode |

В текущем [choose.py](../../../api/app/services/events/choose.py) guidance вызывается внутри `begin_nested()` до commit: старый абзац «после commit» отвергнут. Реальные алерты для проверки не отправлялись и этим документом не разрешены.
