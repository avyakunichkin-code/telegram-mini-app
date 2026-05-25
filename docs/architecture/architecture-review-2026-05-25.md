# Architecture Review Report

**Date:** 2026-05-25  
**Project:** ТВОЙ ХОД (Telegram Mini App)  
**Mode:** full (adapted: foundation + feature specs + vision ideas; stack FastAPI / PostgreSQL / React)

**Loaded:** 0 GDD · **1 ADR** (at review start) · **~12 normative specs** · **~40 vision ideas** · [`TRACEABILITY.md`](../TRACEABILITY.md) · **178 backend tests** (2 failures in `test_victory_engine.py`)

---

## Traceability Summary

| Metric | Count |
|--------|-------|
| Key technical requirements (sample) | 16 |
| Covered (spec + code) | 13 |
| Partial | 2 |
| Gaps | 1 (Plan UI) |

---

## Verdict: **CONCERNS** → **ближе к PASS** (Q&A 2026-05-25)

**PASS blocked by:** нет CI pytest (решение Q&A: локальный pytest + `tvoy-hod-backend.mdc`); открытые эпики Plan UI, E1, O1, M12.

**Снято с блокеров:** doc-sync GAME/GLOSSARY/TARGET_PLAYER; ADR-002/003; pytest **180 passed**; V2 UI P1 (`MqxGoalDash`) — закрыт в TRACEABILITY/backlog.

---

## Coverage Gaps

| TR-ID | Source | Requirement | Suggested action |
|-------|--------|-------------|------------------|
| TR-plan-001 | evolution §II | Plan master + prefill UI | MVP 2.0 spec + ADR when UI starts |
| TR-exp-001 | SPEC_expenses draft | Full expense categories model | Approve SPEC_expenses → implement E1 |
| TR-ci-001 | quality | CI pytest on PR | Add `.github/workflows/tests.yml` |

---

## Cross-document conflicts (resolved in doc-sync)

1. **evolution §II** character XP vs **remove-character-xp** — banner + §II.1 rewrite.
2. **SPEC_victory-v2** `character_level` vs engine — removed from spec table.
3. **SPEC_PRODUCT §3.3** XP step vs §7.2 — steps renumbered.
4. **MVP_AUDIT / PRODUCT_BACKLOG** V2 DEFER vs code — updated to backend OK.
5. **PRODUCT_BACKLOG** MQ-113 character_progression — marked superseded.

---

## Stack / engine audit

| Check | Result |
|-------|--------|
| Victory source of truth | `finance_overview_build.py` + `victory_engine.py` |
| Character progression | Removed (`0031_remove_character_progression.sql`) |
| Event filter | `save_kind` + `event_tier` from `period_index` |
| Tests | 178 passed, 2 failed (tutorial victory chain) |
| CI tests | Not configured (deploy workflow only) |

---

## Q&A resolutions (2026-05-25, session 2)

| # | Тема | Решение |
|---|------|---------|
| 1 | GAME.md drift | **Синхронизировать** §0.2, §5.4–6, §10–11, §13–14 |
| 2 | GLOSSARY победа | **MVP** = игроко-понятное; **Victory v2** = prod + ADR-002 |
| 3 | GLOSSARY save_kind | Поле immutable, не «заменит mode» |
| 4 | TARGET_PLAYER | Крючки: цели победы + achievements/tier, без level |
| 5 | V2 UI | **P1 закрыт** (`MqxGoalDash`) |
| 6 | CI | **Не добавлять** workflow; усилить локальный pytest |
| 7 | PLAN_mvp-11 MQ-113 | **Superseded** + ADR-003 |
| 8 | dashboard UX | **status: approved** |

## Required follow-ups (остаток)

1. Plan Mode UI (MVP 2.0), E1 expenses, O1 onboarding prod, M12 achievements UI.
2. Optional: `docs/architecture/tr-registry.yaml` for stable TR-IDs.
3. Плейтест Pre-Alpha / product analytics.

---

## Doc-sync applied (2026-05-25)

- `docs/vision/ideas/tvoy-hod-evolution-after-mvp.md`
- `docs/foundation/SPEC_PRODUCT.md`
- `docs/specs/features/SPEC_victory-v2.md`
- `docs/foundation/MVP_AUDIT_VS_SPEC.md`
- `docs/backlog/PRODUCT_BACKLOG.md`
- `docs/TRACEABILITY.md`
- `docs/specs/features/SPEC_game-plan.md`
- **New:** `docs/decisions/ADR-002-victory-engine-and-template-config.md`
- **New:** `docs/decisions/ADR-003-remove-character-progression.md`

---

## History

| Date | Verdict | Notes |
|------|---------|-------|
| 2026-05-25 | CONCERNS | Initial full review + doc-sync + ADR-002/003 |
