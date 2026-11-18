# Проверка инструкций и доступов GAME · 2026-11-12

Вердикт: **CONCERNS**. Перенос инструкций и discovery подтверждён в текущем
чате GAME; полную активацию hooks и зелёный behavioral suite подтвердить нельзя.
Аудит не меняет permissions, trust, настройки, навыки или продуктовый код.

## Наблюдаемое состояние

- cwd: `game/`. В начальный контекст реально переданы общие и игровые AGENTS.
- Каталог клиента содержит 7 общих и 6 игровых навыков с новыми путями.
  `codex-config-audit/SKILL.md` успешно прочитан из родительской области.
- В tool schema доступны economy-reviewer, economy-balance-runner,
  mqx-ui-reviewer. Исполнение ролей не проверялось: делегирование для этого
  аудита не запрашивалось. Карточки ролей сами по себе не создают sandbox.
- Managed workspace-write разрешает рабочий GAME и родительский репозиторий,
  включая shared. Чтение текущих инструкций, scripts и shared path доступно.
  Запись этого отчёта подтверждает возможность обычной записи в репозиторий.
  Каталоги `.agents`, `.codex`, `.git` имеют отдельные ограничения managed-среды;
  возможность их изменения этим аудитом не проверялась.
- Node v24.15.0, npm 11.12.1, Git 2.47.1.windows.1 запускаются.
  `game/web/node_modules` и `shared/packages/fincore` существуют.
- `game/.venv` отсутствует; корневая `.venv/Scripts/python.exe` запускается,
  версия Python 3.13.0. Runner поддерживает этот fallback; CI требует 3.14.
  Полнота Python-зависимостей и продуктовый runtime здесь не проверялись.
- Сеть ограничена managed-политикой; web tool доступен. Внешние сервисы,
  deploy, реальные БД и credentials не проверялись и не требуются для аудита.

## Команды и результаты

Из Git root, executable `node`:

| Команда | Exit | Результат |
|---|---:|---|
| `node scripts/codex/check.mjs` | 0 | 13 skills, 26 mappings, 42 Markdown files; ссылки, hooks/agents, DDL baseline PASS |
| `node --test scripts/codex/*.test.mjs` | 1 | 23 PASS / 1 FAIL, всего 24 |

Единственный FAIL: `scripts/codex/scopes.test.mjs`, сценарий skill links,
`fs.symlinkSync(..., 'junction')` возвращает EPERM во временной папке Windows
sandbox. Это наблюдаемый отказ среды; assertions этого сценария не выполнены.
Не скрывать его skip и не считать весь suite зелёным. Остальные проверки,
включая executable adapter→stub smoke, Windows wrapper, patch add/update/delete/
move, traversal, unknown payload, error/timeout contracts и runner exit,
прошли. Тесты не доказывают обработку timeout/crash нативным клиентом.

Безопасный native smoke через `exec_command` из Git root:
`Write-Output 'CODEX_GUARD_SMOKE design-lab/index.html'` напечатал marker,
exit 0. Файлы generated output не изменялись. Локальный pre adapter отклонил бы
такую строку; отказ до действия в клиенте не наблюдался. Поэтому:

| Слой | Статус |
|---|---|
| Реализация adapters/policy | подтверждена прошедшими тестами |
| Регистрация | `.codex/hooks.json` присутствует, checker PASS |
| Trust | неизвестен |
| Нативное исполнение SessionStart/PostToolUse | не подтверждено |
| Нативная блокировка PreToolUse | не подтверждена smoke |

## Оставшиеся ограничения

Для полного подтверждения выполнить symlink-сценарий в среде, разрешающей
junction, без ослабления теста. Для hooks пройти существующий review/trust
процесс в [CODEX-HOOKS](CODEX-HOOKS.md), затем повторить безопасный smoke
в новом чате. Не изменять trust database и managed policy вручную.

Наследование AGENTS сверено с [официальным Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide).
Официальная [документация упаковки plugins](https://developers.openai.com/plugins/build/plugins)
также отделяет включение plugin от доверия его hooks; это не доказательство
активации hooks данного репозитория. Фактические ограничения текущего клиента
имеют приоритет над предположениями по документации.

Повторный прогон "node --test scripts/codex/*.test.mjs" вне Windows sandbox завершился с кодом 0. Прошли все 24 теста, включая создание junction. Результат первоначального прогона выше сохранён как наблюдение среды. Подробности в [отчёте о перепроверке](INDEPENDENT-RUNTIMES.md).
