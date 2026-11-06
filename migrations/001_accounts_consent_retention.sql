-- MenoWell Database Schema: Accounts, Consent, and Data Retention
-- Compatible with PostgreSQL (Hostinger / Supabase / Neon / AWS RDS)

-- 1. User Accounts (holds only minimal authentication details)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Proof of Consent Log (UK GDPR Article 9 special category / US consumer health privacy)
-- Health data details are NEVER stored in this table.
CREATE TABLE IF NOT EXISTS consent_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_version VARCHAR(32) NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purpose VARCHAR(64) NOT NULL, -- e.g. 'server_sync' or 'ai_assistance'
    retention_days INT NOT NULL CHECK (retention_days IN (10, 20, 30, 90)),
    withdrawn_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_user_purpose ON consent_records(user_id, purpose, withdrawn_at);

-- 3. Stored Health Records (Encrypted payload with strict dated expiry)
CREATE TABLE IF NOT EXISTS stored_health_records (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload TEXT NOT NULL, -- Encrypted JSON in transit and at rest
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for high-performance automatic expiry deletion job
CREATE INDEX IF NOT EXISTS idx_health_records_expiry ON stored_health_records(expires_at);
CREATE INDEX IF NOT EXISTS idx_health_records_user ON stored_health_records(user_id);

-- Scheduled deletion query run at least daily:
-- DELETE FROM stored_health_records WHERE expires_at <= NOW();
