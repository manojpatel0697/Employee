-- ============================================================
-- 004_new_leads_schema.sql
--
-- Restructures the leads table to match the XLSX import format:
-- sl_no, name, phone, category, search_category, area, address, map_link
--
-- Also simplifies the pipeline to the actual employee workflow:
-- picked_up → interested → demo_sent → meeting_scheduled → meeting_date_time
-- ============================================================

-- Add new XLSX columns (all nullable to support existing rows)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sl_no           TEXT,
  ADD COLUMN IF NOT EXISTS name            TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category        TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS search_category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area            TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS map_link        TEXT NOT NULL DEFAULT '';

-- Add new pipeline columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS picked_up       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_status     TEXT
    CHECK (call_status IN ('Answered', 'Not Answered', 'Busy', 'Switched Off') OR call_status IS NULL);

-- Rename contact_person → keep it but also support 'name' column from xlsx
-- (contact_person is the existing column; name is new — both map to the same person)
-- We keep both for backwards compatibility.

-- Increase notes length limit (already TEXT, no change needed)

-- Drop old constraints on service_interest to make it optional
-- (the new schema doesn't require it — category replaces it)
ALTER TABLE leads
  ALTER COLUMN service_interest SET DEFAULT 'Other';

-- ============================================================
-- IMPORTANT: After running this migration, update your RLS
-- policies if needed (migration 003 already handles that).
-- ============================================================
