---
name: event-authoring
description: Create or revise game YAML events, choices, effects and chains from a concrete brief; excludes catalog-only audits and SQL schema changes.
---

# event-authoring

Пример: «добавь YAML event про ремонт жилья». Не primary: обзор каталога ($event-audit), period.py ($game-economy).
Прочитай docs/templates/EVENT_BRIEF.md, .claude/skills/create-event/event-balance-rules.md и persona-profiles.md как предметные справки; проверь текущий loader и data/events/mvp11. Создай brief: persona, проблема, trade-off, effects, lifecycle, needs axes, chain и preview. Отдельный definition_key на вариант; только ALLOWED_EFFECT_KEYS; needs+ имеет цену, нет Pareto-доминанты, отказ с ценой. Housing downgrade: once либо ограниченный repeat с cooldown по §10; axes по §11. Taxonomy проверь по loader — не дублируй поля в extra по устаревшему тексту. Выплачивающий epilogue не исключай автоматически из blocks_period_end. Контент в YAML, не INSERT в SQL. Проверь каталог и effects через pytest -k event; перед готовностью economic data diff нужен полный backend pytest (включает fincore); крупный пакет → $event-audit и $balance-playtest.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
