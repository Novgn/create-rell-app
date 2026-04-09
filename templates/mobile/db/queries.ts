// Typed query helpers for {{projectName}}.
//
// Every helper takes a `db` client as its first argument so callers can
// inject either the lazy singleton from `./client` or a request-scoped
// client. These helpers are Node-only — use the Supabase hook in
// `lib/supabase/client.ts` for React Native screens.

import { eq } from 'drizzle-orm';

import type { DbClient } from './client';
import { type NewUserRole, type Role, type UserRole, userRoles } from './schema';

/**
 * Fetch a user_roles row by Clerk user ID. Returns `null` if the user has
 * not yet been assigned a role (e.g. immediately after sign-up but before
 * a webhook upserts the default tier).
 */
export async function getUserRoleByClerkId(
  db: DbClient,
  clerkUserId: string,
): Promise<UserRole | null> {
  const rows = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Upsert a user's role. Used by the Clerk webhook handler when a user is
 * created (assign 'free') or after a billing event changes their tier.
 * Returns the resulting row so callers can confirm the mutation.
 */
export async function setUserRole(
  db: DbClient,
  clerkUserId: string,
  role: Role,
): Promise<UserRole> {
  const now = new Date();
  const values: NewUserRole = { clerkUserId, role, updatedAt: now };
  const rows = await db
    .insert(userRoles)
    .values(values)
    .onConflictDoUpdate({
      target: userRoles.clerkUserId,
      set: { role, updatedAt: now },
    })
    .returning();
  const result = rows[0];
  if (!result) {
    throw new Error(`setUserRole: upsert returned no rows for clerkUserId=${clerkUserId}`);
  }
  return result;
}
