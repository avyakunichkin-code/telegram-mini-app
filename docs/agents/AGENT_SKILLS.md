---
tags:
  - tvoy-hod/layer/agents
aliases:
  - AGENT_SKILLS
---
# Навыки Codex

Активный каталог — [.agents/skills](../../.agents/skills/), границы — [AGENTS](../../AGENTS.md). Имя и description определяют выбор; SKILL.md читается по задаче. Нет обязательной загрузки всех справок и отдельного tier/catalog runtime.

| Задача | Primary |
|---|---|
| Idea/spec/plan, баг, docs, guidance/admin | delivery |
| Экономика | game-economy |
| События / аудит каталога | event-authoring / event-audit |
| API / SQL | api-contract-change / db-migration |
| Новый дизайн / утверждённый UI | mqx-design / frontend-implementation |
| Проверка / review / баланс | verify-change / review-change / balance-playtest |
| ADR / AI-конфигурация | architecture-decision / codex-config-audit |

[Процессы](../engineering/CODEX-PROCESSES.md), [frontend-справка](../engineering/FRONTEND-REFERENCES.md), [карта исторической адаптации](../engineering/CODEX-MIGRATION-MAP.md). Последняя хранит provenance, не открывает доступ к старым инструкциям. Поддерживающие навыки выбираются только по затронутому риску.

Роли находятся в [.codex/agents](../../.codex/agents/); запуск зависит от разрешений клиента. Регистрация hooks — [.codex/hooks.json](../../.codex/hooks.json), доказательства — [CODEX-HOOKS](../engineering/CODEX-HOOKS.md). Разрешения среды не расширяются проектной ролью.
