# Design-lab: новая игра — режим (шаг 1)

> **Снято (2026-10-15).** Шага «Игра / План» больше нет (ADR-013, GO-01): «Новая игра» сразу ведёт к выбору жизни — [`../pre-game-shell/APPROVED.md`](../pre-game-shell/APPROVED.md). Экран ниже — история.

Утверждённый референс prod.

```bash
cd design-lab/new-game-mode
npx serve .
```

Открыть `index.html`.

| Документ | Назначение |
|----------|------------|
| [`APPROVED.md`](APPROVED.md) | Утверждённый R2 + I1 |
| [`VARIANTS.md`](VARIANTS.md) | Сводка (без альтернатив) |

## Prod

- `MqxMonetkaDialogScreen`, `MqxSaveKindPicker`, `NewProfileKindScreen`
- `ModeIllustrations.jsx` — I1
- Шаг 2: [`../game-templates/`](../game-templates/) (если есть)
