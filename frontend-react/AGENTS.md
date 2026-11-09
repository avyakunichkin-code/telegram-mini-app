# ТВОЙ ХОД · frontend

Рабочий каталог frontend-проекта Codex — `frontend-react/`. Корневые
[правила](../AGENTS.md) действуют; этот файл задаёт контекст игры.

Начни с [документации Game](../docs/game/README.md) и затронутой spec.
Продукт — одна игра, один SPA/API и одна экономика; PWA/web primary,
Telegram secondary (ADR-012/013). Plan не режим и не `save_kind` игры.
Не импортируй `apps/plan-*` и не используй документы Plan как требования игры.

React 18 + Vite. Состояние, API и границы — [ARCHITECTURE](ARCHITECTURE.md).
Новый layout/карточка/CTA/sheet: lab → явное утверждение человека → MQX → prod;
hotfix без смены layout — по [DESIGN_WORKFLOW](src/components/mqx/DESIGN_WORKFLOW.md).
Вход в дизайн — [Game design](../docs/game/DESIGN.md).

Проверки из этого каталога: `npm.cmd run test:unit`, `npm.cmd run build`,
`npm.cmd run check:guardrails`; Playwright для затронутого критичного пути.
Общий ButtonBase остаётся в `packages/ui-kit`; изменения общего контракта
проверяй отдельно по [shared UI](../tests/shared-ui/README.md).
