// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Client-side role hook for {{projectName}} (mobile).
//
// Unlike the web counterpart, mobile queries the Supabase `user_roles`
// table directly via the Clerk-authenticated Supabase client. No web
// backend dependency — the mobile app can run against the same Supabase
// instance without needing a paired Next.js host.
//
// The RLS policy `select_user_roles_own` (see shared/db/migrations/)
// allows the signed-in user to read their own row; super_admin users
// can read every row via `select_user_roles_admin`. Either way, the
// returned role is authoritative.

import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

import type { Role } from '@{{projectNameKebab}}/shared';
import { useSupabaseClient } from '../supabase/client';

export interface UseRoleResult {
  role: Role | null;
  isLoading: boolean;
}

// Module-level cache so concurrent <RoleGate> mounts share a single fetch.
// Expo does not ship React's cache() helper, but the module-level memo
// pattern achieves the same dedupe semantics across component instances.
// Cleared on sign-out by Clerk's auth state transition in the effect below.
let cachedRole: Role | null = null;
let inFlight: Promise<Role> | null = null;

type SupabaseClient = ReturnType<typeof useSupabaseClient>;

function fetchRole(supabase: SupabaseClient, userId: string): Promise<Role> {
  if (cachedRole !== null) return Promise.resolve(cachedRole);
  if (inFlight) return inFlight;
  inFlight = supabase
    .from('user_roles')
    .select('role')
    .eq('clerk_user_id', userId)
    .maybeSingle()
    .then(({ data, error }: { data: { role: Role } | null; error: unknown }) => {
      if (error) throw error;
      const next: Role = data?.role ?? 'free';
      cachedRole = next;
      return next;
    })
    .finally(() => {
      inFlight = null;
    }) as Promise<Role>;
  return inFlight;
}

export function useRole(): UseRoleResult {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  const [role, setRoleState] = useState<Role | null>(cachedRole);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || userId == null) {
      cachedRole = null;
      setRoleState(null);
      return;
    }
    let cancelled = false;
    fetchRole(supabase, userId)
      .then((r) => {
        if (!cancelled) setRoleState(r);
      })
      .catch((err) => {
        console.error('[useRole] failed to fetch role:', err);
        if (!cancelled) setRoleState('free');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, supabase]);

  if (!isLoaded) return { role: null, isLoading: true };
  if (!isSignedIn) return { role: null, isLoading: false };
  return { role, isLoading: role === null };
}
