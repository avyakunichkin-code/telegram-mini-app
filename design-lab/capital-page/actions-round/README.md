# actions-round — все варианты IA «Финансы»

Раунд для выбора направления redesign: **действия**, **onboarding O2**, **визуал** — при жёстком инварианте:

| Инвариант | Контракт |
|-----------|----------|
| **Доходы / Расходы «под рукой»** | Сводка или mini-панель в **верхней зоне** viewport (≤1 экран до детализации) |
| **Deep-link с дашборда** | `#capital-flows-income` / `#capital-flows-expense` — раскрытие + scroll (как `openFlowsSection` в prod) |
| **O2 onboarding** | Без inline PNG Монетки на странице — guidance через strip (см. SPEC O2) |

## Запуск

```powershell
cd design-lab/capital-page/actions-round
.\sync-lab.ps1
npx serve .
```

Или через хаб: `cd design-lab && npx serve .` → **Capital — actions (all variants)**.

На каждом макете — кнопки **«С дашборда: Доходы / Расходы»** (симуляция `onGoCapitalFlows`).

## Варианты

| ID | Название | Суть | Sheet? |
|----|----------|------|--------|
| **V0** | Prod baseline | Текущий стек аккордеонов + блок Монетки (зачёркнут как legacy) | Нет |
| **V1** | O1+ orient | `cap-health` + доходы/расходы открыты, action — tease | Нет |
| **V2** | Action chips | Сводка + CTA-чипы → scroll к разделу | Нет |
| **V3** | Page seg | «Разобраться \| Действия» + sticky mini-поток | Нет |
| **V4** | Catalog hub | Sticky mini-поток + сетка 2×2 «Добавить» | Нет |
| **V5** | T2 tabs | Sticky поток + табы T2 только для action-разделов | Нет |
| **V6** | T4 groups | Sticky поток + группы «Деньги / Активы» | Нет |
| **V7** | Sheet | Sticky поток + hub-плитки → **sheet** на раздел | **Да** |
| **V8** | Sticky mini | Mini Доходы/Расходы always-on + аккордеоны действий | Нет |

Подробнее: [`VARIANTS.md`](VARIANTS.md).

## Связанные

- [`../orient-round/`](../orient-round/) — O1–O4 поток
- [`../flows-round/`](../flows-round/) — аккордеоны prod
- [`../README.md`](../README.md) — утверждённая IA

## После выбора

1. Явное «утверждаем Vx» в чате
2. `APPROVED.md` + canon sync
3. Spec / prod — только после lab
