# bg2-page-round — Аналитика ★ BG-2, prod parity

Страница целиком, как в prod `AnalyticsPremium` после переноса ★ BG-2 (2026-10-15). Канон — [`../APPROVED.md`](../APPROVED.md); утверждённый раунд — [`../../board-game/screens-round/`](../../board-game/screens-round/).

Три состояния: есть риск (подушка тонкая), всё устойчиво, начало партии (закрытых ходов нет).

## Запуск

Хаб: `cd design-lab && npx serve .`. Отдельно (Windows: `npx.cmd serve .`):

```bash
cd design-lab/analytics/bg2-page-round && ./sync-lab.sh && npx serve .
```

`lab-base.css` собирается из `board-game/styles.css` + `logic-round` + `hybrid-round` + `screens-round/styles.css`; `styles.css` — только отличия prod.
