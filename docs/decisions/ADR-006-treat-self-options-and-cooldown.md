---
status: accepted
date: 2026-05-26
deciders: продукт (сессия character needs)
---

# ADR-006: «Порадовать себя» — выбор варианта и кулдаун 15 периодов

## Context

Ручное пополнение потребностей без события не должно **заменять** события. Ранний черновик spec: одна кнопка с авто-boost на «самую слабую» шкалу и кулдаун **2** периода — позволял каждые 2 месяца тратить ~8% зарплаты и обходить контент.

Продукт: кулдаун **15 периодов** (согласован с медленным decay ~10–15 периодов до нуля); при нажатии игрок **выбирает** сценарий из `options[]` с разным `needs_delta` (пример: пикник с друзьями → social + health). **MVP:** в blueprint **минимум 1** опция на персонажа; целевой контент — 3–4 опции.

## Decision

1. **Два шага API:**
   - Список вариантов в `GET /api/finance/overview` (и/или period status): `treat_self.options[]` когда кулдаун прошёл и есть cash.
   - `POST /api/game/period/treat-self` с телом `{ "option_id": string }`.
2. **Варианты** задаются в `blueprint_json.needs.treat_self.options` (**≥1** в MVP, до 3–4 в контенте):
   ```json
   {
     "id": "picnic_friends",
     "title": "Отгул: пикник с друзьями",
     "needs_delta": { "social": 22, "health": 18, "comfort": 6, "status": 4 },
     "cost_pct_salary": 0.08
   }
   ```
3. **Кулдаун:** `cooldown_periods: 15` (дефолт; не ниже 15 в сидах фазы 1).
4. **Стоимость:** per-option `cost_pct_salary` или общий `default_cost_pct_salary` + `cost_min` / `cost_max` (как в spec).
5. После успешного POST: применить `needs_delta`, списать cash, `treat_self_last_period_index = period_index`.
6. **Idempotency-Key** — как у `claim-salary`.

## Alternatives considered

1. **Одна кнопка без выбора** — отклонено: слабее fantasy и обучение trade-off.
2. **Кулдаун 2–5 периодов** — отклонено: конфликт с медленным decay и экономикой 8% зарплаты.
3. **Отдельные кнопки на каждую шкалу** — отклонено на MVP: один вход «Порадовать себя» → sheet выбора.

## Consequences

- UI: bottom sheet / modal (1 карточка в MVP — допустим confirm без списка); design-lab → MQX.
- Контент: MVP — одна опция per template; расширение до 3–4 — backlog контента.
- Тесты: cooldown 15, unknown option_id → 400, insufficient cash → 400.

## GDD / requirements addressed

- TR-needs-004, TR-needs-008

## Связанные артефакты

- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md) §«Порадовать себя»
- ADR: [ADR-005](ADR-005-character-needs-state-and-defeat.md)
