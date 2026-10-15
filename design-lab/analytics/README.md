# Design-lab: Аналитика

Вкладка **«Аналитика»**: сначала вывод (счёт + подушка), потом из чего он. Канон — [`APPROVED.md`](APPROVED.md) (★ BG-2, 2026-10-15).

| Раунд | Статус | Что смотреть |
|-------|--------|--------------|
| [bg2-page-round](./bg2-page-round/) | **★ prod parity** | `AnalyticsPremium` после ★ BG-2: риск / устойчиво / начало партии |
| [../board-game/screens-round](../board-game/screens-round/) | ★ утверждено | экран «Аналитика» в раунде BG-2 |
| [v2-round](./v2-round/) | история | AN1 v2 (2026-06-21), заменён |

Запуск: `cd design-lab && npx serve .` → хаб, или отдельно:

```bash
cd design-lab/analytics/bg2-page-round && ./sync-lab.sh && npx serve .
```

Spec: [`SPEC_ANALYTICS`](../../docs/specs/SPEC_ANALYTICS.md).
