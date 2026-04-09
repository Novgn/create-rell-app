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
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', userId)
      .maybeSingle()
      .then(({ data, error }: { data: { role: Role } | null; error: unknown }) => {
        if (cancelled) return;
        if (error) {
          console.error('[useRole] failed to fetch role:', error);
          setRole('free');
        } else {
          setRole(data?.role ?? 'free');
        }
      })
      .then(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded, userId, supabase]);

  return { role, isLoading };
}
