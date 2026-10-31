"""
Пороги светофора и параметры сценариев (SPEC_plan-v1, `rules_version=1`).

Значения предварительные — калибруются до α Plan (Open question #2). Меняются только
вместе с `RULES_VERSION`: сохранённые отчёты помнят, по какой версии посчитаны.
"""

RULES_VERSION = 1
FORECAST_MONTHS = 12

# Светофор
SAVINGS_RATE_GREEN = 0.10
DTI_GREEN = 30.0
DTI_RED = 50.0
CUSHION_MIN_MONTHS = 1.0
CUSHION_TARGET_MONTHS = 3.0
CUSHION_TARGET_MONTHS_FAMILY = 6.0  # есть ребёнок и один доход даёт > MAIN_EARNER_SHARE дохода семьи
MAIN_EARNER_SHARE = 0.70

# Флаги «инвестиции и защита»
CONCENTRATION_SHARE = 0.50
PENSION_AGE_FLAG = 35

# Сценарии
S1_MONTHS_WITHOUT_INCOME = 6
S2_CHILD_MONTHLY_COST = 25_000.0
S2_PARENTAL_LEAVE_CUT = 0.60
S2_MONTHS = 12
S3_PRICE_GROWTH = 0.10

# Долги и цели
HIGH_RATE_PERCENT = 20.0
EXTRA_SHARE_OF_FREE_CASHFLOW = 0.50
CUSHION_SHARE_OF_FREE_CASHFLOW = 0.50  # пока подушка ниже цели
MAX_PAYOFF_MONTHS = 360

# Быстрый старт: сводный кредит по одному платежу
QUICK_DEBT_RATE = 18.0
QUICK_DEBT_TERM = 36

# Точность отчёта: поле «точное», если max / min ≤ 1.1
PRECISION_EXACT_RATIO = 1.1
PRECISION_APPROX = 0.50
PRECISION_REFINED = 0.85

DISCLAIMER = (
    "Расчёт информационный, на данных, которые вы ввели. Это не индивидуальная инвестиционная "
    "рекомендация и не предложение финансовых продуктов."
)
