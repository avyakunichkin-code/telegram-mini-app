---
layer: ux
status: draft
last_reviewed: 2026-06-01
platform: Telegram Mini App (touch-first, 320–480px)
screen_id: finance
prod_route: GameScreen tab `finance`
---

# UX Spec: Финансы (Управление капиталом)

> **Status:** Draft — as-built из prod + design-lab; на ревью  
> **Author:** product + /ux-design session  
> **Last Updated:** 2026-06-01  
> **Journey Phase(s):** активная партия (core loop), сценарий №6 TMA — «финансовая картина»  
> **Template:** UX Spec (`docs/ux/screens/`)

**Связанные документы:** [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md) · [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) (§Капитал) · [`ux/screens/dashboard.md`](dashboard.md) · [`accessibility-requirements.md`](../accessibility-requirements.md) · [`design-lab/capital-page/details-actions-round/README.md`](../../../design-lab/capital-page/details-actions-round/README.md) · [`design-lab/finance-insurance/README.md`](../../../design-lab/finance-insurance/README.md)

**Реализация:** `FinancePremium.jsx`, `CapitalPeriodFlowsBlock`, `MqxCapitalPageModeSeg`, `CapitalDetailsPanel`, `CapitalActionsPanel`, `MqxCapitalActionGrid`, `MqxCapitalSheet`, `InvestProductForm`, `InsuranceProductPicker`; оболочка — `GameScreen.jsx` (`activeTab === 'finance'`).

**Внутренний обзор для команды:** [`handbook/internal/TEAM_UPDATE_2026-06-01.md`](../../handbook/internal/TEAM_UPDATE_2026-06-01.md).

---

## Purpose & Player Need

**Игрок открывает «Финансы», чтобы:**

1. **Разобрать поток периода** — из чего складываются доходы и расходы (зарплата, активы, обязательства, страховки, жизнь).
2. **Управлять капиталом** — оформить/закрыть инвестиции, купить/отменить страховку, добавить/удалить имущество и долги из шаблонов.
3. **Подготовить решения** перед концом месяца (не дублирует зарплату и подушку — они на главной).

Формулировка: *«Хочу понять, куда уходят деньги в этом месяце, и при необходимости что-то добавить или убрать в портфеле».*

**Не цель этой вкладки:** победа/цели (главная), аналитика трендов (вкладка «Аналитика»), настройки профиля (меню).

---

## Player Context on Arrival

| Контекст | Поведение UI |
|----------|----------------|
| **С главной** — chip «Доходы» / «Расходы» | `openFlowsSection` → скролл и раскрытие аккордеона `capital-flows-income` / `capital-flows-expense` |
| **С главной** — «Все финансы →» / «Вложить» | Таб `finance` без якоря; «Вложить» — цель онбординга ведёт сюда для депозита/облигаций |
| **Повторный заход** | Тот же стек; без одноразовой Монетки на вкладке (снята в v2) |
| **Онбординг** | Таб может быть **заблокирован** (`lockTabs`); цель `tutorial_invest` требует действий здесь |
| **Шаблон с урезанными механиками** | Разделы скрыты по `overview.mechanics_effective` (не только blueprint) |

**Эмоция:** осмысление и контроль, не паника — короткие lead-тексты, аккордеоны свёрнуты по умолчанию (кроме deep-link на поток).

---

## Navigation Position

```text
App (HashRouter)
└─ GameScreen
   ├─ Tab: dashboard
   ├─ Tab: finance  ← этот spec
   ├─ Tab: analytics
   └─ Tab: menu
   BottomGameNav — переключение табов
```

**Иерархия:** второй уровень игрового HUD; **без** кнопки «назад» — возврат только через нижний таббар или системный жест TG.

---

## Entry & Exit Points

| Направление | Источник | Действие / результат |
|-------------|----------|----------------------|
| **Вход** | `BottomGameNav` → Финансы | `activeTab = finance` |
| **Вход** | Dashboard chip Доходы/Расходы | `finance` + `capitalFlowsOpen` = income \| expense |
| **Вход** | Dashboard «Все финансы →» | `finance`, flows без якоря |
| **Вход** | Dashboard «Вложить» / цель invest | `finance`, режим **«Действия»**, sheet депозита/облигаций |
| **Выход** | `BottomGameNav` | dashboard / analytics / menu |
| **Выход** | Confirm dialog (отмена полиса, закрытие позиции) | остаёмся на finance после решения |

Данные **не сбрасываются** при смене таба: `overview` общий для `GameScreen`, доп. списки подгружаются в `FinancePremium` (`reloadExtra`).

---

## Layout Specification

### Information Hierarchy

1. **Ориентация** (hero) — «Управление капиталом», сколько разделов доступно.  
2. **Поток периода** (Доходы / Расходы) — highest для понимания «откуда/куда».  
3. **Режим страницы** — **Детали** (что уже есть) или **Действия** (оформить новое).  
4. **Контент режима** — аккордеоны позиций **или** сетка плиток + bottom sheets.

### Layout Zones

| Зона | Компонент | Примечание |
|------|-----------|------------|
| **Z0 Hero** | `MqxTabHero` `mqx-hero--capital` | `sectionLabel` «Финансы», pill «N разделов», subtitle из `capitalPageSubtitle(mechanics)` |
| **Z1 Поток** | `CapitalPeriodFlowsBlock` | Доходы, Расходы; meta **M7** (сумма) |
| **Z1b Режим** | `MqxCapitalPageModeSeg` | **Детали \| Действия** — разделитель под потоками |
| **Z2a Детали** | `CapitalDetailsPanel` | Аккордеоны: Инвестиции → Страховки → Имущество → Обязательства; только позиции |
| **Z2b Действия** | `CapitalActionsPanel` | Сетка плиток 3× (узкий 2×) + `MqxCapitalSheet` |

**Порядок аккордеонов в «Детали» (2026-06):** как выше; видимость по `mechanics_effective` / `capitalSectionState` (страховки locked).

Сводка **Доходы / Расходы** всегда **выше** сегмента и контента ([`details-actions-round`](../../../design-lab/capital-page/details-actions-round/)).

### Component Inventory

| Компонент | Зона | Роль |
|-----------|------|------|
| `MqxTabHero` | Z0 | Заголовок вкладки, без `h1` (канон TMA) |
| `CapitalPeriodFlowsBlock` | Z1 | Доходы/расходы; `MqxCapitalMetaSum` |
| `MqxCapitalPageModeSeg` | Z1b | Детали \| Действия |
| `CapitalDetailsPanel` | Z2a | Позиции + `MqxCapitalTextRowAction` |
| `MqxCapitalMetaCount` / `MqxCapitalMetaLiab` | Z2a | Meta M8 / M5 в summary |
| `MqxCapitalDetailEmpty` | Z2a | Пусто → CTA «+ Добавить» → Действия + sheet |
| `MqxCapitalActionGrid` | Z2b | Плитки действий |
| `MqxCapitalSheet` | Z2b | Оформление (invest, insurance, templates) |
| `InvestProductForm` | sheet | Депозит / облигации |
| `InsuranceProductPicker` | sheet | Каталог 2×2 |
| `CapitalPositionCard` | sheet | Шаблоны имущества / долгов |
| `InvestPositionRow` | Z2a | `useTextAction` — «Закрыть» / «Продать» |
| `useMqxConfirm` | глобально | Закрытие позиций, отмена полиса, удаление актива/долга |

**Паттерн v2:** разделение **просмотр (Детали)** и **оформление (Действия + sheet)**; см. [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) §Капитал.

### ASCII Wireframe

```text
┌─────────────────────────────────────┐
│ Финансы          [N разделов]       │  Z0 Hero
│ Управление капиталом                │
├─────────────────────────────────────┤
│ ▼ Доходы              [итого ₽]     │  Z1
│ ▼ Расходы             [итого ₽]     │
├─────────────────────────────────────┤
│ [ Детали | Действия ]               │  Z1b
├─────────────────────────────────────┤
│  (режим «Детали»)                   │
│ ▼ Инвестиции          [≡ 2]         │  Z2a
│   позиции + Закрыть/Продать         │
│ ▼ Страховки … Имущество … Долги     │
├─────────────────────────────────────┤
│  (режим «Действия»)                 │
│ [Деп][Обл][Дом][Авто][Стр][Ип][Кр]  │  Z2b grid
│         → bottom sheet              │
└─────────────────────────────────────┘
   [Главная][Финансы][Аналитика][Меню]   BottomGameNav
```

---

## States & Variants

| State / Variant | Trigger | Что меняется |
|-----------------|---------|--------------|
| **Default** | `overview` загружен | Потоки + режим «Детали» по умолчанию |
| **No overview** | загрузка / ошибка родителя | `FinancePremium` → `null` (пустой таб) |
| **Deep-link flows** | `openFlowsSection` | Раскрыт один из Доходы/Расходы |
| **Page mode actions** | `pageMode === 'actions'` | Сетка + sheets |
| **Sheet open** | `openSheet` | Bottom sheet поверх таба |
| **Section hidden** | `mechanics_effective.* = false` | Аккордеон/плитка не рендерится |
| **Insurance locked** | `capitalSectionState === 'locked'` | В «Детали» — locked hint; плитка страховок скрыта в «Действия» |
| **Busy buy/cancel** | `buyingPlanKey`, `cancellingPolicyId` | Disabled в sheet / row action |
| **Confirm pending** | `useMqxConfirm` | Dialog поверх scroll |

**Пустые состояния:** `MqxCapitalDetailEmpty` в каждой секции «Детали» с переходом в «Действия».

---

## Interaction Map

**Ввод:** touch-first (TMA); desktop — hover на delete по [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md).

| Элемент | Действие | Feedback | Исход |
|---------|----------|----------|--------|
| Аккордеон Доходы/Расходы | tap header | expand/collapse | Локальный UI |
| `MqxCapitalPageModeSeg` | tap | смена Детали/Действия | Переключение панели |
| Плитка действия | tap | открытие sheet | Каталог / форма |
| Открыть депозит/облигации | submit в sheet | toast | API + refresh |
| Закрыть/продать позицию | text action → confirm | toast | close / delete |
| Купить страховку | tap план в sheet | toast | `buyPolicy` |
| Отменить полис | «Отменить» → confirm | toast | `cancelPolicy` |
| Добавить из шаблона (sheet) | tap + | toast | `create*FromTemplate` |
| «+ Добавить» в пустой секции | tap | → Действия + sheet | `onGotoAction` |
| Bottom tab | tap | смена вкладки | уход с finance |

**Согласованность с главной:** chip «Доходы» не дублирует net cashflow — на dashboard `total_monthly_income`; здесь **детализация** периода через `buildCapitalPeriodFlows`.

---

## Events Fired

| Действие | Событие analytics | Примечание |
|----------|-------------------|------------|
| Открытие таба | — | не зафиксировано в spec |
| Покупка полиса / инвестиция | — | **OQ:** нужны ли product events |
| Ошибки API | — | только toast пользователю |

Персистентные изменения: балансы, позиции, полисы — через backend; UI только вызывает API и `refreshOverview`.

---

## Transitions & Animations

| Переход | Поведение |
|---------|-----------|
| Смена таба | Мгновенная (контент таба mount/unmount в `GameScreen`) |
| Deep-link scroll | `scrollIntoView({ behavior: 'smooth' })` к `#capital-flows-*` |
| Аккордеон | CSS expand/collapse (без отдельной motion-spec) |
| Confirm dialog | Telegram UI / `useMqxConfirm` overlay |

Reduced motion: не отдельный флаг; избегать длинных анимаций (только smooth scroll — **OQ** уважать `prefers-reduced-motion`).

---

## Data Requirements

| Data | Источник | R/W | Notes |
|------|----------|-----|-------|
| `overview` (cash, assets, liabilities, mechanics, …) | `GET /api/finance/overview` | R | Общий с дашбордом |
| `mechanics` / `mechanics_effective` | overview | R | Gates разделов |
| Invest positions | `GET /api/invest/positions` | R | `reloadExtra` |
| Policies | `GET /api/insurance/policies` | R | |
| Asset/liability templates | `GET .../asset-templates`, `liability-templates` | R | |
| Open deposit/bond | POST invest | W | clamp amount ≤ cash |
| Buy/cancel insurance | POST insurance | W | |
| Create/delete asset/liability | POST/DELETE finance | W | |

**Клиентское состояние:** `pageMode`, `openSheet`, суммы форм, expanded flows — не на сервере.

---

## Accessibility

**Tier:** Basic — [`accessibility-requirements.md`](../accessibility-requirements.md).

| Требование | Prod |
|------------|------|
| Заголовки | `h2` в hero через классы; **без `h1`** (как dashboard) |
| Аккордеоны | Раскрытие по tap; **OQ:** `aria-expanded` на всех `MqxCapitalSectionAccordion` |
| Invest subtabs | `role="tablist"`, `aria-selected` ✅ |
| Суммы | `MoneyText`; tone pos/neg не только цветом — частично |
| Confirm | Focus trap в dialog — ⚠️ проверить при `/ux-review` |
| Delete | Достаточная hit-area; hover только `@media (hover: hover)` |

---

## Localization Considerations

| Элемент | RU (prod) | Notes |
|---------|-----------|-------|
| Hero title | «Управление капиталом» | ≤ 28 chars |
| Section titles | Доходы, Расходы, Инвестиции, … | |
| Режим страницы | «Детали», «Действия» | |
| Row actions | «Закрыть», «Продать», «Отменить» | |
| Help deposit/bond | 2–3 строки | не сокращать ставку |
| **Запрещено** | EN: Positions, cashflow в UI | P0 SPEC_FRONTEND_UI |

---

## Acceptance Criteria

1. При `activeTab = finance` отображается hero «Управление капиталом» и блоки Доходы/Расходы, если есть `overview`.
2. Переход с главной chip «Доходы» раскрывает аккордеон с `id="capital-flows-income"` в зоне видимости.
3. При `capital_invest`: в «Детали» — позиции; в «Действия» — плитки Депозит и Облигации и sheets.
4. Открытие депозита с суммой > `cash_balance` не уходит на сервер (clamp) или возвращает понятную ошибку toast.
5. Отмена полиса и закрытие инвестиции требуют confirm; отмена в dialog не меняет данных.
6. После успешного добавления долга из шаблона — toast «Обязательство добавлено…», `overview` обновлён (cash/liabilities).
7. Пустая секция «Детали» → «+ Добавить» переключает на «Действия» и открывает нужный sheet.
8. На 320px сетка действий — 2 колонки; нет горизонтального скролла страницы.
9. `npm run build` без ошибок; smoke: потоки → Детали/Действия → депозит → страховка → ипотека/кредит.

---

## Open Questions

| ID | Вопрос |
|----|--------|
| **OQ-F1** | ~~Монетка на вкладке~~ — снята в v2; ориентация через hero + пустые состояния |
| **OQ-F2** | Product/analytics events на действия капитала — нужен ли минимальный набор? |
| **OQ-F3** | Зафиксировать meta M8/M5 в `APPROVED.md` capital-page после финального ревью lab |
| **OQ-F4** | `prefers-reduced-motion`: отключить smooth scroll с dashboard chips? |
| **OQ-F5** | EN-audit вкладки — отложено (как dashboard). |

---

## Implementation checklist

- [x] As-built описан в этой спеке
- [ ] `/ux-review screens/finance.md`
- [ ] Закрыть OQ-F1 с продуктом
- [ ] Пустые состояния (TMA checklist)
- [ ] EN-audit — отложено

---

*При изменении паттерна капитала обновлять [`design-lab/capital-page/`](../../../design-lab/capital-page/) и [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md).*
