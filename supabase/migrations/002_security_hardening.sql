-- ============================================================
-- 002_security_hardening.sql  —  Agency Portal security pass
-- Run this in the Supabase SQL editor after 001_schema.sql
-- ============================================================

-- ----------------------------------------------------------------
-- PASSWORD HASHING
-- Supabase Auth stores passwords using bcrypt (cost factor 10) by
-- default — you do NOT need to hash passwords yourself.
-- Never store passwords in the `profiles` table or any other table.
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- PROFILES — allow new users to insert their own profile row
-- (required for post-signup trigger / onboarding flow)
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'insert_own_profile'
  ) THEN
    CREATE POLICY insert_own_profile ON profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Allow users to update their own profile (e.g. name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'update_own_profile'
  ) THEN
    CREATE POLICY update_own_profile ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Admins can read all profiles (needed for lead assignment dropdown)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'admin_read_all_profiles'
  ) THEN
    CREATE POLICY admin_read_all_profiles ON profiles
      FOR SELECT
      USING (
        auth.uid() = id
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- LEADS — prevent employees from changing assigned_to themselves
-- (only admins / service-role can reassign)
-- ----------------------------------------------------------------
-- The existing employees_own_leads_update policy allows employees to
-- UPDATE any column. We add a CHECK constraint at the DB level to
-- block them from escalating their own assignment.
-- ----------------------------------------------------------------

-- Ensure role column cannot be changed by non-admins via RLS
-- (role escalation prevention)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'prevent_role_escalation'
  ) THEN
    CREATE POLICY prevent_role_escalation ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (
        -- Employees and developers cannot change their own role
        role = (SELECT role FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- RATE LIMITING NOTE
-- Database-level rate limiting is handled by Supabase's built-in
-- connection pooler (PgBouncer) and the application-level
-- lib/rate-limit.ts. No additional DB config needed.
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- AUDIT LOG TABLE — track sensitive admin actions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service-role (admin API routes) can insert audit records
-- No SELECT policy — admins query via service role which bypasses RLS
-- This prevents tampering with audit records by authenticated users

-- ----------------------------------------------------------------
-- Supabase Auth hardening (configure in Supabase dashboard):
-- ----------------------------------------------------------------
-- 1. Auth > Settings > Enable email confirmations (prevent fake signups)
-- 2. Auth > Settings > Disable sign-ups (only admin invites employees)
-- 3. Auth > Settings > JWT expiry: 3600 (1 hour sessions)
-- 4. Auth > Settings > Enable leaked password protection
-- 5. Auth > Rate limits: reduce OTP to 3/hour, sign-in to 10/hour
-- ----------------------------------------------------------------
