// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Runtime environment variable validation for {{projectName}} (mobile).
//
// Expo uses the `EXPO_PUBLIC_` prefix for values that are safe to ship to
// the compiled JS bundle. Anything secret must stay on the server (e.g. via
// Clerk's secret key in the web backend) — do not put secrets in the
// mobile .env, they will be extractable from the bundled app.

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env at the mobile root and fill in the value.`,
    );
  }
  return value;
}

export const env = {
  clerk: {
    publishableKey: required('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  },
  supabase: {
    url: required('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },
} as const;
