import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

// Protected dashboard layout. Middleware already redirects unauthenticated
// users to /sign-in, but this `auth()` check is a defense-in-depth
// belt-and-suspenders — middleware could be bypassed during dev-mode
// hot-reload or misconfiguration, and layout-level enforcement catches it.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div>
      <header>
        <h2>{{projectName}} Dashboard</h2>
        <UserButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
