// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Protected dashboard layout. Middleware already redirects unauthenticated
// users to /sign-in, but this `auth()` check is a defense-in-depth
// belt-and-suspenders — middleware could be bypassed during dev-mode
// hot-reload or misconfiguration, and layout-level enforcement catches it.
//
// Semantic structure (Story 4.3): uses <header>/<nav>/<main> for a11y and
// adds `aria-label`s so assistive tech can distinguish the regions. Tailwind
// utility classes handle the visual styling.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">
            {{projectName}}
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Home
            </Link>
            <Link href="/dashboard/settings" className="hover:underline">
              Settings
            </Link>
            <Link href="/dashboard/billing" className="hover:underline">
              Billing
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>
      <main aria-label="Dashboard content" className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
