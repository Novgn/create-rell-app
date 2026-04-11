import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getCurrentUserWithRole } from '@/lib/auth/current-user';

// GET /api/me/role — returns the currently signed-in user's RBAC role.
//
// The client-side `useRole()` hook calls this to decide whether to render
// paid/admin UI. Server components should read roles directly via
// `getCurrentUserWithRole()` instead — this endpoint is only for code
// that already has a client-side render path (e.g. a `<RoleGate />`).
//
// Authoritative RBAC lives at the database layer. A client that fakes a
// 'paid' response from this endpoint still can't read paid data because
// Supabase RLS policies enforce the real role.
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const current = await getCurrentUserWithRole();
  return NextResponse.json({ role: current?.role ?? 'free' });
}
