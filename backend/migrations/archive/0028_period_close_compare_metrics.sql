-- Сравнение доходов/расходов между периодами + снимок долга для итога периода
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS period_income_rate DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS period_expense_total DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE period_economy_closings ADD COLUMN IF NOT EXISTS total_debt_balance DOUBLE PRECISION NOT NULL DEFAULT 0;
