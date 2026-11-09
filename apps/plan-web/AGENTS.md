# ТВОЙ ПЛАН · frontend

Рабочий каталог frontend-проекта Codex — `apps/plan-web/`. Корневые
[правила](../../AGENTS.md) действуют; этот файл задаёт контекст Plan.

Начни с [документации Plan](../../docs/plan/README.md),
[SPEC_plan-v1](../../docs/plan/specs/SPEC_plan-v1.md) и затронутого плана.
Plan — семейный финансовый чекап: календарные месяцы, анкета, отчёт, шаги.
Игровые needs/events/victory/ходы, MQX-компоненты и канон Game сюда не переносить.
Не импортируй `backend/` или `frontend-react/`. Общие пакеты доступны через Vite aliases.

React 18 + Vite, свой API `apps/plan-api`, своё оформление.
Вход в дизайн и процесс утверждения — [Plan design](../../docs/plan/DESIGN.md).
Для Plan выбирай delivery/verify-change; игровые mqx-design и
frontend-implementation не являются его процессом по умолчанию.
Реальных анкет, продуктивной БД и деплоя в этом поручении нет.

Из этого каталога: `npm.cmd run test:unit`, `npm.cmd run build`,
`npm.cmd run test:e2e` для критичного UI-пути. `npm.cmd run dev` — порт 5190,
API proxy — 8020. Тесты приложения проверяют только Plan и общие пакеты;
межпродуктовый контракт — [shared UI](../../tests/shared-ui/README.md).
