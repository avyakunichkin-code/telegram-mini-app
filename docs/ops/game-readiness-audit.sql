-- PostgreSQL: run on the explicitly selected playtest database before deployment.
-- Aggregate counts and schema metadata only; no personal records or mutation.
-- A successful local SQLite test does not replace this check.
BEGIN TRANSACTION READ ONLY;

SELECT save_kind, COUNT(*) AS profiles_count
FROM game_profiles
GROUP BY save_kind
ORDER BY save_kind;

SELECT COUNT(*) AS legacy_plan_profiles
FROM game_profiles
WHERE save_kind = 'plan';

-- PR-17 presence and GO compatibility: metadata, not user values.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND ((table_name = 'users' AND column_name = 'last_seen_at')
    OR (table_name = 'game_profiles' AND column_name = 'save_kind'))
ORDER BY table_name, column_name;

COMMIT;
