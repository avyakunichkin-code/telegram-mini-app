# Events tails — E2 + E5

**Каркас:** L3 ★ prod (`EventCard`).  
**Цель:** закрыть хвосты из [`mqx-ui-unification`](../../../docs/vision/ideas/mqx-ui-unification.md).

**Смотреть:** не отдельный `serve` в этой папке, а хаб — `cd design-lab && npx serve .` → поиск «Tails» или раздел **События** → `events/tails-round/`.

## E2 — страховой случай (M6 halo)

| ID | Идея | Статус |
|----|------|--------|
| **E2-A** | Только emerald bubble + badge (сейчас в prod) | baseline |
| **E2-B ★** | Halo на всей карточке: gradient, blur-orb, pulse у badge, Монетка 56px | **prod** |

## E5 — длинные тексты

| ID | Идея | Статус |
|----|------|--------|
| **E5-A** | JS truncate (title 96, desc 180) | legacy |
| **E5-B ★** | Title clamp 2; пузырь scroll `max-height`; выборы clamp 2 строки CSS | **prod** |

**Не делаем:** отдельный layout; «Показать ещё» с раскрытием (можно в backlog, если scroll недостаточен).
