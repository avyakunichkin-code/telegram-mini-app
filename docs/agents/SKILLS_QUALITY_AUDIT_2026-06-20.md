---
layer: agents
status: archived
archived_at: 2026-07-01
last_reviewed: 2026-06-20
tags:
  - tvoy-hod/layer/agents
  - tvoy-hod/status/archived
aliases:
  - "Аудит качества скиллов — 2026-06-20"
  - SKILLS_QUALITY_AUDIT_2026-06-20
---
# Аудит качества скиллов — 2026-06-20

> **Archived 2026-07-01.** Актуальная политика: [release-ready-quality.md](../../.cursor/skills/_shared/release-ready-quality.md), [skill-responsibility-matrix.md](../../.cursor/skills/_shared/skill-responsibility-matrix.md), [catalog.yaml](../../.cursor/skills/catalog.yaml). История cleanup: [LEGACY_NOISE_AUDIT_2026-06-20.md](LEGACY_NOISE_AUDIT_2026-06-20.md).

**Цель:** соответствие `quality-rubric.md` (G1–G6), чёткие границы ответственности, вызов только уместных primary, bar **release-ready** (не набросок).

**Static-check:** `node .cursor/skills/skill-test/_static-check.mjs` → 30 COMPLIANT.

---

## 1. Новые канонические артефакты

| Файл | Назначение |
|------|------------|
| [`.cursor/skills/_shared/release-ready-quality.md`](../../.cursor/skills/_shared/release-ready-quality.md) | Bar merge-ready; чеклист; draft-only исключения |
| [`.cursor/skills/_shared/skill-responsibility-matrix.md`](../../.cursor/skills/_shared/skill-responsibility-matrix.md) | Когда primary / When NOT / subagents |
| [`.cursor/skills/_shared/clarify-first.md`](../../.cursor/skills/_shared/clarify-first.md) | STOP при неясности; AskUserQuestion до implement |
| [`.cursor/skills/_shared/delivery-workflow.md`](../../.cursor/skills/_shared/delivery-workflow.md) | Думаем → Уточняем → Планируем → Делаем |
| [`.cursor/skills/_shared/visual-assets-policy.md`](../../.cursor/skills/_shared/visual-assets-policy.md) | Иконки/фоны: согласовать формат → сгенерировать → в репо |

Обновлены: `quality-rubric.md` (**G5**, **G6**), `tvoy-hod-router.mdc`, блок «Стандарт качества и вызов» во **всех** product/meta skills.

---

## 2. Соответствие rubric G1–G6

| Метрика | Статус | Замечание |
|---------|--------|-----------|
| **G1** Contract frontmatter | ✅ | 30/30; `db-baselines` — allowed-tools + ask-before-write |
| **G2** Verdict | ✅ | PASS/FAIL/CONCERNS/COMPLETE/APPROVED в skills |
| **G3** Ask-before-write | ✅ | Write-skills с «Могу записать» |
| **G4** Handoff | ✅ | «Следующий шаг» / next_skill |
| **G5** Release-ready | ✅ | `_shared/release-ready-quality.md` + блок в SKILL.md |
| **G6** Clarify & workflow & assets | ✅ | `_shared/clarify-first`, `delivery-workflow`, `visual-assets-policy` (2026-06-20 pass 2) |

---

## 3. Разделение ответственности (вердикт)

| Пара | Риск | Митигация |
|------|------|-----------|
| create-event ↔ game-economy | Путаница YAML vs period | matrix + «Не путать» в обоих skills |
| create-event ↔ event-analysis | Write vs read-only | event-analysis: When NOT + verdict GAPS |
| design-lab ↔ frontend-ui | Prod без lab | DESIGN_WORKFLOW gate + When NOT в обоих |
| api ↔ incremental | Контракт без spec | api: contract-first + critical-tests satellite |
| balance-playtest ↔ economy-reviewer | Sim vs pytest | balance: evidence-only verdict |

**Subagents** не заменяют primary skills — только post-diff review (matrix § Subagents).

---

## 4. Вызов только в нужных запросах

| `tier` | Поведение |
|--------|-----------|
| **core** | Primary по смыслу задачи; не подменять deferred |
| **support** | Primary только для plan / merge / ADR / balance / DB |
| **deferred** | Явный запрос или satellite |
| **meta** | skill-test, layout — не product delivery |

**using-agent-skills** §0: release-ready over speed; один primary; honest verdict.

---

## 5. Release-ready philosophy (внедрено)

- Допустимо **больше токенов** на read → analyze → verify → self-review.
- **COMPLETE** запрещён для «скелета», «шаблона», «TODO потом» без draft-only режима.
- **idea-refine** / ранний spec → verdict **DRAFT**; **event-analysis** → **GAPS**; lab → **APPROVED** до prod.

---

## 6. Gaps (следующий проход, не блокер)

| # | Gap | Рекомендация |
|---|-----|--------------|
| 1 | ~~`catalog.yaml` без `read_if`~~ | **Закрыто Sprint B 2026-06-20** — 7 skills tiered |
| 2 | Не все deferred skills имеют When NOT | Добавить по мере использования |
| 3 | ~~`_inject-quality-block.mjs`, `_patch-workflow-block.mjs`~~ | **Закрыто Sprint F** — `_maintain.mjs` + [`skill-test/README.md`](../../.cursor/skills/skill-test/README.md) |
| 4 | ~~Behavioral spec `/skill-test category`~~ | **Частично 2026-06-20:** core trilogy `/skill-test spec` → PASS; отчёты в `results/skill-test-spec-*-2026-06-20.md` |

**Закрыто pass 2 (2026-06-20):** clarify-first, delivery-workflow, visual-assets-policy, G6, When NOT на core skills, UI anti-placeholder.

**Закрыто Sprint B (2026-06-20):** `read_if` в `catalog.yaml`; slim `must_read`; секция «Читай при условии» в SKILL; `_context-check` поддерживает `read_if`.

**Закрыто Sprint C (2026-06-20):** tiered context для `spec-driven-development`, `api-and-interface-design`, `planning-and-task-breakdown`; DL1 в `game-economy` `read_if`; `session-start` hook; удалён `SKILLS_AUDIT_2026-06-01`; `TASK_SLICE` → `read_if`.

**Закрыто Sprint D (2026-06-20):** CI `.github/workflows/skills-check.yml` (static + context на PR/push); `last_context` 2026-06-20 для 11 tiered skills; `db-baselines-and-migrations` → 0 WARNINGS.

**Закрыто Sprint E (2026-06-20):** `read_if_when` в MQ шаблонах; `_resolve-read-if.mjs`; subagent policy в router; `AI_ONBOARDING.md`; category check в CI.

**Закрыто Sprint F (2026-06-20):** specs dedup (`SMOKE_STUB.md`, `sync-smoke-specs`); `_maintain.mjs`; `_archived-check.mjs` в CI; hooks throttle 2m/bucket + dedupe hints.

**Behavioral spec 2026-06-20:** `/skill-test spec` для `create-event`, `game-economy-and-victory`, `frontend-ui-engineering` → PASS; specs FE/create-event sync tiered context.

---

## 7. Sprint C — tiered context (define / api / plan)

| Skill | must_read | read_if |
|-------|-----------|---------|
| spec-driven-development | 2 | ideas/, decisions/, specs/features/ |
| api-and-interface-design | 4 | services README, DOCUMENTATION_SYSTEM, specs/features/ |
| planning-and-task-breakdown | 4 | specs/, TRACEABILITY, SKILL_DOC_MAP |
| game-economy (+) | — | DL1_MATH_CONSISTENCY_REVIEW.md |

---

## 8. Sprint D — CI и parity gate

| Артефакт | Назначение |
|----------|------------|
| [`.github/workflows/skills-check.yml`](../../.github/workflows/skills-check.yml) | PR/push → `node .cursor/skills/skill-test/_static-check.mjs` + `_context-check.mjs` |
| `catalog.yaml` `last_context` | 11 tiered skills → `2026-06-20` / `COMPLIANT` |
| `db-baselines-and-migrations/SKILL.md` | `backend/main.py` в «Куда писать»; **Дальше:** + next_skill |

**Локально:** те же команды из корня репо. Context-check: **45 COMPLIANT, 0 WARNINGS** (2026-06-20).

---

## 9. Sprint E — tasks, category, subagents, onboarding

| Артефакт | Назначение |
|----------|------------|
| [`TASK_SLICE.md`](../templates/TASK_SLICE.md) | frontmatter **`read_if_when`** + bullet Read if |
| [`PLAN_FEATURE.md`](../templates/PLAN_FEATURE.md) | колонка Read if (`when`) в vertical slices |
| [`_resolve-read-if.mjs`](../../.cursor/skills/skill-test/_resolve-read-if.mjs) | `node … <skill>` → таблица `when` / paths для MQ-* |
| [`AI_ONBOARDING.md`](AI_ONBOARDING.md) | вход для новой сессии агента |
| `tvoy-hod-router.mdc` § Subagents | когда запускать / не запускать subagents |
| CI `skills-check.yml` | + `_category-check.mjs` (41 COMPLIANT, 0 WARNINGS) |

---

## 10. Sprint F — dedup, maintain, archived, hooks

| Артефакт | Назначение |
|----------|------------|
| [`specs/_shared/SMOKE_STUB.md`](../../.cursor/skills/specs/_shared/SMOKE_STUB.md) | Общий smoke-протокол для 21 stub spec |
| [`specs/README.md`](../../.cursor/skills/specs/README.md) | Specs ≠ SKILL.md; когда full vs smoke |
| [`_maintain.mjs`](../../.cursor/skills/skill-test/_maintain.mjs) | inject-quality · patch-workflow · sync-smoke-specs · check-archived |
| [`_archived-check.mjs`](../../.cursor/skills/skill-test/_archived-check.mjs) | `disable-model-invocation` + banner + catalog (11 COMPLIANT) |
| `after-edit-verify.mjs` | Throttle 2 min/bucket; dedupe hints; seeds block merged |
| `.cursor/hooks/.hint-throttle.json` | Local state (gitignored) |

---

## 12. Channel strategy (ADR-012, 2026-06-20)

| Решение | Артефакты |
|---------|-----------|
| Primary = **PWA + web** | [`ADR-012`](../decisions/ADR-012-primary-channels-pwa-web-over-tma.md), `SPEC_PRODUCT` §1.1 |
| Release gate | **`release-web`** (guardrails + PWA/web smoke W1–W9) |
| TMA secondary | **`release-tma`** → deprecated alias; **`telegram-mini-app-runtime`** — optional T1/T2 |
| Agent docs | `AI_ONBOARDING` §2, `game-lexicon` Channels, router deferred list |

---

## 13. Legacy noise cleanup (2026-06-20)

См. [`LEGACY_NOISE_AUDIT_2026-06-20.md`](LEGACY_NOISE_AUDIT_2026-06-20.md) — удалено ~30 файлов-дублей, trim TMA-first messaging.

---

## 14. Чекlist для нового скилла

1. Frontmatter G1 + `allowed-tools` если Write
2. Блок «Стандарт качества и вызов» + строка в matrix
3. **When NOT primary**
4. Release-ready verify в процедуре
5. Verdict + «Могу записать» + «Следующий шаг»
6. Запись в `catalog.yaml` (`tier`, `context`)

---

*Следующий аудит: после behavioral `/skill-test spec` для **`release-web`** или смены channel ADR.*
