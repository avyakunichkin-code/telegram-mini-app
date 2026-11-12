# ТВОЙ ХОД · GAME

Открывай эту папку как продуктовый проект Codex. Общие границы —
[AGENTS](../AGENTS.md), карта — [ARCHITECTURE](ARCHITECTURE.md).
Начни с [README](README.md) и затронутой spec/плана в docs; PLAN не загружай.

PWA/web primary, Telegram secondary. Одна экономика, один цикл периода, один API.
Контент событий — `data/events/mvp11/`, baseline SQL — DDL-only.
Финансы используют `../shared/packages/fincore`; адаптеры остаются в api.
Новый layout/карточка/CTA/sheet: lab → явное утверждение человека → MQX → prod.
Мелкие layout-neutral исправления — по
[DESIGN_WORKFLOW](web/src/components/mqx/DESIGN_WORKFLOW.md).
Исходники CSS/ассетов — design, экспорты обновлять генераторами.

Навыки: delivery для обычных задач; game-economy для экономики; event-authoring /
event-audit для контента; mqx-design / frontend-implementation для UI;
api-contract-change, db-migration, review-change, verify-change — по области.
Существенная экономика требует 30–40 периодов и осмысленного balance diff.
Review экономики без зелёного backend pytest — NEEDS REVISION.

Проверки из корня продукта: `npm.cmd run check`; runner выбирает `game/.venv`.
Адресно из api: `../.venv/Scripts/python.exe -m pytest -q` после установки среды
продукта; для переходной корневой среды — `../../.venv/Scripts/python.exe`.
Из web: `npm.cmd run test:unit`, `npm.cmd run build`, `npm.cmd run check:guardrails`;
Playwright для критичного UI. Review агента или тест не заменяют approval человека.
Сохраняй пользовательские изменения; не читать env, credentials и реальные анкеты.
