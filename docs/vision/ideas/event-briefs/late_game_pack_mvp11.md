---
tags:
  - tvoy-hod/layer/idea
aliases:
  - late_game_pack_mvp11
  - "Late-game pack (ходы 20–40) — MVP 1.1"
---
# Late-game pack (ходы 20–40) — MVP 1.1

**Дата:** 2026-06-08 · **Каталог:** `data/events/mvp11/late_game.yaml` + `credit_debt.yaml` (рефинанс)

| Key | Tier | Audience | Lifecycle | Триггер |
|-----|------|----------|-----------|---------|
| `mq11_refinance_bank` | 4 | all | B, cooldown 12 | `min_active_liabilities: 1` |
| `mq11_portfolio_rebalance` | 4 | all | B, cooldown 10 | окно tier при ходе 30+ |
| `mq11_rent_room_student` | 3 | student | A, once | profile |
| `mq11_mortgage_prepay_pro` | 5 | pro | B, cooldown 12 | liabilities ≥ 1 |
| `mq11_lifestyle_creep` | 3 | all | B, cooldown 12 | expense_line |

**needs_axis_map:** жильё → comfort; кредиты → comfort+status; подписки → comfort+status.
