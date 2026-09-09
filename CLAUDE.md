---
tags:
  - tvoy-hod/layer/agent
aliases:
  - CLAUDE
---
## ТВОЙ ХОД — индекс для агента

**Игра по финансовой грамотности** (PWA/web primary; TMA secondary — [ADR-012](docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)): периоды, cash, обязательства, события, победа.

**Свод принципов (вердикт):** [`CONVENTIONS.md`](CONVENTIONS.md) ([C-X](CONVENTIONS.md), [C-Y](CONVENTIONS.md), [C-1](CONVENTIONS.md)–[C-4](CONVENTIONS.md)). Этот файл — **индекс** для агента в Cursor, не конституция.

**Роутер скиллов:** [`.cursor/rules/tvoy-hod-router.mdc`](.cursor/rules/tvoy-hod-router.mdc) · **Лексикон игры:** [`.cursor/skills/_shared/game-lexicon.md`](.cursor/skills/_shared/game-lexicon.md)

| Документ | Назначение |
|----------|------------|
| [`CONVENTIONS.md`](CONVENTIONS.md) | Принципы: соответствует / нарушает |
| [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика |
| [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md) | idea → spec → plan → tasks |
| [`docs/audits/README.md`](docs/audits/README.md) | Снимки аудитов: `product/`, `engineering/`, `qa/`, `ux/`, `liveops/` |
| [`docs/agents/SKILL_DOC_MAP.md`](docs/agents/SKILL_DOC_MAP.md) | Фаза → скилл → docs |
| [`backend/app/README.md`](backend/app/README.md) | Домены backend, карта API |
| [`frontend-react/ARCHITECTURE.md`](frontend-react/ARCHITECTURE.md) | screens, api/, hooks |
| [`DESIGN_WORKFLOW.md`](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) | MQX: lab → prod |

**При конфликте ([C-1](CONVENTIONS.md)):** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

---

### Core loop (TB1)

Открытый период → действия → **«Закрыть месяц»** (`POST /api/game/time/next` → `process_period_end`) → новый период.

- **`save_kind`:** только **`game`** — `game_starter_templates` + `template_key`. Режим Plan **снят** ([ADR-013](docs/decisions/ADR-013-game-only-drop-plan-mode.md), [C-2](CONVENTIONS.md)); вырезание кода — [`PLAN_game-only`](docs/plans/PLAN_game-only.md).
- **Зарплата** — только по кнопке в периоде; пропуск = нет выплаты за период.
- **2 события/период**; YAML: `data/events/mvp11/` ([ADR-008](docs/decisions/ADR-008-events-catalog-single-source.md), [C-4](CONVENTIONS.md)).
- **Прогрессия:** `event_tier` от `period_index`, без character XP — [`remove-character-xp-and-levels.md`](docs/vision/ideas/remove-character-xp-and-levels.md).

---

### Стек

Backend: FastAPI, SQLAlchemy, PostgreSQL. Frontend: React + Vite, `@telegram-apps/telegram-ui`, MQX.

---

### Ключевой код

| Область | Файлы |
|---------|--------|
| Экономика периода | `backend/app/game/period.py` |
| Победа | `backend/app/victory/engine.py`, `finance/overview_build.py` |
| HTTP | `backend/app/routers/` → `services/` |
| FE state/API | `hooks/useGame.js`, `src/api.js` |
| Prod UI | `*Premium.jsx`, `components/mqx/` |

Полный список эндпоинтов — [`backend/app/README.md`](backend/app/README.md) и секции ниже в истории файла в git при необходимости.

---

### Победа (Victory v2)

`GET /api/finance/overview` → `victory_engine.evaluate_victory` + `victory_config_json` шаблона ([ADR-002](docs/decisions/ADR-002-victory-engine-and-template-config.md), [SPEC_victory-v2](docs/specs/features/SPEC_victory-v2.md)).

- **chain:** все шаги + `period_index >= min_period_index_for_victory` (дефолт 7).
- **parallel:** M из N enabled целей + gate.
- **mechanics_unlock** — [ADR-004](docs/decisions/ADR-004-mechanics-unlock-victory-chain.md).

---

### БД

`backend/migrations/`, `bash backend/scripts/db.sh migrate`. Skill: **db-baselines-and-migrations**.

---

### Баланс / пороги

[`game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md) · события: [`.cursor/skills/create-event/event-balance-rules.md`](.cursor/skills/create-event/event-balance-rules.md)
