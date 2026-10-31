---
name: code-review-and-quality
description: Merge gate for ТВОЙ ХОД — runs the built-in /code-review on the diff, routes economy and MQX changes to their reviewer subagents, checks pytest and guardrails, and returns one verdict. Use before merging a branch or PR, or when the user asks whether a change is ready to merge.
argument-hint: '[paths, PR scope, or "staged"]'
user-invocable: true
allowed-tools: Read, Glob, Grep, Skill, Agent, Bash(python -m pytest *), Bash(npm run check:guardrails)
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только для решения «можно ли мержить»; поиск багов делает встроенный `/code-review`, упрощение — `/simplify`, безопасность — `/security-review`.

# Code Review and Quality — merge gate

## Прочитай сначала (ТВОЙ ХОД)

- [`CLAUDE.md`](../../../CLAUDE.md)
- [`docs/foundation/SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md)

## Читай при условии (`catalog.yaml` → `read_if`)

| Когда | Файлы |
|-------|--------|
| review touches feature contract | [`docs/specs/features/`](../../../docs/specs/features/) — matching `SPEC_*.md` по diff |

**Куда писать:** никуда — READ-ONLY, только отчёт. **Дальше:** правки через `incremental-implementation`.

## Процедура

1. **Баги в diff** — встроенный `/code-review` (effort `high` для экономики, денег и auth; иначе `medium`). Это основной поиск дефектов; этот скилл его не дублирует.
2. **Ревьюер по зоне** — по путям diff:
   - `backend/app/game/`, `victory/`, `events/`, `seeds/`, миграции с игровыми данными → субагент **economy-reviewer**;
   - `frontend-react/src/components/mqx/`, `*Premium.jsx`, `design-lab/` → субагент **mqx-ui-reviewer**;
   - большой баланс (seeds, YAML событий, `period.py`) → **economy-balance-runner**.
3. **Проверки:** `cd backend && python -m pytest -q` при backend-diff; `cd frontend-react && npm run check:guardrails` при UI-diff. Поведенческие изменения — min gate из [`critical-test-scenarios`](../critical-test-scenarios/SKILL.md) (G1 happy, G2 boundary, G3 FE↔BE contract, G4 business invariant).
4. **Безопасность** — если diff трогает auth, JWT, `initData`, деньги или секреты: `/security-review` и чеклист из [`release-web/guardrails.md`](../release-web/guardrails.md).
5. **Контракт:** при смене API — `src/api/<домен>.js`, хуки и `backend/app/README.md` синхронны; при смене правил — spec или ADR обновлены (C-1, [`CONVENTIONS.md`](../../../CONVENTIONS.md)).

## Severity

- **Blocking (P0/P1)** — баг, регрессия, красный pytest или guardrails, нарушение контракта или CONVENTIONS → **FAIL**.
- **Advisory (P2)** — читаемость, мелкие улучшения → не блокируют, перечислить.

Не блокировать изменение за то, что оно написано не так, как написал бы ревьюер: критерий — улучшает ли оно код и соблюдает ли конвенции проекта.

---

## Итог (Verdict)

В конце явно укажи результат: **APPROVED** (можно мержить), **CONCERNS** (только advisory) или **FAIL** (есть blocking) — со списком blocking-пунктов и статусом pytest / guardrails.

## Согласование изменений

По умолчанию только чтение и отчёт; правки в репозитории — только по явной просьбе пользователя.

## Следующий шаг

Исправления → `incremental-implementation` / `test-driven-development`; после исправлений — повторный merge gate.
