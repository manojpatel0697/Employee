-- ============================================================
-- 003_fix_rls_recursion.sql
--
-- ROOT CAUSE:
--   Policies on `profiles` were querying `profiles` themselves,
--   causing infinite recursion whenever any query touched profiles.
--   Policies on `leads` that sub-queried profiles had the same issue.
--
-- FIX:
--   1. Drop all broken recursive policies.
--   2. Create auth_role() helper that reads role from JWT — never
--      touches any table, so it cannot recurse.
--   3. Add a trigger to sync profile.role into auth app_metadata
--      so the JWT role stays current.
--   4. Re-create all policies using auth_role() instead of sub-queries.
--
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================

-- ----------------------------------------------------------------
-- STEP 1: Drop all broken recursive policies
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS read_own_profile            ON profiles;
DROP POLICY IF EXISTS admin_read_all_profiles     ON profiles;
DROP POLICY IF EXISTS insert_own_profile          ON profiles;
DROP POLICY IF EXISTS update_own_profile          ON profiles;
DROP POLICY IF EXISTS prevent_role_escalation     ON profiles;
DROP POLICY IF EXISTS profiles_read_own           ON profiles;
DROP POLICY IF EXISTS profiles_admin_read_all     ON profiles;
DROP POLICY IF EXISTS profiles_insert_own         ON profiles;
DROP POLICY IF EXISTS profiles_update_own         ON profiles;
DROP POLICY IF EXISTS profiles_no_role_escalation ON profiles;

DROP POLICY IF EXISTS employees_own_leads_select  ON leads;
DROP POLICY IF EXISTS employees_own_leads_update  ON leads;
DROP POLICY IF EXISTS leads_employee_select       ON leads;
DROP POLICY IF EXISTS leads_employee_update       ON leads;

-- ----------------------------------------------------------------
-- STEP 2: Helper function — reads role from JWT app_metadata.
-- Never queries any table, so it cannot cause recursion.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    'employee'
  )
$$;

-- ----------------------------------------------------------------
-- STEP 3: Trigger to sync profile.role into auth app_metadata
-- whenever a profile row is inserted or updated.
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
-- STEP 5: Re-create profiles RLS policies (no self-referencing)
-- ----------------------------------------------------------------

-- Any authenticated user can read their own profile row
CREATE POLICY profiles_read_own
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read ALL profiles (reads JWT — no table query)
CREATE POLICY profiles_admin_read_all
  ON profiles FOR SELECT
  USING (auth_role() = 'admin');

-- Users can insert their own profile row (signup flow)
CREATE POLICY profiles_insert_own
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (name etc.)
-- Role changes are blocked at the API layer (requires service-role key).
CREATE POLICY profiles_update_own
  ON profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- STEP 6: Re-create leads RLS policies (no cross-table joins)
-- ----------------------------------------------------------------

-- Employees see only their own assigned leads.
-- Admins see all leads (JWT check — no table query).
-- Admin API routes use service-role key which bypasses RLS entirely.
CREATE POLICY leads_employee_select
  ON leads FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR auth_role() = 'admin'
  );

-- Employees can update only their own leads.
-- Admins can update any lead.
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
-- Done. After running this script:
--   • Employee dashboard loads without recursion errors.
--   • Employees see only their assigned leads.
--   • Admins (via service-role API) see all leads.
--   • New profile inserts automatically sync role to JWT.
-- ----------------------------------------------------------------
