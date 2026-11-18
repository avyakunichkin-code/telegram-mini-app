# Перенос GAME / PLAN · 2026-11-11

Структура утверждена владельцем в чате; [ADR-018](../decisions/ADR-018-product-roots.md).
Результат — [общая архитектура](../../ARCHITECTURE.md), отдельные корни
[GAME](../../game/README.md), [PLAN](../../plan/README.md),
[общих библиотек](../../shared/README.md).

Статус проверки: **CONCERNS** из-за воспроизводимого performance-лимита PLAN.
Это отчёт реализации и self-check, не независимое review или новое human approval.

## Что изменено

- GAME владеет web, api, landing, docs, design, design-lab, data и scripts.
- PLAN владеет web, api, landing, docs и design-lab. Пустые каталоги не создавались.
- Общие библиотеки и UI-контракт перенесены в shared; UI-тесты имеют собственные
  package/lock и runtime, без использования установки PLAN как тестового окружения.
- Добавлены продуктовые AGENTS/README/ARCHITECTURE и единые команды dev/build/check.
  Runner и E2E предпочитают среду продукта, корневая .venv — переходный fallback.
- Пересчитаны ссылки, editable requirements, Vite aliases, Playwright cwd,
  manifests, генераторы, CI и пути артефактов. Лендинги имеют отдельные сборки
  и CI jobs с продуктовыми фильтрами. Общие статические проверки не собирают соседа.
- GAME Pages компонуется на уровне продукта в game/dist/pages, без зависимости
  сборки web от сборки лендинга; прежний публичный путь landing сохранён.
- PLAN-лендинг импортирован из чистого HEAD a27f40cdeb7f2ea7eb066fdb2eb58edaa69186ec.
  Полная история всех refs сохранена [Git bundle](../../plan/docs/archive/source-history/README.md).
  Единственный редактируемый источник — plan/landing/site; старый sites checkout — архив.
- Знания прежнего клиента перенесены отдельным чатом; [карта переноса](CODEX-KNOWLEDGE-MIGRATION.md).
  Исходные каталоги не удалены. Codex не требует их чтения.

## Сохранность и ограничения

Перед изменениями сохранён git status; 2963 перемещённых исходных файла сверены
по SHA-256 до исправления путей. Inventory/path map лежат локально в
`.codex-state/product-roots`. Исходные пользовательские правки сохранялись;
reset, clean, staging и commit не выполнялись. Генерируемые lab-хабы обновлены
генераторами; lab-base.css вручную не переписывались. Дизайн-утверждения не менялись.

Реальные env, локальные БД, ключи и анкеты не читались и не переносились.
Файлы .env.example перемещены без чтения содержимого. Старые локальные среды,
кеши и исторические инструкции могут оставлять прежние каталоги на диске;
активный код приложений находится в новых корнях. Установка зависимостей
производится отдельно для продукта, а параллельные изменения — в отдельных worktree.

Deploy, реальные PostgreSQL-миграции, публикация сайтов и настройки GitHub
не выполнялись. YAML проверен локально; GitHub Actions run не заявлен.
Полная Git-история лендинга сохранена переносимым bundle, но не присоединена
merge-коммитом: коммиты за владельца не создавались.

## Выполненные проверки

Python ниже — корневой `.venv/Scripts/python.exe`, Python 3.13; CI требует 3.14.
Команды запускались из указанного cwd. MSYS/сервисные smoke выполнены вне Windows
sandbox после адресного разрешения, на синтетических данных.

| cwd | Команда | Exit | Результат |
|---|---|---:|---|
| root | node scripts/check-product-roots.mjs | 0 | Корни, shared, editable-пути, cwd CI, 18 навигационных документов |
| root | git diff --check | 0 | Форматирование изменённых tracked-файлов |
| root | node scripts/codex/check.mjs | 0 | Skills, текущие ссылки, adapters и DDL baseline |
| root | node --test scripts/codex/*.test.mjs | 0 | 16 тестов; включая отказ чтения старого контура и новые generated-пути |
| root | Python -X utf8 scripts/check_conventions.py | 0 | 6 принципов; также smoke с запретом чтения старых клиентских файлов |
| root | node game/scripts/design-assets.mjs --check | 0 | 132 экспорта и примеры, 0 stale |
| game/api | Python -m pytest -q | 0 | 719 passed, 1 skipped |
| game/api | Python -m pytest -q tests/test_db_migration_runner.py | 0 | Адресный повтор после изменения выбора среды: 1 passed, stub psql |
| plan/api | Python -m pytest -q | 1 | 114 passed, 1 performance failure; два полных запуска |
| game/web | npm run test:unit | 0 | Все группы unit/scripts |
| plan/web | npm run test:unit | 0 | 43 passed |
| game/web, plan/web | npm run build | 0 | Обе сборки |
| game/web | npm run check:guardrails | 0 | Включая 39 lab-раундов и canon parity |
| root | node --test shared/tests/ui/*.test.mjs | 0 | 4 passed, оба реальных адаптера |
| root | node --test shared/packages/api-client/test/*.test.js | 0 | 6 passed |
| game/web | npm run test:ui-kit | 0 | 14 Playwright tests, UI-kit и финал партии |
| game/web | npm run test:e2e -- e2e/onboarding.spec.js | 0 | 6 tests, регистрация, первый ход, reload |
| plan/web | E2E_PREVIEW=1 npm run test:e2e -- e2e/checkup.spec.js | 0 | 20 tests, mobile + desktop |
| plan/web | npm run test:e2e -- e2e/checkup.spec.js | 0 | Финальный штатный dev-прогон: 20 tests, mobile + desktop |
| game | npm run build:pages | 0 | Самостоятельные сборки web/landing и общий Pages artifact |
| game/landing, plan/landing | npm run build | 0 | Оба лендинга |
| game/web | npm run design-lab:build-nav | 0 | 71 GAME-ссылка |
| root | node plan/scripts/build-design-lab.mjs | 0 | 17 PLAN-раундов |
| root | git bundle verify plan/docs/archive/source-history/plan-landing.bundle | 0 | Полная история, 3 refs |

Дополнительно: YAML всех workflow и PowerShell dev-setup проходят синтаксический
разбор без исполнения setup; standalone UI lock принят npm ci dry-run offline.
Навык architecture-decision исправлен под фактическое наличие platform и прошёл
quick_validate, exit 0. Сверка 560 перемещённых Markdown-документов с рабочими
inline-ссылками HEAD не обнаружила повреждений этих ссылок; research, survey,
tracker и results исключены из этой сверки. Новые точки входа проверены отдельно.

В общем срезе устранены два замечания self-review чата переноса знаний:
детектор учитывает обычные инструкции чтения и reference-links, а AI workflows
запускаются также при Markdown-изменениях вне узкого engineering-поддерева.
Для детектора наблюдался RED на пропущенной инструкции, затем GREEN после исправления.

## Негативные результаты и их пределы

Первый sandbox-прогон теста миграций встретил MSYS NtCreateDirectoryObject
0xC0000022; вне sandbox тот же тест проходит. Зависшие sandbox-прогоны остановлены,
они не выдаются за успешные проверки. Первоначальный dev E2E PLAN потерял Vite-сервер
после 14 успешных тестов; на собранном preview все 20 прошли.
Финальный повтор в штатном dev-режиме также прошёл 20/20; первоначальный сбой
процесса не воспроизвёлся.

Performance PLAN: максимум пяти прогонов 1.286 с и 1.221 с при лимите 1.0 с.
На копиях исходных расчётных файлов в прежнем apps/plan-api layout тот же тест
дал 1.079 с и exit 1. 33 Python-файла совпали с исходным SHA-256; main.py,
изменённый переносом путей, не требовался этому тесту и не импортировался.
Отдельный smoke подтверждал использование копий fincore/plan_api из reference,
а не текущей установки. Это воспроизводит превышение на исходных расчётах и
не доказывает выполнение бюджета на этой машине. Порог и алгоритмы не ослаблены.

Экономические правила, API-поля и финансовое ядро этим переносом не менялись;
balance simulation не запускалась, baseline не обновлялся. Fincore/golden проверки
входили в успешный GAME pytest. Остаточный performance-вопрос — отдельная область,
а не основание менять финансовую логику в миграции каталогов.
