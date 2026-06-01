# Страница «Капитал» — IA и компоновка

Этап 1 MQX: статика до React. Правила: [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Канон prod (2026-06)

| Решение | Детали |
|---------|--------|
| **Экран** | `FinancePremium`, hero **«Капитал»**, `mqx-capital-page` |
| **Порядок** | **Доходы / Расходы** → **Детали \| Действия** → позиции или сетка + sheet |
| **Детали** | Аккордеоны позиций (инвестиции → страховки → имущество → обязательства); meta M8/M5 |
| **Действия** | `MqxCapitalActionGrid` + `MqxCapitalSheet`; ипотека и кредит раздельно |
| **Lab ★** | [`details-actions-round/`](details-actions-round/) — sync `./sync-lab.sh` |

UX: [`docs/ux/screens/finance.md`](../../docs/ux/screens/finance.md).

## CSS-пакет (не отдельная витрина)

| Папка | Назначение |
|-------|------------|
| [`flows-round/styles.css`](flows-round/styles.css) | Стили блока Доходы/Расходы; подключается из `details-actions-round/sync-lab.sh` |

Раунды `orient-round`, `actions-round`, hub `index.html` (6 аккордеонов / «Управление капиталом») удалены **2026-06-01** — git history.

## Запуск

```bash
cd design-lab/capital-page/details-actions-round
./sync-lab.sh
npx serve .
# хаб: cd design-lab && npx serve .
```

## Связанные lab

- [`row-actions/`](../row-actions/) — `MqxFinListRow`, метрики
- [`finance-insurance/`](../finance-insurance/) — каталог страховок
- [`invest-forms/`](../invest-forms/) — формы инвестиций
