# Story 4.3: Add shadcn/ui, NativeWind, Skeleton Loaders, and Tailwind

Status: in-progress

## Story

As a developer starting a new project,
I want UI frameworks and loading components pre-configured,
so that I can build polished interfaces immediately on both web and mobile.

## Acceptance Criteria

1. **Tailwind CSS (web)** is configured and working:
   - `templates/monolith/web/postcss.config.mjs` with `@tailwindcss/postcss` plugin (Tailwind 4.x)
   - `templates/monolith/web/app/globals.css` imports Tailwind via `@import "tailwindcss"` (Tailwind 4.x convention)
   - `web/package.json` pins `tailwindcss`, `@tailwindcss/postcss`, `tailwind-merge`, `clsx`
2. **shadcn/ui groundwork** is present:
   - `templates/monolith/web/lib/cn.ts` exports the `cn()` helper (`clsx` + `tailwind-merge`) — the canonical shadcn utility
   - `templates/monolith/web/components.json` is the shadcn config so future `npx shadcn add` commands work
   - Minimum shadcn-style base components ship inline (no external fetch needed on first scaffold):
     - `templates/monolith/web/components/ui/Button.tsx`
     - `templates/monolith/web/components/ui/Card.tsx`
     - `templates/monolith/web/components/ui/Skeleton.tsx`
   - Each base component uses `cn()` + Tailwind utility classes
3. **Skeleton loaders** exist at the architecture-mandated location:
   - `templates/monolith/web/components/shared/SkeletonCard.tsx` (composes the base `Skeleton`)
   - `templates/monolith/web/components/shared/SkeletonTable.tsx`
   - `templates/monolith/web/app/dashboard/loading.tsx` uses `<SkeletonCard />` as the route-level loading UI
4. **NativeWind (mobile)** is configured:
   - `templates/monolith/mobile/tailwind.config.js` with `content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']` and the NativeWind preset
   - `templates/monolith/mobile/global.css` contains the Tailwind directives
   - `templates/monolith/mobile/babel.config.js` adds the NativeWind Babel preset chain
   - `templates/monolith/mobile/metro.config.js` wraps the default Expo config with `withNativeWind()`
   - `templates/monolith/mobile/nativewind-env.d.ts` declares the JSX typing for className on native primitives
   - `mobile/package.json` pins `nativewind`, `tailwindcss` (as devDependency), `react-native-reanimated`
5. **Mobile skeleton loader** exists:
   - `templates/monolith/mobile/components/shared/SkeletonCard.tsx` that uses NativeWind `className` on RN primitives
6. **Accessibility + semantic HTML** on web auth / billing pages:
   - Sign-in, sign-up pages use semantic `<main>` wrapper (added via a shared `AuthLayout.tsx` or inline); ARIA label on the container
   - Billing page uses semantic `<main>` + `<section>` elements and labels
   - Existing pages that use `<div>` where `<main>` / `<nav>` would fit are upgraded
7. **Inline comments** explain:
   - Why Tailwind v4 uses CSS-first config (`@import "tailwindcss"`) instead of a `tailwind.config.ts` on web
   - Why NativeWind still uses `tailwind.config.js` (nativewind's metro transformer depends on it)
   - Why `cn()` merges via `tailwind-merge` (class collision resolution)
8. Unit tests verify:
   - All new files exist
   - `cn.ts` imports `clsx` + `tailwind-merge`
   - `globals.css` imports `tailwindcss`
   - `components/ui/Button.tsx`, `Card.tsx`, `Skeleton.tsx` exist and use `cn()`
   - `components/shared/SkeletonCard.tsx` + `SkeletonTable.tsx` exist
   - `app/dashboard/loading.tsx` imports `SkeletonCard`
   - `mobile/tailwind.config.js` references the NativeWind preset
   - `mobile/global.css` contains Tailwind directives
   - `mobile/metro.config.js` wraps config with `withNativeWind`
   - `mobile/components/shared/SkeletonCard.tsx` uses `className`
   - Web dashboard layout uses `<main>` element
   - Web/mobile package.json pins are exact semver
9. `npm test` passes.

## Tasks / Subtasks

- [ ] **Task 1: Web Tailwind setup**
  - [ ] Create `web/postcss.config.mjs`
  - [ ] Rewrite `web/app/globals.css` with Tailwind 4 import + base layer
  - [ ] Create `web/lib/cn.ts`
  - [ ] Create `web/components.json` (shadcn config)
  - [ ] Create `web/components/ui/Button.tsx`, `Card.tsx`, `Skeleton.tsx`
  - [ ] Pin `tailwindcss`, `@tailwindcss/postcss`, `tailwind-merge`, `clsx` in `web/package.json`
- [ ] **Task 2: Skeleton loaders (web)**
  - [ ] Create `web/components/shared/SkeletonCard.tsx`
  - [ ] Create `web/components/shared/SkeletonTable.tsx`
  - [ ] Create `web/app/dashboard/loading.tsx`
- [ ] **Task 3: Semantic HTML/A11y upgrades (web)**
  - [ ] Update `web/app/dashboard/layout.tsx` to use `<main>` + `<nav>` + ARIA labels
  - [ ] Update `web/app/dashboard/billing/page.tsx` to use `<main>`/`<section>`
- [ ] **Task 4: Mobile NativeWind setup**
  - [ ] Create `mobile/tailwind.config.js`
  - [ ] Create `mobile/global.css`
  - [ ] Update `mobile/babel.config.js` to use NativeWind preset
  - [ ] Create `mobile/metro.config.js`
  - [ ] Create `mobile/nativewind-env.d.ts`
  - [ ] Import `global.css` from `mobile/app/_layout.tsx`
  - [ ] Pin `nativewind`, `tailwindcss`, `react-native-reanimated` in `mobile/package.json`
- [ ] **Task 5: Mobile skeleton loader**
  - [ ] Create `mobile/components/shared/SkeletonCard.tsx`
- [ ] **Task 6: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES`
  - [ ] Add `describe('templates/monolith Tailwind + shadcn + NativeWind (Story 4.3)')` block
- [ ] **Task 7: Verification**
  - [ ] `npx vitest run`

## Dev Notes

### Tailwind 4.x CSS-first config (web)

Tailwind 4 moved to a CSS-first configuration model — `tailwind.config.ts` is still supported but the *idiomatic* setup is a single `@import "tailwindcss"` line in `globals.css` plus a `@theme {}` block for tokens. We use the idiomatic path. The shadcn ecosystem has been updating but the `cn()` helper + base components pattern is unchanged — it's just Tailwind classes with `tailwind-merge` resolving collisions.

### Shadcn minimum base components

Shipping `Button`, `Card`, `Skeleton` inline (rather than requiring the user to run `npx shadcn add ...` after scaffolding) means:
- First scaffold works offline
- The user gets a feel for the pattern immediately
- `npx shadcn add dialog` etc. still works because `components.json` is configured

### NativeWind v4 metro setup

NativeWind 4 requires:
- `withNativeWind` wrapper on the Metro config
- `babel-preset-expo` + `nativewind/babel` in babel config (order matters — nativewind comes after)
- `global.css` imported once from the root layout so Metro picks up the generated styles
- `react-native-reanimated` is a peer dep (NativeWind uses it for certain transitions)

### Accessibility

The PRD (NFR10-NFR12) requires semantic HTML, ARIA on auth/billing, keyboard nav. This story is where the semantic upgrade happens — existing pages used `<div>` + `<h2>` as placeholders in Stories 2.x/3.x; we upgrade the visible user surface to `<main>`, `<nav>`, `<section>`, and label them.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR39 FR40 FR41 FR42 NFR10 NFR11 NFR12]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)
