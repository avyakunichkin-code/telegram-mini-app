-- E1: каталог категорий расходов + статьи бюджета на профиле
-- Идемпотентно: таблица могла быть создана через SQLAlchemy create_all без DEFAULT на is_active.

CREATE TABLE IF NOT EXISTS expense_category_definitions (
  category_key VARCHAR(40) NOT NULL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  default_tier VARCHAR(20) NOT NULL DEFAULT 'must',
  sort_order INTEGER NOT NULL DEFAULT 100,
  icon_key VARCHAR(40),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- Догоняем схему, если таблица уже была без DEFAULT / created_at
ALTER TABLE expense_category_definitions
  ADD COLUMN IF NOT EXISTS is_active INTEGER;

ALTER TABLE expense_category_definitions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc');

UPDATE expense_category_definitions SET is_active = 1 WHERE is_active IS NULL;

ALTER TABLE expense_category_definitions
  ALTER COLUMN is_active SET DEFAULT 1;

ALTER TABLE expense_category_definitions
  ALTER COLUMN is_active SET NOT NULL;

INSERT INTO expense_category_definitions (
  category_key, title, default_tier, sort_order, icon_key, is_active
)
VALUES
  ('housing', 'Жильё', 'must', 10, 'housing', 1),
  ('food', 'Еда', 'must', 20, 'food', 1),
  ('transport', 'Транспорт', 'must', 30, 'transport', 1),
  ('health', 'Здоровье', 'must', 40, 'health', 1),
  ('clothing', 'Одежда и быт', 'must', 50, 'clothing', 1),
  ('communications', 'Связь и подписки', 'must', 60, 'communications', 1),
  ('leisure', 'Досуг', 'discretionary', 70, 'leisure', 1),
  ('other', 'Прочее', 'discretionary', 80, 'other', 1)
ON CONFLICT (category_key) DO UPDATE SET
  title = EXCLUDED.title,
  default_tier = EXCLUDED.default_tier,
  sort_order = EXCLUDED.sort_order,
  icon_key = EXCLUDED.icon_key,
  is_active = EXCLUDED.is_active;

CREATE TABLE IF NOT EXISTS profile_expense_lines (
  id SERIAL PRIMARY KEY,
  game_profile_id INTEGER NOT NULL REFERENCES game_profiles(id) ON DELETE CASCADE,
  category_key VARCHAR(40) NOT NULL REFERENCES expense_category_definitions(category_key),
  amount_monthly DOUBLE PRECISION NOT NULL DEFAULT 0,
  title_override VARCHAR(160),
  source_kind VARCHAR(20) NOT NULL DEFAULT 'template',
  source_ref VARCHAR(120),
  tier VARCHAR(20) NOT NULL DEFAULT 'must',
  created_period_index INTEGER NOT NULL DEFAULT 1,
  expires_period_index INTEGER,
  revoked_at TIMESTAMP WITHOUT TIME ZONE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS ix_profile_expense_lines_profile_active
  ON profile_expense_lines (game_profile_id, is_active);
