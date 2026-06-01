---
layer: tasks
epic_id: DL1
plan: ../plans/PLAN_debt-liability-capital-graph.md
spec: ../specs/features/SPEC_debt-liability-capital-graph.md
---

# Задачи эпика DL1

Формат среза: [`TASK_SLICE.md`](../templates/TASK_SLICE.md).

---

## DL1-100 — ADR граф капитала

- **Phase:** `define`
- **Tier:** `support`
- **Skill:** `documentation-and-adrs`
- **Satellites:** `doubt-driven-development`
- **Next skill:** `spec-driven-development`
- **Acceptance:** ADR описывает: пути A/B, продажа с payoff, legacy
- **Verify:** Review в PR
- **Files:** `docs/decisions/ADR-010-liability-asset-insurance-graph.md`
- **Estimate:** S
- **Status:** ✅ 2026-06-01 (accepted)

---

## DL1-101 — Утверждение spec

- **Phase:** `define`
- **Skill:** `spec-driven-development`
- **Acceptance:** `SPEC_debt-liability-capital-graph.md` status `approved`; TRACEABILITY обновлён
- **Estimate:** S
- **Depends:** DL1-100
- **Status:** ⬜

---

## DL1-105 — Математика: annuity + golden tests (TDD)

- **Phase:** `build`
- **Skill:** `test-driven-development`
- **Satellites:** `game-economy-and-victory`
- **Acceptance:** SPEC §4.4 V1–V5; `pytest tests/test_dl1_annuity_golden.py` green
- **Files:** `app/finance/annuity.py`, `tests/fixtures/dl1_golden_vectors.py`, `tests/test_dl1_annuity_golden.py`
- **Estimate:** S
- **Depends:** DL1-101
- **Status:** ✅ 2026-06-01

---

## DL1-110 — Миграция liabilities

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Satellites:** `test-driven-development`
- **Acceptance:** Колонки по spec §3.1; backfill `unsecured` + `interest_only`
- **Verify:** `pytest backend/tests/test_liability_legacy_compat.py`
- **Files:** `backend/migrations/00xx_liability_graph.sql`, `models.py`
- **Estimate:** M
- **Depends:** DL1-101
- **Status:** ⬜

---

## DL1-111 — Миграция insurance FK

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Acceptance:** `insured_asset_id` nullable FK
- **Estimate:** S
- **Depends:** DL1-101, DL1-105
- **Status:** ⬜

---

## DL1-120 — Пути A/B: secured bundle + consumer (backend)

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Satellites:** `api-and-interface-design`, `test-driven-development`
- **Acceptance:** DL1-AC-1, DL1-AC-1b; ADR-010 §1–4
- **Verify:** `test_secured_acquisition.py`, `test_consumer_loan_limit.py`
- **Files:** `services/finance/liabilities.py`, `services/finance/assets.py`, `starters/` seeds
- **Estimate:** L
- **Depends:** DL1-110
- **Status:** ⬜

---

## DL1-123 — Продажа актива с погашением secured

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Acceptance:** DL1-AC-1c; payoff → остаток на cash; доплата с cash
- **Verify:** `test_asset_sale_with_mortgage.py`
- **Files:** `services/finance/assets.py`
- **Estimate:** M
- **Depends:** DL1-120
- **Status:** ⬜

---

## DL1-130 — Страховка: привязка к активу

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Acceptance:** DL1-AC-5; 400 без актива нужного kind
- **Verify:** `test_insurance_asset_binding.py`
- **Files:** `services/insurance/service.py`, `starters/insurance_catalog.py`
- **Estimate:** M
- **Depends:** DL1-111
- **Status:** ⬜

---

## DL1-140 — Движок аннуитета

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Acceptance:** Формулы spec §4.1; split principal/interest
- **Verify:** `test_annuity_schedule.py`
- **Files:** `backend/app/finance/annuity.py`, `finance/helpers.py`
- **Estimate:** M
- **Depends:** DL1-110
- **Status:** ⬜

---

## DL1-141 — period_end: аннуитет и закрытие по сроку

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Satellites:** `balance-playtest`
- **Acceptance:** DL1-AC-2, DL1-AC-3
- **Verify:** `test_period_close_metrics.py` extended
- **Files:** `game/period.py`
- **Estimate:** L
- **Depends:** DL1-140
- **Status:** ⬜

---

## DL1-150 — Частичное погашение API

- **Phase:** `build`
- **Skill:** `game-economy-and-victory`
- **Acceptance:** DL1-AC-4; idempotency optional v1
- **Verify:** `test_liability_prepay.py`
- **Files:** `routers/finance.py`, `services/finance/liabilities.py`
- **Estimate:** M
- **Depends:** DL1-141
- **Status:** ⬜

---

## DL1-160 — Frontend: капитал (долг + страховка)

- **Phase:** `build`
- **Skill:** `frontend-ui-engineering`
- **Satellites:** `design-lab-mqx`, `critical-test-scenarios`
- **Acceptance:** Выбор актива при страховке; prepay UI; остаток срока
- **Files:** `FinancePremium.jsx`, `api/finance.js`, `api/insurance.js`
- **Estimate:** L
- **Depends:** DL1-120, DL1-130, DL1-150
- **Status:** ⬜

---

## DL1-170 — Регрессия срока страховки

- **Phase:** `verify`
- **Skill:** `test-driven-development`
- **Acceptance:** DL1-AC-6; UI показывает expires
- **Verify:** `tests/test_insurance_policy_expiry.py`
- **Estimate:** S
- **Depends:** DL1-111
- **Status:** ✅ 2026-06-01 (backend; UI expires — backlog)

---

## Backlog (после MVP DL1)

| ID | Тема |
|----|------|
| DL1-200 | DTI / лимит нового долга (GD-18) |
| DL1-210 | События: предикаты `insured_asset_id` (EVT1) |
| DL1-220 | Продление полиса без gap |
| DL1-230 | Admin C1: редактирование `term_periods` в каталоге |
