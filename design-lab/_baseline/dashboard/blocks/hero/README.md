# Hero без таймера (turn-based period)

Раунд для TB1. **★ FINAL: H2** — кнопки справа, **«Закрыть месяц»**. Чипы плана месяца (H3) → эпик **TB1.1**.

## Запуск

```powershell
cd design-lab/dashboard/hero-no-timer-round
.\sync-lab.ps1
npx serve .
```

Открыть `http://localhost:3000` → `index.html`.

## Документы

- [`CONTENT.md`](CONTENT.md) — копирайт и видение
- [`VARIANTS.md`](VARIANTS.md) — H1 / H2 / H3, ★ FINAL
- Idea: [`docs/vision/ideas/turn-based-period-no-timer.md`](../../../docs/vision/ideas/turn-based-period-no-timer.md)
- Plan: [`docs/plans/PLAN_turn-based-period-no-timer.md`](../../../docs/plans/PLAN_turn-based-period-no-timer.md)

## Prod

После ★ FINAL — перенос в `MqxDashboardHero` по [`DESIGN_WORKFLOW.md`](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).
