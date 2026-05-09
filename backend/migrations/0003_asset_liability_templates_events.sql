-- Idempotent migration: templates for assets/liabilities + расширение событий
-- PostgreSQL.

-- ---------- asset_templates ----------
CREATE TABLE IF NOT EXISTS asset_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  kind VARCHAR(50) NOT NULL DEFAULT 'generic',
  asset_value DOUBLE PRECISION NOT NULL,
  monthly_maintenance_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  monthly_income DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_asset_templates_key ON asset_templates (template_key);
CREATE INDEX IF NOT EXISTS ix_asset_templates_active ON asset_templates (is_active);

INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, is_active, sort_order)
VALUES
  ('home', 'Жилая квартира', 'home', 4500000, 6000, 0, 1, 10),
  ('rental_home', 'Доходная квартира (аренда)', 'rental_home', 5200000, 7000, 35000, 1, 20),
  ('car_personal', 'Личная машина', 'car_personal', 1200000, 12000, 0, 1, 30),
  ('car_taxi', 'Машина для такси (аренда)', 'car_taxi', 1500000, 18000, 45000, 1, 40)
ON CONFLICT (template_key) DO NOTHING;

-- ---------- liability_templates ----------
CREATE TABLE IF NOT EXISTS liability_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(160) NOT NULL,
  total_debt DOUBLE PRECISION NOT NULL,
  annual_rate_percent DOUBLE PRECISION NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_liability_templates_key ON liability_templates (template_key);
CREATE INDEX IF NOT EXISTS ix_liability_templates_active ON liability_templates (is_active);

INSERT INTO liability_templates (template_key, title, total_debt, annual_rate_percent, is_active, sort_order)
VALUES
  ('mortgage', 'Ипотека', 3500000, 9, 1, 10),
  ('car_loan', 'Автокредит', 850000, 14, 1, 20),
  ('consumer', 'Потребительский кредит', 400000, 18, 1, 30),
  ('credit_card', 'Кредитная карта', 150000, 22, 1, 40)
ON CONFLICT (template_key) DO NOTHING;

-- ---------- event_definitions: поля под будущие сценарии ----------
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS mandatory INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS category VARCHAR(80);
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS metadata_json TEXT NOT NULL DEFAULT '{}';

-- Одна библиотека сценариев для всех режимов игры (выборка фильтруется по mode в коде)
UPDATE event_definitions SET mode = 'any' WHERE mode = 'light';

-- Пересчёт ежемесячных платежей как тело × (ставка%/100) / 12 для уже существующих обязательств
UPDATE finance_liabilities
SET monthly_payment = (
  ROUND(
    (CAST(total_debt AS NUMERIC) * CAST(annual_rate_percent AS NUMERIC) / 100 / 12),
    2
  )
)::double precision;
