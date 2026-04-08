// Runtime environment variable validation for {{projectName}} (web).
//
// Importing this module asserts that every required key is present at
// startup — fail fast during `next build` or `next dev` instead of
// silently producing a broken runtime.
//
// Add a new key here whenever you add one to `.env.example`. Keep the two
// in sync or deploys will surprise you.

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

export const env = {
  clerk: {
    publishableKey: required('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    // Secret key is only read on the server — never expose to the client.
    secretKey: required('CLERK_SECRET_KEY'),
    // Signing secret for the Clerk Billing webhook (Story 3.2). Only the
    // webhook route reads this; other paths do not need it — but fail fast
    // at module load so a missing value is obvious.
    billingWebhookSigningSecret: required('CLERK_BILLING_WEBHOOK_SIGNING_SECRET'),
  },
  supabase: {
    url: required('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  },
  database: {
    // Populated in Story 2.4 (Drizzle). Optional for Story 2.2 so the web
    // app can boot without a database during auth-only development.
    // Returns `undefined` rather than an empty string so downstream callers
    // can explicit-check and fail with a clearer message at the call site.
    url: process.env.DATABASE_URL,
  },
} as const;
