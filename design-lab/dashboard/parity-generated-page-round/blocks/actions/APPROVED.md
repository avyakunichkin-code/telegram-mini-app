# Period actions — утверждено ★

**Раунд:** `design-lab/dashboard/period-actions-round/`  
**Скин:** S5 unified (chip как «Финансы периода»).

## Компоновка 2×2

| Позиция | Label | Sub (10px) | Действие |
|---------|-------|------------|----------|
| 1.1 | Зарплата | получить | `POST claim-salary`; disabled после получения |
| 1.2 | Вложить | депозиты/облигации | переход на вкладку Финансы → инвестиции |
| 2.1 | Пополнить | подушку | панель суммы → `contribute-to-safety-fund` |
| 2.2 | Снять | с подушки | панель суммы → `withdraw-from-safety-fund` |

## Подсказка Монетки

- Поза: **wink** (`monetka-wink`)
- Расположение: пузырь **слева**, маскот **справа**
- Текст: только про **Зарплату** (см. `CONTENT.md`)
- Акценты `<strong>`: **amber** — как `mqx-goal-monetka__text strong` в prod

## Без

- Подзаголовка «Управляй денежным потоком»
- Смены текста «Зарплата» на «получена»
- Кнопок `mqx-action` с рамками (legacy R0)

## Prod

- `MqxPeriodHint` + `MqxPeriodActionChip` (или рефактор `MqxPeriodActions`)
- `DashboardPremium` — порядок chip и подписи
- `index.css` — стили `mqx-period-hint`, `mqx-action-chip`
