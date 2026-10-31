# Памятка владельца

Локальный Codex-контур создан рядом с Claude. Начни с [AGENTS](../../AGENTS.md), [ролей](CODEX-ARCHITECTURE.md) и [команд](COMMANDS.md). 13 навыков и три custom review-типа обнаружены клиентом. Продуктовый код и финансовые формулы не менялись.

Примеры: `$delivery исправь опечатку README`; `$game-economy проверь зарплату`; `$event-authoring добавь событие`; `$event-audit проверь каталог`; `$api-contract-change добавь поле`; `$mqx-design новая карточка`; `$review-change проверь diff`; `$codex-config-audit проверь контур`. Обычная формулировка тоже подходит. Для guidance/admin скажи область — delivery откроет отдельный процесс. Роли можно вызвать «независимый economy-reviewer по этому diff», если текущий клиент разрешает делегирование; не запускать всю команду на мелочь.

Новый UI сначала показывает lab-варианты и ждёт твоего явного выбора до prod. Review агента — не твоё утверждение дизайна или нового baseline. Plan пока отдельный прототип; встроенный save_kind=plan не возвращается.

**Остаток активации:** просмотреть и доверить проектные hooks штатным механизмом клиента, затем новый чат/сессия и безопасный allow/deny smoke по [runbook](CODEX-HOOKS.md). Текущая native-блокировка не подтверждена; не считать hooks действующими. Если managed policy не допускает локальные hooks — требуется её владелец, обход не настроен. CLI/CI checks и executable adapter tests доступны отдельно.

Что проверить сейчас: `node scripts/codex/check.mjs --protected` и `node --test scripts/codex/*.test.mjs`. Полный отчёт фактически выполненных проверок/ошибок и routing simulation — [EVALS](EVALS.md). Claude/user changes сохранены snapshot; полный source map в [MIGRATION-MAP](CODEX-MIGRATION-MAP.md).

Дальше — калибровать по реальным задачам; PostgreSQL/reliability, баланс/контент и production Plan вводить по [готовности](CODEX-ROADMAP.md), не по выдуманным датам. Внешние аккаунты, отправки, деплой и глобальные разрешения не затронуты.
