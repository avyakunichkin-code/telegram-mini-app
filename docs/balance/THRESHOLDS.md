---
tags:
  - tvoy-hod/layer/balance
aliases:
  - "Пороги balance diff (эвристика)"
  - THRESHOLDS
---
# Пороги balance diff (эвристика)

Используются в `backend/scripts/balance_diff.py`. Не заменяют продуктовое решение — только сигнал для ревью.

| Условие | Уровень |
|---------|---------|
| Разный `template_key` / `policy` vs baseline | INVALID (сравнение бессмысленно) |
| `win_reached` true → false | REGRESSION |
| `win_at_period` был, стал null | REGRESSION |
| `win_at_period` раньше (меньший P) | INFO (легче) |
| `win_at_period` позже | INFO |
| `defeated` false → true | REGRESSION |
| `defeated` true → false | INFO |
| Оба defeated, `periods_closed` уменьшился ≥2 | REGRESSION (поражение раньше) |
| `goals_met` уменьшился | REGRESSION |
| `max_neg_streak` вырос | WARNING |
| `max_overdue` вырос >0 | WARNING |
| `periods_closed` \|Δ\| ≥3 (оба не defeated) | WARNING |
| `cash_p12` / `p20` / `p40` сдвиг ≥10% | WARNING |
| тот же сдвиг ≥25% | REGRESSION |
| `events_resolved` \|Δ\| >10% от baseline | WARNING |
| `salary_claim_rate` снизился | WARNING |

Настройка в коде: константа `DIFF_THRESHOLDS` в `balance_diff.py`.

## Инварианты победимости

Пороги выше ловят **дрейф** от baseline: если baseline уже непобедим, вердикт будет OK. Инварианты проверяют **абсолютные** свойства дизайна и дают `INVARIANT FAIL` (exit 1) независимо от baseline. Источник: [аудит 2026-10-25](../audits/ux/2026-10-25-constraints-design-gamefeel.md), улучшения 1–2.

| Код | Условие FAIL | Где проверяется |
|-----|--------------|-----------------|
| INV-1 | на шаблоне ни одна политика не побеждает в окне **P12–P30** | `check_suite_invariants`, только полный прогон manifest (без `--only`, горизонт ≥ 30) |
| INV-2 | needs-aware политика (`needs_keeper`, `restructure`, `chain_runner`) проигрывает по `needs_depletion` раньше **P20**, имея на счёте > **3×** расходов хода перед поражением | `check_report_invariants` — в каждом `balance_diff` |
| INV-3 | одно-осевая политика (`needs_keeper`, `idle`) побеждает, а `chain_runner` — нет, или быстрее `chain_runner` больше чем в **1,3×** | `check_suite_invariants` |

`idle`, `tutorial`, `safety_first`, `passive` не выбирают события ради потребностей, поэтому INV-2 к ним не применяется (их смерть от потребностей — ожидаемое давление, не дефект).

На время перекалибровки экономики: `--invariants warn` у `balance_playtest.py` / `balance_diff.py` — флаги становятся `WARNING: invariant …` и не блокируют. Константы — `INVARIANTS` в `balance_diff.py`.

`goals_met_peak` — максимум `goals_met` по ряду: после поражения overview обнулён и итоговый `goals_met` = 0.
