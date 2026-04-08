# Story 3.4: Add Paywall Prompts and Role-Based UI Gating

Status: review

## Story

As a developer building a freemium SaaS,
I want client-side role gating and upgrade prompts for free users,
so that paid features are visible but gated with clear upgrade paths.

## Acceptance Criteria

1. **Given** the RBAC system is in place with role helpers, **When** a free-tier user accesses a paid feature, **Then** a `<RoleGate>` component conditionally renders content based on user role.
2. A `<PaywallPrompt>` component displays an upgrade CTA for free users, linking to `/dashboard/billing`.
3. Role checks use the `useRole()` hook for client-side gating (from Story 3.3).
4. The components are reusable across any route or feature.
5. `<RoleGate>` API:
   - `requiredRole: Role` — the minimum role to render children
   - `children: ReactNode` — content shown when the user has the required role
   - `fallback?: ReactNode` — content shown when they don't (defaults to `<PaywallPrompt />`)
6. Role hierarchy: `super_admin > paid > free`. `<RoleGate requiredRole="paid">` renders for paid AND super_admin users.
7. `<PaywallPrompt>` shows a brief "Upgrade to continue" message with a link to `/dashboard/billing`. Minimal styling (Story 4.3 does the real look).
8. A demo paid-only route `/dashboard/paid-feature/page.tsx` demonstrates the pattern — shows `<RoleGate requiredRole="paid">` wrapping a "Paid feature content" section.
9. Mobile: a `<RoleGate>` React Native component under `mobile/components/auth/RoleGate.tsx` doing the same thing using the mobile `useRole` hook.
10. Mobile: a `<PaywallPrompt>` React Native component.
11. New template files:
    - `templates/monolith/web/components/auth/RoleGate.tsx`
    - `templates/monolith/web/components/auth/PaywallPrompt.tsx`
    - `templates/monolith/web/app/dashboard/paid-feature/page.tsx`
    - `templates/monolith/mobile/components/auth/RoleGate.tsx`
    - `templates/monolith/mobile/components/auth/PaywallPrompt.tsx`
12. Unit tests verify:
    - Every new file exists
    - Web `RoleGate.tsx` is a client component that imports `useRole`
    - Web `RoleGate.tsx` implements the role hierarchy (super_admin satisfies paid, etc.)
    - Web `PaywallPrompt.tsx` links to `/dashboard/billing`
    - Demo paid-feature route uses `<RoleGate requiredRole="paid">`
    - Mobile `RoleGate.tsx` imports from `@clerk/clerk-expo`-backed `useRole`
13. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.

## Tasks / Subtasks

- [ ] **Task 1: Web RoleGate**
  - [ ] Create `templates/monolith/web/components/auth/RoleGate.tsx`:
    - `'use client'`
    - Accepts `requiredRole`, `children`, optional `fallback`
    - Uses `useRole()` to get current role
    - Implements hierarchy: `super_admin` satisfies any role; `paid` satisfies `paid` or `free`; `free` satisfies `free`
    - Returns `children` if hierarchy allows, `fallback ?? <PaywallPrompt />` otherwise
    - While loading, returns `null` (skeleton comes in 4.3)
- [ ] **Task 2: Web PaywallPrompt**
  - [ ] Create `templates/monolith/web/components/auth/PaywallPrompt.tsx`:
    - Client component
    - Renders a short "Upgrade to paid plan" message
    - Uses `next/link` to link to `/dashboard/billing`
- [ ] **Task 3: Demo paid-feature route**
  - [ ] Create `templates/monolith/web/app/dashboard/paid-feature/page.tsx` demonstrating the pattern:
    - Wraps content in `<RoleGate requiredRole="paid">` showing "paid feature content"
- [ ] **Task 4: Mobile RoleGate + PaywallPrompt**
  - [ ] Create `templates/monolith/mobile/components/auth/RoleGate.tsx` — same props, uses the mobile `useRole()` hook.
  - [ ] Create `templates/monolith/mobile/components/auth/PaywallPrompt.tsx` — React Native version with a Button linking via expo-router.
- [ ] **Task 5: Tests**
  - [ ] Extend EXPECTED_TEMPLATE_FILES with the 5 new files.
  - [ ] Add content assertions.
- [ ] **Task 6: Verification**
  - [ ] All commands pass.

## Dev Notes

### Architecture compliance

- **Role hierarchy**: implement an `includes` function or inline comparison:
  ```ts
  const hierarchy: Role[] = ['free', 'paid', 'super_admin'];
  const hasRequiredRole = (current: Role, required: Role) =>
    hierarchy.indexOf(current) >= hierarchy.indexOf(required);
  ```
- **Client-side RoleGate is UX, not security**: the RLS layer still enforces actual data access. Never rely on the gate alone.
- **PaywallPrompt is a placeholder visual** — Story 4.3 styles it with shadcn/ui.

### Critical implementation details

- **Loading state**: return `null` while `isLoading` so the UI doesn't flash paid content before the role resolves.
- **Default fallback**: if no `fallback` prop is provided, render `<PaywallPrompt />`. Callers can override with `fallback={null}` to hide entirely.
- **`requiredRole: 'free'`** always renders (everyone has at least 'free').

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR32]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)

### Debug Log References

- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run test` → 200/200 (7 new Story 3.4 tests)
- `npm run build` → 20.48 KB

### Completion Notes List

- **Web + mobile parity**: both `<RoleGate>` implementations share the same HIERARCHY ordering (`['free', 'paid', 'super_admin']`) and same `hasRequiredRole` helper shape. A test asserts the hierarchy literal matches across both files.
- **Loading state returns `null`** to prevent flashing paid content before the role resolves. Story 4.3 will swap in a skeleton loader.
- **Default fallback = `<PaywallPrompt />`** — callers override with `fallback={null}` to hide entirely.
- **Role hierarchy**: `super_admin` > `paid` > `free`. `requiredRole="paid"` renders for paid AND super_admin users. `requiredRole="free"` always renders.
- **UI-only enforcement**: comments explicitly call out that client-side gating is UX, and Supabase RLS is the authoritative security boundary.
- **Demo paid-feature route** showcases the pattern: `app/dashboard/paid-feature/page.tsx` wraps content in `<RoleGate requiredRole="paid">`.
- **Mobile PaywallPrompt** links to `/(tabs)/billing` — a placeholder route not yet created (no mobile billing tab in scope for Epic 3). Users add it when they build a real mobile billing flow.

### File List

**Created (5):**

- `templates/monolith/web/components/auth/RoleGate.tsx` — client component with `useRole` + hierarchy check
- `templates/monolith/web/components/auth/PaywallPrompt.tsx` — upgrade CTA with next/link to /dashboard/billing
- `templates/monolith/web/app/dashboard/paid-feature/page.tsx` — demo paid-only route
- `templates/monolith/mobile/components/auth/RoleGate.tsx` — mirror for React Native
- `templates/monolith/mobile/components/auth/PaywallPrompt.tsx` — React Native visual with expo-router Link

**Modified (1):**

- `tests/unit/templates-monolith.test.ts` — 7 new tests covering hierarchy, default fallback, next/link, demo route, mobile imports, and cross-platform hierarchy parity
