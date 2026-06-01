---
layer: handbook
status: active
role: product
last_reviewed: 2026-05-30
owner: product
---

# Продукт — guide

Маршрут владельца продукта. **Owner документации:** владелец продукта.

## Зачем читать

Понять **что в prod**, **что в backlog**, **куда движемся** — без погружения в код.

## Маршрут (30–60 мин)

1. [`../PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md) — vision, pillars, MVP 2.0, § «Бизнес-контекст»  
2. [`../ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md) — воронка советника (гипотеза), lead scoring, backlog продукта §9.6  
3. [`../MONETIZATION.md`](../MONETIZATION.md) — B2C TBD vs B2B2C гипотеза  
4. [`../GAME.md`](../GAME.md) — статус production  
5. [`../FEATURE_STATUS.md`](../FEATURE_STATUS.md) — матрица фич, § «Воронка и лиды»  
6. [`../../foundation/SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md) — реализованный цикл §1–11  
7. [`../../foundation/TARGET_PLAYER_AND_SESSION.md`](../../foundation/TARGET_PLAYER_AND_SESSION.md) §8 — игрок vs покупатель  
8. [`../../vision/ideas/tvoy-hod-evolution-after-mvp.md`](../../vision/ideas/tvoy-hod-evolution-after-mvp.md) §II — целевая Game/Plan  
9. [`../../backlog/PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) — приоритеты P0–P3  
10. [`../../foundation/MVP_AUDIT_VS_SPEC.md`](../../foundation/MVP_AUDIT_VS_SPEC.md) — расхождения docs vs код  
11. [`../internal/ECONOMY_TUNING.md`](../internal/ECONOMY_TUNING.md) — формулы (команда)  

## Ключевые решения (ADR)

| Тема | Документ |
|------|----------|
| Game / Plan | [ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md) |
| Победа | [ADR-002](../../decisions/ADR-002-victory-engine-and-template-config.md) |
| Механики UI | [ADR-004](../../decisions/ADR-004-mechanics-unlock-victory-chain.md) |
| Потребности | [ADR-005](../../decisions/ADR-005-character-needs-state-and-defeat.md) |
| Метрики TB1 | [ADR-009](../../decisions/ADR-009-metrics-dictionary-tb1.md) |

## Открытые продуктовые темы (отдельные сессии)

- Ужесточение KPI v2 — после 2 волн; канон лайт: [`KPI_AND_PHASES.md`](../KPI_AND_PHASES.md)  
- Positioning vs конкуренты  
- Монетизация B2C — [`MONETIZATION.md`](../MONETIZATION.md); валидация воронки советника — CustDev (см. advisor-doc backlog)  
- Третий design pillar (опционально)  
- Приоритет E1 vs O1 vs M12  

## Design pillars (канон)

1. **Умная игра**  
2. **Честные последствия**  

См. [`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md).

## Целевая аудитория (канон)

**30+**, готовые поиграть в **умную игру** — [`TARGET_PLAYER_AND_SESSION.md`](../../foundation/TARGET_PLAYER_AND_SESSION.md) §1.
