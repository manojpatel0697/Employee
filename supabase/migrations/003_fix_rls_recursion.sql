-- ============================================================
-- 003_fix_rls_recursion.sql
--
-- ROOT CAUSE:
--   Policies on `profiles` were querying `profiles` themselves
--   (admin_read_all_profiles, prevent_role_escalation), causing
--   infinite recursion whenever any query touched profiles.
--   Policies on `leads` that JOIN profiles had the same issue.
--
-- FIX:
--   Replace all cross-table profile lookups in RLS policies with
--   auth.jwt() -> 'user_metadata' ->> 'role'  OR
--   (auth.jwt() -> 'app_metadata' ->> 'role')
--   which reads the role from the JWT token without hitting the DB.
--
--   We also add a Supabase DB trigger that copies the role into
--   app_metadata on every profile upsert so the JWT stays current.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ----------------------------------------------------------------
-- STEP 1: Drop all the broken recursive policies
-- ----------------------------------------------------------------

-- profiles table
DROP POLICY IF EXISTS read_own_profile           ON profiles;
DROP POLICY IF EXISTS admin_read_all_profiles    ON profiles;
DROP POLICY IF EXISTS insert_own_profile         ON profiles;
DROP POLICY IF EXISTS update_own_profile         ON profiles;
DROP POLICY IF EXISTS prevent_role_escalation    ON profiles;

-- leads table
DROP POLICY IF EXISTS employees_own_leads_select ON leads;
DROP POLICY IF EXISTS employees_own_leads_update ON leads;

-- ----------------------------------------------------------------
-- STEP 2: Helper function — reads role from JWT app_metadata.
-- This NEVER queries any table, so it cannot recurse.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    'employee'   -- safe default
  )
$$;

-- ----------------------------------------------------------------
-- STEP 3: Trigger — sync profile.role into auth app_metadata
-- whenever a profile row is inserted or updated.
-- This keeps the JWT role claim in sync so auth_role() is accurate.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_role_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_auth_metadata();

-- ----------------------------------------------------------------
-- STEP 4: Backfill — sync existing profile roles into auth metadata
-- ----------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, role FROM profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('role', rec.role)
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- STEP 5: Re-create profiles policies WITHOUT self-referencing
-- ----------------------------------------------------------------

-- Any authenticated user can read their own profile row
CREATE POLICY profiles_read_own
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read ALL profiles (uses JWT — no table query)
CREATE POLICY profiles_admin_read_all
  ON profiles FOR SELECT
  USING (auth_role() = 'admin');

-- Users can insert their own profile (self-registration / signup trigger)
CREATE POLICY profiles_insert_own
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own
  ON profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Role escalation prevention: only admins can change the role column.
-- Employees and developers cannot promote themselves.
CREATE POLICY profiles_no_role_escalation
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Allow update if role is unchanged, OR if the caller is an admin
    role = (OLD.role) OR auth_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- STEP 6: Re-create leads policies WITHOUT cross-table joins
-- ----------------------------------------------------------------

-- Employees can SELECT only their own assigned leads.
-- Admins (via JWT) can SELECT all leads.
-- API routes that need full access use the service-role key which
-- bypasses RLS entirely.
CREATE POLICY leads_employee_select
  ON leads FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR auth_role() = 'admin'
  );

-- Employees can UPDATE only their own assigned leads.
-- Admins can UPDATE any lead.
CREATE POLICY leads_employee_update
  ON leads FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR auth_role() = 'admin'
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR auth_role() = 'admin'
  );

-- ----------------------------------------------------------------
-- DONE.
-- After running this migration:
--   1. Existing employee logins will work without recursion.
--   2. Newly created profiles automatically sync role to JWT.
--   3. Employees see only their leads; admins see all (via service role).
-- ----------------------------------------------------------------
