# Страница «Капитал» — IA и компоновка

Этап 1 MQX: статика до React. Правила: [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Канон prod — ★ BG-2 (2026-10-15)

Канон и инварианты — [`APPROVED.md`](APPROVED.md); макет — [`../board-game/screens-round/`](../board-game/screens-round/) («Капитал · Детали», «Капитал · Действия»).

| Решение | Детали |
|---------|--------|
| **Экран** | `FinancePremium`, hero **«Капитал»**, `mqx-capital-page mqx-capital-page--board` |
| **Порядок** | Доходы/Расходы за ход → «Остаётся после хода» (Детали) → **Детали \| Действия** → карточки или фишки + sheet |
| **Детали** | `CapitalLot` — карточки собственности с цветной полосой: Вложения → Страховки → Имущество → Долги |
| **Действия** | `MqxCapitalActionGrid` — фишки 3 в ряд «Вложить / Купить / Занять», закрытые — пунктиром; `MqxCapitalSheet` |
| **Prod parity** | `screens-round/` + [`../finance/parity-generated-page-round/`](../finance/parity-generated-page-round/) |
| **История** | [`details-actions-round/`](details-actions-round/) — канон v2 (2026-06), структура сохранена |

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
