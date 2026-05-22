# Design-lab: Новая игра — режим (шаг 1)

```bash
cd design-lab/new-game-mode
npx serve .
```

Открыть `index.html` — **R1** (prod) vs **B** (legacy плитки).

| Документ | Назначение |
|----------|------------|
| [`VARIANTS.md`](VARIANTS.md) | A/B/R1 |
| [`APPROVED.md`](APPROVED.md) | Утверждённый R1 |
| [`../auth-flow/`](../auth-flow/) | Тот же skin пузыря Монетки |

## Prod

- **`MqxSaveKindPicker`** — MQX-компонент (`#/dev/mqx` при добавлении секции)
- **`NewProfileKindScreen`** — шаг 1 потока новой игры
- Следующий шаг: [`../game-templates/`](../game-templates/)

## История

| ID | Статус |
|----|--------|
| B · Монетка + плитки 2×2 | superseded → R1 |
| R1 · Unified strips | **★ prod** |
