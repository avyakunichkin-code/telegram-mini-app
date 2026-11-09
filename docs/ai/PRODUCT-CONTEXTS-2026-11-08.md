# Разделение контекстов Game / Plan · 08.11.2026

Срез разрешён владельцем в чате о разделении frontend-проектов, включая
документацию. Решение — [ADR-018](../decisions/ADR-018-product-work-contexts.md).

## Реализовано в репозитории

- Локальные AGENTS обоих frontend/API, общих пакетов и документации;
  корневой AGENTS маршрутизирует по продукту.
- Нейтральный [индекс](../README.md), отдельные [Game](../game/README.md) и
  [Plan](../plan/README.md). Подробный прежний индекс перенесён в
  [Game catalog](../game/CATALOG.md), относительные ссылки пересчитаны.
  На момент этого среза spec/foundation/handbook Game сохраняли адреса.
  Последующее поручение владельца расширило разделение до физического переноса
  в `docs/game/`: см. поправку ADR-018 и `docs/product-doc-relocations.json`.
- Раздельные дизайн-процессы и URL лаборатории `?product=game|plan`.
  Поиск/архив сохраняют scope; Plan не создаёт игровые parity iframe.
  Корневой lab index пересобран штатным генератором, lab-base.css не менялся.
- Unit Plan проверяет только Plan; [shared UI](../../tests/shared-ui/README.md)
  проверяет оба реальных адаптера отдельно. Отдельный CI job и path filters.
  Codex checker проверяет ссылки локальных инструкций.

## Проверки

Все команды ниже завершились с exit code **0**:

| cwd | Команда | Результат |
|---|---|---|
| root | `node scripts/codex/check.mjs` | структура, локальные инструкции и ссылки |
| root | `node --test scripts/codex/*.test.mjs` | 17 тестов, включая product navigation и ссылки |
| root | `node --test tests/shared-ui/*.test.mjs` | 4 контрактных теста двух адаптеров |
| apps/plan-web | `npm.cmd run test:unit` | 31 тест |
| apps/plan-web | `npm.cmd run build` | сборка |
| frontend-react | `npm.cmd run test:unit` | 105 тестов в пяти наборах |
| frontend-react | `npm.cmd run build` | сборка + PWA |
| frontend-react | `npm.cmd run check:guardrails` | границы, canon, стиль, ratchet, lab |
| frontend-react | `npm.cmd run design-lab:build-nav` | 107 ссылок, generated index |
| root | `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | 6 принципов |

Дополнительно: локальные ссылки перенесённого каталога/индексов разрешаются,
оба CI YAML разбираются PyYAML, scoped `git diff --check` — exit 0.
Guardrails предупреждает о существующем формате lab-base.css трёх Plan-раундов
(actions/continuity/history), build — об устаревшей Browserslist DB.
Эти предупреждения не исправлялись в контекстном срезе. Backend pytest,
баланс и продуктовый Playwright не запускались: runtime/экономика/экраны не менялись.
Навигация проверена исполнением сгенерированного JS с DOM fixture, не браузерным QA.

## Клиент Codex и оставшееся подтверждение

Два отдельных стартовых frontend-чата созданы и завершили read-only подготовку
контекста, каждый прочитал только свой продукт. Поскольку созданы до смены
настройки, фактический cwd этих сессий — корень; они задают явный workdir.

Список проектов после UI-настройки подтвердил основной путь Plan
`apps/plan-web/`, Game всё ещё указывает в корень. Корень оставлен дополнительной
исходной папкой Plan для общих пакетов/API/docs; это не файловая изоляция.
У диалога «Доверять этой папке?» автоматическая проверка безопасности отклонила
действие: доверие разрешает чтение, редактирование, запуск файлов и автоматическое
выполнение настроек. Без отдельного разрешения не обходить этот отказ.
Доверие Plan и настройка frontend cwd Game остаются незавершёнными.

Существующие пользовательские изменения сохранены. Protected status до/после
совпал; это сравнение списка статусов, не новая hash-проверка исторического контура.
Claude/.cursor/Git hooks не редактировались, глобальные permissions не менялись.
Runtime-блокировка repository hooks этим срезом не заявляется.
