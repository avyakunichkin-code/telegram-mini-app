# Frontend — структура `src/`

Канон: [one-pager](../docs/vision/ideas/project-structure-standardization.md).  
Стили: [`src/styles/README.md`](src/styles/README.md).  
MQX UI: [`src/components/mqx/DESIGN_WORKFLOW.md`](src/components/mqx/DESIGN_WORKFLOW.md).

---

## Карта папок

```text
src/
  api.js                 # barrel → api/
  api/                   # HTTP, зеркало backend/app/routers/
    client.js            # apiCall, ApiError, setAuthToken
    auth.js, game.js, finance.js, invest.js, insurance.js, admin.js
    index.js             # API = { ...domains }
  screens/               # route- / flow-level экраны (тонкие сборки)
    pre-game/            # новая игра: режим, шаблоны
    plan/                # Plan mode (мастер, скоро)
    game/                # (цель) вкладки GameScreen — пока legacy *Premium.jsx
    admin/, dev/         # по мере появления
  components/            # legacy + мелкие блоки; не расширять для новых экранов
    mqx/                 # design-lab ★ → prod: примитивы, layout, onboarding
  hooks/                 # useGame и др.; цель — hooks/<domain>/
  styles/                # CSS-модули по домену (barrel index.css)
  config/, utils/, context/
```

---

## Пять правил

1. **Новый экран потока** → `screens/<flow>/`. Не добавлять route-level JSX в корень `components/`.
2. **Видимый паттерн MQX** → `components/mqx/` + стили `styles/mqx/<domain>.css` (см. DESIGN_WORKFLOW).
3. **HTTP** → `api/<domain>.js`; домен = роутер FastAPI (`game`, `finance`, …). Импорт для совместимости: `from '../api'`.
4. **Состояние** → `hooks/<domain>/` при росте; пока допустим монолитный `useGame.js`.
5. **В spec фичи** — строка трассировки:

| Слой | Пример |
|------|--------|
| Screen | `screens/pre-game/GameTemplatePickScreen.jsx` |
| API | `api/game.js` → `POST /api/game/start` |
| Styles | `styles/mqx/flows.css` |

---

## Потоки `screens/`

| Папка | Содержимое | Legacy (до переезда) |
|-------|------------|----------------------|
| `pre-game/` | `NewProfileKindScreen`, `GameTemplatePickScreen` | `components/new-game/` (re-export) |
| `plan/` | Мастер Plan, префилл — **в разработке** | `BaseParamsScreen.jsx` в `components/` |
| `game/` | Дашборд, финансы, аналитика, `GameScreen` | `*Premium.jsx`, `GameScreen.jsx` |

### Plan mode (`screens/plan/`)

- **Цель:** мастер ввода, `save_kind: plan`, префилл из `starter_params_json` (см. evolution §II.3).
- **Сейчас:** `App.jsx` → `BaseParamsScreen` (`components/BaseParamsScreen.jsx`, `saveKind="plan"`).
- **Следующий шаг:** перенести/разбить на `screens/plan/PlanSetupScreen.jsx` (и подэкраны) при старте работ по Plan.

---

## Legacy quarantine

- `components/*Section.jsx` — не добавлять фичи (см. SPEC_FRONTEND_UI).
- `components/new-game/` — только re-export; правки в `screens/pre-game/`.
- `components/*Premium.jsx` — вкладки игры; переезд в `screens/game/` **по касанию** (touch-it move-it).

---

## Backend (зеркало)

| Frontend | Backend |
|----------|---------|
| `api/game.js` | `app/routers/game.py`, `period_actions.py`, `events.py` |
| `api/finance.js` | `app/routers/finance.py`, `app/routers/expenses.py` |
| `api/invest.js` | `app/routers/invest.py` |
| `api/insurance.js` | `app/routers/insurance.py` |
| Seeds каталога Game | `app/seeds/game_starter_templates.py` |

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-05-25 | MVP structure: `api/*`, `screens/pre-game/`, `ARCHITECTURE.md`, seeds |
