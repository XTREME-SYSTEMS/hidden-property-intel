-- ============================================================
-- HIDDEN PROPERTY INTEL — SUPABASE MIGRATION 2
-- Full mirror schema: adds base44_id + missing columns to
-- existing tables, creates property_scores + sync_state tables.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ---- sync_state (incremental sync tracking) ----
CREATE TABLE IF NOT EXISTS sync_state (
  id                   TEXT PRIMARY KEY DEFAULT 'default',
  last_synced_at       TIMESTAMPTZ,
  last_property_count  INTEGER DEFAULT 0,
  updated_date         TIMESTAMPTZ DEFAULT NOW()
);

-- ---- properties: add base44_id + full columns ----
ALTER TABLE properties ADD COLUMN IF NOT EXISTS base44_id           TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS normalized_address  TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat                 NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng                 NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_footage      NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms            NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms          NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built         NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_size            NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description         TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS source_url          TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS scraped_at          TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_verified_at    TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_fetch_attempts INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS days_on_market      INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images              JSONB DEFAULT '[]';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured         BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS proposed_asking_price NUMERIC;
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_base44_id ON properties(base44_id) WHERE base44_id IS NOT NULL;

-- ---- property_scores (new table) ----
CREATE TABLE IF NOT EXISTS property_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base44_id             TEXT UNIQUE,
  property_id           TEXT,
  overall_score         NUMERIC,
  distress_severity     TEXT,
  repair_cost_estimate  NUMERIC,
  after_repair_value    NUMERIC,
  estimated_roi         NUMERIC,
  ai_analysis           TEXT,
  scored_at             TIMESTAMPTZ,
  model_version         TEXT,
  created_date          TIMESTAMPTZ DEFAULT NOW(),
  updated_date          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_property_scores_property ON property_scores(property_id);
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS property_scores_read ON property_scores;
CREATE POLICY property_scores_read ON property_scores FOR SELECT USING (TRUE);

-- ---- owners: add base44_id + full columns ----
ALTER TABLE owners ADD COLUMN IF NOT EXISTS base44_id              TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS contact_address        TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS relationship_to_property TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS acquired_date          DATE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS ownership_percentage   NUMERIC;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS is_verified            BOOLEAN DEFAULT FALSE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS source                 TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS contacted_at           TIMESTAMPTZ;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS follow_up_enabled      BOOLEAN DEFAULT FALSE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS next_follow_up_date   TIMESTAMPTZ;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS automation_enabled    BOOLEAN DEFAULT FALSE;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS is_reachable           BOOLEAN DEFAULT TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_owners_base44_id ON owners(base44_id) WHERE base44_id IS NOT NULL;

-- ---- investor_leads: add base44_id + full columns ----
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS base44_id                  TEXT;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS website                    TEXT;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS target_markets             TEXT[];
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS investment_types          TEXT[];
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS region                    TEXT;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS source                    TEXT;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS last_contacted             TIMESTAMPTZ;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS notes                     TEXT;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS follow_up_enabled        BOOLEAN DEFAULT FALSE;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS follow_up_frequency_days INTEGER DEFAULT 7;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS next_follow_up_date      TIMESTAMPTZ;
ALTER TABLE investor_leads ADD COLUMN IF NOT EXISTS automation_enabled        BOOLEAN DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_base44_id ON investor_leads(base44_id) WHERE base44_id IS NOT NULL;

-- ---- deals: add base44_id + full columns ----
ALTER TABLE deals ADD COLUMN IF NOT EXISTS base44_id          TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id            TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage              TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS exit_strategy      TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS acquisition_price  NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rehab_budget       NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS arv               NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS holding_costs      NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS projected_profit  NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS actual_profit      NUMERIC;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS target_close_date DATE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_deals_base44_id ON deals(base44_id) WHERE base44_id IS NOT NULL;

-- ============================================================
-- END OF MIGRATION 2
-- ============================================================