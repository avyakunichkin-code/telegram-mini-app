---
layer: ux
status: approved
last_reviewed: 2026-05-26
platform: Telegram Mini App
screen_id: needs-help-sheet
parent: dashboard-needs
---

# UX Spec: Справочник «Помощь» (needs guide)

> **API:** `GET /api/game/needs/guide` или `overview.needs_guide`  
> **Lab:** [`design-lab/character-needs/help-sheet-round/`](../../../design-lab/character-needs/help-sheet-round/)

---

## Purpose & Player Need

Ответы **по запросу**: как держать шкалы в норме и что делать в критике. Особенно важно для **hard** без проактивных подсказок.

---

## Layout

```text
┌─────────────────────────────────────┐
│ Потребности                      ✕  │
├─────────────────────────────────────┤
│ ▼ Что это                           │
│ ▼ Почему снижаются                  │
│ ▼ Как пополнить                     │
│ ▼ Кнопка «Улучшить»                 │
├─────────────────────────────────────┤
│ [        Понятно        ]           │
└─────────────────────────────────────┘
```

- Четыре `h3` блока без collapse (`sections[]` с API).
- Контент: `backend/app/needs/guide_content.py`.

---

## Entry & Exit

| Entry | Exit |
|-------|------|
| Иконка книги в Z-NEEDS | «Понятно» / ✕ / backdrop |

---

## States

| State | UI |
|-------|-----|
| Loading | Skeleton lines |
| Ready | Тексты из API |
| Error | «Не удалось загрузить» + retry |

---

## Accessibility

- `aria-labelledby` на заголовок sheet.
- Списки — `<ul>`; не только цвет для важного.

---

## Acceptance Criteria

1. Открывается с главной; закрывается всеми стандартными путями.
2. Показаны все разделы `sections` (минимум 4).
3. Тексты на русском; длина до ~400 символов на раздел без поломки layout на 320px.
