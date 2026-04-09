// Mobile RoleGate component for {{projectName}}.
//
// Same shape as the web version — wraps children and conditionally
// renders them based on the current user's RBAC role. The mobile
// useRole() hook queries Supabase directly via Clerk 3P auth (see
// mobile/lib/auth/use-role.ts).
//
// UX only. Database-layer RLS is the real security boundary.

import type { ReactNode } from 'react';

import type { Role } from '../../db/schema';
import { useRole } from '../../lib/auth/use-role';
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

  if (isLoading) return null;

  const effectiveRole: Role = role ?? 'free';

  if (hasRequiredRole(effectiveRole, requiredRole)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <PaywallPrompt />}</>;
}
