---
layer: handbook
status: draft
role: engineering
last_reviewed: 2026-05-30
tags:
  - tvoy-hod/layer/handbook
  - tvoy-hod/status/draft
aliases:
  - "Разработка — guide"
  - engineering
---
# Разработка — guide

> Каркас role-guide. Для кода начинайте с [AGENTS.md](../../../../AGENTS.md), не с GAME.md.

## Зачем читать GAME

Контекст **зачем** и **границы MVP** — перед изменением экономики, событий, UI.

## Маршрут

1. [AGENTS.md](../../../../AGENTS.md) — карта репо, эндпоинты  
2. [`../../foundation/SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md)  
3. [`../../vision/ARCHITECTURE_ASSESSMENT_2026-06.md`](../../vision/ARCHITECTURE_ASSESSMENT_2026-06.md) — архитектура, масштаб, тех. roadmap (раз в квартал)  
4. Spec фичи: `game/docs/specs/features/SPEC_*.md`  
5. [`../GAME.md`](../GAME.md) §0.2 — статус блоков  
6. [`../../decisions/`](../../../../docs/decisions) — ADR по затронутой области  
7. [`../../agents/AGENT_SKILLS.md`](../../../../docs/agents/AGENT_SKILLS.md) — какой skill primary  

## Доменные пакеты backend

[`../../../backend/app/README.md`](../../../api/app/README.md) · [ADR-007](../../decisions/ADR-007-backend-domain-packages.md)

| Домен | Путь |
|-------|------|
| Период | `app/game/period.py` |
| Победа | `app/victory/engine.py` |
| Needs | `app/needs/engine.py` |
| Overview | `app/finance/overview_build.py` |

## Verify

```bash
pytest -q game/api/tests/
cd frontend-react && npm run build
```
