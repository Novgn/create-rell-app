import 'server-only';
import { z } from 'zod';

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
//
// Validation strategy: a single Zod schema is parsed once at module load.
// Missing or invalid values produce ONE error listing every problem, which
// is far friendlier than a hand-rolled validator that throws on the first
// missing key.
//
// DATABASE_URL is intentionally optional so the web app can boot without
// a database during auth-only development. The schema normalises empty
// strings to `undefined` so downstream callers can explicit-check and
// fail with a clearer message at the call site.

const schema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  // Signing secret for the Clerk Billing webhook (Story 3.2). The
  // webhook route is the only caller; splitting this out of the
  // browser-safe env prevents a browser-side module-load crash.
  CLERK_BILLING_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  // Populated in Story 2.4 (Drizzle). Optional for auth-only dev; empty
  // strings are coerced to `undefined` for cleaner downstream checks.
  DATABASE_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

function parse() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid server-side environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the missing values.`,
    );
  }
  return result.data;
}

const parsed = parse();

export const serverEnv = {
  clerk: {
    secretKey: parsed.CLERK_SECRET_KEY,
    billingWebhookSigningSecret: parsed.CLERK_BILLING_WEBHOOK_SIGNING_SECRET,
  },
  database: {
    url: parsed.DATABASE_URL,
  },
} as const;
