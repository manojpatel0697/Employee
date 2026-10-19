-- ============================================================
-- 001_schema.sql  —  Agency Portal initial schema
-- ============================================================

-- ----------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'employee'
               CHECK (role IN ('admin', 'employee', 'developer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Each user can read their own profile
CREATE POLICY read_own_profile ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- LEADS
-- ----------------------------------------------------------------
CREATE TABLE leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name           TEXT NOT NULL DEFAULT '',
  contact_person         TEXT NOT NULL DEFAULT '',
  phone                  TEXT NOT NULL DEFAULT '',
  email                  TEXT NOT NULL DEFAULT '',
  source                 TEXT NOT NULL DEFAULT '',
  assigned_to            UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Pipeline fields
  status                 TEXT NOT NULL DEFAULT 'New'
                           CHECK (status IN (
                             'New', 'Contacted', 'Demo Sent',
                             'Meeting Scheduled', 'Site Visit Requested',
                             'Converted', 'Dropped'
                           )),
  service_interest       TEXT NOT NULL DEFAULT 'Other'
                           CHECK (service_interest IN ('Camera', 'Web', 'Both', 'Other')),
  is_interested          BOOLEAN,
  demo_website_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  demo_liked             BOOLEAN,
  meeting_scheduled      BOOLEAN NOT NULL DEFAULT FALSE,
  meeting_type           TEXT
                           CHECK (meeting_type IN ('Google Meet', 'Onsite') OR meeting_type IS NULL),
  meeting_date_time      TIMESTAMPTZ,
  site_visit_requested   BOOLEAN NOT NULL DEFAULT FALSE,
  notes                  TEXT NOT NULL DEFAULT '',

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Employees can SELECT and UPDATE only their assigned leads
CREATE POLICY employees_own_leads ON leads
  FOR ALL
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- PROJECTS_PRD
-- ----------------------------------------------------------------
CREATE TABLE projects_prd (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name                 TEXT NOT NULL DEFAULT '',
  client_email                TEXT NOT NULL DEFAULT '',
  prd_content                 TEXT NOT NULL DEFAULT '',
  lovable_generation_status   TEXT NOT NULL DEFAULT 'Pending Email Intake'
                                CHECK (lovable_generation_status IN (
                                  'Pending Email Intake',
                                  'Generated via Lovable',
                                  'In Development',
                                  'Review',
                                  'Completed'
                                )),
  development_status          TEXT NOT NULL DEFAULT 'Not Started'
                                CHECK (development_status IN (
                                  'Not Started',
                                  'Frontend Built',
                                  'Backend & DB Hooked',
                                  'Deployed',
                                  'Live'
                                )),
  current_blocker             TEXT,
  assigned_developer_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects_prd ENABLE ROW LEVEL SECURITY;

-- Developers (and admins) can read PRD rows
CREATE POLICY developers_read_prd ON projects_prd
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_prd_updated_at
  BEFORE UPDATE ON projects_prd
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
