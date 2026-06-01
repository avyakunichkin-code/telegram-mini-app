---
layer: vision
status: active
last_reviewed: 2026-05-26
supersedes_xp_direction: remove-character-xp-and-levels.md
---

# Achievements M12 — направление (idea-refine)

> **Обновлено 2026-05-26:** без XP персонажа и level gates. Канон: [`SPEC_achievements`](../specs/features/SPEC_achievements.md), [`remove-character-xp-and-levels`](remove-character-xp-and-levels.md).

## Problem Statement

**Как наградить осмысленные финансовые вехи в Game Mode, не смешивая их с победой партии (Victory v2)?**

## Recommended Direction

**Цепочки tier (1–4) по шести областям GAME §5.3** (критерии в БД, без XP-награды). UI — экран «Развитие» / collapsible на дашборде. Разблокировка капитала — **`mechanics_unlock`** ([ADR-004](../../decisions/ADR-004-mechanics-unlock-victory-chain.md)), не level.

Прокси для сложных анкетных формулировок (досрочка 30%, «голый шок») допустимы в v1.0 с явным backlog на точные метрики.

## Key Assumptions to Validate

- [ ] Игрок понимает разницу «достижение» vs «цель победы» — опрос после 3 периодов.
- [ ] `monthly_reference_expense` как знаменатель «месяцев подушки» воспринимается честно — сравнить с obligations-only в плейтесте.
- [ ] Прокси кредитной цепочки не вызывают ощущение «обманули» — качественные интервью.

## MVP Scope (v1.0)

**In:** 6×4 tier, движок, API, хуки периода/finance, unit-тесты критериев, тосты.

**Out:** Полный UI каталога, альтернативные ветки, точный early repayment, Plan Mode.

## Not Doing (and Why)

- **Достижения в victory_config** — размывает победу шаблона.
- **Отзыв tier при падении метрик** — плохой UX, риск эксплойтов.
- **ETF/акции в инвестиционной цепочке** — вне MVP scope продукта.
- **Глобальные достижения аккаунта** — усложнение без запроса из анкеты.

## Open Questions

- Нужен ли в API **progress** к следующему tier в v1.1?
- Когда вводить **credit_free** ветку — после плейтеста или сразу в сидах?

---

Норматив для разработки: [`docs/specs/features/SPEC_achievements.md`](../../specs/features/SPEC_achievements.md).
