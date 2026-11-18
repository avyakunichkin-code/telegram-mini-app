# Перенос знаний в Codex

Снимок: 2026-11-11, во время миграции корней продуктов. Статус после поручения об автономном Codex-контуре: **рабочие зависимости чтения сняты**. Предметные справки находятся в `game/docs/engineering/codex-knowledge/`; навыки, проверки, CI и навигация используют Codex-источники. Исходный снятый контур не читался повторно и не изменялся. Исходные изменения параллельной миграции сохранены; последующий срез дополнительно обновил рабочие ссылки и проверки.

Новые документы — справки с происхождением, не слой выше code/tests/spec. Старые абсолютные числа, результаты тестов и сообщения о багах не превращены в текущий канон. Ссылки на исторические пути ниже записаны как provenance, а не как зависимости чтения.

Исторические source-id ниже — идентификаторы происхождения, не пути для чтения. Точные исходные пути и снимки сохранены отдельно в [архиве](../archive/agent-migration-2026-11-11/README.md).

## Source → destination

| Источник | Назначение / решение | Статус |
|---|---|---|
| `source-id:skills/create-event/event-balance-rules.md` | [Game: баланс событий](../../game/docs/engineering/codex-knowledge/event-balance-rules.md) | Уникальные trade-off, lifecycle A–D, axis map и ручной аудит сохранены; §1–4/10/11 доступны |
| `source-id:skills/create-event/persona-profiles.md` | [Game: персоны](../../game/docs/engineering/codex-knowledge/persona-profiles.md) | Тон/audience и парные сюжеты сохранены; цифры перенаправлены на seeds |
| `source-id:agent-memory/economy-reviewer/MEMORY.md` и `project_*.md` | [Game: заметки ревью](../../game/docs/engineering/codex-knowledge/reviewer-notes.md), [существующие проверенные ориентиры](CODEX-INVARIANTS.md) | Подтверждённое отделено от гипотез; устаревшие claims сняты |
| `source-id:skills/db-baselines-and-migrations/reference.md`, rule `db-migrations` | [Game: инженерные детали](../../game/docs/engineering/codex-knowledge/engineering-notes.md), [migrations README](../../game/api/migrations/README.md), `$db-migration` | Non-ORM/ограничение models-only сохранены; DDL/seeds/YAML уже канонизированы |
| `source-id:skills/_shared/visual-assets-policy.md` | [Game: инженерные детали](../../game/docs/engineering/codex-knowledge/engineering-notes.md) | Реальные assets, формат/стиль, alt, локальные пути сохранены; снятый контур tool/blanket approval не копируется |
| `source-id:skills/admin-ops/SKILL.md`, `guidance-onboarding/SKILL.md` | [CODEX-PROCESSES](CODEX-PROCESSES.md) + [Game: вопросы ревью](../../game/docs/engineering/codex-knowledge/engineering-notes.md) | Процессы уже адаптированы; дополнительные ловушки сохранены как вопросы для сверки |
| `source-id:skills/_shared/game-lexicon.md` | [GLOSSARY](../../game/docs/foundation/GLOSSARY.md), [EVENTS_TERMS_RU](../../game/docs/handbook/EVENTS_TERMS_RU.md), [SPEC_PRODUCT](../../game/docs/foundation/SPEC_PRODUCT.md), game rules/period/victory | Дубль; отдельная копия не нужна. «Два события», gate=7 и старый Plan/shared-platform не переносить как неизменяемые константы |
| `source-id:rules/working-agreements.md`, `router.md`; shared `clarify-first`, `delivery-workflow`, `release-ready-quality`, responsibility matrix | [CONVENTIONS](../../CONVENTIONS.md), [AGENTS](../../AGENTS.md), [CODEX-PROCESSES](CODEX-PROCESSES.md), scoped skills | Дубли уже адаптированного процесса; не переносить требования инструментов снятого контура/моделей/разрешений |
| Rules `backend`, `events`, `fincore` | Domain skills, код + tests, [архитектура](../../ARCHITECTURE.md), Game event-справки выше | Дубли + устаревшие пути/предположения; не вводить новый канон из rule |
| Rules `frontend-core`, `frontend-a11y`, `frontend-mqx`, `design-lab`, `canon-sync` | [DESIGN_WORKFLOW](../../game/web/src/components/mqx/DESIGN_WORKFLOW.md), [SPEC_FRONTEND_UI](../../game/docs/specs/SPEC_FRONTEND_UI.md), MQX skills и [FRONTEND-REFERENCES](FRONTEND-REFERENCES.md) | Дубли; approval остаётся человеческим; generated files — через генераторы |
| `frontend-react/source-id:skills/{accessibility,composition-patterns,react-best-practices,frontend-design,vite}` | [FRONTEND-REFERENCES](FRONTEND-REFERENCES.md), текущие package/lock и локальные UI specs | Отбор уже существует; generic upstream не копируется в продукт. React 19/RSC/Next и beta Vite советы не универсальны для React 18/Vite SPA |
| `source-id:skills/idea-refine/{frameworks,refinement-criteria,examples}.md` | `$delivery` idea + существующие [шаблоны](../templates/) | Общие SCAMPER/JTBD/HMW/pre-mortem и учебные примеры не уникальны продукту; новой копии нет |
| Остальные активные `SKILL.md` (26 всего) | [CODEX-MIGRATION-MAP](CODEX-MIGRATION-MAP.md), [skill-migration.json](skill-migration.json) | Уже есть поимённая карта всех 26 и целевых процессов; не размножается здесь |
| `source-id:skills/{specs,results,templates,quality-rubric.md}`, `skill-test` scripts | [CODEX-AUDIT](CODEX-AUDIT.md), существующий migration map / [source-ledger](../archive/agent-migration-2026-11-11/source-ledger.json) | снятый контур smoke/quality fixtures и старые отчёты не продуктовый канон и не текущее доказательство проверок; writers не запускались |
| `source-id:skills/_archived/` | Исторический архив и существующая карта 11 архивных навыков | Не активирован; полный аудит тел архива этим срезом не заявлен. Общие studio-процессы не копируются в Game/Plan |
| `source-id:agents/`, `source-id:hooks/` | `.codex/agents`, [CODEX-HOOKS](CODEX-HOOKS.md), существующая карта поведения | Адаптация уже документирована; снятый контур permissions, hook payload и модели не переносятся |
| `source-id:launch.json` | [COMMANDS](COMMANDS.md), product manifests/config | Исторические порты: lab 4173, Game API 8000/web 5173, Plan API 8020/web 5190. Старые cwd/app-dir/env не копируются; запуск не проверялся |
| `backend/source-id:` | Проверен список файлов | Есть пустой `agent-memory`, `rg --files --hidden` не нашёл файлов; предметных знаний не обнаружено |

Для Plan отдельный `plan/docs/engineering/codex-knowledge/` не создан: уникальной Plan-справки в выбранных источниках нет. Порты launch — уже техническая конфигурация, старый embedded Plan противоречит текущим границам. Канон Plan остаётся в [plan/docs](../../plan/docs/README.md); Game-знания туда не копируются.

## Расхождения, обнаруженные при переносе

- Free lunch: исторический prose-порог расходился с `balance_contract.py`; описана фактическая проверка кода, без изменения поведения.
- Refusal: старый раздел говорил о ручном аудите, но код уже проверяет `refusal_needs_bonus` эвристикой заголовка в `soft_offer`/`tradeoff`.
- Informational: источник одновременно требовал ≥2 и одну кнопку. Ни один вариант не повышен до нового правила.
- Priority starvation и отсутствие сортировки активов: старые замечания уже частично устранены (`already_shown`, `order_by(FinanceAsset.id)`). Остальные memory claims — адресные гипотезы, не подтверждённые дефекты.
- Guidance: устаревшее «после commit» отвергнуто; текущий choose-path вызывает hook внутри savepoint до commit.
- Никакая цифра зарплаты, baseline или green test из исторического источника не выдана за результат этой задачи.

## Автономный Codex-контур: выполнено

По следующему поручению пользователя снято любое рабочее чтение старого контура:

1. Event authoring/audit читают Codex-справки; перенесены также onboarding, каталоги, шаблоны, ссылки в документации и комментарии кода.
2. Checker больше не перечисляет исходные skills и не хеширует снятый контур/Git-hooks snapshot. Вместо этого проверяет сохранённые 26 уникальных migration-записей и текущие targets. Старый --protected явно сообщает, что выполняет только автономную Codex-проверку; drift старых файлов он больше не измеряет.
3. Оба AI CI workflow запускают scripts/codex, а не старые scripts. Obsidian использует AGENTS; convention scan исключает исходный контур и исторический entrypoint; одноразовый path-patcher также читает только актуальные docs.
4. Проверка запрещает навигационные ссылки и executable-команды на старые источники. Plain-text provenance в исторических отчётах и JSON manifests допустимо и не является поручением открыть файл.
5. Поведенческие тесты подменяют файловые API с отказом доступа к любому source-id:исторический entrypoint; обычный checker и совместимый --protected проходят. Отдельный sentinel доказывает, что запрет в тесте действительно сработал.

Каталоги-исходники не удалены: данное поручение снимает чтение и переносит необходимые знания. Их наличие больше не нужно проверкам Codex. Сами снятый контур-настройки и регистрация старого клиента не редактировались; работа в другом клиенте не входит в доказанный автономный Codex-срез.

## Проверки последнего среза

- node scripts/codex/check.mjs — exit 0: 13 skills, 26 исторических mappings, 30 Markdown-файлов с проверкой ссылок; дополнительно scan документации на старые reading dependencies.
- node --test scripts/codex/*.test.mjs — exit 0: 15/15, включая отказ доступа к старым источникам в обоих режимах checker.
- .venv/Scripts/python.exe -X utf8 scripts/check_conventions.py — exit 0.
- quick_validate для event-authoring, event-audit, codex-config-audit — каждый exit 0.

В первом запуске новых тестов ошибка экранирования regex в тестовом preload дала 2 failure; исправлена, полный повтор прошёл. Product logic не менялась (в balance_contract.py изменён только docstring), backend/FE suites не запускались. Изменения CI проверены локальными командами; GitHub run и runtime клиентских hooks не заявлены.
