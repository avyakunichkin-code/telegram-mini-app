---
layer: audits
kind: ai
status: active
last_reviewed: 2026-09-07
audience: engineering, content, agents
tags:
  - tvoy-hod/layer/audits
  - tvoy-hod/kind/ai
aliases:
  - "AI-аудиты — куда класть"
---
# Kind `ai` — runtime-решения и dev-time агенты

Сюда кладётся снимок **игрового decision-стека** (picker событий, guidance, симы) и **пайплайна LLM/агентов** (Cursor skills, authoring YAML). Не архитектура монолита ([`../engineering/`](../engineering/)), не GD-баланс каталога как продукт ([`../product/`](../product/)), не качество скиллов как rubric ([`../../agents/SKILLS_QUALITY_AUDIT_2026-06-20.md`](../../agents/SKILLS_QUALITY_AUDIT_2026-06-20.md) — архив).

**Не путать:** в этом репо нет NPC / NavMesh / Unity ML-Agents. «AI» ≠ боевой агент.

Канон папки: [`../README.md`](../README.md). Шаблон: [`../../templates/AUDIT.md`](../../templates/AUDIT.md).

## Путь

```text
docs/audits/ai/<YYYY-MM-DD>-<slug>.md
```

## Текущий снимок

[`2026-09-07-runtime-and-dev-ai.md`](2026-09-07-runtime-and-dev-ai.md) (DRAFT) — аудит.  
[`2026-09-07-ai-proposals.md`](2026-09-07-ai-proposals.md) (DRAFT) — 6 предложений, кросс-роли; слоты = `PLAN_production-ready`.
