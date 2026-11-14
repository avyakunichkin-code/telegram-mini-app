# goal-path-stepper-round

Design-lab: **связанные кружки** (stepper) в свёрнутом разделе «Цель» на дашборде.

## Запуск

```powershell
cd game/design-lab/archive/dashboard/goal-path-stepper-round
.\sync-lab.sh
npx serve .
```

Открыть `http://localhost:3000` (или порт serve). В Network не должно быть 404 на `lab-base.css` и `assets/monetka-mascot.png`.

## Sync

`sync-lab.sh` собирает:

1. `../styles.css` (dashboard lab base)
2. `../goal-chain-round/styles.css` (G1 goal dash)
3. `./styles.css` (stepper)

Копирует маскот из `game/design-lab/events/assets/monetka-mascot.png`.

## Файлы

| Файл | Назначение |
|------|------------|
| `index.html` | Варианты P1–P3, 5 и 7 шагов, gate |
| `VARIANTS.md` | Сравнение и маппинг API |
| `styles.css` | Только stepper + layout modifiers |

## Связь

- UX: [`game/docs/ux/screens/dashboard.md`](../../../docs/ux/screens/dashboard.md) § Z2
- Idea: [`game/docs/vision/ideas/template-mechanics-victory-tutorial-chain.md`](../../../docs/vision/ideas/template-mechanics-victory-tutorial-chain.md)
- Prod: `MqxGoalDash` + `buildGoalChainView`
