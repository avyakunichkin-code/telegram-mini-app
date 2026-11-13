# GAME / PLAN

Два самостоятельных продукта в одном репозитории.

- [ТВОЙ ХОД — GAME](game/README.md): игра финансовой грамотности.
- [ТВОЙ ПЛАН — PLAN](plan/README.md): семейный финансовый чекап.
- [Общие библиотеки](shared/README.md): финансовое ядро, инфраструктура и примитивы.

Открывай game/ или plan/ отдельным проектом в Codex.
[Архитектура](ARCHITECTURE.md) · [Правила](AGENTS.md) · [Документация](docs/README.md).

Из папки продукта: npm.cmd run dev, npm.cmd run build, npm.cmd run check.
API запускается отдельно: node ../scripts/project.mjs game api (или plan api).
Сначала установи зависимости web и API по их lock/requirements; подробности в README продукта.
Для одновременных изменений используй отдельные Git worktree и окружения.
Коммиты и публикации миграцией не выполняются.
