---
layer: agents
status: active
tags:
  - tvoy-hod/layer/agents
  - tvoy-hod/status/active
aliases:
  - "AI онбординг"
  - AI_ONBOARDING
---
# AI онбординг · Codex

Начни с [AGENTS.md](../../AGENTS.md), [CONVENTIONS](../../CONVENTIONS.md) и AGENTS выбранного продукта. Карта репозитория — [ARCHITECTURE](../../ARCHITECTURE.md).

Выбери один primary из [.agents/skills](../../.agents/skills/). Читай его SKILL.md и только затронутые справки. [Процессы](../engineering/CODEX-PROCESSES.md) различают idea/spec/plan/implementation, guidance/admin и явно выбранный release/TMA/marketing.

Сохраняй изменения пользователя; не читай секреты и реальные анкеты. Новая Game-вёрстка проходит lab → человеческое утверждение → MQX → prod/canon. Plan остаётся отдельным прототипом. Дополнительные агенты — только при разрешении текущего клиента и необходимости изоляции; роль ревьюера не является человеческим approval.

Команды — [COMMANDS](../engineering/COMMANDS.md). Для AI-контура:

~~~text
node scripts/codex/check.mjs
node --test scripts/codex/*.test.mjs
~~~

Отчёт содержит результат, команды с exit code, ограничения и незакрытые решения. Состояние адаптеров — [CODEX-HOOKS](../engineering/CODEX-HOOKS.md); наличие конфигурации не доказывает runtime-блокировку. Старые source manifests — историческое происхождение, не список для чтения исходников.
