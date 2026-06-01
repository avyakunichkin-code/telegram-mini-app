---
layer: handbook
status: draft
role: engineering
last_reviewed: 2026-05-30
---

# Разработка — guide

> Каркас role-guide. Для кода начинайте с [`CLAUDE.md`](../../../CLAUDE.md), не с GAME.md.

## Зачем читать GAME

Контекст **зачем** и **границы MVP** — перед изменением экономики, событий, UI.

## Маршрут

1. [`../../../CLAUDE.md`](../../../CLAUDE.md) — карта репо, эндпоинты  
2. [`../../foundation/SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md)  
3. Spec фичи: `docs/specs/features/SPEC_*.md`  
4. [`../GAME.md`](../GAME.md) §0.2 — статус блоков  
5. [`../../decisions/`](../../decisions/) — ADR по затронутой области  
6. [`../../agents/CURSOR_SKILLS.md`](../../agents/CURSOR_SKILLS.md) — какой skill primary  

## Доменные пакеты backend

[`../../../backend/app/README.md`](../../../backend/app/README.md) · [ADR-007](../../decisions/ADR-007-backend-domain-packages.md)

| Домен | Путь |
|-------|------|
| Период | `app/game/period.py` |
| Победа | `app/victory/engine.py` |
| Needs | `app/needs/engine.py` |
| Overview | `app/finance/overview_build.py` |

## Verify

```bash
pytest -q backend/tests/
cd frontend-react && npm run build
```
