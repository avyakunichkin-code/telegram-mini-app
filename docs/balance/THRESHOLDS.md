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
