# Аудит дополнительного контура Codex

Начат 2026-10-29, продолжен 2026-10-30 (Europe/Moscow). Область — AI-архитектура основного checkout telegram-mini-app; продукт/формулы не менялись. Первый git status получен до любых записей. Сохранённый снимок сделан после создания двух служебных каталогов: строки ?? docs/ai/ и ?? scripts/codex/ в нём принадлежат этой задаче, не пользователю. Исходный git status в [status-before.txt](status-before.txt), SHA-256 защищённых файлов в [protected-before.json](protected-before.json). Уже были многочисленные пользовательские изменения (в том числе CLAUDE, 2 Claude instruction files, CONVENTIONS, backend/frontend/docs, удаления старого Plan и untracked память). Их не откатывали и не включали в собственную реализацию.

## Инвентарь и полнота

| Слой | Факт | Глубина |
|---|---|---|
| Root Claude skills | 26 non-archive SKILL.md | все тела, catalog и matrix полностью прочитаны независимым source_audit |
| Archive skills | 11 SKILL.md | перечислены, deferred, тела не читались/не активированы |
| Rules | 11 верхнего уровня | содержимое прочитано; backend/frontend/DB/fincore/events/lab/canon/router/agreements |
| Claude agents | 3 + README | полностью прочитаны, границы сохранены отдельно |
| Hooks | 5 behaviors, 6 .mjs включая tests + README/settings | исходники прочитаны; source scripts не запускались |
| Frontend nested skills | ещё 5 | все SKILL и 2 slim AGENTS прочитаны; upstream full/rules/references инвентаризированы, применимые рекомендации отобраны; весь upstream corpus не загружался |
| Commands | отдельной .claude/commands нет | slash entrypoints в 26 skills; explicit mapping в MIGRATION-MAP |
| Launch | 5 entries | полностью: lab/backend/frontend/plan-api/plan-web, не перенесены в выдуманную схему |
| Permissions | settings allow/deny | прочитаны без импорта в Codex; глобальные secret/config stores не читались |
| Memory | economy-reviewer MEMORY + 5 notes | прочитаны; выбранные факты проверены по коду, остальные hypotheses/stale отдельно |
| Git hooks | 14 *.sample, активных нет | перечислены, pre-commit sample прочитан; core.hooksPath unset, без изменения |
| CI | 3 исходных workflows | полностью прочитаны; backend + frontend CI действует, skills-check Claude-only |
| docs/agents | 10 .md | полностью независимым source_audit; прошлые audits не текущие PASS |
| Core decisions | CONVENTIONS, DOCUMENTATION_SYSTEM, ADR-012/013/016, PLAN_game-plan-split | полностью прочитаны, включая независимый повтор; evidence по source-ledger |
| App maps/manifests | app README, FE ARCHITECTURE, MQX workflow, package.json, pytest.ini, migrations/e2e/balance README | прочитаны, команды не взяты из общих шаблонов |

Машинный per-file реестр [source-ledger.json](source-ledger.json) хранит назначение, trigger, input/output, запись, зависимости/side effects, перенос/место, глубину review. Он не объявляет hash-only или listed файлы полностью просмотренными. Архивы, old specs/results и upstream references не стали активными автоматически. Инвентаризация excludes worktrees/node_modules/.venv/.git/caches/logs; первый широкий rg ошибочно вывел пути worktree, затем фильтр исправлен; контент worktree не использовался как проектный источник. Не было env/token/key/questionnaire/credential чтения. Local MCP/override в root/frontend не обнаружены; глобальный конфиг не исследовался.

## Найденный drift и принятые решения

- backend rule говорит «нет CI», но .github/workflows/ci.yml запускает backend pytest (с fincore), FE unit/guardrails/build. Используем manifest/CI.
- backend/game-economy prose содержит универсальный min period 7; текущий индекс/engine дают цепочку целей из конфигурации, общего 7-gate нет. Не копировать число как универсальный invariant.
- handbook skill требует MVP2 Plan Mode/save_kind=plan. Противоречит ADR-013/016: Plan отдельный prototype, не режим игры.
- create-event taxonomy «loader не читает» устарело: mvp11_catalog/seeds и spawn обрабатывают поля; не требовать старое дублирование extra.
- event-analysis исключает epilogue из mandatory gate, paid epilogues фактически blocks_period_end. Исключение не перенесено.
- guidance prose «после commit» спорит со своими invariants; choose.py выполняет hook в begin_nested до commit.
- matrix содержит 24 из 26 skills; новый map покрывает также meta/deferred и отсутствовавшие deprecation/layout.
- generic npm test/tsc/Vitest, обязательный commit/чистое дерево и Claude tool/model syntax не перенесены.
- frontend references React19/Next/Vite beta и старый v7/system-font бренд не универсальны для текущего React18/board-game канона.
- clarify-first «при любом сомнении STOP» адаптирован под текущую авторизацию пользователя/клиента: блокирующий вопрос только при действительно необходимом решении, не повторное согласие на уже порученные локальные правки.
- after-edit пишет throttle в .claude: не запускался. Новый state .codex-state, поскольку managed sandbox защищает .codex от runtime-записи.

## Клиент и границы доказательств

Local Codex desktop, managed filesystem/permissions из контекста; CLI 0.165.0-alpha.1.2, hooks stable true по features list. CLI --version/help/features доступны, с предупреждением об отказе записи PATH aliases в глобальный .codex/tmp. Это исходное ограничение, глобальные права не менялись. `--strict-config features list` не поддерживается, не выдан за успешный schema validator. Python alias/py launcher не работают; root .venv Python3.13 работает, CI Python3.14; платных API-вызовов настройки нет.

13 skills и три agent types появились в контексте клиента (обнаружение наблюдалось). Native hook deny не наблюдался: benign marker исполнился. Trust state не читался/не подделывался. Подробные статусы и последний шаг — [HOOKS](CODEX-HOOKS.md). Проверки и forward-eval отделены в [EVALS](EVALS.md); AI routing simulation не доказывает результат product tests.

## Официальная документация

По OpenAI Docs выполнены поиск и открытие официальных страниц: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills](https://learn.chatgpt.com/docs/build-skills), [hooks](https://learn.chatgpt.com/docs/hooks), [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced), [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [skills/prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), [review rules](https://developers.openai.com/blog/custom-code-review-rules-for-codex). Применимы repo skills/AGENTS/custom agents; не API Agents-конфигурация. Текущие docs не гарантируют runtime конкретного managed-клиента. Модель, провайдер продукта и аккаунт не менялись.

Дополнительное чтение всех 10 skill-test scripts: _inject-quality-block/_patch-workflow-block/_sync-smoke-specs и _maintain могут писать в .claude; _static/_context/_category/_archived/_claude-config/_resolve-read-if read-only. Ничего не запускалось. _static/_category могут завершаться 0 при NON-COMPLIANT; _context может считать agents как skills. Поэтому они не доказательство Codex.
