-- Ипотека: связка с 1-комнатной квартирой (DL1)

UPDATE liability_templates SET
  linked_asset_template_key = 'apt_1br',
  total_debt = 4000000,
  down_payment_amount = 1000000
WHERE template_key = 'mortgage';
