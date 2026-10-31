---
tags:
  - tvoy-hod/layer/agent
aliases:
  - CLAUDE
---
## ТВОЙ ХОД — индекс для агента

**Игра по финансовой грамотности** (PWA/web primary; TMA secondary — [ADR-012](docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)): периоды, cash, обязательства, события, победа.

**Свод принципов (вердикт):** [`CONVENTIONS.md`](CONVENTIONS.md) ([C-X](CONVENTIONS.md), [C-Y](CONVENTIONS.md), [C-1](CONVENTIONS.md)–[C-4](CONVENTIONS.md)). Этот файл — **индекс** для Claude Code (грузится в каждую сессию), не конституция.

**Роутер скиллов:** [`.claude/rules/router.md`](.claude/rules/router.md) · **Лексикон игры:** [`.claude/skills/_shared/game-lexicon.md`](.claude/skills/_shared/game-lexicon.md)

| Документ | Назначение |
|----------|------------|
| [`CONVENTIONS.md`](CONVENTIONS.md) | Принципы: соответствует / нарушает |
| [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика |
| [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md) | idea → spec → plan → tasks |
| [`docs/ROADMAPS.md`](docs/ROADMAPS.md) | Роадмапы направлений: Game, Plan ([`docs/plan/`](docs/plan/README.md)), ядро |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Журнал доработок: что сделано, по датам (заметная доработка — строка в разделе дня) |
| [`docs/audits/README.md`](docs/audits/README.md) | Снимки аудитов: `product/`, `engineering/`, `qa/`, `ux/`, `liveops/` |
| [`docs/agents/SKILL_DOC_MAP.md`](docs/agents/SKILL_DOC_MAP.md) | Фаза → скилл → docs |
| [`backend/app/README.md`](backend/app/README.md) | Домены backend, карта API |
| [`frontend-react/ARCHITECTURE.md`](frontend-react/ARCHITECTURE.md) | screens, api/, hooks |
| [`DESIGN_WORKFLOW.md`](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) | MQX: lab → prod |

**При конфликте ([C-1](CONVENTIONS.md)):** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

---

### Core loop (TB1)

Открытый период → действия → **«Завершить ход»** (`POST /api/game/time/next` → `process_period_end`) → новый период.

- **`save_kind`:** только **`game`** — `game_starter_templates` + `template_key`. Режим Plan внутри игры **снят** ([ADR-013](docs/decisions/ADR-013-game-only-drop-plan-mode.md), [C-2](CONVENTIONS.md)); GO-02/03 реализованы локально 2026-10-29; детали — [`PLAN_game-only`](docs/plans/PLAN_game-only.md).
- **Plan — отдельный продукт** (финансовый помощник, не игра), общий с игрой только `packages/fincore` + `packages/platform` ([ADR-016](docs/decisions/ADR-016-two-products-shared-fincore.md), [`PLAN_game-plan-split`](docs/plans/PLAN_game-plan-split.md)). Игровые понятия (needs, события, победа, ход) в `fincore` не заносить. Plan-**прототип** (`apps/plan-*`: без БД, без деплоя, без реальных пользователей) — сейчас; продуктовый Plan — после Pre-Alpha gate. Документы и роадмап Plan — [`docs/plan/`](docs/plan/README.md).
- **Зарплата** — только по кнопке в периоде; пропуск = нет выплаты за период.
- **2 события/период**; YAML: `data/events/mvp11/` ([ADR-008](docs/decisions/ADR-008-events-catalog-single-source.md), [C-4](CONVENTIONS.md)).
- **Прогрессия:** `event_tier` от `period_index`, без character XP — [`remove-character-xp-and-levels.md`](docs/vision/ideas/remove-character-xp-and-levels.md).

---

### Стек

Backend: FastAPI, SQLAlchemy, PostgreSQL. Frontend: React + Vite, `@telegram-apps/telegram-ui`, MQX.

### Команды (проверка перед «готово»)

| Что | Команда |
|-----|---------|
| Backend тесты | `cd backend && python -m pytest -q` (Windows: `py -3 -m pytest -q`; тесты на SQLite, БД не нужна). Зависимости ставить **из `backend/`** (`-e ../packages/fincore`) |
| Ядро fincore | входит в backend pytest (`testpaths` в `backend/pytest.ini`); отдельно — `cd packages/fincore && python -m pytest -q` |
| Frontend | `cd frontend-react && npm run build` · `npm run test:unit` · PR: `npm run check:guardrails` |
| UI-сценарии (Playwright, системный Chrome) | `cd frontend-react && npm run test:e2e` — сам поднимает стенд: backend на SQLite :8011 + Vite :5181 ([`e2e/README.md`](frontend-react/e2e/README.md)) |
| Баланс 30–40 периодов | `/balance-playtest` или `cd backend && python scripts/balance_playtest.py` |
| Свод принципов | `py -3 scripts/check_conventions.py` |
| AI-конфиг (skills/rules/agents/hooks) | `node .claude/skills/skill-test/_static-check.mjs` · `node .claude/skills/skill-test/_claude-config-check.mjs` |

AI-конфигурация: `.claude/rules/` (path-scoped), `.claude/skills/`, `.claude/agents/`, хуки в `.claude/settings.json` — карта в скилле `project-skills-layout`.

---

### Ключевой код

| Область | Файлы |
|---------|--------|
| Экономика периода | `backend/app/game/period.py` |
| Победа | `backend/app/victory/engine.py`, `finance/overview_build.py` |
| HTTP | `backend/app/routers/` → `services/` |
| FE state/API | `hooks/useGame.js`, `src/api/` (`client.js` — `apiCall`/`ApiError`; домены — `game.js`, `finance.js`, …; `src/api.js` — реэкспорт) |
| Prod UI | `*Premium.jsx`, `components/mqx/` |

Полный список эндпоинтов — [`backend/app/README.md`](backend/app/README.md).

---

### Победа (Victory v2)

`GET /api/finance/overview` → `victory_engine.evaluate_victory` + `victory_config_json` шаблона ([ADR-002](docs/decisions/ADR-002-victory-engine-and-template-config.md), [SPEC_victory-v2](docs/specs/features/SPEC_victory-v2.md)).

- **chain:** все шаги цепочки из конфигурации шаблона; общего ограничения «с 7-го периода» нет.
- **parallel:** legacy-совместимость: M из N включённых целей.
- **mechanics_unlock** — [ADR-004](docs/decisions/ADR-004-mechanics-unlock-victory-chain.md).

---

### БД

`backend/migrations/`, `bash backend/scripts/db.sh migrate`. Skill: **db-baselines-and-migrations**.

---

### Баланс / пороги

[`game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md) · события: [`.claude/skills/create-event/event-balance-rules.md`](.claude/skills/create-event/event-balance-rules.md)

---

### Compact instructions

При сжатии контекста сохраняй: список изменённых файлов и ветку, незакоммиченные изменения, команды проверки и их последний результат (pytest / `npm run build` / `test:unit`), принятые пользователем решения и открытые вопросы.
