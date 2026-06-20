---
tags:
  - tvoy-hod/layer/agent
aliases:
  - CLAUDE
---
## ТВОЙ ХОД — индекс для агента

Telegram Mini App: **игра по финансовой грамотности** (периоды, cash, обязательства, события, победа).

**Каналы (2026-06, ADR-012):** primary = **PWA + web**; TMA — secondary. См. [`SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) §1.1.

**Роутер скиллов:** [`.cursor/rules/tvoy-hod-router.mdc`](.cursor/rules/tvoy-hod-router.mdc) · **Лексикон игры:** [`.cursor/skills/_shared/game-lexicon.md`](.cursor/skills/_shared/game-lexicon.md)

| Документ | Назначение |
|----------|------------|
| [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика |
| [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md) | idea → spec → plan → tasks |
| [`docs/agents/SKILL_DOC_MAP.md`](docs/agents/SKILL_DOC_MAP.md) | Фаза → скилл → docs |
| [`backend/app/README.md`](backend/app/README.md) | Домены backend, карта API |
| [`frontend-react/ARCHITECTURE.md`](frontend-react/ARCHITECTURE.md) | screens, api/, hooks |
| [`DESIGN_WORKFLOW.md`](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) | MQX: lab → prod |

**При конфликте:** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

---

### Core loop (TB1)

Открытый период → действия → **«Закрыть месяц»** (`POST /api/game/time/next` → `process_period_end`) → новый период.

- **`save_kind`:** `game` \| `plan`. Game — `game_starter_templates` + `template_key`. Plan — API есть, UI «Скоро».
- **Зарплата** — только по кнопке в периоде; пропуск = нет выплаты за период.
- **2 события/период**; YAML: `data/events/mvp11/` (ADR-008).
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
