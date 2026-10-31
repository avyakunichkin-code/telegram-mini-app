# Design-lab: новая игра — режим (шаг 1)

> **Снято (2026-10-15).** Шага «Игра / План» больше нет (ADR-013, GO-01): «Новая игра» сразу ведёт к выбору жизни — [`../pre-game-shell/APPROVED.md`](../pre-game-shell/APPROVED.md). Экран ниже — история.

Исторический референс снятого экрана.

```bash
cd design-lab/new-game-mode
npx serve .
```

Открыть `index.html`.

| Документ | Назначение |
|----------|------------|
| [`APPROVED.md`](APPROVED.md) | Утверждённый R2 + I1 |
| [`VARIANTS.md`](VARIANTS.md) | Сводка (без альтернатив) |

## Исторические компоненты

- `MqxMonetkaDialogScreen`, `MqxSaveKindPicker`, `NewProfileKindScreen`
- `ModeIllustrations.jsx` — I1
- Актуальный выбор жизни: [`../game-templates/`](../game-templates/) (если есть)

## Очистка 2026-10-29

GO-02/03: удалены старый мастер `BaseParamsScreen`, редакторы `PlanExpenseEditor` / `PlanExpenseBudgetEditor` и их экспорты MQX. В игре остался старт по шаблонам; Plan развивается отдельно в `apps/plan-web` (ADR-016). Исторический макет не является каноном текущего UI.
