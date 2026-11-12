---
tags:
  - tvoy-hod/layer/agents
aliases:
  - "Фаза скиллов: контент, данные, согласованность механик"
  - SKILLS_PHASE_CONTENT_AND_DATA
---
# Выбор процесса для контента и данных

Действующий маршрут — [AGENT_SKILLS](AGENT_SKILLS.md) и [CODEX-PROCESSES](../engineering/CODEX-PROCESSES.md). Старая phase/tier taxonomy не является исполняемым каталогом Codex.

- YAML-событие: event-authoring; read-only каталог: event-audit.
- Period/victory/needs/стартовые числа: game-economy; существенная экономика: balance-playtest.
- Схема/seed ownership: db-migration; event content остаётся в YAML.
- API: api-contract-change; новый UI: mqx-design, утверждённый: frontend-implementation.
- Проверки и review: verify-change / review-change по области.

Качество = полный согласованный срез, проверенный контракт/ссылки, результаты команд и названные риски. Человеческое утверждение дизайна не заменяют роль, отчёт или зелёный тест. Release/TMA/deprecation/marketing выбираются только явно. Проверки и команды — [COMMANDS](../engineering/COMMANDS.md).
