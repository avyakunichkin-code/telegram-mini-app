---
layer: decision
status: accepted
date: 2026-06-05
---

# ADR-011: эффекты открытого периода при закрытии месяца

## Контекст

Плейтест: после события −500 ₽/мес на дашборде **37 000**, в итогах месяца **37 500**. Пользователь ожидает: «что случилось в этом месяце — спишется в этом месяце».

## Решение

На `process_period_end` для `period_index = N`:

- `compute_monthly_burn` и breakdown lifestyle берут **актуальное** состояние профиля (включая `ProfileExpenseLine` от событий с `period_index ≤ N` в открытом периоде).
- `period_expense_total`, ритуал закрытия и chip «Расходы» после события в том же периоде **согласованы**.
- UI подписывает факт списания vs прогноз на следующий период, если оба показываются.

## Последствия

- Тест: событие меняет burn → `time/next` → lifestyle debit = новый burn.
- Нельзя показывать в ритуале «ставку прошлого снимка», если в периоде был choice с delta.

## Связано

- [`SPEC_onboarding-o3.md`](../specs/features/SPEC_onboarding-o3.md)
- `backend/app/game/period.py`, `compute_monthly_burn`
