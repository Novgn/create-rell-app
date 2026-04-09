import 'server-only';

// Server-only environment variables for {{projectName}} (web).
//
// Importing this module from a client component errors at build time
// thanks to the `server-only` guard above. That prevents accidental
// leaks of secret values into the browser bundle — exactly the bug that
// splitting env.ts into public + server files is designed to fix.
//
// Add every server-only secret here (Clerk secret key, webhook signing
// secrets, Supabase service role key, etc.). Browser-safe `NEXT_PUBLIC_*`
// values belong in `./env.ts`.

function requiredServer(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

export const serverEnv = {
  clerk: {
    secretKey: requiredServer('CLERK_SECRET_KEY'),
    // Signing secret for the Clerk Billing webhook (Story 3.2). The
    // webhook route is the only caller; splitting this out of the
    // browser-safe env prevents a browser-side module-load crash.
    billingWebhookSigningSecret: requiredServer('CLERK_BILLING_WEBHOOK_SIGNING_SECRET'),
  },
  database: {
    // Populated in Story 2.4 (Drizzle). Optional so the web app can boot
    // without a database during auth-only development. Returns `undefined`
    // rather than an empty string so downstream callers can explicit-check
    // and fail with a clearer message at the call site.
    url: process.env.DATABASE_URL,
  },
} as const;
