---
layer: index
status: active
aliases:
  - "Документация ТВОЙ ХОД"
  - "Документация Game и Plan"
---
# Документация · Game / Plan

Выберите продукт; его spec, очередь, исследования и дизайн имеют отдельного владельца.

| Продукт | Документация | Дизайн | Задачи |
|---|---|---|---|
| ТВОЙ ХОД | [Game](game/README.md), [подробный каталог](game/CATALOG.md) | [Game design](game/DESIGN.md) | [Game tasks](game/tasks/README.md) |
| ТВОЙ ПЛАН | [Plan](plan/README.md) | [Plan design](plan/DESIGN.md) | [Plan tasks](plan/tasks/README.md) |

Общие материалы репозитория:

- [Структура и архив](PROJECT_STRUCTURE.md), [система документации](DOCUMENTATION_SYSTEM.md).
- [Принципы](../CONVENTIONS.md), [ADR](decisions/README.md), [шаблоны](templates/).
- [Общее ядро](plans/PLAN_game-plan-split.md), [карта роадмапов](ROADMAPS.md).
- [Рабочие контексты Codex](ai/WORKSPACES.md), [AI-процессы](ai/CODEX-ARCHITECTURE.md).
- [Obsidian](OBSIDIAN.md), [Home](Home.md), [журнал изменений](CHANGELOG.md).

Канон продуктов физически разделён: `docs/game/` и `docs/plan/`, внутри —
собственные слои документации. Общие материалы перечислены выше.
[Реестр переносов Game](product-doc-relocations.json) сохраняет прежние адреса;
по ним остаются только ссылки совместимости, скрытые из обычного поиска.
