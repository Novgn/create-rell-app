// Browser-safe environment variables for {{projectName}} (web).
//
// This module is imported by BOTH client and server components. It may
// only reference `NEXT_PUBLIC_*` variables — Next.js statically replaces
// those at build time, so they're accessible in the browser bundle.
//
// Server-only secrets live in `./env-server.ts`, which imports `'server-only'`
// and throws if bundled into the browser. When you add a new secret, put
// it there — NOT here.
//
// Validation strategy: a single Zod schema is parsed once at module load.
// Missing or invalid values produce ONE error listing every problem, which
// is far friendlier than a hand-rolled validator that throws on the first
// missing key.

import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function parse() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid public environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the missing values.`,
    );
  }
  return result.data;
}

const parsed = parse();

export const env = {
  clerk: {
    publishableKey: parsed.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  supabase: {
    url: parsed.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
} as const;
