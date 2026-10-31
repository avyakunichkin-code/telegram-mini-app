# Codex architecture

Локальный дополнительный контур. Вход: [AGENTS.md](../../AGENTS.md) → descriptions в [.agents/skills](../../.agents/skills) → один primary → только нужные справки/проверки. Проектный контракт не меняет managed permissions клиента. Claude остаётся самостоятельным контуром; его tool names, permissions и состояние не импортированы.

Навигация: [аудит](CODEX-AUDIT.md), [migration map](CODEX-MIGRATION-MAP.md), [процессы](CODEX-PROCESSES.md), [команды](COMMANDS.md), [hooks](CODEX-HOOKS.md), [инварианты](CODEX-INVARIANTS.md), [frontend references](FRONTEND-REFERENCES.md), [roadmap](CODEX-ROADMAP.md), [памятка владельца](CODEX-RECOMMENDATIONS.md).

## Слои и полномочия

1. Решения: CONVENTIONS, ADR, spec и текущий код/тесты. AI-документы описывают работу, не новый продуктовый backlog.
2. Маршрутизация: корневой AGENTS и 13 обнаруживаемых skills. Процессы guidance/admin и deferred — явно связанная справка delivery, а не невидимые автоправила.
3. Ролевые карточки ниже — области ответственности одного агента или изолированного прохода. Число ролей не задаёт число процессов/агентов.
4. Адаптеры: scripts/codex; регистрация только .codex/hooks.json. Состояние .codex-state (gitignored), не .claude.
5. Проверка: локальные поведенческие тесты, статический checker и дополнительный CI workflow. Нативные hooks требуют trust/runtime evidence отдельно.

У каждой роли вход — конкретная задача, затронутые файлы/diff, применимые решения и доступные результаты проверок. Никто не получает права владельца-человека, prod-доступа или разрешения на внешние сообщения. Область записи — договор процесса, не технический sandbox.

| Роль / когда нужна | Вопросы и обязательные источники по области | Что может менять | Артефакт и handoff |
|---|---|---|---|
| Координатор продукта: неоднозначная идея/фича | проблема, аудитория, scope, gate; DOCUMENTATION_SYSTEM, текущая spec | idea/spec/plan только согласованной задачи | one-pager/AC/срез → профильный инженер; приоритет утверждает человек |
| Архитектор общих пакетов: fincore/границы | что действительно общее; ADR-016, split plan, fincore README | packages и адаптеры по согласованному срезу, ADR | схема границ, golden/diff → economy/BE; platform пока только план |
| Инженер экономики: формула/период/победа | инварианты, источник чисел, порядок проводок; period.py, victory, spec | game/finance/victory/needs/seeds и тесты | код + pytest + trace → economy-reviewer |
| Баланс-дизайнер: существенная смена чисел | метрики, политики, победимость, цена выбора; balance README/THRESHOLDS | данные в рамках принятого rebalance; baseline только после явного принятия | гипотеза/метрики → runner и человек для playtest |
| Автор/аналитик событий: YAML/каталог | brief, persona, trade-off, lifecycle/axes, loader; EVENT_BRIEF, balance rules | author пишет YAML/brief; audit пишет только отчёт | ключи/effects/tests/gaps → event-audit/economy |
| Backend/API/DB: контракт или схема | auth/null/error/транзакции/DDL; app README, migrations README, текущие schemas | router/service/schema/models/migrations/seeds по области | contract test + миграционный runbook → FE/QA |
| UX/MQX-дизайнер: новый паттерн/layout | варианты/состояния/бренд; DESIGN_WORKFLOW, theme APPROVED | только lab до approval | 2–5 вариантов и выбор → человек → frontend |
| Frontend: утверждённый UI/hotfix | API/state/a11y/React 18; ARCHITECTURE, frontend references | screens/mqx/styles/api/hooks и canon после approval | рабочий UI + проверки → mqx-ui-reviewer |
| QA/reviewer: регрессия/крупный diff | CS, независимое воспроизведение, доказательства; COMMANDS, текущие тесты | QA тесты при поручении; review без правок | findings/команды/риски → автор |
| Release/ops: явно перед выпуском | PWA/web readiness, rollback, миграции; ops/DEPLOY, CI | локальный отчёт; внешние действия только отдельной авторизацией | readiness/блокеры → владелец |

## Три независимых прохода

Реальные определения: [.codex/agents](../../.codex/agents). Они используют документированную TOML-форму name/description/developer_instructions, без выбора модели и без попытки заменить sandbox. Текущий клиент предоставляет collaboration; запуск custom agent по имени в новом чате ещё не наблюдался. До подтверждения обнаружения можно явно передать карточку доступному субагенту. Делегирование только при разрешении действующих клиентских инструкций и необходимости независимости, не на каждой задаче.

| Проход | Вход / чтение | Запись | Выход и получатель |
|---|---|---|---|
| economy-reviewer | diff, spec, invariants, backend pytest evidence | без правок; память Claude не открывается на запись | APPROVED/CONCERNS/NEEDS REVISION; при логике/данных без green pytest — revision → инженер |
| economy-balance-runner | manifest/policy/seed, sim JSON, baseline | reports в docs/balance/reports; source/baseline не меняет | OK/REVIEW/REGRESSION LIKELY/BLOCKED + метрики → баланс-дизайнер/economy reviewer |
| mqx-ui-reviewer | diff, размер изменения, lab/prod, реальное approval, canon | без правок | UI verdict, состояния/guardrails/следующий шаг → frontend/дизайнер |

Надпись read-only и TOML не техническая защита. Custom agents наследуют permissions родителя. Claude memory-only guard не подменён фиктивным аналогом: автоматической памяти Codex здесь нет, write isolation требует отдельного подтверждённого runtime-контроля. При отсутствии изоляции называй результат отдельным проходом, не технически read-only исполнением.

## Критерий маршрута

Зарплата/пороги → game-economy + meaningful balance; YAML → event-authoring без SQL; Dashboard card → mqx-design до approval; API → api-contract-change + critical test; fincore bug → shared-kernel neutrality; generated CSS → отказ от ручной правки/точный источник; README typo → delivery без полной команды/симуляции. Результаты AI-evals и ограничения — [EVALS](EVALS.md).
