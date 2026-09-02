-- ============================================================
-- PropertyIntel — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DATA SOURCES — county sites the scraper targets
-- ============================================================
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'county_assessor',
  url TEXT NOT NULL,
  state TEXT,
  county TEXT,
  scrape_frequency TEXT NOT NULL DEFAULT 'daily',
  scrape_config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  last_run_at TIMESTAMPTZ,
  properties_yielded NUMERIC DEFAULT 0,
  health_score NUMERIC,
  consecutive_failures NUMERIC DEFAULT 0,
  paused_until TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPERTIES — the main inventory table
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT,
  normalized_address TEXT,
  dedup_key TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geohash TEXT,
  property_type TEXT DEFAULT 'residential',
  distress_type TEXT,
  status TEXT DEFAULT 'active',
  estimated_value NUMERIC,
  proposed_asking_price NUMERIC,
  property_score NUMERIC,
  square_footage NUMERIC,
  bedrooms NUMERIC,
  bathrooms NUMERIC,
  year_built NUMERIC,
  lot_size NUMERIC,
  description TEXT,
  seller_id TEXT,
  source TEXT DEFAULT 'scraped',
  source_url TEXT,
  source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  source_name TEXT,
  scraped_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  image_fetch_attempts NUMERIC DEFAULT 0,
  days_on_market NUMERIC,
  images JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT false,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dedup: unique on normalized address + zip
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_dedup
  ON properties (dedup_key) WHERE dedup_key IS NOT NULL;

-- Geohash proximity dedup
CREATE INDEX IF NOT EXISTS idx_properties_geohash
  ON properties (geohash) WHERE geohash IS NOT NULL;

-- Source URL for re-verification
CREATE INDEX IF NOT EXISTS idx_properties_source_url
  ON properties (source_url) WHERE source_url IS NOT NULL;

-- Status filter (marketplace queries)
CREATE INDEX IF NOT EXISTS idx_properties_status
  ON properties (status);

-- Sync tracking: updated_at index
CREATE INDEX IF NOT EXISTS idx_properties_updated
  ON properties (updated_at);

-- City/state lookups
CREATE INDEX IF NOT EXISTS idx_properties_location
  ON properties (state, city);

-- ============================================================
-- OWNERS — property owner records
-- ============================================================
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_type TEXT DEFAULT 'current',
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  relationship_to_property TEXT,
  acquired_date DATE,
  ownership_percentage NUMERIC,
  is_verified BOOLEAN DEFAULT false,
  source TEXT,
  outreach_status TEXT DEFAULT 'new',
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owners_property ON owners (property_id);

-- ============================================================
-- SCRAPE JOBS — per-run execution tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  source_name TEXT,
  status TEXT DEFAULT 'queued',
  properties_found NUMERIC DEFAULT 0,
  properties_new NUMERIC DEFAULT 0,
  properties_updated NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  scrape_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs (source_id);

-- ============================================================
-- PROPERTY SCORES — AI scoring results
-- ============================================================
CREATE TABLE IF NOT EXISTS property_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  overall_score NUMERIC,
  distress_severity TEXT,
  repair_cost_estimate NUMERIC,
  after_repair_value NUMERIC,
  estimated_roi NUMERIC,
  comparable_sales JSONB DEFAULT '[]',
  score_factors JSONB DEFAULT '{}',
  ai_analysis TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_property ON property_scores (property_id);

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'scraped',
  caption TEXT,
  source TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_property ON property_images (property_id);

-- ============================================================
-- TITLE RISKS
-- ============================================================
CREATE TABLE IF NOT EXISTS title_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  lien_total NUMERIC,
  mortgage_balance NUMERIC,
  has_judgments BOOLEAN,
  code_liens JSONB DEFAULT '[]',
  hoa_delinquent BOOLEAN,
  tax_delinquent BOOLEAN,
  risk_level TEXT,
  details TEXT,
  ai_analysis TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_title_risks_property ON title_risks (property_id);

-- ============================================================
-- OWNERSHIP CHAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS ownership_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  transfers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chains_property ON ownership_chains (property_id);

-- ============================================================
-- SYNC STATE — tracks Supabase → Base44 sync
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  last_synced_at TIMESTAMPTZ,
  last_property_count NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sync_state (id, last_synced_at, last_property_count)
VALUES ('default', NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_sources_updated ON data_sources;
CREATE TRIGGER trg_data_sources_updated BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_properties_updated ON properties;
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_owners_updated ON owners;
CREATE TRIGGER trg_owners_updated BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_chains_updated ON ownership_chains;
CREATE TRIGGER trg_chains_updated BEFORE UPDATE ON ownership_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — service_role bypasses; anon read-only
-- ============================================================
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Public read for properties, scores, images, title_risks, chains
-- (the Base44 frontend bridge uses service_role so these are a bonus)
CREATE POLICY "public_read_properties" ON properties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_scores" ON property_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_images" ON property_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_title_risks" ON title_risks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_chains" ON ownership_chains FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- SEED DATA — South Florida county sources
-- ============================================================
INSERT INTO data_sources (name, type, url, state, county, scrape_frequency, scrape_config, status) VALUES
('Miami-Dade County Foreclosures', 'foreclosure', 'https://www.miamidadeclerk.gov/cjc/Search/Search.aspx', 'FL', 'Miami-Dade', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Broward County Foreclosures', 'foreclosure', 'https://www.browardclerk.org/civil/family-foreclosures', 'FL', 'Broward', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Palm Beach County Foreclosures', 'foreclosure', 'https://www.mypalmbeachclerk.gov/eCaseView', 'FL', 'Palm Beach', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('St. Lucie County Foreclosures', 'foreclosure', 'https://www.slclerk.org/civil-court', 'FL', 'St. Lucie', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Martin County Foreclosures', 'foreclosure', 'https://www.martinclerk.com/civil', 'FL', 'Martin', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Indian River County Foreclosures', 'foreclosure', 'https://www.ircclick.com/civil', 'FL', 'Indian River', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Okeechobee County Foreclosures', 'foreclosure', 'https://www.okeechobeeclerk.com/civil', 'FL', 'Okeechobee', 'daily', '{"method":"browser","distress_type":"foreclosure","extract_selector":"table","parser":"generic"}', 'active'),
('Broward County Tax-Deed Sales', 'tax_records', 'https://www.broward.taxdeeds.com', 'FL', 'Broward', 'daily', '{"method":"browser","distress_type":"tax_delinquent","extract_selector":"table","parser":"generic"}', 'active'),
('Miami-Dade County Tax-Deed Sales', 'tax_records', 'https://www.miamidade.taxdeeds.com', 'FL', 'Miami-Dade', 'daily', '{"method":"browser","distress_type":"tax_delinquent","extract_selector":"table","parser":"generic"}', 'active'),
('Palm Beach County Tax-Deed Sales', 'tax_records', 'https://www.palmbeach.taxdeeds.com', 'FL', 'Palm Beach', 'daily', '{"method":"browser","distress_type":"tax_delinquent","extract_selector":"table","parser":"generic"}', 'active'),
('St. Lucie County Tax-Deed Sales', 'tax_records', 'https://www.stlucie.taxdeeds.com', 'FL', 'St. Lucie', 'daily', '{"method":"browser","distress_type":"tax_delinquent","extract_selector":"table","parser":"generic"}', 'active'),
('Broward County Code Violations', 'county_assessor', 'https://www.broward.org/CodeAppeals', 'FL', 'Broward', 'weekly', '{"method":"browser","distress_type":"code_violation","extract_selector":"table","parser":"generic"}', 'active'),
('Miami-Dade County Code Violations', 'county_assessor', 'https://www.miamidade.gov/csd/case_search.asp', 'FL', 'Miami-Dade', 'weekly', '{"method":"browser","distress_type":"code_violation","extract_selector":"table","parser":"generic"}', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================