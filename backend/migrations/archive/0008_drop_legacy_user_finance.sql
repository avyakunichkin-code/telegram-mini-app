-- Удаление legacy-слоя финансов и демо-сообщений на users (игра живёт в game_profiles + finance_*).

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS salary_profiles CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
