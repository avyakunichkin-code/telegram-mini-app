# MQX UI Unification — единый визуальный язык TMA

**Статус:** in progress (этап A, 2026-05-23)  
**Связано:** [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md), [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md), [`UI_CONSISTENCY_AUDIT.md`](../../specs/UI_CONSISTENCY_AUDIT.md)

---

## Problem Statement

**How might we** сделать так, чтобы любой экран Telegram Mini App ТВОЙ ХОД воспринимался как один продукт (MQX + Quest Violet), без третьего «языка» и без правок в production в обход `design-lab` → утверждение → MQX → `#/dev/mqx`?

**Для кого:** игрок TMA (320–480px, светлая/тёмная тема Telegram).  
**Успех:** новый UI = утверждённый паттерн из spec; legacy не растёт; витрина MQX отражает только prod; главная боль — **несогласованность между вкладками** (особенно «Финансы»).

**Ограничения сессии:** Plan mode в prod **не** в scope ближайших 2 недель. Путь: **аудит → обсуждение → design-lab → ★ → prod**.

---

## Recommended Direction

Три волны, строго по [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md):

| Волна | Фокус | Итог |
|-------|--------|------|
| **A — Hygiene** | Инвентаризация, удаление мёртвого кода, MQX-витрина = только ★ prod | Меньше шума для агента и разработки |
| **B — Дашборд + события** | Только **открытые** хвосты (не перерисовывать S5 ★) | Lab → ★ → prod |
| **C — Капитал / Финансы** | `capital-page` A/B, вынос из `FinanceSection` | Один язык вкладки «Финансы» |

**Главный визуальный разрыв сейчас:** `FinancePremium` → legacy **`FinanceSection`** (смешение `mq-` / `tgui-` / `mqx-`). Дашборд **S5 Unified ★** уже в prod; события **L3 ★** в prod (бывш. M2 + domain band).

---

## Этап A — выполняется

- [x] Таблица аудита: [`UI_CONSISTENCY_AUDIT.md`](../../specs/UI_CONSISTENCY_AUDIT.md)
- [x] Удалить неиспользуемые `*Section.jsx`, `PeriodCloseModal.jsx`
- [x] Убрать из `#/dev/mqx` legacy-блоки (`MqxPeriodDashboard`, старые stat-cards)
- [x] Онбординг-демо на стеке prod (`MqxFinancePeriodBlock` + `MqxGoalDash`)
- [x] Синхронизировать статусы в `design-lab/README.md` и `DESIGN_WORKFLOW.md`

---

## Этап B — в работе (2026-05-23)

**Согласовано:** сначала **компоновка**, затем **домены** (`event_domain`).

| Lab | URL | Статус |
|-----|-----|--------|
| [`design-lab/events/layout-round/`](../../../design-lab/events/layout-round/) | `layout-round/index.html` | ★ **L3** → prod |
| [`design-lab/events/domains-round/`](../../../design-lab/events/domains-round/) | `domains-round/index.html` | Справочник доменов на L3 |

---

## Этап B — обсуждение (до lab)

### Дашборд — что уже ★ (не трогаем без причины)

По [`design-lab/dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md):

- **L3 + S5 Unified** в `DashboardPremium` (`mqx-tab-page--dash-unified`)
- Hero, 2×2 финансы, **цель** (`MqxGoalDash`), действия, таббар без «пилюли»
- Lab: [`goal-chain-round`](../../../design-lab/dashboard/goal-chain-round/) в паритете с prod; лендинг — [`LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md)

### Дашборд — что ещё разобрать (кандидаты в lab)

| # | Тема | Зачем | Риск если пропустить |
|---|------|--------|----------------------|
| B1 | **Empty / error / loading** на shell и вкладках | Единые `mqx-capital-empty` / скелетоны | «Чужие» спиннеры и пустые экраны |
| B2 | **Иконки итога периода** (6 строк) | Заменить временные `FinanceMetricIcons` | Визуальный разрыв с метриками капитала |
| B3 | **Stat-иконки 2×2** на главной | Согласовать с `FinanceMetricIcons` / StatIcons | Разный стиль chip-иконок |
| B4 | **VictoryGoalsPanel** vs блок уровня | Один паттерн целей (v2) | Дублирование смысла |

**Не делаем в B:** перекомпоновку S5, новый hero, dual-accordion (`dashboard-dual-accordion` — архив идеи).

### События — что ★ и что доделать

**В prod:** `EventCard` **L3** (domain band + pill, пузырь + Монетка), flat choices, `event_domain` из API, бейдж страхового случая, impacts на кнопках.

| # | Тема | Статус | Предлагаемый шаг |
|---|------|--------|------------------|
| E1 | Карточка L3 | ★ prod | — |
| E2 | **Страховой случай (M6 halo)** | Частично (badge + emerald bubble) | Lab: нужен ли полный halo панели |
| E3 | **EventChoiceImpacts** / XP на кнопках | ★ prod | — |
| E4 | **Оверлей карусели** (toolbar, dots, свайп) | ★ O1 L3 shell | — |
| E5 | **Длинные тексты** (line-clamp, скролл) | Открыто | Один раунд lab «длинное событие» |
| E6 | **Consumption-события** (0026) | Контент есть | Визуальная категория (иконка/kicker), не новый layout |

**Не делаем:** M1/M5 ультра-компакт без ★; отдельный LLM-текст от Монетки; Монетка на каждой кнопке выбора.

---

## Этап D — Pre-game shell + кнопки MQX (2026-05-25)

**Утверждено:** два route login/register; только design-lab → prod; **`MqxButton` везде** в user flows.

| Lab | Содержание |
|-----|------------|
| [`design-lab/pre-game-shell/`](../../../design-lab/pre-game-shell/) | P1–P6: bubble / flow / кнопки ★ |

**Спека:** [`SPEC_APP_SHELL.md`](../../specs/SPEC_APP_SHELL.md) · **Идея:** [`mqx-app-shell-pre-game-unification.md`](mqx-app-shell-pre-game-unification.md)

**Prod (первая волна):** Login, Register, StartMenu, New game, AuthGuard loading, MenuPremium, модалки GameScreen, `MqxConfirmDialog`.

**Остаток TGUI `Button`:** Plan/BaseParams, InsuranceSection, Admin — отдельные PR.

---

## Этап C — Капитал (после B, отдельное ★)

- Утвердить **A или B** в [`design-lab/capital-page/`](../../../design-lab/capital-page/)
- Порядок табов: Инвестиции → Бюджет → Страховки → Имущество → Обязательства
- Постепенно заменить тело `FinanceSection` на MQX-компоненты
- Недвижимость (`real-estate-asset-catalog`) — только через этот каркас

---

## Key Assumptions to Validate

- [ ] Игроку не мешает Монетка на **каждой** карточке события (M2) — playtest
- [ ] Удаление legacy `*Section` не ломает ни один маршрут (grep + smoke)
- [ ] `FinanceSection`-рефактор можно резать по одной вкладке за PR

---

## MVP Scope (текущая сессия)

**In:** этап A целиком; one-pager; audit-таблица; согласованный backlog B (дашборд хвосты + события).

**Out:** Plan mode UI; полный capital-page prod; редизайн аналитики (`MqStatRow` → MQX).

---

## Not Doing (and Why)

| Исключение | Причина |
|------------|---------|
| `BaseParamsScreen`, `PlanExpenseEditor` | Plan не в prod 2 недели; spec вне scope |
| Переписать `AnalyticsPremium` на чистый MQX | Этап D, после капитала |
| Новые шрифты / Inter в TMA | Против брендбука |
| Правки prod без design-lab | Только hotfix/баг без смены вида |
| `dashboard-dual-accordion` | Не утверждалось; superseded S5 |

---

## Open Questions

1. **B2 + B3** — один lab-раунд «иконки метрик» для дашборда + period-close + capital?
2. **E2** — включаем emerald halo (M6) для страховых событий или оставляем только badge?
3. После A — **сразу lab по событиям (E)** или **сначала empty/error (B1)**?

---

## Следующий шаг после утверждения one-pager

1. Пройтись по [`UI_CONSISTENCY_AUDIT.md`](../../specs/UI_CONSISTENCY_AUDIT.md) — подтвердить удаления.
2. Выбрать **первый lab-тикет** для этапа B: рекомендация **E2+E3** (события, быстрый визуальный выигрыш) **или** **B1** (empty/error, системно).
3. Явное ★ в чате → MQX → prod одним PR.
