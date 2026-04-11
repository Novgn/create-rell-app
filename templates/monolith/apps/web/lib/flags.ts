// Feature flag abstraction for {{projectName}}.
//
// Defaults to reading `NEXT_PUBLIC_FLAG_<NAME>` or `FLAG_<NAME>` from the
// environment. Swap this out for @vercel/flags, GrowthBook, LaunchDarkly,
// or any other provider — the `flag(name)` signature stays stable and
// call sites don't need to change.

const TRUTHY = new Set(['1', 'true', 'on', 'yes', 'enabled']);

export function flag(name: string, defaultValue = false): boolean {
  const raw =
    process.env[`NEXT_PUBLIC_FLAG_${name.toUpperCase()}`] ??
    process.env[`FLAG_${name.toUpperCase()}`];
  if (raw === undefined || raw === '') return defaultValue;
  return TRUTHY.has(raw.toLowerCase());
}
