-- DC-04 / GE1 «Цена решений»: привязка списания события к выбранному экземпляру.
-- Сумма события может зависеть от зарплаты на момент выбора (cash_pct_salary),
-- поэтому карточка берёт фактическое списание из журнала, а не effects_json.
-- NULL у существующих записей и у движений не по событию (без backfill).

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS event_instance_id INTEGER NULL REFERENCES event_instances(id);
CREATE INDEX IF NOT EXISTS ix_transactions_event_instance_id ON transactions (event_instance_id);
