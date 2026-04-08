import { auth } from '@clerk/nextjs/server';

// Protected dashboard landing page. Guaranteed to run only for authenticated
// users because (a) middleware redirects unauth'd requests and (b) the
// layout above double-checks `auth()` before rendering children.
export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <section>
      <h1>Welcome back</h1>
      <p>Signed in as Clerk user: {userId}</p>
      <p>Billing, RBAC, and data features land in Epic 3 and beyond.</p>
    </section>
  );
}
