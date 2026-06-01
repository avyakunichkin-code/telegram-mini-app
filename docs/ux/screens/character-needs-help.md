---
layer: ux
status: approved
last_reviewed: 2026-06-02
platform: Telegram Mini App
screen_id: needs-help-sheet
parent: dashboard-needs
---

# UX Spec: Справочник «Потребности» (needs guide)

> **API:** `GET /api/game/needs/guide`  
> **Контент:** `backend/app/needs/guide_content.py`  
> **Компонент:** `MqxNeedsHelpSheet.jsx`  
> **Вход:** иконка книги с бейджем «?» в Z-NEEDS (v7-e2)  
> **Lab:** [`design-lab/character-needs/help-sheet-round/`](../../../design-lab/character-needs/help-sheet-round/) (визуал sheet; контент — prod API)

---

## Purpose & Player Need

Ответы **по запросу**: что такое потребности, почему они падают, как поднять через события, как работает кнопка **«Улучшить»** (treat-self). Не дублирует O2 curriculum.

---

## API contract

```json
{
  "title": "Потребности",
  "sections": [
    { "heading": "Что это", "items": ["…"] },
    { "heading": "Почему снижаются", "items": ["…"] },
    { "heading": "Как пополнить", "items": ["…"] },
    { "heading": "Кнопка «Улучшить»", "items": ["…"] }
  ],
  "maintenance": ["…"],
  "critical": ["…"]
}
```

- `sections` — **канон** для UI.
- `maintenance` / `critical` — legacy для старых клиентов; FE fallback если `sections` пуст.

---

## Layout

```text
┌─────────────────────────────────────┐
│ Потребности                      ✕  │
├─────────────────────────────────────┤
│ Что это                             │
│   • …                               │
│ Почему снижаются                    │
│   • …                               │
│ Как пополнить                       │
│   • …                               │
│ Кнопка «Улучшить»                  │
│   • …                               │
├─────────────────────────────────────┤
│ [        Понятно        ]           │
└─────────────────────────────────────┘
```

- Четыре `h3` + `ul`; без accordion.
- При открытии — загрузка; при повторном открытии — новый fetch (сброс state при закрытии).

---

## Entry & Exit

| Entry | Exit |
|-------|------|
| Иконка книги+? в шапке Z-NEEDS | «Понятно» / ✕ / scrim |

---

## States

| State | UI |
|-------|-----|
| Loading | «Загружаем…» |
| Ready | `sections[]` из API |
| Error | toast + пустой body или повтор при следующем открытии |

---

## Accessibility

- `role="dialog"`, `aria-labelledby` → заголовок sheet.
- Кнопка справки: `aria-label="Подсказки"`.

---

## Acceptance Criteria

1. Открывается с главной; закрывается всеми стандартными путями.
2. Показаны все 4 раздела `sections`.
3. Тексты на русском; layout на 320px без горизонтального скролла.
4. После закрытия и повторного открытия контент загружается снова (нет вечного «Загружаем…»).
