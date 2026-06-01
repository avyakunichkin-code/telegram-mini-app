---
layer: ux
status: approved
last_reviewed: 2026-06-02
platform: Telegram Mini App
screen_id: dashboard-needs
parent: dashboard
prod_route: GameScreen tab `dashboard` → Z-NEEDS
---

# UX Spec: Потребности на главной (Z-NEEDS)

> **Status:** Approved (базовые решения UX-01…UX-08)  
> **Parent:** [`dashboard.md`](dashboard.md)  
> **Product:** [`SPEC_game-character-needs.md`](../../specs/features/SPEC_game-character-needs.md)  
> **Lab:** [`dashboard-needs-v7-round/`](../../../design-lab/character-needs/dashboard-needs-v7-round/) — **v7 в prod** (плоский блок) · v5/v6 архив · **Портрет:** [`persona-portraits-round/`](../../../design-lab/game-templates/persona-portraits-round/)

---

## Purpose & Player Need

Игрок видит, **насколько «жива» его роль** в этом месяце, и успевает среагировать до штрафа или поражения — не уходя с главной и не открывая отдельный экран.

*«Я хочу одним взглядом понять, всё ли в порядке с комфортом, статусом, связями и здоровьем, и что нажать, если нет.»*

---

## Player Context on Arrival

| Контекст | UI |
|----------|-----|
| Первая игра, coach активен | Z-NEEDS **скрыт** до `brief_done` (не отвлекать от O1) |
| Сразу после coach | Intro-баннер ([`CHARACTER_NEEDS_UX.md`](../CHARACTER_NEEDS_UX.md) § Onboarding), затем compact Z-NEEDS |
| Обычная сессия | Всегда 4 шкалы; без accordion (v7) |
| Любая шкала <40, soft | Опциональный баннер «Проверь потребности» (dismissible) |
| `needs_zero_periods_streak > 0` | Critical banner «N из 3 месяцев…» |
| Plan / `needs.enabled: false` | Секция не рендерится |

---

## Navigation Position

```text
GameScreen → dashboard
  Z0 Hero
  Z-NEEDS  ← этот spec
  Z1 Финансы периода
  Z2 Цель
  Z3 Действия периода
```

---

## Layout Specification

### Information Hierarchy (Z-NEEDS only)

1. **Заголовок секции** `h2.mqx-finance-static__title` — **вне** карточки, как «Финансы периода».  
2. **Bleed-баннер риска** (если `needs_zero_periods_streak > 0`).  
3. **Портрет** слева + **4 шкалы** справа (всегда видимы; accordion снят).  
4. **Без summary** («Есть просадка» / «Истощение» под заголовком) — статус только в подписи справа от бара.  
5. **Действия** в шапке (★ **v7-e2e3**): иконка книги с «?» → sheet [`character-needs-help.md`](character-needs-help.md); сердце → treat-self. Lab: v7-A…D, e1–e3.

### Layout Zones

| Подзона | Содержание |
|---------|------------|
| **Header row** | `h2` «Потребности» + **книга с бейджем «?»** (справка) + **сердце** (treat-self, v7-e3) |
| **Risk bleed** | Полноширинный баннер при `needs_zero_periods_streak > 0` |
| **Body** | `PersonaPortrait` (`dash`) + **4 шкалы** всегда (`MqxNeedsBars`) |
| **Разделитель** | Только `MqxDivider` после секции (без `border-bottom` у блока) |

### ASCII Wireframe (prod v7-e2e3)

```text
│ ⚠ Риск: 2 из 3 месяцев с нулём на «Связи»     │  bleed (если streak)
├───────────────────────────────────────────────┤
│ Потребности                        [📖?] [♥]  │
│ [👤]  Комфорт   ████████░░    Норма           │
│       Статус    █████░░░░░    Низко           │
│       Связи     ███░░░░░░░    Истощение       │
│       Здоровье  ██████░░░░    Норма           │
├───────────────────────────────────────────────┤  MqxDivider
```

### Component Inventory

| Компонент | Lab / MQX | Примечание |
|-----------|-----------|------------|
| `MqxNeedsDash` | dashboard-needs-v7-round ★ **e2e3** | `actionsVariant="e2e3"` |
| `PersonaPortrait` | persona-portraits-round | `size="dash"` |
| `IconHelpBook` + badge | `MqxContextHelpIcons.jsx` | без фона/рамки у кнопки |
| `IconTreatHeart` | то же | emerald-точка; disabled → toast cooldown |
| `MqxNeedsHelpSheet` | help-sheet-round | `GET /api/game/needs/guide` → 4 `sections` |
| `MqxTreatSelfSheet` | treat-self-round | `POST treat-self` |

---

## States & Variants

| State | Условие | UI |
|-------|---------|-----|
| **Hidden** | `!needs.enabled` | Нет секции |
| **Hidden onboarding** | `inOnboarding` | Нет секции |
| **Default** | `needs.enabled` | 4 bars + портрет |
| **Zone labels** | per bar | Норма / Низко / Истощение / Критично (справа от бара) |
| **Zero + streak** | `needs_zero_periods_streak > 0` | Bleed risk banner |
| **Treat unavailable** | cooldown | Сердце `aria-disabled`; tap → toast «Разблокируется через N периодов» |
| **Treat available** | `treat_self.available` | Сердце → `MqxTreatSelfSheet` |

### Цвета зон (не единственный канал)

| Зона | Визуал | Текстовый дубль |
|------|--------|-----------------|
| ≥40 | neutral/emerald track | «Норма» |
| 30–39 | amber track | «Низко» |
| 1–29 | stressed pattern / amber-red | «Истощение» |
| 0 | danger + pulse optional | «Критично» |

---

## Interaction Map

| Действие | Результат | Feedback |
|----------|-----------|----------|
| Tap книга «?» | open [`character-needs-help`](character-needs-help.md) | `MqxNeedsHelpSheet` |
| Tap сердце | treat sheet или toast если cooldown | [`character-needs-treat-self`](character-needs-treat-self.md) |
| Dismiss intro banner | hide + persist flag | fade out |
| Dismiss soft hint | hide until next period or forever (product: **until next period**) | — |

---

## Data Requirements

| Data | Source | Read/Write |
|------|--------|------------|
| `overview.needs` | GET overview | Read |
| `overview.needs_meta` | overview | Read |
| `overview.treat_self` | overview | Read |
| `needs_zero_periods_streak` | overview or period status | Read |
| Intro dismissed | profile field or localStorage | Write (client) |

---

## Accessibility

- Секция: `<section aria-labelledby="needs-title">`, `h2` «Потребности».
- Каждый bar: `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Связи, 28 из 100, низко"`.
- Critical banner: `role="alert"` или `aria-live="polite"` при появлении.
- Кнопки footer ≥44×44px.

---

## Acceptance Criteria

1. Z-NEEDS сразу после hero, до Z1; при `needs.enabled` секция видна на 320px.
2. Всегда 4 подписанных бара; accordion снят (v7).
3. При streak≥1 — bleed-баннер «N из 3 месяцев».
4. Справка: 4 раздела из `needs/guide`; заголовок sheet «Потребности».
5. Сердце disabled → toast с cooldown (не блокирующий `disabled` без feedback).
6. Один `MqxDivider` после секции (без двойной линии).
7. Не рендерится в онбординге и при `needs.enabled: false`.

---

## Design-lab

| ID | Статус |
|----|--------|
| **v7-e2e3** | ★ **prod** — книга e2 + сердце e3 |
| v7-A…D, e1–e3 | архив сравнения — [`dashboard-needs-v7-round/VARIANTS.md`](../../../design-lab/character-needs/dashboard-needs-v7-round/VARIANTS.md) |
| v5/v6 | архив |
