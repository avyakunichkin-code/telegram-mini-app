-- NV-304 (SPEC_needs-set-point §3.3): период покупки актива — для привыкания к нему в уровне жизни.
-- NULL у уже существующих строк = «с начала игры» (без backfill: истории покупок нет).

ALTER TABLE finance_assets ADD COLUMN IF NOT EXISTS acquired_period_index INTEGER NULL;
