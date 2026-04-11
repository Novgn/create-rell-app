// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Runtime environment variable validation for {{projectName}} (mobile).
//
// Expo uses the `EXPO_PUBLIC_` prefix for values that are safe to ship to
// the compiled JS bundle. Anything secret must stay on the server (e.g. via
// Clerk's secret key in the web backend) — do not put secrets in the
// mobile .env, they will be extractable from the bundled app.
//
// Validation strategy: a single Zod schema is parsed once at module load.
// Missing or invalid values produce ONE error listing every problem, which
// is far friendlier than a hand-rolled validator that throws on the first
// missing key.

import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function parse() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid mobile environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env at the mobile root and fill in the missing values.`,
    );
  }
  return result.data;
}

const parsed = parse();

export const env = {
  clerk: {
    publishableKey: parsed.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  supabase: {
    url: parsed.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: parsed.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
} as const;
