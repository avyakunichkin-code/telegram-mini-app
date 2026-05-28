---
layer: tasks
epic: E1
spec: ../specs/features/SPEC_expenses.md
plan: ../plans/PLAN_expenses.md
checklist: ../specs/economy/EXPENSES_LAYER_CHECKLIST.md
---

# Задачи E1 — Расходы (жизнеобеспечение)

> **2026-05-26:** реализация **на паузе**. Сначала E1-R в [`PLAN_backlog_may2026.md`](../plans/PLAN_backlog_may2026.md) (R1→R2→R3, go/decision). Чекбоксы ниже — **после go**.

Синхронизировать с [`EXPENSES_LAYER_CHECKLIST.md`](../specs/economy/EXPENSES_LAYER_CHECKLIST.md).

---

## Волна A — Backend

- [ ] E1-110 — migration categories + `expense_category_definitions`
- [ ] E1-111 — migration `profile_expense_lines` + models
- [ ] E1-112 — `finance/expenses.py` domain + tests
- [ ] E1-113 — `game/start` creates lines from blueprint
- [ ] E1-114 — template seeds `expense_budget` for all starters
- [ ] E1-115 — `game_period` burn charge + category breakdown
- [ ] E1-116 — overview API fields
- [ ] E1-117 — legacy profile backfill
- [ ] E1-118 — achievements + victory integration

## Волна B — Frontend

- [ ] E1-210 — `api.js`
- [ ] E1-211 — Dashboard burn UX
- [ ] E1-212 — Expenses screen (by category)
- [ ] E1-213 — Period end breakdown UI
- [ ] E1-214 — design-lab / MQX

## Волна C — Content & meta

- [ ] E1-310 — event effects `expense_line`
- [ ] E1-311 — event seeds update
- [ ] E1-312 — victory template goals
- [ ] E1-313 — analytics burn series
- [ ] E1-314 — victory/analytics UI

## Волна D — Plan

- [ ] E1-410 — Plan spec section
- [ ] E1-411 — Plan CRUD API
- [ ] E1-412 — Plan UI editor

## Doc

- [ ] E1-901 — SPEC + EXPENSES_SYSTEM → approved
- [ ] E1-902 — GLOSSARY, CLAUDE, TRACEABILITY, MVP_AUDIT
