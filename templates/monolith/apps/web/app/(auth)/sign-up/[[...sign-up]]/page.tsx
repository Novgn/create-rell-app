import { SignUp } from '@clerk/nextjs';

// Counterpart to the sign-in page. Clerk's <SignUp /> handles email
// verification, password strength, and OAuth social providers out of the
// box. Customize appearance via the `appearance` prop or a theme.
export default function SignUpPage() {
  return (
    <main>
      <SignUp />
    </main>
  );
}
