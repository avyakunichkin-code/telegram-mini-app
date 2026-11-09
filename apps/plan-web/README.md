# ТВОЙ ПЛАН · frontend

React 18 + Vite, отдельный клиент семейного финансового чекапа.
[Документация](../../docs/plan/README.md) · [Дизайн](../../docs/plan/DESIGN.md) ·
[Инструкции](AGENTS.md) · [API spec](../../docs/plan/specs/SPEC_plan-v1.md).

Из этого каталога: `npm.cmd run dev` (5190), `npm.cmd run test:unit`,
`npm.cmd run build`, `npm.cmd run test:e2e`.
API proxy ведёт к plan-api на 8020. Использовать только вымышленные данные.

Общие зависимости разрешаются aliases из `packages/`; игровой frontend не
импортируется. Межпродуктовый контракт проверяется отдельно:
из корня — `node --test tests/shared-ui/*.test.mjs`.
