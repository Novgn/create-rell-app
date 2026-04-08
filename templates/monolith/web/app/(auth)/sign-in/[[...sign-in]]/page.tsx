import { SignIn } from '@clerk/nextjs';

// Clerk's <SignIn /> component uses a catch-all route so it can render the
// OAuth callback, email verification, 2FA, and other nested flows at the
// same URL segment. The double-bracketed [[...sign-in]] segment is the
// Next.js convention for optional catch-alls.
export default function SignInPage() {
  return (
    <main>
      <SignIn />
    </main>
  );
}
