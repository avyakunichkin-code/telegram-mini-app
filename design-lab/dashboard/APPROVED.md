# Dashboard — утверждено (L3 + S5 Unified)

**Витрина:** `design-lab/dashboard/` · скин **S5 Unified**.  
**Лендинг (скрин):** [`goal-chain-round/`](goal-chain-round/) — не `index.html` (там устаревший «Уровень»).

## Порядок (L3)

1. Hero (цветной, на всю ширину)
2. Финансы — **2×2** chip + Монетка + «Все финансы →»
3. **Цель** — аккордеон `MqxGoalDash`, цепочка шагов победы ([`goal-chain-round/`](goal-chain-round/))
4. Действия — 4 кнопки (`MqxPeriodActions`)

## Страница (S5)

| Зона | Оформление |
|------|------------|
| Hero | Фиолетовый градиент, без скругления «карточки» |
| Контент | Еле заметный вертикальный градиент, **без** рамки `mqx-frame` / `mqx-dash-stack` |
| Разделы | Только **inset** горизонтальные линии (не до краёв) |
| Таббар | Белый фон, inset-разделители между вкладками; активная — **вся ячейка** (яркий градиент) |

## Без объёма

- Нет border/box-shadow у `mqx-frame` и `mqx-dash-stack` в игре
- Акцент только цветом (hero, цель, активный таб)

## UX (сохранено)

- Цель: sky-фон раздела, Монетка + пузырь «как достичь»
- Шеврон: иконка без фона
- Суммы: уменьшение шрифта, без переноса

## Prod

- `DashboardPremium` → `mqx-tab-page--dash-unified`
- `MqxFinancePeriodBlock` → `MqxGoalDash` → `MqxPeriodActions`
- Стили: `:has(.mqx-tab-page--dash-unified)` в `index.css`
- **design-lab** `goal-chain-round` — паритет с prod для лендинга и макетов

## Lab ↔ prod checklist

| Элемент | Lab | Prod |
|--------|-----|------|
| Hero pause | `\|\|` + filled | `MqxDashboardHero` |
| Подушка | chip + действия | `DashboardPremium` |
| Цель | `mqx-goal-dash` | `MqxGoalDash` |
| Таббар | `bottom-nav__cell--active` full | `BottomGameNav` |
