---
name: release-tma
description: >-
  DEPRECATED — use release-web. Pre-release checklist alias for backward
  compatibility with /release-tma invocations.
argument-hint: "[deprecated — use /release-web]"
user-invocable: true
allowed-tools: Read
---

## Стандарт качества и вызов

**Release-ready:** см. [release-ready-quality.md](../_shared/release-ready-quality.md) через **`release-web`**.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md).

# release-tma (deprecated)

> **С 2026-06-20** primary channels = **PWA + web** ([ADR-012](../../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)).  
> Используй **`release-web`** — тот же gate + PWA/web smoke; TMA — optional subsection.

## Прочитай сначала

- [`.cursor/skills/release-web/SKILL.md`](../release-web/SKILL.md) — **единственная процедура**

**Дальше:** выполни **`release-web`**; не дублируй checklist здесь.

## Checklist

1. Открой и выполни **`release-web`** целиком.
2. В отчёте укажи: «вызван deprecated `/release-tma` → применён `release-web`».

Не дублируй checklist здесь.

## Verdict

Наследуется от **`release-web`**: READY / BLOCKED / CONCERNS.

## Согласование

Этот alias **не пишет** в репо — только отчёт через **`release-web`**. **Могу записать** — только после явного согласования (как в `release-web`).

## Следующий шаг

- [`release-web`](../release-web/SKILL.md)
- [`code-review-and-quality`](../code-review-and-quality/SKILL.md)
