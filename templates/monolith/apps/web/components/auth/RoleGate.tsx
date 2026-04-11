// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
'use client';

// RoleGate component for {{projectName}}.
//
// Client-side UI gate that renders `children` only when the signed-in
// user's role meets the `requiredRole` threshold. When it doesn't, the
// optional `fallback` is rendered, defaulting to `<PaywallPrompt />`.
//
// IMPORTANT: this is UX only. Actual data access is gated by Supabase
// RLS policies at the database layer. A user who bypasses this component
// still can't read rows they don't have a claim on.
//
// Role hierarchy:
//   super_admin > paid > free
// `requiredRole="paid"` renders for 'paid' and 'super_admin' users, not
// for 'free'. `requiredRole="free"` always renders (everyone has >= free).

import type { ReactNode } from 'react';

import type { Role } from '@{{projectNameKebab}}/shared';
import { useRole } from '@/lib/auth/use-role';
import { PaywallPrompt } from './PaywallPrompt';

const HIERARCHY: readonly Role[] = ['free', 'paid', 'super_admin'];

export function hasRequiredRole(current: Role, required: Role): boolean {
  return HIERARCHY.indexOf(current) >= HIERARCHY.indexOf(required);
}

export interface RoleGateProps {
  requiredRole: Role;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ requiredRole, children, fallback }: RoleGateProps) {
  const { role, isLoading } = useRole();

  // Don't flash paid content while the role is resolving. Story 4.3
  // replaces this with a skeleton loader.
  if (isLoading) return null;

  // Not signed in — treat as 'free' so fallback renders.
  const effectiveRole: Role = role ?? 'free';

  if (hasRequiredRole(effectiveRole, requiredRole)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <PaywallPrompt />}</>;
}
