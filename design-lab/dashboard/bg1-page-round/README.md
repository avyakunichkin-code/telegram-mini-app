# bg1-page-round — исторический снимок BG-1

Историческая страница после переноса BG-1 (14.10.2026). Текущий канон — [current-page-round](../current-page-round/). Этот снимок не отражает BG-3/BG-4 и уточнения 04.11.
Концепция и утверждение — [`../../board-game/APPROVED.md`](../../board-game/APPROVED.md), раунд [`../../board-game/hybrid-round/`](../../board-game/hybrid-round/).

Два состояния одного хода: зарплата не забрана (цель свёрнута) и после зарплаты (цель раскрыта).

## Запуск

Хаб: `cd design-lab && npx serve .` → Dashboard → BG-1 prod parity.

Отдельно (Windows: `npx.cmd serve .` или `py -3 -m http.server 4173`):

```bash
cd design-lab/dashboard/bg1-page-round && ./sync-lab.sh && npx serve .
```

`lab-base.css` собирается из `board-game/styles.css` + `board-game/logic-round/styles.css`; `styles.css` — стили hybrid-round + отличия prod.
