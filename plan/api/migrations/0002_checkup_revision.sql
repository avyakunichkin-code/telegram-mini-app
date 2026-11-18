-- Одновременная запись с двух устройств одного аккаунта (revision), версия JSON-документа,
-- не больше одного черновика на семью.
ALTER TABLE checkups ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE checkups ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX uq_checkups_one_draft ON checkups (household_id) WHERE status = 'draft';
