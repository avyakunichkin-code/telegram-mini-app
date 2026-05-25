# Структура репозитория и стандарты кода

Сессия **idea-refine** (май 2026): как привести код к предсказуемой структуре без «большого взрыва», опираясь на уже сделанный split CSS (`frontend-react/src/styles/`) и конвейер документации (вариант A в [`DOCUMENTATION_SYSTEM.md`](../../DOCUMENTATION_SYSTEM.md)).

Связано: [`CLAUDE.md`](../../../CLAUDE.md), [`specs/SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md), [`frontend-react/src/styles/README.md`](../../../frontend-react/src/styles/README.md), [`mqx/DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

---

## Problem Statement (HMW)

**Как сделать так, чтобы разработчик и агент без объяснений понимали, куда класть новый экран, API-вызов и стиль — и при этом не сломать TMA массовым переименованием?**

Контекст: в проекте уже есть сильные островки (docs по слоям, MQX + design-lab, `routers/` на backend), но frontend — смесь плоского `components/` (~25 экранов) и зрелого `mqx/`, backend — плоский `app/` с тяжёлым `main.py` и монолитным `api.js`.

---

## Recommended Direction

### Выбор: **направление A — «границы + документ + постепенный переезд»**

Не реорганизовать весь репозиторий одним PR. Зафиксировать **зеркало трассируемости** (экран ↔ spec ↔ API ↔ CSS-модуль) и правило **touch-it move-it**: новый код — только в новых границах; legacy — трогаем при реальной задаче.

Три опоры (две уже начаты):

| Опора | Статус | Эталон |
|-------|--------|--------|
| Документация idea → spec → plan | ✅ `docs/` вариант A | [`DOCUMENTATION_SYSTEM.md`](../../DOCUMENTATION_SYSTEM.md) |
| CSS по доменам + barrel | ✅ май 2026 | [`styles/README.md`](../../../frontend-react/src/styles/README.md), `index.css` |
| JS/TS структура кода | 🔲 этот one-pager | `ARCHITECTURE.md` + pilot |

### Целевая модель (лёгкий feature-slice, не FSD)

```text
frontend-react/src/
  index.css                 # barrel @import → styles/
  styles/                   # tokens, tma-base, mqx/*, shell, page, admin
  api/
    index.js                # re-export (тонкий контракт)
    game.js, finance.js, …  # зеркало backend/routers/
  screens/                  # route-level / flow-level UI (тонкие сборки)
    pre-game/               # старт, auth-adjacent flows
    game/                   # GameScreen, вкладки *Premium
    plan/                   # зарезервировать под Plan 2.0
    admin/, dev/
  components/               # legacy + мелочь без своего flow (сжимается со временем)
  hooks/
    game/, finance/, …
  components/mqx/           # без изменений: примитивы, layout, DESIGN_WORKFLOW

backend/
  app/routers/              # без изменений: публичный API
  app/seeds/                # вынести из main.py каталоги и bootstrap-данные
  app/game_period.py, …     # доменная логика — файлы по смыслу (не обязательно domains/)
  main.py                   # только wiring + lifespan
```

### Пять правил размещения (канон для агентов)

1. **Экран с роутом или шагом flow** → `screens/<flow>/` (новое). Legacy в `components/` не расширять.
2. **Видимый UI-паттерн MQX** → `components/mqx/` по [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md); стили → `styles/mqx/<domain>.css`.
3. **HTTP к backend** → `api/<domain>.js`; домен = имя роутера (`game`, `finance`, `events`, …).
4. **Состояние и polling игры** → `hooks/game/` (и аналоги); не раздувать `useGame.js` без необходимости.
5. **В spec фичи одна строка трассировки:** Screen · API · CSS module (шаблон ниже).

```markdown
| Слой | Артефакт |
|------|----------|
| Screen | `screens/game/DashboardTab.jsx` (или legacy `DashboardPremium.jsx` до переезда) |
| API | `api/finance.js` → `GET /api/finance/overview` |
| Styles | `styles/mqx/dashboard.css` |
```

### Паттерны, которые уже работают (не ломать)

- **Screen / Shell / MQX:** `GameScreen` + `MqxShell`; вкладки — `*Premium.jsx` как оркестраторы данных.
- **Barrel + порядок импортов:** как `index.css` — один вход, предсказуемый каскад.
- **Backend routers + толстые модули:** `game_period.py`, `finance_overview_build.py` — искать логику по имени файла, не по «слою service».

### Пилоты (порядок внедрения)

| # | Задача | Риск | Польза |
|---|--------|------|--------|
| 1 | `frontend-react/ARCHITECTURE.md` — карта папок + 5 правил | Нулевой | Онбординг агента/человека |
| 2 | Разрез `api.js` → `api/*.js` + re-export | Низкий | Контракты по доменам |
| 3 | `backend/app/seeds/` + утоньшение `main.py` | Низкий | Читаемость bootstrap |
| 4 | Переименование `components/new-game/` → `screens/pre-game/` | Низкий | Уже почти feature folder |
| 5 | ADR `docs/decisions/ADR-00N-frontend-layout.md` | Нулевой | Фиксация «почему screens/» |
| 6 | По одной вкладке: `FinancePremium` → `screens/game/` при следующем PR фичи | Средний churn | Снижение flat `components/` |

---

## Key Assumptions to Validate

- [ ] **Один разработчик + агенты** остаются основной моделью — явные папки важнее «идеального» DDD на backend.
- [ ] **Plan mode и список сейвов** появятся в ближайших кварталах — резерв `screens/plan/` оправдан.
- [ ] **Split CSS не меняет каскад** в prod (проверено build + порядок в бандле) — перенос JS не должен трогать стили.
- [ ] **Touch-it move-it** реально соблюдается в PR — иначе flat `components/` никогда не сожмётся.
- [ ] **Имя `screens/`** понятнее `features/` для TMA (экран = route/flow, не бизнес-домен).

Как проверить:

- Новый агент по `ARCHITECTURE.md` кладёт заглушку Plan в `screens/plan/` без вопросов.
- PR с фичей финансов указывает в spec три артефакта (screen / api / css).
- `main.py` < ~150 строк wiring после выноса seeds.

---

## MVP Scope

**Включить (1–2 коротких итерации, без изменения UX):**

- One-pager (этот файл) + ссылка в [`docs/README.md`](../../README.md).
- [`frontend-react/ARCHITECTURE.md`](../../../frontend-react/ARCHITECTURE.md) — карта, 5 правил, таблица legacy → target, ссылка на `styles/README.md`.
- Разрез `api.js` на домены с сохранением публичного API (`import { apiCall } from '../api'`).
- `backend/app/seeds/game_starter_templates.py` (или аналог) + импорт в `main.py`.
- Pilot: `screens/pre-game/` (перенос из `components/new-game/`).
- Шаблон строки трассировки в [`docs/templates/`](../../templates/) или в DoR [`DOCUMENTATION_SYSTEM.md`](../../DOCUMENTATION_SYSTEM.md) — одна таблица «Screen · API · CSS».

**Явно вне MVP этой волны:**

- Массовый переезд всех `*Premium.jsx`.
- Резка `models.py` на пакеты.
- Path aliases `@/screens` (опционально позже).
- CSS colocation рядом с JSX (достаточно доменных файлов в `styles/mqx/`).

---

## Not Doing (and Why)

| Исключение | Причина |
|------------|---------|
| **Полный `app/domains/` на backend** | Дорого при меняющейся экономике MVP; логика уже в именованных модулях |
| **Big-bang rename `components/*`** | Высокий churn, нулевая польза игроку; конфликты с активными фичами |
| **Удаление `*Section.jsx` legacy одним PR** | Риск регрессий; quarantine уже в SPEC_FRONTEND_UI |
| **CSS-modules / styled per component** | Дублирует `styles/mqx/*`; ломает единый каскад TMA |
| **Monorepo / Nx / strict FSD** | Избыточно для размера команды и продукта |
| **Отдельный npm-пакет design-tokens** | Токены в `#root` достаточны ([`BRANDBOOK_MQX`](../../reference/brandbook/BRANDBOOK_MQX.md)) |

---

## Решения (2026-05-25)

| Вопрос | Решение |
|--------|---------|
| Имя папки route-level UI | **`screens/`** (не `features/`) |
| Plan mode в архитектуре | **`screens/plan/`** зарезервирован; README + перенос `BaseParamsScreen` при старте Plan |
| MVP one-pager | **Выполнен** — см. ниже |

## Open Questions

- **Когда обязать переезд `*Premium`:** после Plan wizard или уже при G1 «список сейвов»?
- **Линтер/eslint import boundaries** — нужны ли с v1 или достаточно документа + review?
- **ADR** `docs/decisions/ADR-00N-frontend-src-layout.md` — по желанию, канон уже в `ARCHITECTURE.md`.

---

## Реализовано (MVP)

| Артефакт | Путь |
|----------|------|
| Карта кода frontend | [`frontend-react/ARCHITECTURE.md`](../../../frontend-react/ARCHITECTURE.md) |
| API по доменам | [`frontend-react/src/api/`](../../../frontend-react/src/api/) |
| Pre-game screens | [`frontend-react/src/screens/pre-game/`](../../../frontend-react/src/screens/pre-game/) |
| Plan (задел) | [`frontend-react/src/screens/plan/README.md`](../../../frontend-react/src/screens/plan/README.md) |
| Seeds Game templates | [`backend/app/seeds/game_starter_templates.py`](../../../backend/app/seeds/game_starter_templates.py) |

---

## История

| Дата | Событие |
|------|---------|
| 2026-05-25 | One-pager из сессии idea-refine; опора на split `styles/` |
| 2026-05-25 | Решения: `screens/`, Plan в архитектуре; MVP structure land |
