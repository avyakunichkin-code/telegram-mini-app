-- DC-01 / GE1 «Цена решений»: привязка движения журнала к кредиту.
-- NULL у существующих записей и у движений не по кредиту (без backfill).

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS liability_id INTEGER NULL REFERENCES finance_liabilities(id);
CREATE INDEX IF NOT EXISTS ix_transactions_liability_id ON transactions (liability_id);
