# bg1-page-round — дашборд ★ BG-1, prod parity

Страница целиком, как в prod `DashboardPremium` после переноса ★ BG-1 (2026-10-14).
Концепция и утверждение — [`../../board-game/APPROVED.md`](../../board-game/APPROVED.md), раунд [`../../board-game/hybrid-round/`](../../board-game/hybrid-round).

Два состояния одного хода: зарплата не забрана (цель свёрнута) и после зарплаты (цель раскрыта).

Сверху страницы — **кадры prod в ★ «Чернильном крае»** (2026-11-02, `assets/prod-ink/`): единственный стиль prod, правила — инварианты [`../../board-game/APPROVED.md`](../../board-game/APPROVED.md). Ниже — раскладка ★ BG-1: состав и порядок блоков те же, края и тени — до ink. Переснять — со стенда e2e (`game/web/playwright.config.js`), 412×915, WebP.

## Запуск

Хаб: `cd design-lab && npx serve .` → Dashboard → BG-1 prod parity.

Отдельно (Windows: `npx.cmd serve .` или `py -3 -m http.server 4173`):

```bash
cd game/design-lab/dashboard/bg1-page-round && ./sync-lab.sh && npx serve .
```

`lab-base.css` собирается из `board-game/styles.css` + `board-game/logic-round/styles.css`; `styles.css` — стили hybrid-round + отличия prod.
