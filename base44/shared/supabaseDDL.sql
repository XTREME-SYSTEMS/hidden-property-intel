-- ============================================================
-- HIDDEN PROPERTY INTEL — MASTER SUPABASE DDL STAGING SCRIPT
-- Generated: 2026-09-05
-- Purpose: Complete schema, indexes, foreign keys, and RLS
--          for the XTREME COMMUNICATIONS gateway + core platform
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE api_key_status AS ENUM ('active', 'rolled', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE phone_status AS ENUM ('sandbox', 'credentials_required', 'active', 'provisioned', 'failed', 'opted_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE phone_source AS ENUM ('csv_import', 'lead_form', 'manual', 'api', 'scraped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE line_type AS ENUM ('mobile', 'landline', 'voip', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('active', 'under_contract', 'closed', 'expired', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outreach_status AS ENUM ('new', 'contacted', 'responded', 'opted_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- ---- api_keys ----
CREATE TABLE IF NOT EXISTS api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  key_hash        TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  scopes          TEXT[] DEFAULT '{"lookups","numbers:read"}',
  status          api_key_status DEFAULT 'active',
  last_used       TIMESTAMPTZ,
  last_used_ip    TEXT,
  request_count   INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- phone_numbers ----
CREATE TABLE IF NOT EXISTS phone_numbers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number          TEXT NOT NULL,
  country_code    TEXT DEFAULT 'US',
  country         TEXT,
  line_type       line_type DEFAULT 'unknown',
  carrier         TEXT,
  status          phone_status DEFAULT 'sandbox',
  tenant_id       TEXT NOT NULL,
  source          phone_source DEFAULT 'api',
  verified        BOOLEAN DEFAULT FALSE,
  imported_at     TIMESTAMPTZ,
  last_lookup_at  TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- properties ----
CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  zip_code        TEXT NOT NULL,
  property_type   TEXT DEFAULT 'residential',
  distress_type   TEXT,
  status          property_status DEFAULT 'active',
  estimated_value NUMERIC,
  property_score  NUMERIC,
  seller_id       TEXT,
  source          TEXT DEFAULT 'scraped',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- owners ----
CREATE TABLE IF NOT EXISTS owners (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     TEXT,
  name            TEXT NOT NULL,
  owner_type      TEXT DEFAULT 'current',
  contact_phone   TEXT,
  contact_email   TEXT,
  outreach_status outreach_status DEFAULT 'new',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- investor_leads ----
CREATE TABLE IF NOT EXISTS investor_leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  company         TEXT,
  email           TEXT,
  phone           TEXT,
  outreach_status outreach_status DEFAULT 'new',
  contact_count   INTEGER DEFAULT 0,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- deals ----
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     TEXT,
  investor_id     TEXT,
  seller_id       TEXT,
  status          TEXT DEFAULT 'open',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- bids ----
CREATE TABLE IF NOT EXISTS bids (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     TEXT NOT NULL,
  investor_id     TEXT,
  bid_amount      NUMERIC NOT NULL,
  status          TEXT DEFAULT 'active',
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ---- smart_contracts ----
CREATE TABLE IF NOT EXISTS smart_contracts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     TEXT NOT NULL,
  investor_id     TEXT NOT NULL,
  seller_id       TEXT NOT NULL,
  status          TEXT DEFAULT 'draft',
  contract_address TEXT,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by_id   TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

-- API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_hash        ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant      ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status      ON api_keys(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_hash  ON api_keys(key_hash) WHERE status = 'active';

-- Phone numbers
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number   ON phone_numbers(number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_tenant   ON phone_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status   ON phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_lookup   ON phone_numbers(tenant_id, number);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_address   ON properties(address);
CREATE INDEX IF NOT EXISTS idx_properties_city      ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status   ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_score     ON properties(property_score DESC);

-- Owners
CREATE INDEX IF NOT EXISTS idx_owners_property      ON owners(property_id);
CREATE INDEX IF NOT EXISTS idx_owners_outreach      ON owners(outreach_status);

-- Investor leads
CREATE INDEX IF NOT EXISTS idx_leads_outreach       ON investor_leads(outreach_status);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_property       ON deals(property_id);
CREATE INDEX IF NOT EXISTS idx_deals_investor       ON deals(investor_id);
CREATE INDEX IF NOT EXISTS idx_deals_status         ON deals(status);

-- Bids
CREATE INDEX IF NOT EXISTS idx_bids_property        ON bids(property_id);
CREATE INDEX IF NOT EXISTS idx_bids_investor       ON bids(investor_id);
CREATE INDEX IF NOT EXISTS idx_bids_status         ON bids(status);

-- Smart contracts
CREATE INDEX IF NOT EXISTS idx_contracts_property   ON smart_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status    ON smart_contracts(status);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE owners
  DROP CONSTRAINT IF EXISTS fk_owners_property,
  ADD CONSTRAINT fk_owners_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE deals
  DROP CONSTRAINT IF EXISTS fk_deals_property,
  ADD CONSTRAINT fk_deals_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE deals
  DROP CONSTRAINT IF EXISTS fk_deals_investor,
  ADD CONSTRAINT fk_deals_investor
    FOREIGN KEY (investor_id) REFERENCES investor_leads(id) ON DELETE SET NULL;

ALTER TABLE bids
  DROP CONSTRAINT IF EXISTS fk_bids_property,
  ADD CONSTRAINT fk_bids_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE smart_contracts
  DROP CONSTRAINT IF EXISTS fk_contracts_property,
  ADD CONSTRAINT fk_contracts_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE api_keys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_leads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids            ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;

-- ---- API Keys RLS ----
DROP POLICY IF EXISTS api_keys_read ON api_keys;
CREATE POLICY api_keys_read ON api_keys
  FOR SELECT USING (
    tenant_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS api_keys_write ON api_keys;
CREATE POLICY api_keys_write ON api_keys
  FOR ALL USING (
    tenant_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Phone Numbers RLS ----
DROP POLICY IF EXISTS phone_numbers_read ON phone_numbers;
CREATE POLICY phone_numbers_read ON phone_numbers
  FOR SELECT USING (
    tenant_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

DROP POLICY IF EXISTS phone_numbers_write ON phone_numbers;
CREATE POLICY phone_numbers_write ON phone_numbers
  FOR ALL USING (
    tenant_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Properties RLS (public read, owner/admin write) ----
DROP POLICY IF EXISTS properties_read ON properties;
CREATE POLICY properties_read ON properties
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS properties_write ON properties;
CREATE POLICY properties_write ON properties
  FOR ALL USING (
    seller_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Owners RLS (admin only) ----
DROP POLICY IF EXISTS owners_all ON owners;
CREATE POLICY owners_all ON owners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Investor Leads RLS (admin only) ----
DROP POLICY IF EXISTS leads_all ON investor_leads;
CREATE POLICY leads_all ON investor_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Deals RLS ----
DROP POLICY IF EXISTS deals_read ON deals;
CREATE POLICY deals_read ON deals
  FOR SELECT USING (
    investor_id = auth.uid()::TEXT
    OR seller_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Bids RLS ----
DROP POLICY IF EXISTS bids_read ON bids;
CREATE POLICY bids_read ON bids
  FOR SELECT USING (
    investor_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ---- Smart Contracts RLS ----
DROP POLICY IF EXISTS contracts_read ON smart_contracts;
CREATE POLICY contracts_read ON smart_contracts
  FOR SELECT USING (
    investor_id = auth.uid()::TEXT
    OR seller_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ============================================================
-- UPDATED_DATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_api_keys_updated   ON api_keys;
CREATE TRIGGER trg_api_keys_updated   BEFORE UPDATE ON api_keys   FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_phone_numbers_updated ON phone_numbers;
CREATE TRIGGER trg_phone_numbers_updated BEFORE UPDATE ON phone_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_properties_updated  ON properties;
CREATE TRIGGER trg_properties_updated  BEFORE UPDATE ON properties  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_owners_updated       ON owners;
CREATE TRIGGER trg_owners_updated       BEFORE UPDATE ON owners       FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_leads_updated        ON investor_leads;
CREATE TRIGGER trg_leads_updated        BEFORE UPDATE ON investor_leads FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_deals_updated        ON deals;
CREATE TRIGGER trg_deals_updated        BEFORE UPDATE ON deals        FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_bids_updated         ON bids;
CREATE TRIGGER trg_bids_updated         BEFORE UPDATE ON bids         FOR EACH ROW EXECUTE FUNCTION update_updated_date();

DROP TRIGGER IF EXISTS trg_contracts_updated    ON smart_contracts;
CREATE TRIGGER trg_contracts_updated    BEFORE UPDATE ON smart_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ============================================================
-- END OF SCRIPT
-- ============================================================