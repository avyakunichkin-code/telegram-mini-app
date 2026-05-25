---
layer: ux
status: approved
last_reviewed: 2026-05-25
platform: Telegram Mini App (touch-first, 320–480px)
screen_id: dashboard
prod_route: GameScreen tab `dashboard`
---

# UX Spec: Главная (Dashboard)

> **Status:** Approved — OQ 1–7 закрыты (2026-05-25); без `h1` на вкладках (решение продукта); EN-audit отложен  
> **Author:** product + ux-review session  
> **Last Updated:** 2026-05-25  
> **Journey Phase(s):** активная партия (core loop), первая сессия (онбординг O1)  
> **Template:** UX Spec (адаптация studio → `docs/ux/screens/`)

**Связанные документы:** [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md) · [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) · [`SPEC_victory-v2.md`](../../specs/features/SPEC_victory-v2.md) · [ADR-002](../../decisions/ADR-002-victory-engine-and-template-config.md) · [ADR-004](../../decisions/ADR-004-mechanics-unlock-victory-chain.md) · [`SPEC_onboarding-tma.md`](../../specs/features/SPEC_onboarding-tma.md) · [`design-lab/dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md)

**Реализация:** `DashboardPremium.jsx`, `MqxDashboardHero`, `MqxFinancePeriodBlock`, `MqxGoalDash`, `MqxPeriodActions`; оболочка и оверлеи — `GameScreen.jsx`.

---

## Purpose & Player Need

**Игрок приходит на главную, чтобы за один короткий заход (сейчас ~1–3 мин, цель продукта — до 10–15 мин осмысленной игры):**

1. Понять, **где он в «месяце»** (номер периода, сколько осталось времени, идёт ли таймер).
2. Увидеть **ключевые деньги**: поток месяца, расходы на жизнь, наличные, подушка.
3. Сделать **1–2 действия**: зарплата, пополнение/снятие подушки, при необходимости — события и закрытие периода.
4. Понять **следующий шаг к победе** (текущая цель сценария, шаг K из N) без чтения всей вкладки «Финансы».

Формулировка с позиции игрока: *«Я открыл игру и хочу быстро понять, что делать в этом месяце и насколько я близок к своей цели».*

---

## Player Context on Arrival

| Контекст | Поведение UI |
|----------|----------------|
| **Первая игра Game** после выбора шаблона | `onboarding_state = draft` → guided coach поверх того же дашборда; табы заблокированы (кроме главной). |
| **Повторный заход** в ту же партию | Coach не показывается (`brief_done`); полный доступ к 4 табам. |
| **Возврат из Telegram** | Таймер и баланс должны resync (PW1); mood-фон страницы: play / pause / await. |
| **После закрытия периода** | Tail/sheet итога периода (`GameScreen`), не внутри `DashboardPremium`. |
| **Кампания vs исследователь** | Один экран для обоих: кампания смотрит на цель/цепочку; исследователь — на chips и быстрые действия ([`TARGET_PLAYER_AND_SESSION.md`](../../foundation/TARGET_PLAYER_AND_SESSION.md) §6). |

**Эмоциональное состояние:** любопытство + лёгкое давление времени; без «финтех-страха» — короткие подсказки Монетки, не лекции.

---

## Navigation Position

```text
App (HashRouter)
└─ GameScreen (mqx-screen--game)
   ├─ Tab: dashboard  ← этот spec (default)
   ├─ Tab: finance
   ├─ Tab: analytics
   └─ Tab: menu
   BottomGameNav — единственная первичная навигация между табами
```

**Иерархия:** Dashboard — **корень игрового HUD**; не дублирует нижний таббар и не содержит вторичного «назад».

---

## Entry & Exit Points

| Направление | Источник | Действие / результат |
|-------------|----------|----------------------|
| **Вход** | Создание/загрузка профиля → `GameScreen` | `activeTab = dashboard` по умолчанию |
| **Вход** | Онбординг `lockTabs` | Принудительный возврат на dashboard |
| **Выход** | `BottomGameNav` | finance / analytics / menu |
| **Выход** | Chip «Доходы» / «Расходы» | `setActiveTab('finance')` + `capitalFlowsOpen` = income \| expense |
| **Выход** | «Все финансы →» | `setActiveTab('finance')` |
| **Выход** | «Вложить» | finance → Инвестиции (депозит / облигации) |
| **Выход** | Pill «События» | `EventCarouselOverlay` (родитель `GameScreen`) |
| **Выход** | «Следующий период» | `advancePeriod` (+ modal предупреждения о зарплате вне онбординга) |
| **Выход** | (план M12) «Все достижения →» | страница каталога достижений — **не в prod** |

---

## Layout Specification

### Information Hierarchy

1. **Время и управление периодом** (hero) — highest: таймер, play/pause, № периода, события, закрытие месяца.  
2. **Снимок денег за период** (2×2 chips) — scan за 2–3 с.  
3. **Прогресс сценария** (цель, свёрнуто по умолчанию) — мотивация, не блокирует действия.  
4. **Действия периода** (2×2 chips) — primary motor loop.  
5. **Inline-панель подушки** — только после выбора «Пополнить» / «Снять».

### Layout Zones

| Зона | Компонент | CSS / режим |
|------|-----------|-------------|
| **Z0 Hero** | `MqxDashboardHero` | `mqx-hero--compact`, full width, градиент S5 |
| **Z1 Финансы периода** | `MqxFinancePeriodBlock` | `mqx-finance-static`, 2×2 chips, «Все финансы →» |
| **Z2 Цель** | `MqxGoalDash` | `mqx-goal-dash`, аккордеон, bleed sky-фон |
| **Z3 Действия** | `MqxPeriodActions` | `mqx-period-actions--chips`, 2×2 |
| **Z3b Подушка inline** | `SafetyFundActionForm` | `mqx-dash-safety-panel`, условный рендер |
| **Scroll** | `main.mqx-content--dash-flat` | вертикальный стек, inset-разделители (`MqxDivider`) |

**Вне тела dashboard (GameScreen):** modal зарплаты, sheet/tail итога периода, overlay событий, слой `GameOnboardingLayer`.

### Component Inventory

| Компонент | Паттерн / lab | Назначение |
|-----------|---------------|------------|
| `MqxDashboardHero` | dashboard S5 | Таймер, progress, play/pause, период, события, след. период |
| `MqxFinancePeriodBlock` | dashboard L3 | 4 KPI chips, ссылка в финансы |
| `MqxGoalDash` | goal-chain-round ★ · [`goal-path-stepper-round`](../../../design-lab/dashboard/goal-path-stepper-round/) (draft) | Цепочка победы v2 + guidance; свёрнуто — stepper из связанных узлов |
| `MqxPeriodActions` | period-actions-round ★ | Зарплата, вложить, пополнить, снять |
| `SafetyFundActionForm` | shared MQX | Сумма in/out подушки |
| `GameOnboardingLayer` | onboarding-guided ★ | Coach + spotlight (не дочерний dashboard) |

### ASCII Wireframe

```text
┌─────────────────────────────────────┐
│ [logo]  MM:SS  Прогресс месяца · N% │  Z0 Hero
│         [=========>        ]        │
│                    [▶] [⏸]          │
│ Период #3    [События 2] [След. пер.]│
├─────────────────────────────────────┤
│ Финансы периода                     │  Z1
│ ┌─────────┬─────────┐               │
│ │ Доходы  │ Расходы │               │
│ ├─────────┼─────────┤               │
│ │ Баланс  │ Подушка │ [fill bar]    │
│ └─────────┴─────────┘               │
│ Все финансы →                       │
├─────────────────────────────────────┤
│ ▼ Цель · [название текущей цели]    │  Z2 (collapsed)
│     (●)—(●)—(◉)—(○)—(○)  stepper    │  без «Шаг K из N»
├─────────────────────────────────────┤
│ Действия периода                    │  Z3
│ ┌─────────┬─────────┐               │
│ │Зарплата │ Вложить │               │
│ ├─────────┼─────────┤               │
│ │Пополнить│  Снять  │               │
│ └─────────┴─────────┘               │
│ [inline форма подушки — optional]   │  Z3b
└─────────────────────────────────────┘
│ [Главная][Финансы][Аналитика][Меню] │  BottomGameNav
└─────────────────────────────────────┘
```

---

## States & Variants

### Экран целиком (`GameScreen` + dashboard)

| State | Условие | Поведение |
|-------|---------|-----------|
| **Loading** | `loading` | TabHero «Подключаемся», Spinner; dashboard не монтируется |
| **Error** | `error` | Карточка + «Повторить загрузку» |
| **Empty profile** | `!overview \|\| !timeStatus` | «Профиль недоступен» |
| **Ready** | данные есть | `DashboardPremium` |
| **Syncing** | `syncing` | `aria-busy` на shell; *желательно* не блокировать chips (backlog) |

### Hero

| State | Отображение |
|-------|-------------|
| Play | `canPause=true`, mood playing |
| Pause | `canPlay=true`, mood pause |
| События 0 | Pill «События» без badge |
| События N>0 | Badge N; tap → overlay |
| Онбординг | Pill «События» **скрыт** (`eventsUnlocked = !inOnboarding`) |

### Финансы периода (chips)

| Chip | Данные | Интерактив |
|------|--------|------------|
| Доходы | `total_monthly_income` | Tap → finance, секция income |
| Расходы | `monthly_lifestyle_expense` | Tap → finance, секция expense |
| Баланс | `cash_balance` | Только просмотр |
| Подушка | `safety_fund_balance` + fill % к норме | Просмотр + bar; действия в Z3 |

### Цель (`MqxGoalDash`)

| Phase | UI |
|-------|-----|
| `empty` | Секция не рендерится |
| `active` | Свёрнут: kicker «Цель», title, «Шаг K из N» |
| `expanded` | Монетка guidance + цепочка `ol` |
| `gate` | Все шаги цепочки `met`, но `period_index < min_period_index_for_victory` (ждём 7-й период) |
| `win` | `win_reached` — «Победа в сценарии» |

### Действия периода

| Control | Disabled when |
|---------|----------------|
| Зарплата | `salary_claimed` или `!can_claim_salary` или `busy` |
| Пополнить / Снять | `busy` |
| Вложить | `busy`, нет `onInvest`, или `!overview.mechanics.capital_invest` (403 `mechanic_disabled`) |

| State | UI |
|-------|-----|
| `moneyModal=in` | Inline panel, max = cash |
| `moneyModal=out` | Inline panel, max = safety fund |
| `busyAction` | Все chips disabled |

### Онбординг (overlay)

| `onboarding_step` | Spotlight anchor |
|-------------------|------------------|
| `period_timer` | `data-onboarding-anchor="hero"` |
| `salary` | `salary` |
| `safety_fund` | `cushion` (кнопка «Пополнить») — **шаг 3** |
| `next_period` | `next_period` — **шаг 4** |
| `farewell` | без anchor |

Skip: 1-й раз — шаг; 2-й — весь онбординг → `brief_done`.

---

## Interaction Map

**Platform:** Touch (primary). Telegram Desktop — hover на chips по `SPEC_FRONTEND_UI`. Keyboard/gamepad — **не в scope** TMA.

| Элемент | Жест | Результат |
|---------|------|-----------|
| ▶ / ⏸ | tap | `POST` play/pause |
| Progress bar | — | display only |
| События | tap | open overlay |
| Следующий период | tap | warn modal (если зарплата не взята) → advance |
| Finance chip (action) | tap | finance + flows section |
| «Все финансы →» | tap | finance tab |
| Цель toggle | tap | expand/collapse |
| Зарплата | tap | `claim-salary` + toasts |
| Пополнить / Снять | tap | open inline panel |
| Вложить | tap | finance tab |
| Подушка submit | tap CTA | contribute/withdraw API |
| Outside panel | pointerdown | close safety panel |

**Focus order (рекомендуемый):** Hero controls → chips row-major → цель toggle → action chips → inline form fields.

---

## Events Fired

| Действие игрока | Client | Product analytics (рекомендуется) |
|-----------------|--------|-----------------------------------|
| Открытие вкладки | — | `screen_view` `dashboard` |
| Play / Pause | API time | `period_timer_toggle` |
| Claim salary | API | `salary_claimed` |
| Contribute / withdraw cushion | API | `safety_fund_in` / `out` |
| Next period | API | `period_advanced` |
| Open events | UI | `events_overlay_open` |
| Goal expand | UI | `goal_dash_expand` |
| Onboarding step complete | PATCH onboarding | `onboarding_step_*` |
| Finance chip drill-down | navigation | `dash_finance_chip_{income\|expense}` |

*События не блокируют UX при ошибке emit.*

---

## Transitions & Animations

| Переход | Поведение |
|---------|-----------|
| Смена таба | `mq-enter-item` на контенте таба |
| Mood background | `mq-page--mood-playing` \| `pause` \| `await` |
| Hero progress fill | width % без layout thrash |
| Goal expand | CSS chevron + expand region |
| Coach overlay | scrim + spotlight (portal) |
| Period close tail | slide-in tail (GameScreen) |

**Длительности:** согласовать с MQX animation standards при появлении `interaction-patterns.md` (backlog).

---

## Data Requirements

| UI element | API / model | Owner | Update trigger | Null / empty |
|------------|-------------|-------|----------------|--------------|
| `period_index` | `timeStatus` / `overview` | backend game_time | poll, resync, period end | 0 |
| Timer MM:SS | `remainingLocal` / `seconds_until_next_period` | game_time | 1s tick, visibility resync | `00:00` |
| Progress % | `period_duration_seconds`, remaining | derived | same | 0% |
| Доходы chip | `overview.total_monthly_income` | finance overview | refreshOverview | 0 |
| Lifestyle chip | `overview.monthly_lifestyle_expense` | finance overview | refresh | 0 |
| Чистый поток (не chip) | `overview.net_monthly_cashflow` | finance overview | refresh | Аналитика, цели |
| Cash | `overview.cash_balance` | profile | refresh | 0 |
| Safety + bar | `safety_fund_balance`, win target / norm utils | finance overview | contribute, period end | bar hidden if no norm |
| Victory chain | `overview.victory` (`goals`, `progression_mode`, `current_goal_key`) | victory_engine | refresh | hide Z2 if пусто |
| Legacy поля подушки | `win_target_safety_fund`, `win_progress_safety_fund`, `win_ready` | finance overview | refresh | дублируют первую `safety_fund_months` для bar/chips |
| `win_reached` | overview | victory_engine | refresh | фаза `win` в `MqxGoalDash` |
| Salary gating | `periodStatus.salary_claimed`, `can_claim_salary` | period API | claim, period end | disable + toast |
| Pending events count | `pendingEvents.length` | events API | refresh | no badge |
| Onboarding | `onboarding_state`, `onboarding_step` | profile | PATCH onboarding | coach off |
| Mechanics gate | `overview.mechanics.capital_invest` (и др.) | `starter_mechanics` + `mechanics_unlock` | goal progress, refresh | chip «Вложить»; см. ADR-004 |

**UI не хранит** игровое состояние кроме: `moneyModal`, `safetyAmount`, `busyAction`.

---

## Accessibility

**Target tier:** **Basic** — [`accessibility-requirements.md`](../accessibility-requirements.md).

| Требование | Статус prod | Цель spec |
|------------|-------------|-----------|
| Заголовки вкладки | `h2` секций + `aria-label` на `<section>` | **Без `h1`** — решение продукта для TMA hero/chips |
| `role="progressbar"` периода | ✅ | сохранить |
| `aria-live="polite"` таймер | ✅ | сохранить |
| Goal `aria-expanded` / `aria-controls` | ✅ | сохранить |
| Chips: имя + сумма для SR | ⚠ частично | `aria-label` с значением |
| Tone pos/neg только цветом | ⚠ | дублировать знак в `MoneyText` |
| Coach focus trap | ⚠ | документировать в O1 spec |

---

## Localization Considerations

| Элемент | RU (prod) | Max chars (guideline) | Notes |
|---------|-----------|----------------------|-------|
| Hero timer label | «Прогресс месяца» | 24 | |
| Section titles | «Финансы периода», «Действия периода» | 28 | |
| Chip «Доходы» | «Доходы» | 16 | значение = `total_monthly_income`, не net cashflow |
| Pill «Следующий период» | 18 | не сокращать до «Дальше» в онбординге |
| Toasts | RU | 80 | |
| **Запрещено в UI** | EN: cashflow, Positions, Forecast | — | P0 SPEC_FRONTEND_UI |

Запас **+40%** для будущих EN/UK локалей — не в MVP.

---

## Acceptance Criteria

1. При входе в игру активна вкладка «Главная»; hero показывает `period_index` и таймер, согласованные с API (после resync расхождение ≤1 с).
2. Секции «Финансы периода» и «Действия периода» с `h2`; hero без обязательного `h1`.
3. Chip «Расходы» показывает `monthly_lifestyle_expense` (base+delta), не просрочку и не долги.
4. Chip «Доходы» показывает `total_monthly_income` (сумма доходов без вычета расходов); подпись «Доходы» сохраняется.
5. «Зарплата» после успешного claim неактивна; повторный tap — info toast, не повторный POST.
6. «Следующий период» при незабранной доступной зарплате вне онбординга открывает modal; в онбординге шаг `next_period` (4) — без блокировки (SPEC_onboarding-tma).
7. `MqxGoalDash`: при `victory.goals` — свёрнутый заголовок «Шаг K из N»; цель `tutorial_invest` — «Положить деньги на депозит или купить облигацию»; при `win_reached` — фаза победы.
8. Pill «События» при N>0 открывает overlay; при `inOnboarding` pill **не показывается**.
9. Пополнение подушки: сумма ∈ (0, cash] → success toast, панель закрывается, балансы обновляются.
10. На ширине 320px все 8 chips (4+4) без горизонтального скролла; длинные суммы ужимаются (`fitChipValuesIn`).
11. Guided coach: шаги 1→5 проходимы на живом UI; второй Skip → `brief_done`; табы locked на шагах с overlay.
12. `npm run build` без регрессий; ручной smoke: зарплата → подушка → след. период → события.

---

## Решения Open Questions (2026-05-25)

| ID | Решение |
|----|---------|
| **OQ-1** | Pill «События» **скрыт** на всём онбординге (`GameScreen`: `eventsUnlocked = !inOnboarding`). |
| **OQ-2** | Chip **«Доходы»** не переименовываем. Значение = **`total_monthly_income`** (зарплата + доход активов), **без** вычета расходов. `net_monthly_cashflow` — отдельная метрика (аналитика, цели). |
| **OQ-3** | Практика шагов 1 и 4 (`period_timer`, `next_period`): **10 с** в коде, **без** обратного отсчёта и без упоминания секунд в тексте пузыря; подсказка «Попробуй элементы на экране» без таймера. |
| **OQ-4** | Цель `tutorial_invest`: заголовок **«Положить деньги на депозит или купить облигацию»**; в цепочке **сразу после** «Внести в подушку», **до** `safety_3x`/`safety_6x`. Онбординг: шаги **3 = подушка**, **4 = след. период**. Chip «Вложить» ведёт в финансы (депозит/облигации). |
| **OQ-5** | Блок **«Уровень» / character XP на главной снят** — канон [`remove-character-xp-and-levels.md`](../../vision/ideas/remove-character-xp-and-levels.md). SPEC_achievements §11 (коллапс «Уровень» на dashboard) — **не в MVP**; достижения через меню/отдельный экран, без 5-го таба. |
| **OQ-6** | Подсказка **B** (Монетка под chips) **удалена** из prod — дублировала coach и цель. Остаются **A** (онбординг) и **C** (цель при раскрытии). |
| **OQ-7** | Tier **Basic** — [`accessibility-requirements.md`](../accessibility-requirements.md). |

---

## Подсказки Монетки на главной (после OQ-6)

| Слой | Компонент | Когда |
|------|-----------|--------|
| **Coach (O1)** | `GameOnboardingLayer` | Первая игра (`draft` / `started`) |
| **Цель** | `MqxGoalDash` → `GoalMonetkaGuidance` | При раскрытии аккордеона «Цель» |

~~Подсказка под 4 chips (finance-Монетка)~~ — **снята 2026-05-25** как устаревшая: coach + цель + `titleHint` на chips достаточно.

---

## Implementation checklist

- [x] OQ-1: события скрыты в онбординге
- [x] OQ-2: chip «Доходы» → `total_monthly_income` + документация
- [x] OQ-3: 10 с без видимого таймера; тексты без «N секунд»
- [x] OQ-4: цель invest переименована и переставлена; онбординг 3↔4
- [x] OQ-5: уровни сняты — отражено в spec
- [x] OQ-6: finance-Монетка (B) удалена из `MqxFinancePeriodBlock`
- [x] OQ-7: `accessibility-requirements.md`
- [x] Миграции `0036` / `0037` (на окружениях владельца)
- [x] **Без `h1`** на вкладках — зафиксировано в spec
- [ ] EN-audit dashboard — отложено
- [ ] Повторный `/ux-review screens/dashboard.md` — по желанию

---

*Черновик для согласования. При изменении паттерна S5 обновлять этот файл и [`design-lab/dashboard/APPROVED.md`](../../../design-lab/dashboard/APPROVED.md).*
