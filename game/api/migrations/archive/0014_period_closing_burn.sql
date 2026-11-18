-- E1-C: burn на закрытии периода для аналитики

ALTER TABLE period_economy_closings
  ADD COLUMN IF NOT EXISTS monthly_burn_total DOUBLE PRECISION NOT NULL DEFAULT 0;
