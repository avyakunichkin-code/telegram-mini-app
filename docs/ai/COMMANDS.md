# Проверки и команды

PowerShell: команды в таблице выполняются из указанного cwd; не склеивать Unix `cd &&` в Windows PowerShell 5.1. Python выбирать по реальному executable: в этом checkout работает корневой `.venv/Scripts/python.exe` (Python 3.13); `python` — нерабочий WindowsApps alias, `py -3` сообщает No installed Python. CI требует Python 3.14. Не устанавливать/обновлять зависимости без необходимости.

| Задача | cwd | Runtime / зависимости | Windows вызов | Результат / побочки |
|---|---|---|---|---|
| Codex structure/links/map | root | Node 22+, stdlib | `node scripts/codex/check.mjs` | exit 0, без записи |
| Codex protected drift | root | Node | `node scripts/codex/check.mjs --protected` | тот же список/263 hashes; без записи |
| Adapter behavioral smoke | root | Node 22+ | `node --test scripts/codex/*.test.mjs` | stub marker только temp; test logs .codex-state |
| Skill validator | root | Python + PyYAML, bundled skill-creator | `& .venv/Scripts/python.exe -X utf8 <skill-creator>/scripts/quick_validate.py .agents/skills/<name>` | valid frontmatter, не behavior |
| Conventions | root | Python stdlib | `& .venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | exit 0; read-only, большой recursive scan включает worktrees (известное ограничение) |
| Backend + fincore | backend | Python 3.14 CI; requirements-dev, editable fincore | `& ../.venv/Scripts/python.exe -m pytest -q` | SQLite tests; fincore включён testpaths; не запускался для AI-only diff |
| Fincore отдельно | packages/fincore | Python + pytest, установленное ядро | `& ../../.venv/Scripts/python.exe -m pytest -q` | pure core tests; не эквивалент game integration |
| FE unit / build / guardrails | frontend-react | Node 22+, npm ci по lock | `npm.cmd run test:unit`; `npm.cmd run build`; `npm.cmd run check:guardrails` | node --test, dist, guardrail verdict; не Vitest |
| E2E | frontend-react | Playwright/system Chrome; backend env/fincore | `npm.cmd run test:e2e` | изолированные :8011/:5181 SQLite/Vite; reports; E2E_PYTHON при другом Python |
| Баланс | backend | backend requirements; manifest/baselines | `& ../.venv/Scripts/python.exe scripts/balance_playtest.py` | 40p, reports JSON/MD; regression exit 1; baseline не обновлять автоматически |
| Event checks | backend | pytest/backend env | `& ../.venv/Scripts/python.exe -m pytest -q -k event` | YAML/catalog/effects; контент не SQL |
| Guidance | backend / frontend-react | pytest / Node | `pytest -q -k 'guidance or onboarding'`; `npm.cmd run test:guidance` | зеркала/хуки + FE |
| Admin | backend | pytest/admin_env, notifications stub | `pytest -q -k admin` | 403/CSV/YAML-readonly/dedupe |
| PostgreSQL schema | root | bash, psql, изолированный PostgreSQL | `bash backend/scripts/db.sh migrate` | DB mutation; только согласованный стенд, prod не авторизован |
| Baseline validation | root | Codex checker conservative DDL + schema tests | `node scripts/codex/check.mjs` | DML/opaque SQL отклоняется; не полный SQL-parser |
| Hub generator | frontend-react | Node/npm, nav.manifest.json | `npm.cmd run design-lab:build-nav` | design-lab/index.html + serve.json |
| Round sync | frontend-react | Node + bash + round sync-lab.sh | `npm.cmd run design-lab:sync-round -- design-lab/<theme>/<round>` | lab-base.css/assets; windows fallback без PowerShell sync |
| Lab parity | frontend-react | Node/npm | `npm.cmd run design-lab:build` | dashboard/finance parity + hub + checks |
| Lab read server | root | выбранный рабочий Python | `& .venv/Scripts/python.exe -m http.server 4173 --directory design-lab` | локальный сервер; shell path guard может потребовать адресного review, не запускался |

Точные scripts из frontend-react/package.json, backend/pytest.ini, CI и runbooks; они остаются единственным источником команд. Launch source .claude/launch.json: design-lab :4173, backend :8000, frontend :5173, plan-api :8020, plan-web :5190. Не добавлять новый Codex launch schema без подтверждения клиента. Корневой py launcher здесь не работает, а backend/.venv не проверен как полноценный окружение приложения.

Сокращение лога: `node scripts/codex/run-check.mjs -- <executable> <argv...>`; явный executable, shell=false. Для npm на Windows запускай `node <абсолютный npm-cli.js> run build` через runner (путь найди по установленному npm), либо обычный npm.cmd с собственным сохранением лога. Не передавать .cmd как executable shell=false. Runner сохраняет полный совместный stdout/stderr в .codex-state/logs и последние 6000 символов в выводе, возвращает exit code дочернего процесса. Не использовать для env/credentials/реальных анкет; маскировка секретов не обещается.
