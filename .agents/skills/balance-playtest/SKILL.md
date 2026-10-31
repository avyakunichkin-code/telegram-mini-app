---
name: balance-playtest
description: Run deterministic 30–40-period game balance simulations and compare JSON metrics with accepted baselines after material economy or content changes.
---

# balance-playtest

Пример: «сравни баланс после смены зарплаты». Не активировать для опечатки, a11y-label или чистого CSS.
Прочитай docs/balance/README.md, THRESHOLDS.md и baselines/manifest.yaml. Из backend запусти python scripts/balance_playtest.py (40 периодов по manifest); reports пишутся в docs/balance/reports. Проверь exit code, template/policy/seed/periods и meta_mismatch до сравнения. Выдай win_at_period/goals/defeated, cash p12/p20/p40 и флаги diff; REGRESSION → FAIL либо явное принятое решение rebalance. Не обновляй baseline без явного принятия человеком. Независимый economy-balance-runner выдаёт метрики, economy-reviewer — корректность; человеческий playtest — удовольствие и понимание.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
