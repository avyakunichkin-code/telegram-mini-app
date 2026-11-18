"""
Пороги светофора и параметры сценариев (SPEC_plan-v1, `rules_version=1`).

Значения предварительные — калибруются до α Plan (Open question #2). Меняются только
вместе с `RULES_VERSION`: сохранённые отчёты помнят, по какой версии посчитаны.
"""

RULES_VERSION = 1

# P3-02: stable action keys; reports snapshot these templates at creation.
STEP_ACTIONS = {
    "close_overdue": [("confirm_balance", "Уточнить сумму просрочки у кредитора"), ("pay", "Самостоятельно внести платёж"), ("verify", "Проверить погашение просрочки")],
    "stop_deficit": [("review", "Выбрать расходы, которые можно сократить"), ("adjust", "Изменить запланированные расходы"), ("verify", "Проверить, что бюджет больше не уходит в минус")],
    "first_cushion": [("choose_account", "Выбрать отдельный счёт для резерва"), ("transfer", "Самостоятельно пополнить резерв"), ("verify", "Проверить, что деньги зачислены")],
    "avalanche": [("terms", "Уточнить условия досрочного погашения"), ("pay", "Самостоятельно внести дополнительный платёж"), ("verify", "Проверить новый остаток долга")],
    "stress_fail": [("review", "Посмотреть, когда в сценарии заканчиваются деньги"), ("plan", "Определить, как укрепить запас"), ("start", "Выполнить первое действие для увеличения запаса")],
    "goal_unrealistic": [("review", "Сопоставить нужный взнос со свободным остатком"), ("adjust", "Выбрать посильную сумму или более поздний срок")],
    "cushion_target": [("choose_account", "Выбрать отдельный счёт для резерва"), ("transfer", "Самостоятельно внести месячный взнос"), ("verify", "Проверить, что деньги зачислены")],
    "direct_surplus": [("choose_goal", "Выбрать цель для свободного остатка"), ("transfer", "Самостоятельно направить деньги на цель"), ("verify", "Проверить пополнение накоплений")],
}
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
RUNWAY_MAX_MONTHS = 36  # горизонт показа запаса хода, не порог оценки

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
