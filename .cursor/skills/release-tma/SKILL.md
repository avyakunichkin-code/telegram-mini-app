---
name: release-tma
description: >-
  Pre-release checklist for Telegram Mini App — guardrails, design-lab parity,
  and doc sync. Use before merge to release branch, deploy, or when user says
  ready to ship or PR.
argument-hint: "[release or PR readiness]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Shell
---

# Release TMA (ТВОЙ ХОД)

## Прочитай сначала (ТВОЙ ХОД)

- [`.cursor/rules/tvoy-hod-release-guardrails.mdc`](../../rules/tvoy-hod-release-guardrails.mdc)
- [`.cursor/rules/tvoy-hod-canon-sync.mdc`](../../rules/tvoy-hod-canon-sync.mdc)
- [`docs/foundation/DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md)

**Куда писать:** только отчёт в чат; код — если чеклист выявил пробелы (отдельная задача).

## Checklist

### 1. Guardrails (из `frontend-react/`)

```bash
npm run check:guardrails
```

### 2. Design-lab parity

```bash
npm run design-lab:build
```

### 3. Backend (если менялся `backend/` в ветке)

```bash
cd backend && python -m pytest -q
```

### 4. Canon sync (если в ветке был утверждённый UI)

- `design-lab/<theme>/APPROVED.md` актуален
- prod parity round соответствует prod

### 4b. Design QA (ручной, если менялся `frontend-react/` UI)

См. также `frontend-ui-engineering` → Definition of Done.

| # | Проверка |
|---|----------|
| Q1 | **320px** и **~390px** — нет обрезания таббара / hero |
| Q2 | **Тёмная тема** Telegram — нет «белого острова» на MQX-карточках |
| Q3 | Игра: **4 вкладки** + события + закрытие периода (smoke) |
| Q4 | `#/dev/mqx` — новые компоненты в каталоге (если не hotfix) |
| Q5 | Finance не регресснул к legacy-паттернам без lab (⚠ зона) |

### 5. Docs (если менялось поведение)

- `DOC_SYNC_LOG.md` или ADR при необходимости

## Verdict

**READY** / **BLOCKED** / **CONCERNS** — с перечислением упавших команд.

## Согласование

Этот скилл **не пишет** в репо по умолчанию — только отчёт. Если чеклист требует правок кода, спроси: **Могу внести исправления?**

## Следующий шаг

- [`code-review-and-quality`](../code-review-and-quality/SKILL.md)
- [`documentation-and-adrs`](../documentation-and-adrs/SKILL.md)
