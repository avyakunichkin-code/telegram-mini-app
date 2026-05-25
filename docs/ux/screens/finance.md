---
layer: ux
status: draft
last_reviewed: 2026-05-25
platform: Telegram Mini App (touch-first, 320–480px)
screen_id: finance
prod_route: GameScreen tab `finance`
---

# UX Spec: Финансы (Управление капиталом)

> **Status:** Draft — as-built из prod + design-lab; на ревью  
> **Author:** product + /ux-design session  
> **Last Updated:** 2026-05-25  
> **Journey Phase(s):** активная партия (core loop), сценарий №6 TMA — «финансовая картина»  
> **Template:** UX Spec (`docs/ux/screens/`)

**Связанные документы:** [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md) · [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) (§Капитал) · [`ux/screens/dashboard.md`](dashboard.md) · [`accessibility-requirements.md`](../accessibility-requirements.md) · [`design-lab/capital-page/README.md`](../../../design-lab/capital-page/README.md) · [`design-lab/finance-insurance/README.md`](../../../design-lab/finance-insurance/README.md)

**Реализация:** `FinancePremium.jsx`, `CapitalPeriodFlowsBlock`, `CapitalMonetkaGuidance`, `CapitalPropertyPanel`, `CapitalLiabilitiesPanel`, `InsuranceSection`, `InvestProductForm`; оболочка — `GameScreen.jsx` (`activeTab === 'finance'`).

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
| **Повторный заход** | Подсказка `CapitalMonetkaGuidance` скрыта после dismiss (`mq-capital-monetka-v1`) |
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
| **Вход** | Dashboard «Вложить» / цель invest | `finance`, раздел «Инвестиции» (ручной скролл) |
| **Выход** | `BottomGameNav` | dashboard / analytics / menu |
| **Выход** | Confirm dialog (отмена полиса, закрытие позиции) | остаёмся на finance после решения |

Данные **не сбрасываются** при смене таба: `overview` общий для `GameScreen`, доп. списки подгружаются в `FinancePremium` (`reloadExtra`).

---

## Layout Specification

### Information Hierarchy

1. **Ориентация** (hero) — «Управление капиталом», сколько разделов доступно.  
2. **Поток периода** (Доходы / Расходы) — highest для понимания «откуда/куда».  
3. **Действия по разделам** (инвестиции, страховки, имущество, обязательства) — оформление и списки позиций.  
4. **Подсказка Монетки** (опционально, один раз) — не блокирует иерархию 1–3.

### Layout Zones

| Зона | Компонент | Примечание |
|------|-----------|------------|
| **Z0 Hero** | `MqxTabHero` `mqx-hero--capital` | `sectionLabel` «Финансы», pill «N разделов», subtitle из `capitalPageSubtitle(mechanics)` |
| **Z0b Monetka** | `CapitalMonetkaGuidance` | Dismiss × → `localStorage` |
| **Z1 Поток** | `CapitalPeriodFlowsBlock` | Два аккордеона: Доходы, Расходы |
| **Z1b Hint** | `.mqx-cap-actions-hint` | «В разделах ниже… добавление и удаление» |
| **Z2–Z5 Капитал** | `MqxCapitalSectionAccordion` × до 4 | Порядок в prod см. ниже; видимость по `mechanics_effective` |

**Порядок аккордеонов капитала в prod (2026-05):**

1. Инвестиции (`capital_invest`)  
2. Страховки (`capital_insurance`)  
3. Имущество (`capital_property`)  
4. Обязательства (`capital_liabilities`)  

Сводка **Доходы / Расходы** всегда **выше** Z2–Z5 (согласовано с [`design-lab/capital-page/`](../../../design-lab/capital-page/)).

### Component Inventory

| Компонент | Зона | Роль |
|-----------|------|------|
| `MqxTabHero` | Z0 | Заголовок вкладки, без `h1` (канон TMA) |
| `CapitalMonetkaGuidance` | Z0b | Одноразовая подсказка |
| `CapitalPeriodFlowsBlock` | Z1 | Разбивка доходов/расходов периода |
| `MqxCapitalSectionAccordion` | Z1, Z2–Z5 | Сворачиваемый раздел + meta (сумма / счётчик) |
| `MqxSubtab` | Инвестиции | Депозиты \| Облигации |
| `MqxSectionSeg` | Инвестиции, страховки, портфель | **Оформить/Добавить** \| **Позиции (N)** |
| `InvestProductForm` | Инвестиции | Embedded форма, clamp по `cash_balance` |
| `InvestPositionRow` | Инвестиции | Строка позиции + закрытие |
| `InsuranceSection` | Страховки | Каталог 2×2 + тарифы, `useSectionSeg` |
| `CapitalPropertyPanel` | Имущество | Шаблоны + «Мои» активы |
| `CapitalLiabilitiesPanel` | Обязательства | Шаблоны + «Мои» долги |
| `useMqxConfirm` | глобально | Отмена полиса, закрытие инвестиции |

**Паттерн «каталог + позиции»** — канон [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) §Капитал; строки владений — `MqxFinListRow` + `MqxRowAction`.

### ASCII Wireframe

```text
┌─────────────────────────────────────┐
│ Финансы          [N разделов]       │  Z0 Hero
│ Управление капиталом                │
│ подзаголовок (инвестиции, …)        │
├─────────────────────────────────────┤
│ [Монетка: доходы/расходы + разделы]│  Z0b (optional)
│ [×]                                 │
├─────────────────────────────────────┤
│ ▼ Доходы              [итого ₽]     │  Z1
│     категории / строки              │
│ ▼ Расходы             [итого ₽]     │
├─────────────────────────────────────┤
│ подсказка про добавление/удаление   │
├─────────────────────────────────────┤
│ ▼ Инвестиции          [K поз.]      │  Z2
│   [Депозиты|Облигации]              │
│   [Оформить | Позиции (K)]          │
│   форма или список                  │
├─────────────────────────────────────┤
│ ▼ Страховки           [M полис.]    │  Z3
│   каталог / позиции                 │
├─────────────────────────────────────┤
│ ▼ Имущество           [P поз.]      │  Z4
├─────────────────────────────────────┤
│ ▼ Обязательства       [Q долг.]     │  Z5
└─────────────────────────────────────┘
   [Главная][Финансы][Аналитика][Меню]   BottomGameNav
```

---

## States & Variants

| State / Variant | Trigger | Что меняется |
|-----------------|---------|--------------|
| **Default** | `overview` загружен | Полный стек Z0–Z5 по mechanics |
| **No overview** | загрузка / ошибка родителя | `FinancePremium` → `null` (пустой таб) |
| **Deep-link flows** | `openFlowsSection` | Раскрыт один из Доходы/Расходы; второй свёрнут логикой `expandedSection` |
| **Monetka dismissed** | `mq-capital-monetka-v1` | Z0b скрыт |
| **Section hidden** | `mechanics_effective.* = false` | Аккордеон не рендерится; pill «N разделов» пересчитывается |
| **Invest: form** | `investUiMode === 'form'` | Форма открытия |
| **Invest: positions** | seg «Позиции» | Список или `MqxCapitalEmpty` |
| **Portfolio: add / mine** | `MqxSectionSeg` | Каталог шаблонов vs список владений |
| **Busy buy/cancel** | `buyingPlanKey`, `cancellingPolicyId` | Disabled на кнопках страховки |
| **Confirm pending** | `useMqxConfirm` | Modal поверх scroll |

**Пустые состояния** (частично): `MqxCapitalEmpty` в инвестициях; TMA checklist — «пустые состояния вкладки Финансы» ещё [ ] в [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md).

---

## Interaction Map

**Ввод:** touch-first (TMA); desktop — hover на delete по [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md).

| Элемент | Действие | Feedback | Исход |
|---------|----------|----------|--------|
| Аккордеон Доходы/Расходы | tap header | expand/collapse | Локальный UI |
| `MqxSubtab` Депозиты/Облигации | tap | `aria-selected` | Сброс `investUiMode` → form |
| `MqxSectionSeg` | tap | смена панели | form ↔ positions |
| Открыть депозит/облигации | submit форма | toast success/error | API + `refreshOverview` + `reloadExtra` |
| Закрыть позицию | tap → confirm → OK | toast | `closeInvestPosition` |
| Купить страховку | tap план | toast, busy state | `buyPolicy` |
| Отменить полис | tap → confirm | toast | `cancelPolicy` |
| Добавить актив/долг из шаблона | tap + | toast | `create*FromTemplate` / refresh |
| Удалить актив/долг | tap корзина | toast | `deleteAsset` / `deleteLiability` |
| Dismiss Monetka | tap × | скрытие блока | `localStorage` |
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

**Клиентское состояние:** суммы форм, UI modes (form/positions), dismiss Monetka, expanded flows — не на сервере.

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
| Seg labels | «Оформить», «Позиции», «Добавить», «Мои (N)» | +40% для DE/FR |
| Help deposit/bond | 2–3 строки | не сокращать ставку |
| **Запрещено** | EN: Positions, cashflow в UI | P0 SPEC_FRONTEND_UI |

---

## Acceptance Criteria

1. При `activeTab = finance` отображается hero «Управление капиталом» и блоки Доходы/Расходы, если есть `overview`.
2. Переход с главной chip «Доходы» раскрывает аккордеон с `id="capital-flows-income"` в зоне видимости.
3. Раздел «Инвестиции» виден только при `mechanics_effective.capital_invest`; внутри — переключение Депозиты/Облигации и seg Оформить/Позиции.
4. Открытие депозита с суммой > `cash_balance` не уходит на сервер (clamp) или возвращает понятную ошибку toast.
5. Отмена полиса и закрытие инвестиции требуют confirm; отмена в dialog не меняет данных.
6. После успешного добавления долга из шаблона — toast «Обязательство добавлено…», `overview` обновлён (cash/liabilities).
7. Dismiss подсказки Монетки скрывает блок на этом устройстве до очистки storage.
8. На 320px аккордеоны и seg не вызывают горизонтальный скролл страницы.
9. `npm run build` без ошибок; ручной smoke: потоки → инвестиция → страховка → шаблон актива.

---

## Open Questions

| ID | Вопрос |
|----|--------|
| **OQ-F1** | Убрать `CapitalMonetkaGuidance` по аналогии с finance-Монеткой на dashboard (OQ-6), или оставить как единственную ориентацию на вкладке? |
| **OQ-F2** | Product/analytics events на действия капитала — нужен ли минимальный набор? |
| **OQ-F3** | Единые empty states для страховок/имущества/обязательств (сейчас неравномерно) — копирайт и CTA. |
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
