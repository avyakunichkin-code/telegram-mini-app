---
layer: ux
status: approved
last_reviewed: 2026-05-26
platform: Telegram Mini App
screen_id: dashboard-needs
parent: dashboard
prod_route: GameScreen tab `dashboard` → Z-NEEDS
---

# UX Spec: Потребности на главной (Z-NEEDS)

> **Status:** Approved (базовые решения UX-01…UX-08)  
> **Parent:** [`dashboard.md`](dashboard.md)  
> **Product:** [`SPEC_game-character-needs.md`](../../specs/features/SPEC_game-character-needs.md)  
> **Lab:** [`design-lab/character-needs/dashboard-needs-round/`](../../../design-lab/character-needs/dashboard-needs-round/) — **v2 E1–E3** ([`VARIANTS.md`](../../../design-lab/character-needs/dashboard-needs-round/VARIANTS.md))

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
| Обычная сессия | Compact; раскрытие по tap |
| Любая шкала <40, soft | Опциональный баннер «Проверь самочувствие» (dismissible) |
| `needs_zero_periods_streak > 0` | Critical banner «N из 3 месяцев…» |
| Plan / `needs.enabled: false` | Секция не рендерится |

---

## Navigation Position

```text
GameScreen → dashboard
  Z0 Hero
  Z1 Финансы периода
  Z-NEEDS  ← этот spec
  Z2 Цель
  Z3 Действия периода
```

---

## Layout Specification

### Information Hierarchy (Z-NEEDS only)

1. **Bleed-баннер риска** (если `needs_zero_periods_streak > 0`) — на всю ширину, без card-chrome  
2. **Свернуто:** маскот слева (52×56) + **одна** горизонтальная шкала min-оси + цветной статус справа (**без** дубля «Истощение» в шапке строки)  
3. **Раскрыто:** 4 горизонтальные шкалы (тот же паттерн: подпись · бар · цветной статус)  
4. **Действия** — в expanded: чип «Улучшить» и «?» в кружке рядом с заголовком (в collapsed вместо «?» — ссылка `как улучшить →`)

### Layout Zones

| Подзона | Содержание |
|---------|------------|
| **Header row** | `Самочувствие` + ссылка `как улучшить →` (collapsed) / `?` в кружке (expanded) |
| **Compact row** | Min value label + мини-bar или 4-dot strip + статус-текст |
| **Expanded** | `MqxNeedsBars` ×4 |
| **Footer actions** | `[Порадовать себя]` `[?]` — горизонтально, min 44px height |
| **Banners** | Над compact или под header: risk / soft hint |

### ASCII Wireframe

**Collapsed (default):**

```text
│ ⚠ Риск: 2 из 3 месяцев с нулём на «Связи»     │  bleed (если streak)
├───────────────────────────────────────────────┤
│ ▼ Самочувствие                            ⌄   │
│ [👤]  Связи    ███░░░░░░░     Истощение       │  цветной текст, не бейдж
├───────────────────────────────────────────────┤
```

**Expanded:**

```text
│ ▲ Самочувствие                                │
│ [👤]  Комфорт   ████████░░    Норма           │
│       Статус    █████░░░░░    Норма           │
│       Связи     ███░░░░░░░    Истощение       │
│       Здоровье  ██████░░░░    Норма           │
│                    [Порадовать себя]  ( ? )   │  справа, компактно
```

### Component Inventory

| Компонент | Lab / MQX | Примечание |
|-----------|-----------|------------|
| `MqxNeedsSummary` | dashboard-needs-round | accordion host |
| `MqxNeedsBars` | то же | `role="progressbar"` per bar |
| `MqxNeedsRiskBanner` | то же | optional |
| `MqxNeedsIntroBanner` | needs-intro-banner-round | post-onboarding |
| Footer CTA | treat-self + help specs | |

---

## States & Variants

| State | Условие | UI |
|-------|---------|-----|
| **Hidden** | `!needs.enabled` | Нет секции |
| **Hidden onboarding** | `inOnboarding` | Нет секции |
| **Collapsed default** | ready | Compact row |
| **Expanded** | user toggled | 4 bars |
| **All ok** | all ≥40 | «Всё в норме» (зелёный/neutral текст + ✓) |
| **Low** | any <40, none <30 | «Есть просадка» |
| **Distressed** | any <30, >0 | «Истощение» + иконка |
| **Zero** | any ==0 | Подсветка оси + critical banner if streak |
| **Treat unavailable** | cooldown / no cash | CTA disabled + hint «через N периодов» / «не хватает средств» |
| **Treat available** | API `treat_self.available` | CTA enabled |

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
| Tap header/chevron | toggle expanded | `aria-expanded` |
| Tap «Порадовать себя» | open [`character-needs-treat-self`](character-needs-treat-self.md) sheet | — |
| Tap «?» | open [`character-needs-help`](character-needs-help.md) sheet | — |
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

- Секция: `<section aria-labelledby="needs-title">`, `h2` «Самочувствие».
- Каждый bar: `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Связи, 28 из 100, низко"`.
- Critical banner: `role="alert"` или `aria-live="polite"` при появлении.
- Кнопки footer ≥44×44px.

---

## Acceptance Criteria

1. Z-NEEDS между Z1 и Z2; при `needs.enabled` секция видна на 320px.
2. По умолчанию collapsed; expand показывает 4 подписанных бара.
3. При streak≥1 показывается баннер с текстом «N из 3 месяцев».
4. Treat-self disabled при кулдауне с читаемой причиной.
5. Soft + `proactive_hints`: баннер при <40 (если не dismissed).
6. Hard: без proactive баннера; «?» доступен.
7. Не рендерится в онбординге и при `needs.enabled: false`.

---

## Design-lab variants (ожидаемые)

| ID | Идея |
|----|------|
| A | Compact = одна суммарная полоска min |
| B | Compact = 4 micro-bars в ряд |
| C | Compact = текст + emoji-иконки осей |
| D | Banners внутри card vs full-bleed strip |

Утверждение — в `design-lab/character-needs/dashboard-needs-round/VARIANTS.md`.
