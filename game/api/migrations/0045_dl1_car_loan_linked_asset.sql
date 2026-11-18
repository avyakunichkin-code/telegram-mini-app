-- DL1: связка автокредит ↔ car_personal (дополнение к 0044)

UPDATE liability_templates SET
  linked_asset_template_key = 'car_personal',
  total_debt = 900000,
  annual_rate_percent = 14,
  down_payment_amount = 300000
WHERE template_key = 'car_loan';
