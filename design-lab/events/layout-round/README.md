# Events — layout-round (L3 ★ prod)

Компоновка карточки события: L1–L5; **в prod** — **L3** (`EventCard`, `mqx-events-card--l3`).

## Запуск

```powershell
cd design-lab/events/layout-round
.\sync-lab.sh
npx serve .
```

## Лендинг

Fallback PNG событий: секция `#l1`, селектор `.ev-card-shell:first-child` (не внутренний `.ev-m2` без оболочки — иначе чёрный кроп на лендинге).

Спека: [`docs/specs/LANDING_SCREENSHOTS.md`](../../../docs/specs/LANDING_SCREENSHOTS.md)

## Prod

- `EventCarouselOverlay` + `EventCard` в `frontend-react/src/components/mqx/events/`
- Домены: раунд [`domains-round/`](../domains-round/)
