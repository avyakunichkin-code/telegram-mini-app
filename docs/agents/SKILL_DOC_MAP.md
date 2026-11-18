---
tags:
  - tvoy-hod/layer/agents
aliases:
  - "Карта: фаза → скилл → документы (ТВОЙ ХОД)"
  - SKILL_DOC_MAP
---
# Навык → документация

Выбор навыка — [каталог Codex](AGENT_SKILLS.md). Один primary, дополнительные проверки — по риску.

| Стадия | Артефакт | Процесс |
|---|---|---|
| Идея | product docs/vision/ideas, IDEA_ONEPAGER | delivery: idea |
| Контракт фичи | product docs/specs, SPEC_FEATURE | delivery: spec |
| План / срез | product docs/plans и tasks, PLAN_FEATURE / TASK_SLICE | delivery: plan |
| Реализация | product code + docs по поведению | scoped domain skill |
| Проверка / review | evidence и воспроизводимые findings | verify-change / review-change |

Общие [шаблоны](../templates/), [система документации](../DOCUMENTATION_SYSTEM.md), [процессы](../engineering/CODEX-PROCESSES.md). Продуктовую документацию писать в game/docs либо plan/docs; общую инженерию — docs/engineering.

События: [баланс](../../game/docs/engineering/codex-knowledge/event-balance-rules.md), [персоны](../../game/docs/engineering/codex-knowledge/persona-profiles.md), [EVENT_BRIEF](../templates/EVENT_BRIEF.md). Код/tests выше spec, foundation и idea. Аудит — снимок, backlog — приоритет.
