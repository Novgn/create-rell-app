'use client';

import { useEffect } from 'react';

// Next.js App Router error boundary. Runs on the client; a new instance is
// mounted on every route error so state from the crashed page is discarded.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Integrate with your error reporter here (Sentry, etc.).
    console.error('[app error]', error);
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
