-- {{projectName}} — RBAC helpers migration (Story 3.3)
--
-- Adds the SECURITY DEFINER helper function that lets RLS policies check
-- super_admin status WITHOUT triggering recursive policy lookups on the
-- same `user_roles` table. This is the idiomatic Supabase pattern for
-- self-referential RBAC.
--
-- Also adds the `select_user_roles_admin` policy that was deferred from
-- Story 2.4 (0000_initial.sql).

-- ============================================================================
-- is_super_admin() — SECURITY DEFINER helper
-- ============================================================================
-- `SECURITY DEFINER` means this function runs with the privileges of its
-- *owner* (the service role that created it), not the caller. Inside the
-- function body, RLS policies on `user_roles` do NOT apply — so the
-- function can SELECT from the same table it's about to be referenced by
-- without causing recursive policy evaluation.
--
-- IMPORTANT: Always use a fixed search_path in SECURITY DEFINER functions
-- to prevent search_path hijacking attacks. We set `search_path = public`
-- below so the function only ever reads the intended table.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE clerk_user_id = auth.jwt()->>'sub'
          AND role = 'super_admin'
    );
$$;

-- The helper must be callable by authenticated sessions. RLS policies
-- evaluate in the calling session's role, so this grant is required.
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ============================================================================
-- Policy: select_user_roles_admin (deferred from Story 2.4)
-- ============================================================================
-- super_admin god-mode: users with role='super_admin' can read every row
-- in `user_roles`. The policy delegates the check to the SECURITY DEFINER
-- helper above, which avoids recursive policy lookups.
--
-- This policy is ADDED to the existing `select_user_roles_own` policy from
-- 0000_initial.sql; RLS evaluates every SELECT policy and grants access
-- if any one of them passes. Result: admins see every row, regular users
-- see only their own.
CREATE POLICY "select_user_roles_admin"
    ON "user_roles"
    FOR SELECT
    TO authenticated
    USING (public.is_super_admin());
