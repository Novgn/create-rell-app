# Story 4.2: Add React Hook Form with Zod Validation and Example Form

Status: in-progress

## Story

As a developer building forms,
I want React Hook Form with Zod validation pre-configured with an example,
so that I have a working form pattern to build on.

## Acceptance Criteria

1. **Given** the monolith template is scaffolded, **When** the developer opens the project, **Then** an example form component demonstrates React Hook Form + Zod integration on both web and mobile.
2. The Zod schema is defined **once** in `templates/monolith/shared/validation/profile-form.ts` and exported as the single source of truth for both platforms.
3. TypeScript types are derived via `z.infer<typeof profileFormSchema>` — no hand-written input/output types.
4. The shared schema is re-exported from `shared/index.ts` so web and mobile can import it as `@{{projectNameKebab}}/shared`.
5. **Web** example lives at `templates/monolith/web/components/forms/ProfileForm.tsx`:
   - Client component using `useForm` from `react-hook-form` and `zodResolver` from `@hookform/resolvers/zod`
   - Fields: `displayName: string` (min 2, max 60), `bio: string` (max 280), `website: string` (valid url, optional)
   - Inline error messages rendered beside each field
   - `onSubmit` is a no-op that logs the validated payload — callers wire it to their API
   - Semantic HTML: `<form>`, `<label>`, `<input>`, `<textarea>`, `<button type="submit">`
6. A web demo route at `templates/monolith/web/app/dashboard/settings/page.tsx` (Server Component) imports and renders `<ProfileForm />`.
7. **Mobile** example lives at `templates/monolith/mobile/components/forms/ProfileForm.tsx`:
   - Uses `Controller` from `react-hook-form` because React Native inputs are uncontrolled by default
   - Same shared schema and inferred type
   - Uses `TextInput`, `Text`, `Pressable` from `react-native`
   - Error messages surfaced per field
8. A mobile demo route at `templates/monolith/mobile/app/(tabs)/settings.tsx` renders `<ProfileForm />` and is registered in the tabs layout.
9. `web/package.json` pins exact versions of `react-hook-form`, `zod`, `@hookform/resolvers`.
10. `mobile/package.json` pins exact versions of `react-hook-form`, `zod`, `@hookform/resolvers`.
11. `shared/package.json` pins `zod` (because the schema file imports it).
12. Inline comments explain:
    - Why the schema lives in `shared/` (one source of truth, cross-platform type derivation)
    - Why mobile uses `Controller` and web uses `register` (RN inputs are not HTML-native)
    - Why error display is inline rather than via a toast (accessibility + locality)
13. Unit tests verify:
    - Shared schema file exists and uses `z.object` + `z.infer`
    - Schema file is re-exported from `shared/index.ts`
    - Web ProfileForm imports the schema from the shared package
    - Web ProfileForm uses `useForm` + `zodResolver`
    - Mobile ProfileForm imports the schema from the shared package
    - Mobile ProfileForm uses `Controller`
    - Web settings page renders `<ProfileForm />`
    - Mobile settings tab renders `<ProfileForm />`
    - Mobile tabs layout registers the settings tab
    - All new package.json pins are exact semver
14. `npm test` passes.

## Tasks / Subtasks

- [ ] **Task 1: Shared schema**
  - [ ] Create `templates/monolith/shared/validation/profile-form.ts`
  - [ ] Add `export * from './validation/profile-form'` to `shared/index.ts`
  - [ ] Pin `zod` in `shared/package.json`
- [ ] **Task 2: Web form**
  - [ ] Create `templates/monolith/web/components/forms/ProfileForm.tsx`
  - [ ] Create `templates/monolith/web/app/dashboard/settings/page.tsx`
  - [ ] Pin `react-hook-form`, `@hookform/resolvers`, `zod` in `web/package.json`
- [ ] **Task 3: Mobile form**
  - [ ] Create `templates/monolith/mobile/components/forms/ProfileForm.tsx`
  - [ ] Create `templates/monolith/mobile/app/(tabs)/settings.tsx`
  - [ ] Update `mobile/app/(tabs)/_layout.tsx` to register the settings tab
  - [ ] Pin `react-hook-form`, `@hookform/resolvers`, `zod` in `mobile/package.json`
- [ ] **Task 4: Tests**
  - [ ] Add new files to `EXPECTED_TEMPLATE_FILES`
  - [ ] Add a `describe('templates/monolith React Hook Form + Zod (Story 4.2)')` block
- [ ] **Task 5: Verification**
  - [ ] `npx vitest run` — all green

## Dev Notes

### Architecture compliance

- Generated code architecture (line 187-202) specifies React Hook Form + Zod; PRD FR38 requires the example form with inline validation.
- Naming: component files `PascalCase.tsx` under `components/forms/`; schema files `kebab-case.ts` under `shared/validation/`.
- TS convention: "Zod schemas as the single source of truth for validation — derive TypeScript types from schemas with `z.infer<>`" (architecture line 308).

### Version pins (2026-04)

- `react-hook-form@7.64.0` — latest 7.x (8.x not released)
- `@hookform/resolvers@5.2.2` — latest 5.x, pairs with RHF 7.x
- `zod@4.1.12` — latest 4.x. Note: RHF + @hookform/resolvers v5 supports zod v4; the zod v4 import is just `import { z } from 'zod'`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#TypeScript Conventions]
- [Source: _bmad-output/planning-artifacts/prd.md#FR38]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (1M context)
