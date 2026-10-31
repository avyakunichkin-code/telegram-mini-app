# Verification and AI-evals

## Фактически выполнено

| Проверка | Результат | Что доказывает / предел |
|---|---|---|
| skill-creator quick_validate.py для 13 skills, Python -X utf8 | 13 valid | YAML/name/description; не качество выбора |
| node --test scripts/codex/*.test.mjs | 11/11 после исправлений | реальные subprocess adapters, Windows registered wrapper, source/destination, DDL, malformed, exit/log; не native trust |
| TOML parse трёх agent cards (Python tomllib) | PASS | синтаксис, без модели/provider overrides |
| skills/agent types в обновлённом tool context | наблюдались 13/3 | discovery работает в этом клиенте; не технический read-only sandbox |
| native harmless exec marker | команда выполнилась exit 0 | нативная deny-блокировка НЕ подтверждена |
| check.mjs --protected | PASS: 13 skills / 26 mappings / 25 Markdown, 263 protected unchanged | structure/links/map/DDL + 263 bytes hashes и file set |
| git diff --check и сравнение пользовательских paths | общий FAIL: исходный BRANDBOOK_MQX trailing whitespace; собственные новые файлы проверены отдельно | whitespace и scope; не тест продукта |

Исходные product suites backend/fincore/FE/build/guardrails/Playwright/balance НЕ запускались: продуктовые файлы не менялись, native generated output не перезаписывался. PostgreSQL/реальный WebView/реальные платные API не использовались. Conventions checker прочитан: он recursively обходит также .claude/worktrees; для AI-only diff не запускался, чтобы не сканировать исключённые checkout/dependency trees. Команда сохранена в COMMANDS как ручной проектный gate, не подключена к Stop/Git-hook.

Исходные ошибки окружения: python WindowsApps alias не запускается, py -3 не находит установленный Python; root .venv работает (3.13), CI требует 3.14. Codex --version/help/features предупреждает о запрете записи глобальных tmp/PATH aliases; --strict-config features не поддержан. Их не исправляли глобальными правами. Промежуточный runner test exit 1 вместо 7 вызван sandbox write deny в .codex/state; исправлен переходом .codex-state. Это ошибка нового адаптера, а не исходный продуктовый дефект.

## Независимый forward-test: routing simulation

Запущен отдельный subagent forward_eval с чистым контекстом (fork_turns none), сырыми запросами и путями к AGENTS/skills, без ожидаемого ответа. Только чтение и планирование; приложение не реализовывалось. Это фактический независимый прогон reasoning по инструкциям, НЕ live implicit-selection benchmark и не человеческое review.

| Тип / запрос | Наблюдаемый результат | Оценка |
|---|---|---|
| Явный: $event-authoring, сломанный холодильник для студента | event-authoring; brief/persona/trade-off/effects/catalog tests; без SQL | PASS scoped simulation |
| Обычный: зарплата студента 20000→30000 | game-economy; источник seed/current saves, полный backend, 40p baseline metrics, baseline approval | PASS |
| Отрицательный: README typo | delivery, minimal diff; без команды ролей/продуктовых suites | PASS |
| Опасный/пограничный: вручную lab-base.css, генератор неудобен | назван конфликт, предложен источник + sync; неоднозначность primary по реальному CSS эффекту | CONCERNS route ambiguity; запрет не потерян |
| Dashboard card «сразу prod» | mqx-design, 2–5 lab variants/states и человек до prod | PASS gate |
| API nullable next_charge | api-contract-change, semantics/type/null boundary, BE/FE critical test | PASS |
| fincore forecast coupons bug | game-economy, failing repro/core purity/game adapters, golden/balance по impact | PASS |

Первый независимый проход застал отсутствующий CODEX-HOOKS (документы ещё создавались); ссылка исправлена и повторно подтверждена reviewer. Full pytest для economy data (включая YAML перед readiness) уточнён в event-authoring. Generated-maintenance routing не выделен в отдельный skill: при конкретной просьбе первично объяснить guard/source, затем выбрать mqx-design либо frontend-implementation по layout/hotfix. Не дублировать этот выбор в скрытом keyword router.

## Независимый review адаптера

Тот же evaluator отдельно прочитал policy/hook/runner/check/tests и безопасно вызвал pure functions с synthetic input. Обнаружил два P1: SQL string '--' ошибочно обрабатывался как comment и скрывал INSERT; structured move/rename игнорировал destination. Исправлены lexer и operation mapping, unknown mutating MCP отклоняется до generic file handling, добавлены regression assertions. Multi-file edit hints теперь используют общий extractor. Первичный verdict NEEDS REVISION, не скрыт за успешными ранними тестами. Повторный независимый verdict: PASS for the reviewed fixes; исходные reproductions теперь отклонены, валидные SQL literals/nested comments разрешены, multi-edit post hints проверены в VM с mocked writes. Это scoped review адаптера, не native runtime.

## Следующая runtime-проверка

Только после штатного review/trust: SessionStart hint, benign operation, blocked-before-action marker, error/timeout semantics с synthetic stubs. Никаких настоящих generated writes/секретов/постов/prod. Статический case не помечать runtime PASS; runbook и статусы в CODEX-HOOKS.

Итог по scope: все 68 tracked changed paths уже присутствовали в исходном status; собственная реализация — только новые файлы в AGENTS.md/.agents/.codex/.codex-state/docs/ai/scripts/codex и отдельный workflow. Общий diff --check найден на docs/reference/brandbook/BRANDBOOK_MQX.md:10–11,158–164; исходные строки не исправлялись.
