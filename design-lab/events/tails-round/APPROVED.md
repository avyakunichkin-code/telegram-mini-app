# APPROVED — events tails-round

**Дата:** 2026-05-29  
**Раунд:** `design-lab/events/tails-round/`  
**Prod:** `frontend-react/src/components/mqx/events/`, `frontend-react/src/styles/mqx/events.css`  
**Витрина:** `#/dev/mqx` → Events tails · фикстуры `catalog/catalogEventsTailsDemo.js`

## Решения

| Хвост | Вариант | Триггер в prod |
|-------|---------|----------------|
| **E2** | **E2-B** — M6 halo на L3 | `eventHasInsuranceClaimChoice(event)` → класс `mqx-events-card--insurance` |
| **E5** | **E5-B** — clamp + scroll по переполнению | Только CSS на L3; JS-порогов нет |

## Критерии приёмки

- Страховое событие визуально отличимо от обычного L3 без смены слотов.
- Длинный title/description не ломают оверлей; пузырь скроллится внутри.
- `prefers-reduced-motion`: без pulse у badge.

---

## Lab ↔ prod mapping (канон)

При правке **любой** строки из таблицы — синхронно обновить пару lab/prod и прогнать:

```powershell
cd design-lab/events
.\sync-all-rounds.ps1
cd ../../frontend-react
npm run check:events-tails-parity
```

### E5-B — длинные тексты

| Что | Lab | Prod |
|-----|-----|------|
| **Файл дельты** | `tails-round/styles.css` | `frontend-react/src/styles/mqx/events.css` |
| Title clamp 2 | `.ev-l3-head .ev-m2__title` | `.mqx-events-card__title--l3` (≈415–426) |
| Bubble scroll | `.ev-l3 .ev-m2__bubble` — `max-height: 5.6em`, `overflow-y: auto` | `.mqx-events-card--l3 .mqx-events-card__bubble` (≈499–505) |
| Bubble text pad | `.ev-l3 .ev-m2__bubble p { margin: 0 }` | `.mqx-events-card__bubble-text` + `padding-right: 2px` на L3 (≈507–508) |
| Choice title clamp | `.ev-choice--flat .ev-choice__title` | `.mqx-events-choice__title` (≈715–721) |
| Choice desc clamp | `.ev-choice--flat .ev-choice__desc` | `.mqx-events-choice__desc` (≈734–738) |
| Разметка карточки | `index.html` — L3 как `layout-round` | `EventCard.jsx` |
| Демо-данные | тексты в `index.html` § E2/E5 | `catalog/catalogEventsTailsDemo.js` (см. `catalog/README.md`) |

### E2-B — страховой halo

| Что | Lab | Prod |
|-----|-----|------|
| **Файл дельты** | `tails-round/styles.css` | `events.css` + `EventCard.jsx` |
| Класс карточки | `.ev-l3--insurance` на `<article>` | `.mqx-events-card--insurance` (JS) |
| Halo gradient + border | `.ev-l3--insurance` background/border | `.mqx-events-card--l3.mqx-events-card--insurance` (≈512–520) |
| Blur orb | `.ev-l3--insurance::before` — 110×110, `top: -36px`, `blur(22px)` | `::after` (≈523–534) — **псевдоэлемент другой, геометрия та же** |
| Z-index контента | `.ev-l3--insurance .ev-l3__inner` | `.mqx-events-card__band`, `.mqx-events-card__frame` (≈537–540) |
| Монетка 56px | `.ev-l3--insurance .ev-m2__monetka-wrap .ev-monetka` | `.mqx-events-card--insurance .mqx-events-card__monetka` (≈547–550) |
| Bubble row grid | (из layout-round) | `grid-template-columns: 58px 1fr` (≈543–545) |
| Emerald bubble | `.ev-m2--insurance` в HTML | `.mqx-events-card--insurance .mqx-events-card__bubble` (≈578–586) |
| Badge pulse | `.ev-badge-insurance--pulse` + `__dot` + `@keyframes ev-tails-ins-pulse` | `.mqx-events-card__badge-pulse` + `mqx-events-insurance-pulse` (≈553–575) |
| Reduced motion | `@media (prefers-reduced-motion)` на dot | то же на `.mqx-events-card__badge-pulse` |

### Разметка / классы (L3 ★)

| Lab (`index.html`) | Prod (`EventCard.jsx`) |
|--------------------|-------------------------|
| `ev-l3 ev-card-shell` | `mqx-events-card mqx-events-card--l3` |
| `ev-l3__band` | `mqx-events-card__band` |
| `ev-l3__inner` | `mqx-events-card__frame` |
| `ev-l3-head` + `ev-m2__title` | `mqx-events-card__head` + `mqx-events-card__title--l3` |
| `ev-domain-pill` | `mqx-events-domain-pill` |
| `ev-m2__bubble-row` | `mqx-events-card__bubble-row` |
| `ev-choices ev-choices--flat` | `mqx-events-card__choices` |
| `ev-choice ev-choice--flat` | `EventChoiceButton` → `mqx-events-choice--flat` |

Каркас L3 в lab: `lab-base.css` ← `styles.css` + `styles-monetka.css` + `layout-round/styles.css` (auto при `ev-l3__` в `index.html`).

---

## Чеклист синка (агент / PR)

1. Правка lab → зеркало в prod (или наоборот) по таблице выше.
2. `design-lab/events/sync-all-rounds.ps1`
3. `npm run check:events-tails-parity` (frontend-react)
4. Визуально: хаб `events/tails-round/` и `#/dev/mqx` Events tails
5. Обновить **эту секцию**, если меняются селекторы или номера строк

---

## Вне scope tails-round

- Декомпозиция `events.css` (>1k строк) — отдельная задача.
- Domain labels (`eventDomainDisplay.js`) — раунд `domains-round`, не E2/E5.
