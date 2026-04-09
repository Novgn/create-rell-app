# Story 4.1: Add Zustand State Management with Persistence

Status: in-progress

## Story

As a developer building a SaaS product,
I want Zustand configured with persistence,
so that I have a ready-to-use state management layer on day one for both web and mobile.

## Acceptance Criteria

1. **Given** the monolith template is scaffolded, **When** the developer opens the project, **Then** a Zustand store exists at `templates/monolith/web/stores/app-store.ts` with persistence middleware.
2. A Zustand store exists at `templates/monolith/mobile/stores/app-store.ts` with persistence middleware.
3. The **web** store uses `zustand/middleware`'s `persist` with the default (`localStorage`) storage on the browser and a no-op storage fallback on the server so Next.js SSR does not crash.
4. The **mobile** store uses `zustand/middleware`'s `persist` with a `createJSONStorage` adapter backed by `react-native-mmkv`.
5. The store includes a small example slice that demonstrates both ephemeral and persisted state:
   - `theme: 'system' | 'light' | 'dark'` — persisted
   - `setTheme(theme)` action
   - `onboardingComplete: boolean` — persisted
   - `completeOnboarding()` action
   - `drawerOpen: boolean` — **not** persisted (ephemeral UI state)
   - `toggleDrawer()` action
6. Types are derived from a single `AppState` interface shared across both platforms — the only difference between web and mobile stores is the storage adapter. The slice definitions and action signatures are identical.
7. A `partialize` option is used to ensure ephemeral UI state (`drawerOpen`) is not written to storage.
8. A stable storage key (`{{projectNameKebab}}-app`) is used so that clearing or upgrading it is trivial.
9. Inline comments explain:
   - Why persistence uses `partialize` to exclude ephemeral state
   - Why the web store ships a no-op storage fallback (SSR hydration safety)
   - Why mobile uses MMKV (synchronous, fast, crypto-capable)
10. `web/package.json` pins `zustand` as an exact version dependency.
11. `mobile/package.json` pins `zustand` and `react-native-mmkv` as exact version dependencies.
12. A demo consumer exists on each platform to prove the store works end-to-end:
    - Web: `templates/monolith/web/app/dashboard/page.tsx` reads `onboardingComplete` and shows a one-liner "Getting started" vs "Welcome back".
    - Mobile: `templates/monolith/mobile/app/(tabs)/index.tsx` reads `theme` and shows it as a label.
13. Unit tests verify:
    - Both store files exist
    - Both files import `persist` from `zustand/middleware`
    - Web store uses `createJSONStorage` with a no-op server fallback
    - Mobile store uses `createJSONStorage` with an MMKV-backed adapter
    - Both stores use `partialize` excluding `drawerOpen`
    - `zustand` is pinned in both `package.json` files, `react-native-mmkv` is pinned in mobile
    - The demo consumers import the store
14. `npm test` passes and the total test count increases by the number of new assertions.

## Tasks / Subtasks

- [ ] **Task 1: Pin dependencies**
  - [ ] Add `zustand` (exact version) to `templates/monolith/web/package.json` dependencies
  - [ ] Add `zustand` and `react-native-mmkv` (exact versions) to `templates/monolith/mobile/package.json` dependencies
- [ ] **Task 2: Create web store**
  - [ ] Create `templates/monolith/web/stores/app-store.ts`
  - [ ] Define `AppState` interface, `createAppStore()` with `persist` + `partialize` + no-op SSR fallback
  - [ ] Export `useAppStore` hook
- [ ] **Task 3: Create mobile store**
  - [ ] Create `templates/monolith/mobile/stores/app-store.ts`
  - [ ] Same `AppState` shape
  - [ ] `persist` with `createJSONStorage` backed by an MMKV instance
- [ ] **Task 4: Demo consumers**
  - [ ] Update `web/app/dashboard/page.tsx` to read `onboardingComplete` — must remain a Server Component friendly (client component split if needed)
  - [ ] Update `mobile/app/(tabs)/index.tsx` to read `theme`
- [ ] **Task 5: Tests**
  - [ ] Extend `EXPECTED_TEMPLATE_FILES` with the two new store files
  - [ ] Add a `describe('templates/monolith Zustand stores (Story 4.1)')` block with assertions for AC 13
  - [ ] Update web/mobile package.json assertions for new pins
- [ ] **Task 6: Verification**
  - [ ] `npx vitest run` — all green
  - [ ] Quick grep — no leftover `{{...}}` tokens in the new files
- [ ] **Task 7: Commit**

## Dev Notes

### Architecture compliance

- Architecture spec (line 287-289) places `stores/app-store.ts` at the workspace root for web and mobile — not in `shared/`. The two stores diverge on storage adapter, so sharing a file would require a factory indirection that adds no value for the starter. Follow the spec.
- `partialize` is essential because Zustand `persist` otherwise writes **all** state including ephemeral UI flags. A drawer-open flag written to localStorage would create a stale-on-reload UX bug.

### Why MMKV on mobile

- `@react-native-async-storage/async-storage` is the "easy default" but is async, slow, and not encrypted. MMKV is synchronous (matching the `persist` middleware's sync storage contract), ~30x faster, and supports encryption out of the box.
- MMKV has a prebuilt Expo config plugin and works with Expo's prebuild workflow. Users scaffolding a brand-new app will use EAS Build or `expo prebuild` to generate native code; either way MMKV is a supported choice.

### SSR fallback on web

Next.js App Router Server Components crash if a Zustand store touches `localStorage` at module evaluation time. The `persist` middleware handles this gracefully **if** `createJSONStorage` is passed a storage getter that returns `undefined` on the server. Do this via:

```ts
createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined))
```

This keeps `useAppStore` callable from both Server and Client components without hydration errors. Only the **client** reads/writes actually hit `localStorage`.

### Version pins

- `zustand@5.0.8` — latest 5.x stable as of 2026-04 (5.x is the API-breaking-change rewrite; the starter targets it).
- `react-native-mmkv@3.3.4` — latest 3.x stable; the 3.x API exposes a class-based `MMKV` instance that plugs directly into `createJSONStorage`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Generated Code Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#FR37]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)
