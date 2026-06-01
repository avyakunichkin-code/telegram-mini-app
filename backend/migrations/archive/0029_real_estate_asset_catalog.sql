-- Каталог недвижимости: owned / income / leased. Legacy home, rental_home снимаем.

ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS estate_role VARCHAR(20) NOT NULL DEFAULT 'owned';
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS monthly_rent_cost DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS monthly_utilities_cost DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS income_yield_annual DOUBLE PRECISION NULL;
ALTER TABLE asset_templates ADD COLUMN IF NOT EXISTS has_tenants_default INTEGER NOT NULL DEFAULT 0;

ALTER TABLE finance_assets ADD COLUMN IF NOT EXISTS has_tenants INTEGER NOT NULL DEFAULT 0;

UPDATE asset_templates SET is_active = 0 WHERE template_key IN ('home', 'rental_home');

-- owned
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, is_active, sort_order)
VALUES
  ('apt_1br', '1-комнатная квартира', 'home', 5000000, 15000, 0, 'owned', 1, 11),
  ('apt_2br', '2-комнатная квартира', 'home', 10000000, 30000, 0, 'owned', 1, 12),
  ('apt_3br', '3-комнатная квартира', 'home', 15000000, 45000, 0, 'owned', 1, 13),
  ('land_plot', 'Участок', 'land', 2500000, 10000, 0, 'owned', 1, 14),
  ('house_private', 'Частный дом', 'house', 20000000, 80000, 0, 'owned', 1, 15),
  ('mansion', 'Особняк 300+ м²', 'mansion', 50000000, 200000, 0, 'owned', 1, 16)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- income
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, income_yield_annual, has_tenants_default, is_active, sort_order)
VALUES
  ('apt_1br_income', '1-комнатная (сдача)', 'rental_home', 5000000, 7500, 37500, 'income', 0.09, 1, 1, 21),
  ('apt_2br_income', '2-комнатная (сдача)', 'rental_home', 10000000, 15000, 66667, 'income', 0.08, 1, 1, 22),
  ('apt_3br_income', '3-комнатная (сдача)', 'rental_home', 15000000, 22500, 87500, 'income', 0.07, 1, 1, 23),
  ('house_private_income', 'Частный дом (сдача)', 'rental_house', 20000000, 40000, 116667, 'income', 0.07, 1, 1, 24),
  ('mansion_income', 'Особняк (сдача)', 'rental_mansion', 50000000, 100000, 250000, 'income', 0.06, 1, 1, 25)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, income_yield_annual = EXCLUDED.income_yield_annual,
  has_tenants_default = EXCLUDED.has_tenants_default, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- leased (платёж = rent + utilities в monthly_maintenance_cost)
INSERT INTO asset_templates (template_key, title, kind, asset_value, monthly_maintenance_cost, monthly_income, estate_role, monthly_rent_cost, monthly_utilities_cost, is_active, sort_order)
VALUES
  ('lease_studio', 'Студия (аренда)', 'leased_dwelling', 0, 27500, 0, 'leased', 22500, 5000, 1, 31),
  ('lease_apt_2br', '2-комнатная (аренда)', 'leased_dwelling', 0, 52500, 0, 'leased', 45000, 7500, 1, 32),
  ('lease_apt_3br', '3-комнатная (аренда)', 'leased_dwelling', 0, 82500, 0, 'leased', 70000, 12500, 1, 33),
  ('lease_house', 'Дом (аренда)', 'leased_dwelling', 0, 115000, 0, 'leased', 100000, 15000, 1, 34)
ON CONFLICT (template_key) DO UPDATE SET
  title = EXCLUDED.title, kind = EXCLUDED.kind, asset_value = EXCLUDED.asset_value,
  monthly_maintenance_cost = EXCLUDED.monthly_maintenance_cost, monthly_income = EXCLUDED.monthly_income,
  estate_role = EXCLUDED.estate_role, monthly_rent_cost = EXCLUDED.monthly_rent_cost,
  monthly_utilities_cost = EXCLUDED.monthly_utilities_cost, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;
