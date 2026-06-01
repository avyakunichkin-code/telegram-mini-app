---
layer: spec
status: approved
owner: engineering
last_reviewed: 2026-05-19
tracks: quality, mq-116, api-hardening
---

# Spec: Качество и релиз (бэкенд)

## Objective

Снизить риск дублей денежных операций и «500 при плохом JSON» перед плейтестом / Closed Alpha.

## In scope

1. **Валидация `POST /api/game/start`** — Pydantic `GameStartRequest` (422 на типы); бизнес-правила → **400**; отсутствующий шаблон → **404**; для `save_kind=game` обязателен `template_key`.
2. **Идемпотентность**
   - `claim-salary`: повтор в том же периоде → **200**, `already_claimed: true`, без повторного начисления.
   - Денежные POST с заголовком **`Idempotency-Key`**: `contribute-to-safety-fund`, `withdraw-from-safety-fund`, `invest/deposit/open`, `invest/bond/buy`, `insurance/buy` — повтор с тем же ключом возвращает сохранённый ответ.
3. **Тесты**
   - `conftest.py` — SQLite in-memory, `TestClient`.
   - Контрактные: старт → claim-salary → overview; валидация старта.
   - MQ-116: unit-тесты `ensure_period_events` (tier / cooldown).

## Out of scope

- Idempotency для `choose` события и `time/next`.
- Rate limit, единый формат ошибок, Alembic.

## Assumptions

- Ключ идемпотентности уникален в рамках `(user_id, route_key)`.
- Без заголовка `Idempotency-Key` contribute/withdraw ведут себя как раньше (каждый вызов — новая операция).
