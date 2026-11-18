-- DL1: secured liabilities, annuity fields, insurance on asset, template metadata

-- finance_liabilities
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS liability_kind VARCHAR(32) NOT NULL DEFAULT 'unsecured';
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS secured_asset_id INTEGER NULL REFERENCES finance_assets(id);
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS term_periods INTEGER NULL;
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS periods_paid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS original_principal DOUBLE PRECISION NULL;
ALTER TABLE finance_liabilities ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(32) NOT NULL DEFAULT 'interest_only';

CREATE INDEX IF NOT EXISTS ix_finance_liabilities_secured_asset
  ON finance_liabilities (secured_asset_id) WHERE secured_asset_id IS NOT NULL;

-- finance_assets
ALTER TABLE finance_assets ADD COLUMN IF NOT EXISTS acquisition_mode VARCHAR(16) NOT NULL DEFAULT 'cash';

-- insurance_policies
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS insured_asset_id INTEGER NULL REFERENCES finance_assets(id);

CREATE INDEX IF NOT EXISTS ix_insurance_policies_insured_asset
  ON insurance_policies (insured_asset_id) WHERE insured_asset_id IS NOT NULL;

-- liability_templates
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS liability_kind VARCHAR(32) NOT NULL DEFAULT 'consumer';
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS term_periods INTEGER NULL;
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS disbursement_mode VARCHAR(32) NOT NULL DEFAULT 'to_cash';
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS linked_asset_template_key VARCHAR(80) NULL;
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS down_payment_amount DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE liability_templates ADD COLUMN IF NOT EXISTS requires_asset_kind VARCHAR(50) NULL;

UPDATE liability_templates SET liability_kind = 'mortgage', disbursement_mode = 'to_asset_purchase',
  term_periods = 240, requires_asset_kind = 'home', down_payment_amount = 2000000
WHERE template_key = 'mortgage';

UPDATE liability_templates SET liability_kind = 'auto_loan', disbursement_mode = 'to_asset_purchase',
  term_periods = 60, requires_asset_kind = 'car', down_payment_amount = 300000
WHERE template_key = 'car_loan';

UPDATE liability_templates SET liability_kind = 'consumer', disbursement_mode = 'to_cash',
  term_periods = 36, requires_asset_kind = NULL, down_payment_amount = 0
WHERE template_key = 'consumer';

UPDATE liability_templates SET liability_kind = 'consumer', disbursement_mode = 'to_cash',
  term_periods = NULL, requires_asset_kind = NULL, down_payment_amount = 0
WHERE template_key = 'credit_card';

UPDATE finance_liabilities SET liability_kind = 'unsecured', payment_mode = 'interest_only'
WHERE liability_kind IS NULL OR liability_kind = '';
