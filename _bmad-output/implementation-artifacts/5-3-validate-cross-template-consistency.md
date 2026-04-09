# Story 5.3: Validate Cross-Template Consistency

Status: in-progress

## Story

As a developer using any template,
I want all three templates to share consistent conventions,
so that switching between projects or templates is predictable.

## Acceptance Criteria

1. A new test file `tests/unit/templates-consistency.test.ts` runs cross-template assertions comparing `templates/monolith/`, `templates/web/`, and `templates/mobile/`.
2. **Database naming consistency:** all three templates use the same `user_roles` table name, the same column names (`clerk_user_id`, `role`, `created_at`, `updated_at`), the same index name (`idx_user_roles_clerk_user_id`), and the same role literals (`super_admin`, `paid`, `free`).
3. **Env var naming consistency:** environment variable keys follow the same convention across templates. Web templates use `NEXT_PUBLIC_*` and plain-named server secrets; mobile uses `EXPO_PUBLIC_*`. No template invents a different convention.
4. **README structure consistency:** every template README has the same top-level sections — title, Layout, Getting started, Stack, Useful commands, Notes.
5. **Package.json script consistency:** every template defines the same DX scripts (`format`, `format:check`, `prepare`) with identical values, and the same Drizzle commands (`db:generate`, `db:migrate`, `db:push`, `db:studio`).
6. **Prettier + lint-staged consistency:** every template declares the same Prettier config shape (`semi`, `singleQuote`, `trailingComma: 'all'`, `printWidth: 100`, `tabWidth: 2`) and the same lint-staged glob structure.
7. **RoleGate consistency:** web and mobile RoleGate components use the same HIERARCHY ordering (`['free', 'paid', 'super_admin']`) and the same `hasRequiredRole` function name.
8. **Zustand store consistency:** all three templates expose the same `AppState` interface shape (theme, onboardingComplete, drawerOpen) and the same action names (`setTheme`, `completeOnboarding`, `toggleDrawer`).
9. **Zod schema consistency:** the `profileFormSchema` in web + mobile (both solo) + monolith (`shared/validation/`) have identical field rules. Grep for the `.min(2)` + `.max(60)` + `.max(280)` + `.url()` assertions.
10. **Husky consistency:** every template ships `_husky/pre-commit` with the same `lint-staged` invocation.
11. **`.gitignore` consistency:** secrets exclusion (`.env`, `credentials.json`, `*.pem`, `*.key`, `.husky/_`) is identical across templates.
12. **No deprecated JWT template usage** in any template (existing anti-regression, but asserted per-template in the consistency suite too as a belt-and-suspenders check).
13. `npm test` passes with no regressions.

## Tasks / Subtasks

- [ ] Create `tests/unit/templates-consistency.test.ts` with parameterized cross-template assertions
- [ ] Run the full test suite
- [ ] Commit

## Dev Notes

### Strategy

The consistency checks are *orthogonal* to the per-template checks — they deliberately compare content across templates rather than verifying individual files. This catches drift:

- If someone adds a new field to the monolith's AppState but forgets to update the solo mobile store
- If someone changes the RoleGate hierarchy on web but not mobile
- If someone adds a new env var to web but not monolith

A regression in any of these would slip past the per-template tests but break this suite.

### What NOT to check here

- Don't re-check per-template file existence (the per-template tests already do that)
- Don't re-check per-file content details (also per-template)
- Focus only on *cross-template* invariants — things that should be the same across all templates

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/prd.md#FR43 FR44 FR45 FR46]
