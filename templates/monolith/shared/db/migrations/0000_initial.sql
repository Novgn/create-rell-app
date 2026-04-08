-- {{projectName}} — initial database migration
--
-- Creates the `user_roles` table and enables Row-Level Security using the
-- Clerk user ID embedded in Supabase's third-party auth JWT. This
-- migration is generated as a template and committed to the repo so devs
-- can review it before running `pnpm db:migrate` (or equivalent).
--
-- CRITICAL: RLS policies reference `auth.jwt()->>'sub'` to match the
-- Clerk user ID. Do NOT use the deprecated JWT-template pattern (passing
-- a template name to Clerk's getToken call) — that integration path was
-- phased out in April 2025.

-- pgcrypto provides `gen_random_uuid()` used for the primary key default.
-- Supabase enables this by default; self-hosted Postgres deployments may
-- need this explicit enable.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: user_roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "clerk_user_id" text NOT NULL UNIQUE,
    "role" text NOT NULL DEFAULT 'free',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "user_roles_role_check" CHECK ("role" IN ('super_admin', 'paid', 'free'))
);

CREATE INDEX IF NOT EXISTS "idx_user_roles_clerk_user_id" ON "user_roles" ("clerk_user_id");

-- ============================================================================
-- Row-Level Security
-- ============================================================================
-- RLS is a MUST for this table because it stores access-control data.
-- Without RLS enabled, the `CREATE POLICY` statements below have no
-- effect and every authenticated request gets full access.
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policy: select_user_roles_own
--
-- Authenticated users can read their own role row. The `auth.jwt()->>'sub'`
-- expression extracts the Clerk user ID from the JWT that Clerk's native
-- third-party auth integration supplied to Supabase.
-- ----------------------------------------------------------------------------
CREATE POLICY "select_user_roles_own"
    ON "user_roles"
    FOR SELECT
    TO authenticated
    USING (auth.jwt()->>'sub' = "clerk_user_id");

-- ----------------------------------------------------------------------------
-- Policy: select_user_roles_admin
--
-- super_admin god-mode: users with role='super_admin' can read every row.
-- The nested SELECT checks the caller's row and unwraps its role. RLS
-- evaluates this policy in addition to `select_user_roles_own`, so an
-- admin sees everything while regular users still see only their row.
-- ----------------------------------------------------------------------------
CREATE POLICY "select_user_roles_admin"
    ON "user_roles"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "user_roles" AS admin
            WHERE admin.clerk_user_id = auth.jwt()->>'sub'
              AND admin.role = 'super_admin'
        )
    );

-- ----------------------------------------------------------------------------
-- Policy: insert_user_roles_service
--
-- Regular users cannot insert into user_roles — role assignment happens
-- through the billing webhook (Story 3.2) which runs as the service role
-- and bypasses RLS. This policy intentionally evaluates to false so no
-- authenticated client session can self-promote.
-- ----------------------------------------------------------------------------
CREATE POLICY "insert_user_roles_service"
    ON "user_roles"
    FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- Policy: update_user_roles_service
--
-- Same rationale as insert_user_roles_service — only the service role can
-- mutate user_roles. The authenticated client session cannot.
-- ----------------------------------------------------------------------------
CREATE POLICY "update_user_roles_service"
    ON "user_roles"
    FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);
