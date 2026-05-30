# Events tails-round — E2 / E5

**Статус:** ★ prod · [`APPROVED.md`](APPROVED.md) · [`VARIANTS.md`](VARIANTS.md)

## Что смотреть

Две карточки на L3 ★:

| ID | Секция | Смысл |
|----|--------|--------|
| **E2-B** | Страховой случай + halo | M6 emerald halo, pulse badge, Монетка 56px |
| **E5-B** | Длинный consumption | clamp title/choices, scroll пузыря по overflow |

## Запуск

**Ревью (основной):** хаб design-lab → «Tails E2/E5»

```powershell
cd design-lab
npx serve .
# http://localhost:3000/ → События → Tails E2/E5
```

**Отладка раунда:**

```powershell
cd design-lab/events/tails-round
.\sync-lab.ps1
npx serve .
```

## Sync

`lab-base.css` ← `styles.css` + `styles-monetka.css` + **`layout-round/styles.css`** (auto, если в `index.html` есть `ev-l3__`).

Все раунды events:

```powershell
cd design-lab/events
.\sync-all-rounds.ps1
```

## Prod parity

```powershell
cd frontend-react
npm run check:events-tails-parity
```

Канон mapping: `APPROVED.md` § Lab ↔ prod.
