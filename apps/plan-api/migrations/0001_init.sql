-- БД `plan` (SPEC_plan-v1 §Models / DB, SPL-402). Общее подмножество SQLite и Postgres:
-- время — ISO-строки UTC, JSON — TEXT. Разделы чекапа хранятся документом `checkups.data_json`
-- (отступление от нормализованных таблиц spec — см. ROADMAP P2, SPL-402).

CREATE TABLE users (
    id VARCHAR(40) PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    created_at VARCHAR(40) NOT NULL,
    deleted_at VARCHAR(40),
    token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE email_codes (
    email VARCHAR(254) PRIMARY KEY,
    code_hash VARCHAR(64) NOT NULL,
    expires_at VARCHAR(40) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE code_requests (
    id VARCHAR(40) PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    at VARCHAR(40) NOT NULL
);
CREATE INDEX ix_code_requests_email ON code_requests (email, at);
CREATE INDEX ix_code_requests_ip ON code_requests (ip_hash, at);

CREATE TABLE consent_log (
    id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL REFERENCES users (id),
    consent_version VARCHAR(40) NOT NULL,
    accepted_at VARCHAR(40) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL
);

CREATE TABLE households (
    id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40) NOT NULL UNIQUE REFERENCES users (id),
    members_json TEXT NOT NULL
);

CREATE TABLE checkups (
    id VARCHAR(40) PRIMARY KEY,
    household_id VARCHAR(40) NOT NULL REFERENCES households (id),
    entry_question VARCHAR(20) NOT NULL,
    status VARCHAR(12) NOT NULL,
    as_of VARCHAR(7) NOT NULL,
    parent_checkup_id VARCHAR(40),
    created_at VARCHAR(40) NOT NULL,
    completed_at VARCHAR(40),
    members_json TEXT NOT NULL,
    data_json TEXT NOT NULL
);
CREATE INDEX ix_checkups_household ON checkups (household_id, status);

CREATE TABLE reports (
    id VARCHAR(40) PRIMARY KEY,
    checkup_id VARCHAR(40) NOT NULL UNIQUE REFERENCES checkups (id),
    rules_version VARCHAR(20) NOT NULL,
    computed_at VARCHAR(40) NOT NULL,
    idempotency_key VARCHAR(100),
    payload_json TEXT NOT NULL
);

CREATE TABLE steps (
    id VARCHAR(40) PRIMARY KEY,
    report_id VARCHAR(40) NOT NULL REFERENCES reports (id),
    household_id VARCHAR(40) NOT NULL REFERENCES households (id),
    rule_key VARCHAR(40) NOT NULL,
    rank INTEGER NOT NULL,
    status VARCHAR(12) NOT NULL,
    status_at VARCHAR(40),
    payload_json TEXT NOT NULL
);
CREATE INDEX ix_steps_report ON steps (report_id);

CREATE TABLE product_events (
    id VARCHAR(40) PRIMARY KEY,
    user_id VARCHAR(40),
    name VARCHAR(40) NOT NULL,
    props_json TEXT NOT NULL,
    at VARCHAR(40) NOT NULL
);
CREATE INDEX ix_product_events_name ON product_events (name);
