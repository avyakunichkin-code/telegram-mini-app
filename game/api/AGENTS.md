# ТВОЙ ХОД · API

Корневые [правила](../AGENTS.md) действуют. Контекст — игра:
[Game docs](../docs/game/README.md), затронутая spec и код/тесты.
Одна экономика; закрытие месяца — через канонический игровой pipeline.
Plan не режим Game; не импортировать `apps/plan-*`.

Зарплата/period/victory/needs — game-economy; события — event-authoring либо
event-audit; API — api-contract-change; схема — db-migration.
Контент событий — `data/events/mvp11/`, SQL baseline — DDL-only.
`fincore` получает DTO через адаптеры, без ORM и игровых понятий внутри ядра.

Проверки и рабочий Python — [COMMANDS](../docs/ai/COMMANDS.md).
Для логики/данных нужен зелёный `python -m pytest -q` (включает fincore).
При существенной экономике — 30–40 периодов и осмысленный baseline diff.
