// Client-side role hook for {{projectName}} (mobile).
//
// Unlike the web counterpart, mobile queries the Supabase `user_roles`
// table directly via the Clerk-authenticated Supabase client. No web
// backend dependency — the mobile app can run against the same Supabase
// instance without needing a paired Next.js host.
//
// The RLS policy `select_user_roles_own` (see db/migrations/)
// allows the signed-in user to read their own row; super_admin users
// can read every row via `select_user_roles_admin`. Either way, the
// returned role is authoritative.

import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';

import type { Role } from '../../db/schema';
import { useSupabaseClient } from '../supabase/client';

export interface UseRoleResult {
  role: Role | null;
  isLoading: boolean;
}

export function useRole(): UseRoleResult {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const supabase = useSupabaseClient();
  const [fetchedRole, setFetchedRole] = useState<Role | null>(null);

  const shouldFetch = isLoaded === true && isSignedIn === true && userId != null;

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;

    supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', userId)
      .maybeSingle()
      .then(({ data, error }: { data: { role: Role } | null; error: unknown }) => {
        if (cancelled) return;
        if (error) {
          console.error('[useRole] failed to fetch role:', error);
          setFetchedRole('free');
        } else {
          setFetchedRole(data?.role ?? 'free');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, userId, supabase]);

  if (!isLoaded) return { role: null, isLoading: true };
  if (!isSignedIn) return { role: null, isLoading: false };
  return { role: fetchedRole, isLoading: fetchedRole === null };
}
