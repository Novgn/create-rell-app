import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

import { OnboardingGreeting } from '@/components/shared/OnboardingGreeting';

// Protected dashboard landing page. Guaranteed to run only for authenticated
// users because (a) middleware redirects unauth'd requests and (b) the
// layout above double-checks `auth()` before rendering children.
//
// `OnboardingGreeting` is a small client component that reads
// `onboardingComplete` from the Zustand store added in Story 4.1. It lives in
// a separate file so this page can stay a Server Component (Clerk's `auth()`
// helper is server-only).
export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <section>
      <h1>Welcome back</h1>
      <p>Signed in as Clerk user: {userId}</p>
      <OnboardingGreeting />
      <p>
        <Link href="/dashboard/billing">Manage billing</Link>
      </p>
    </section>
  );
}
