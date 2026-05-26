---
layer: ux
status: approved
last_reviewed: 2026-05-26
platform: Telegram Mini App
screen_id: events-needs-delta
parent: events-overlay
---

# UX Spec: Потребности в событиях (`needs_delta`)

> **Parent flows:** [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md) §4  
> **Existing:** `EventCard`, `EventCarouselOverlay` — [`design-lab/events/`](../../../design-lab/events/)  
> **Lab:** [`design-lab/character-needs/events-needs-chips-round/`](../../../design-lab/character-needs/events-needs-chips-round/)

---

## Purpose & Player Need

Игрок **связывает выбор в событии** с полосками на главной: видит, что ответ даст **+Связи** или **−Комфорт**, до нажатия.

---

## Scope (фаза 1)

- Отображение `needs_delta` на **кнопках выбора** в overlay.
- После успешного `choose` — обновление needs в overview + **juice** на dashboard bars (если игрок на главной после закрытия overlay).
- **Не менять** общую компоновку карточки события (L3 + overlay O1).

---

## Visual pattern

| Элемент | Спецификация |
|---------|--------------|
| Chip | `+Связи 12` / `−Статус 5`; только ненулевые оси |
| Порядок | Комфорт → Статус → Связи → Здоровье |
| Знак | `+` зелёный/emerald, `−` amber/danger (дубль текстом) |
| Пустой delta | Чипы не показывать |

### На кнопке choice

```text
┌──────────────────────────────┐
│ Пойти на пикник с друзьями   │
│ +Связи 22  +Здоровье 18      │
└──────────────────────────────┘
```

---

## Interaction

| Action | Outcome |
|--------|---------|
| Tap choice | existing POST choose + apply needs_delta server-side |
| Success | Close card / next event; parent refreshes overview |
| Return to dashboard | Optional juice burst on affected bars |

---

## States

| State | UI |
|-------|-----|
| Choice with delta | Chips visible |
| Choice cash-only | No needs chips (unchanged) |
| Mixed effects | Cash in title/subtitle; needs chips below |

---

## Acceptance Criteria

1. Если в choice есть `needs_delta`, на кнопке видны чипы с RU labels.
2. Знак +/- не только цветом.
3. После выбора значения needs на главной соответствуют серверу.
4. Не ломается свайп/карусель overlay на 320px.

---

## Lab variants

| ID | Идея |
|----|------|
| A | Chips под текстом кнопки |
| B | Chips справа в одну строку (если влезает) |
| C | Одна строка «Жизнь: +связи, +здоровье» |
