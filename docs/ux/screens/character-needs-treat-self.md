---
layer: ux
status: approved
last_reviewed: 2026-05-26
platform: Telegram Mini App
screen_id: treat-self-sheet
parent: dashboard-needs
---

# UX Spec: «Порадовать себя» (bottom sheet)

> **ADR:** [006](../../decisions/ADR-006-treat-self-options-and-cooldown.md)  
> **Lab:** [`design-lab/character-needs/treat-self-round/`](../../../design-lab/character-needs/treat-self-round/)

---

## Purpose & Player Need

Редкий **платный** способ поднять шкалы, когда события не помогли. Игрок **осознанно** выбирает сценарий, видит цену и эффект, подтверждает списание.

*«Я хочу потратить часть зарплаты на отдых и понять, какие полоски вырастут.»*

---

## Entry & Exit

| Entry | Exit |
|-------|------|
| CTA «Порадовать себя» в Z-NEEDS | Успех: sheet закрыт, toast «Готово», needs обновлены |
| — | Отмена: sheet закрыт, без POST |
| — | Ошибка 400: toast с причиной (кулдаун, нет cash, неверный option) |

---

## Layout (sheet)

```text
┌─────────────────────────────────────┐
│ Порадовать себя                  ✕  │
│ Списание с карты · раз в ~15 мес.   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Отгул: пикник с друзьями        │ │  option card (selected if 1)
│ │ Отдых и общение                 │ │
│ │ +Связи +22  +Здоровье +18 …     │ │  MqxNeedsDeltaChips
│ │ −8 400 ₽                        │ │  cost
│ └─────────────────────────────────┘ │
│ (при N>1 — список карточек, radio)  │
├─────────────────────────────────────┤
│ [      Подтвердить      ]           │  primary
│ [        Отмена         ]           │  secondary / text
└─────────────────────────────────────┘
```

### N = 1 (MVP)

- Одна карточка, визуально selected.
- Primary «Подтвердить» активна сразу.
- Не делать instant POST по первому tap на CTA дашборда.

### N > 1 (post-MVP)

- Radio/select на карточке; confirm disabled пока не выбрано.

---

## States

| State | UI |
|-------|-----|
| Loading options | Skeleton 1 card |
| Ready | Карточки + cost из API |
| Submitting | Primary disabled + spinner |
| Success | Close + success toast |
| Error cooldown | Toast: «Можно снова через N периодов» |
| Error cash | Toast: «Не хватает средств на карте» |

---

## Interaction Map

| Action | Event / API |
|--------|-------------|
| Confirm | `POST /api/game/period/treat-self` `{ option_id }` |
| Cancel | close sheet |
| Backdrop tap | close (no POST) |

**Analytics (рекомендуется):** `treat_self_open`, `treat_self_confirm`, `treat_self_cancel`.

---

## Copy (RU)

| Элемент | Текст |
|---------|-------|
| Title | Порадовать себя |
| Subtitle | Списание с карты. Не заменяет события — запасной путь. |
| Confirm | Подтвердить |
| Success toast | Потребности улучшились |
| Cooldown hint (disabled CTA) | Доступно через N периодов |

---

## Acceptance Criteria

1. Открытие только из enabled CTA; sheet `aria-modal`.
2. Всегда видна цена и превью дельт до confirm.
3. При 1 опции — одна карточка; `option_id` уходит в POST.
4. После успеха overview needs обновлён; кулдаун отражён на CTA.
5. Повторный confirm во время busy заблокирован.

---

## Lab variants

| ID | Идея |
|----|------|
| A | Карточка + full-width confirm (default) |
| B | Sticky footer с cost summary |
| C | Confirm opens second «Вы уверены?» step — **отклонено** (лишний шаг) |
