// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
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

// Module-level cache so concurrent <RoleGate> mounts share a single fetch.
// Cleared on sign-out by Clerk's auth state transition in the effect below.
let cachedRole: Role | null = null;
let inFlight: Promise<Role> | null = null;

async function fetchRole(): Promise<Role> {
  if (cachedRole !== null) return cachedRole;
  if (inFlight) return inFlight;
  inFlight = fetch('/api/me/role')
    .then((res) => {
      if (!res.ok) throw new Error(`/api/me/role returned ${res.status}`);
      return res.json() as Promise<{ role: Role }>;
    })
    .then((data) => {
      cachedRole = data.role;
      return data.role;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function useRole(): UseRoleResult {
  const { isSignedIn, isLoaded } = useAuth();
  const [role, setRole] = useState<Role | null>(cachedRole);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      // Clear the module-level cache so the next sign-in refetches from
      // scratch. We deliberately do NOT call `setRole(null)` here — the
      // render logic below already gates on `isSignedIn`, and calling
      // setState synchronously inside an effect trips
      // react-hooks/set-state-in-effect. The stale `role` state becomes
      // unreachable as soon as `isSignedIn` flips to false.
      cachedRole = null;
      return;
    }
    let cancelled = false;
    fetchRole()
      .then((r) => {
        if (!cancelled) setRole(r);
      })
      .catch((err) => {
        console.error('[useRole] failed to fetch role:', err);
        if (!cancelled) setRole('free');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return { role: null, isLoading: true };
  if (!isSignedIn) return { role: null, isLoading: false };
  return { role, isLoading: role === null };
}
