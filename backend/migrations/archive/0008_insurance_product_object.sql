-- Страховки: продукт + объект, сумма выплаты, срок, статус выплаты.
-- Механика: при страховом случае — полная payout_amount на счёт, полис деактивируется (claimed_period_index).

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS product VARCHAR(30);

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS insured_object VARCHAR(30);

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS payout_amount DOUBLE PRECISION;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS term_periods INTEGER NOT NULL DEFAULT 12;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS started_period_index INTEGER;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS expires_period_index INTEGER;

ALTER TABLE IF EXISTS insurance_policies
  ADD COLUMN IF NOT EXISTS claimed_period_index INTEGER;

-- payout из legacy coverage_limit
UPDATE insurance_policies
SET payout_amount = coverage_limit
WHERE payout_amount IS NULL AND coverage_limit IS NOT NULL;

-- product / object из legacy kind
UPDATE insurance_policies
SET product = 'health', insured_object = 'life', kind = 'health_life'
WHERE (product IS NULL OR product = '') AND kind = 'health';

UPDATE insurance_policies
SET product = 'property', insured_object = 'property', kind = 'property_property'
WHERE (product IS NULL OR product = '') AND kind = 'property';

UPDATE insurance_policies
SET product = 'auto', insured_object = 'property', kind = 'auto_property'
WHERE (product IS NULL OR product = '') AND kind = 'car';

-- kind = product_object для уже заполненных пар
UPDATE insurance_policies
SET kind = product || '_' || insured_object
WHERE product IS NOT NULL AND product <> '' AND insured_object IS NOT NULL AND insured_object <> ''
  AND (kind IS NULL OR kind = '' OR kind IN ('health', 'property', 'car'));

-- срок: если не задан — 12 периодов с момента создания (оценка started = 1)
UPDATE insurance_policies
SET term_periods = 12
WHERE term_periods IS NULL OR term_periods <= 0;

UPDATE insurance_policies
SET started_period_index = 1
WHERE started_period_index IS NULL;

UPDATE insurance_policies
SET expires_period_index = started_period_index + term_periods
WHERE expires_period_index IS NULL AND started_period_index IS NOT NULL;
