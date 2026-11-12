# Независимые среды GAME и PLAN

Проверено 2026-11-12. Каждый продукт использует свою `.venv` и свои
`web/node_modules`. Runner и E2E не выбирают корневой Python автоматически.
Явные overrides: `PROJECT_PYTHON` для runner, `E2E_PYTHON` для Playwright.
Shared-пакеты установлены editable; это общий исходный код, зависимости Python
остаются внутри среды каждого продукта.

Из `game/` или `plan/` в двух терминалах:

```powershell
npm.cmd run dev:api
npm.cmd run dev
```

Порты GAME: API 8000, web 5173. PLAN: API 8020, web 5190.
`PROJECT_API_PORT` / `PROJECT_WEB_PORT` меняют порты runner. При смене API-порта
фронтенду также нужен `VITE_API_BASE_URL` (GAME) или `PLAN_API_URL` (PLAN).
PLAN запускается через `plan_api.main:create_app --factory`: прежний
`plan_api.main:app` воспроизведённо завершался exit 1, такого экспорта нет.

## Проверки

| cwd | Команда / executable | Exit | Результат |
|---|---|---|---|
| game/api | `../.venv/Scripts/python.exe -m pip --isolated install -r requirements-dev.txt` | 0 | Отдельная среда GAME |
| plan/api | `../.venv/Scripts/python.exe -m pip --isolated install -r requirements.txt -c ../../.codex-state/independent-runtime/constraints.txt` | 0 | Отдельная среда PLAN, версии из существующей тестовой среды |
| root | `<product>/.venv/Scripts/python.exe -m pip check` для обоих | 0 | Нет конфликтов зависимостей |
| root | `node --test scripts/project.test.mjs` | 0 | 3 теста выбора среды, factory и портов |
| root | `node scripts/smoke-projects.mjs` | 0 | Два API, HTML и Vite proxy; PLAN жив после остановки GAME |
| game/web, plan/web | `npm.cmd run build` | 0 | Обе сборки прошли |
| root | `node scripts/codex/check.mjs` | 0 | Ссылки и структура |
| root | `node --test scripts/codex/*.test.mjs` | 0 | 24 теста |
| root | `game/.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | 0 | Conventions gate |

Smoke можно запускать по одному: `npm.cmd run smoke` из продукта. Он использует
временные SQLite, синтетические настройки, пустой envDir и отключённый dotenv;
портам 18000/15173 и 18020/15190 нельзя быть занятыми. По завершении собственные
процессы и временные данные удаляются. Реальные настройки и базы не переносились.

Первый smoke в Windows sandbox завершился таймаутом без логов API. Повтор
с адресным разрешением прошёл. Codex-тест создания symlink получил EPERM в sandbox,
вне него все 24 теста прошли без изменения тестов. Конфигурации Playwright
проверяются отдельными процессами: две установленные копии Playwright запрещают
загрузку в одном Node-процессе.

Ограничения: локальный Python 3.13.0, CI требует 3.14. Полные backend/E2E-наборы
в этом срезе не перезапускались; smoke проверяет запуск и связь, не пользовательские
сценарии в браузере. GAME build сохраняет предупреждения о размере чанка,
смешанных static/dynamic imports и устаревших Browserslist-данных.
