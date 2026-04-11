// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>{{projectName}}</h1>
      <p>
        Welcome to your scaffolded Next.js app. Sign in to continue, or edit{' '}
        <code>app/page.tsx</code> to customize this landing page.
      </p>
      <p>
        <Link href="/sign-in">Sign in</Link> &middot; <Link href="/sign-up">Create account</Link>
      </p>
    </main>
  );
}
