---
layer: audits
kind: qa
status: active
last_reviewed: 2026-11-11
audience: qa, engineering, product
doc_type: audit
verdict: PASS
source: локальные автоматические проверки, скриншоты и независимые scoped review
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/qa
aliases:
  - DC-09 — закрытие «Цены решений»
---
# DC-09 — закрытие «Цены решений»

Снимок проверки 2026-11-11, не новый источник продуктовых решений. Канон поведения — [spec](../../specs/features/SPEC_run-finale-decision-cost.md); порядок работ и подтверждения PO — [план](../../plans/PLAN_run-finale-decision-cost.md). `implemented` означает локальную реализацию; merge/deploy не выполнялись.

## Принятый срез

- DC-01…05: nullable связи журнала с кредитом и экземпляром события, четыре типа кандидатов, `run_finale.decisions` и совместимое `monthly_burn` для подписи масштаба.
- DC-06: средний регулярный доход за закрытые ходы с оценкой пропущенных зарплат; PO предварительно выбрал **1×** («Давай пока 1х»). Проводки экономики не менялись.
- DC-07…08: PO утвердил **A · Чек** для обоих исходов; блок в `MqxRunFinale` и каталоге, 0/1/3 строки, «≈», доступные знаки и `MoneyText`, месяцы расходов только как масштаб суммы.
- DC-09: parent/feature specs, CHANGELOG, plan, backlog, TRACEABILITY и DOC_SYNC_LOG приведены к текущему коду. Расширение реализовано локально, публикация не заявляется.

## Проверки и доказательства

Windows, рабочий Python — корневая `.venv/Scripts/python.exe` (3.13), PostgreSQL **18**, системный Chrome. CI Python 3.14 этим локальным прогоном не подменяется. Сырые логи и balance JSON находятся в `game/docs/balance/reports/` и игнорируются Git по существующему правилу; этот свод хранится отдельно, чтобы статус не зависел от локальных файлов.

| Проверка | cwd / команда | Результат |
|---|---|---|
| Полный backend + fincore/platform после включения 1× | `backend`: `../.venv/Scripts/python.exe -m pytest -q` | **718 passed, 1 skipped**, exit 0, `DC-06_1x-backend.log` |
| Формулы, контракт финала и измеритель | `backend`: `../.venv/Scripts/python.exe -m pytest -q tests/test_run_finale_decisions.py tests/test_run_finale.py tests/test_decision_cost_playtest.py` | **42 passed**, exit 0, `DC-06_1x-targeted.log` |
| Повторный отбор сохранённых первых финалов | `select_decisions` на кандидатах DC-06 с порогом среднего дохода | **6/6** совпали с `1x_mixed`, exit 0, `DC-06_1x-recorded-verification.log` |
| Frontend unit / build | `frontend-react`: `npm.cmd run test:unit`; `npm.cmd run build` | exit 0; логи DC-08 `dc08-unit.log`, `dc08-build-verified.log` |
| UI в Chrome | `frontend-react`: `npm.cmd run test:ui-kit -- --grep "A · Чек\|пустого блока"` | **10 passed**, exit 0; после контрастного hotfix повтор light/dark **2 passed**, exit 0 |
| Guardrails после DC-09 | `frontend-react`: `npm.cmd run check:guardrails` | exit 0, `dc09-guardrails.log`; предупреждения трёх прежних plan-checkup раундов не блокируют |
| PostgreSQL/schema и регрессия shell runner | `backend`: явный `TEST_DATABASE_URL` новой временной БД; `../.venv/Scripts/python.exe -X utf8 -m pytest -q tests/test_db_migration_runner.py tests/test_schema_canon.py tests/test_pg_schema_drift.py` | **9 passed, без skip**, exit 0, `DC-09_schema-tests.log` |
| Conventions | root: `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | exit 0, `DC-09_conventions.log`: 6 принципов, журнал C-Y проверен |

Backend application-код в DC-09 не менялся, поэтому полный результат 718/1 принят из проверенного среза 1×. Новая правка `db.sh` проверена отдельной регрессией и реальным migrate, не объявлена покрытой прежним полным pytest. Прежний единственный skip — PostgreSQL schema drift без `TEST_DATABASE_URL` — отдельно пройден на PostgreSQL, это не новый полный прогон с нулём skip.

## DC-06: выбор порога

10 существующих сценариев manifest, фиксированный seed **42**, горизонт **40** ходов. На первом исходе получены 4 победы и 2 поражения; 4 сценария без исхода за горизонт исключены из знаменателя частот.

| Порог среднего дохода | Вложения выбраны | Пустой блок | Оба знака |
|---|---:|---:|---:|
| 1× | 2/6 | 4/6 | 2/6 |
| 2× | 0/6 | 4/6 | 0/6 |
| 3× | 0/6 | 5/6 | 0/6 |

`largest` / `mixed` совпали; случаев вытеснения в выборке нет, они проверены отдельным тестом. Все 10 сравнений summary с baseline без блокирующих флагов; template/policy/seed/горизонт совпадают. Это не полный manifest/suite-invariant verdict. Baseline не обновлялся. Воспроизведение: `backend`, `../.venv/Scripts/python.exe -X utf8 scripts/decision_cost_playtest.py --out ../docs/balance/reports/DC-06_2026-11-11_income-thresholds.json`.

## PostgreSQL: fresh, legacy и repeat

Создан новый одноразовый кластер в `.codex-state/dc09-pg-20261111-*`, только `127.0.0.1:55439`, синтетические БД `dc09_game` и `dc09_fresh`. Существующие службы, базы и реальные данные не использовались.

1. Обнаружен дефект `db.sh`: `ls … | xargs basename` разбивал путь checkout с пробелами, после настоящих миграций пытался открыть файл `Aleksei`. Ошибка подтверждена первым запуском (exit 1), `DC-09_pg-migrate-first.log`.
2. Перечисление SQL заменено на quoted glob и bash parameter expansion с сортировкой; порядок миграций и их содержимое сохранены. Регрессия использует stub `psql`, путь `checkout with spaces` и SQL-файл с пробелами, без реальной БД.
3. Исправленный `bash game/api/scripts/db.sh migrate` на второй пустой БД применил baseline и все increments: exit 0, `DC-09_pg-migrate-fresh.log`.
4. В первой синтетической БД подготовлена форма `transactions` до `0051/0052` и старая строка −125,25 ₽. Canonical migrate: exit 0, `DC-09_pg-migrate-legacy.log`.
5. Проверены обе nullable колонки, оба индекса, FK targets и запрет несуществующих FK (`23503`), вставка корректных ссылок. Сумма старой строки не изменилась, новые ссылки у неё `NULL`: exit 0, `DC-09_pg-verify-first.log`.
6. Повторный canonical migrate и повторная проверка сохранили старую строку и новые связи: оба exit 0, `DC-09_pg-migrate-repeat.log` и `DC-09_pg-verify-repeat.log`.

Для Git Bash `PG_BIN` задан в POSIX-форме `/c/Program Files/PostgreSQL/18/bin`, поскольку `bash` отсутствует в PATH и запускался по установленному абсолютному пути. Подключения указывали только новые временные БД. По окончании кластер остановлен штатным `pg_ctl -D <созданный каталог> -m fast -w stop`: exit 0, `server stopped`. Миграции production не выполнялись.

## Review и ограничения

Независимые проходы предыдущих срезов: `mqx-ui-reviewer` — **PASS** после просмотра светлой/тёмной темы на 320 px; `economy-reviewer` — **PASS** по формуле 1×, контракту и итоговому отчёту. Финальный независимый `economy-reviewer` по DC-09 — **PASS**: shell-fix, PostgreSQL evidence и документация согласованы, воспроизводимых регрессий не найдено. Утверждение макета/порога дано PO отдельно и не заменено агентским review. Проверены **58** добавленных относительных Markdown-ссылок: файлы/папки существуют, anchors этим скриптом не проверялись. Scoped `git diff --check` — exit 0.

Ограничения текущего среза: выборка фиксированных ботов не измеряет частоту поведения реальных игроков; боты не пропускают зарплаты (восстановление проверено отдельным тестом). Вложения остаются одной агрегированной карточкой, поэтому лимиты 1/2 не различаются; разделение и новые гарантии разнообразия отдельно не принимались. Нулевой порог сохраняет фильтр положительных сумм. Human playtest понимания и удовольствия, merge/deploy и применение SQL на реальном окружении этим закрытием не заявляются.
