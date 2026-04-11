'use client';

// Client-side role hook for {{projectName}} (web).
//
// `useRole()` fetches the current user's RBAC role from `/api/me/role`
// and returns it alongside a loading flag. This is for UI gating only:
// the RoleGate and PaywallPrompt components (Story 3.4) use it to decide
// whether to render content.
//
// Client-side role checks are NEVER a security boundary. Authoritative
// RBAC is enforced by server components (`roles.ts`), route handlers,
// and Supabase RLS. The value returned here may be up to a few seconds
// stale (e.g. immediately after an upgrade webhook fires).

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import type { Role } from '@{{projectNameKebab}}/shared';

export interface UseRoleResult {
  role: Role | null;
  isLoading: boolean;
}

export function useRole(): UseRoleResult {
  const { isSignedIn, isLoaded } = useAuth();
  const [fetchedRole, setFetchedRole] = useState<Role | null>(null);

  const shouldFetch = isLoaded === true && isSignedIn === true;

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;

    fetch('/api/me/role')
      .then((res) => {
        if (!res.ok) throw new Error(`/api/me/role returned ${res.status}`);
        return res.json() as Promise<{ role: Role }>;
      })
      .then((data) => {
        if (!cancelled) setFetchedRole(data.role);
      })
      .catch((err) => {
        console.error('[useRole] failed to fetch role:', err);
        if (!cancelled) setFetchedRole('free');
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch]);

  if (!isLoaded) return { role: null, isLoading: true };
  if (!isSignedIn) return { role: null, isLoading: false };
  return { role: fetchedRole, isLoading: fetchedRole === null };
}
