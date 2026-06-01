---
layer: ux
status: approved
last_reviewed: 2026-05-26
platform: Telegram Mini App
screen_id: needs-period-warnings-defeat
parent: dashboard + period-close
---

# UX Spec: Предупреждения периода и поражение по потребностям

> **Mechanics:** [ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md)  
> **Lab:** [`design-lab/character-needs/defeat-round/`](../../../design-lab/character-needs/defeat-round/), [`period-close/`](../../../design-lab/period-close/)

---

## Purpose

1. **Перед закрытием месяца** — предупредить о штрафе/риске, не блокируя TB1.  
2. **После поражения** — ясный исход и путь в меню / новую игру.

---

## A. Предупреждение при «Закрыть месяц»

### Triggers (OR)

| Trigger | Modal copy (черновик) |
|---------|------------------------|
| `is_distressed` (any <30%) | «Одна или несколько потребностей ниже 30%. В этом месяце возможен штраф с карты.» |
| `has_zero` && streak 0 | «Есть потребность на нуле. Если так останется три месяца подряд — поражение.» |
| `needs_zero_periods_streak` 1 or 2 | «Риск поражения: N из 3 месяцев с нулём на шкале.» |

### Pattern

- Reuse семейство **`MqxSalaryWarnModal`** (два действия: «Всё равно закрыть» / «Остаться»).
- **Не блокировать** в онбординге шаг `next_period` (как зарплата).
- Можно **объединить** с предупреждением о зарплате в один modal с двумя bullet (если оба условия).

### Interaction

| Action | Result |
|--------|--------|
| Остаться | close modal, stay on dashboard |
| Всё равно закрыть | proceed `POST time/next` |

---

## B. Итог периода (tail / ritual)

Если в ответе `process_period_end`:

- `defeat_triggered` + `defeat_reason: needs_depletion` → **не** показывать обычный позитивный tail; перейти к **Defeat screen**.
- Иначе при `distressed_penalty_applied` → строка в tail: «Штраф за истощение: −X ₽».

---

## C. Game over `needs_depletion`

### Layout (full-screen или modal)

```text
┌─────────────────────────────────────┐
│         [Монетка optional]          │
│   Поражение                         │
│   Потребности на нуле три месяца    │
│   подряд                            │
│   Краткое объяснение (1–2 фразы)    │
│   [ Новая игра ]  [ В меню ]        │
└─────────────────────────────────────┘
```

### Copy

- Title: **Поражение**
- Body: «Три месяца подряд хотя бы одна потребность была на нуле. Попробуй чаще закрывать события и следить за полосками на главной.»
- **Не** обвинять («ты плохо играл»); тон нейтральный, обучающий.

### After

- Профиль `is_active = 0`; game actions disabled.
- CTA как у существующего поражения по cash (если есть — выровнять).

---

## Acceptance Criteria

1. При distressed закрытие месяца показывает предупреждение (вне онбординга шага 4).
2. При `needs_depletion` показывается defeat UI, не обычный success tail.
3. Тексты на русском; доступны две CTA (меню / новая игра).
4. Поражение по cash и по needs визуально в одном семействе.
