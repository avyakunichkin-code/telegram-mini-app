# ТВОЙ ПЛАН · PLAN

Общие границы — [AGENTS](../AGENTS.md), карта — [ARCHITECTURE](ARCHITECTURE.md).
Вход — [docs/README](docs/README.md), [spec](docs/specs/SPEC_plan-v1.md),
затронутый план и [дизайн](docs/DESIGN.md). GAME без причины не загружай.

PLAN — семейный финансовый чекап: календарные месяцы, ввод, отчёт и шаги.
Needs/events/victory/ходы и игровые MQX-компоненты сюда не переносить.
Не импортировать game. Финансы — fincore, инфраструктура — platform,
адаптеры и продуктовые сценарии принадлежат PLAN.
ADR-017 разрешает локальный P2; реальные пользователи и деплой остаются за его
отдельными условиями. Только синтетические данные; не читать env и реальные анкеты.

Primary — delivery / verify-change; API-поле — api-contract-change.
Общие навыки выбирают текущие файлы PLAN по [профилю](docs/engineering/CODEX-PROCESSES.md).
Игровые навыки остаются в области GAME; дубли в PLAN не создаются.
Дизайн — процесс PLAN; игровые mqx-design и frontend-implementation не primary.
Из корня продукта: `npm.cmd run check`; runner выбирает `plan/.venv`.
Адресно из api: `../.venv/Scripts/python.exe -m pytest -q` после установки среды
продукта; другой runtime задаётся явно через `PROJECT_PYTHON` / `E2E_PYTHON`.
Из web: `npm.cmd run test:unit`, `npm.cmd run build`, `npm.cmd run test:e2e`
для критичного пути. Изменение общего контракта проверяется у обоих потребителей.
