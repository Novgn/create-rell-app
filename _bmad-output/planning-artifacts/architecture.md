---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-06'
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/product-brief-create-rell-app.md"]
workflowType: 'architecture'
project_name: 'create-rell-app'
user_name: 'Wayne'
date: '2026-04-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
50 FRs across 9 capability areas. The requirements split into two domains:

1. **CLI Tool (FR1-FR15, FR47-FR50):** Interactive/flag-based command interface, project scaffolding engine, dependency installation, file generation, progress feedback, error handling, exit codes, deterministic output.
2. **Generated Template Code (FR16-FR46):** Fully wired Clerk auth + Supabase 3P Auth, Clerk Billing with pricing/checkout/webhooks, three-tier RBAC (server/client/database), Drizzle ORM with migrations, Zustand/React Hook Form/Zod/shadcn/NativeWind, and cross-template consistency.

**Non-Functional Requirements:**
20 NFRs across 5 categories. Architecture-driving NFRs:
- Integration correctness — Clerk + Supabase 3P Auth must function without manual JWT config
- Deterministic output — same inputs produce same project structure
- Cross-platform — macOS, Linux, Windows
- Pinned dependency versions — no floating ranges
- Maintainability — localized update surfaces, smoke tests on every change

**Scale & Complexity:**
- Primary domain: Developer tooling / CLI scaffolding
- Complexity level: Low-medium
- Estimated architectural components: CLI engine, template storage, variable substitution, package manager abstraction, 3 template codebases

### Technical Constraints & Dependencies

- Node.js 22+ LTS runtime
- npm public registry distribution (`npx create-rell-app`)
- Template build order: Monolith → Mobile → Web (monolith establishes patterns, solos are subsets)
- Third-party dependency chain: Clerk, Supabase, Drizzle, Expo, Tailwind, shadcn/ui, NativeWind
- No telemetry or external data transmission from CLI

### Cross-Cutting Concerns Identified

- **Template consistency:** All 3 templates must share naming conventions, file structure, and code style while supporting different platforms
- **Package manager abstraction:** npm/pnpm/yarn must be handled transparently for both dependency installation and lock file generation
- **Variable substitution:** Project name and package manager config must be injected into generated files across all templates
- **Smoke test infrastructure:** Automated validation across all 3 templates on every change

## Starter Template Evaluation

### Primary Technology Domain

CLI Tool / Developer Tooling — Node.js TypeScript scaffolder distributed via npm.

### Starter Options Considered

| Option | Approach | Fit |
|---|---|---|
| **Commander.js + @inquirer/prompts** | Minimal, composable CLI libraries. Flag parsing + interactive prompts. | Best fit — matches single-command, small surface area |
| **oclif** | Full CLI framework with plugin system, auto-generated help | Overkill — designed for multi-command CLIs with plugin ecosystems |
| **citty (unjs)** | Modern, lightweight CLI builder | Less established for `create-*` pattern, smaller community |

### Selected Approach: Commander.js + @inquirer/prompts

**Rationale:**
- Proven pattern used by create-t3-app and most `create-*` tools in the npm ecosystem
- Commander.js handles flag parsing (`--template`, `--pm`) with minimal config
- @inquirer/prompts provides interactive prompts with clean API
- No framework overhead for a tool with one command and 2-3 flags
- Both libraries are actively maintained with large install bases

**Initialization:**
No starter template CLI command — this is a from-scratch TypeScript project using these libraries as dependencies.

**Architectural Decisions Provided by This Approach:**

**Language & Runtime:** TypeScript compiled to ESM, targeting Node.js 22+ LTS

**CLI Libraries:**
- `commander` — flag/argument parsing, help generation
- `@inquirer/prompts` — interactive template and package manager selection
- `chalk` — terminal output coloring for progress/error feedback
- `fs-extra` — file system operations for template copying
- `execa` — subprocess execution for `npm install` / `pnpm install` / `yarn install`

**Build Tooling:** tsup or unbuild for compiling TypeScript to distributable JS

**Testing:** Vitest for unit tests, custom smoke test scripts for template validation

**Code Organization:** Flat CLI source with template directories stored alongside

**Development Experience:** TypeScript with strict mode, ESLint + Prettier

**Note:** Project initialization should be the first implementation story — set up the CLI project structure, configure TypeScript, and wire Commander + Inquirer for the basic prompt flow.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Template storage strategy — static files with string replacement
- Repository structure — single package, templates as directories
- CLI library choices — Commander.js + @inquirer/prompts (decided in Step 3)

**Important Decisions (Shape Architecture):**
- CI/CD pipeline — GitHub Actions for smoke tests and npm publishing
- Template dependency management — package.json as source of truth, automated update PRs

**Deferred Decisions (Post-MVP):**
- Template versioning/update mechanism (Phase 3)
- Custom template authoring (Phase 3)

### Template Storage & Scaffolding

**Decision:** Static files with string replacement
**Rationale:** Templates are complete, working project directories. The CLI copies them and performs find-replace for a small set of variables (`{{projectName}}`, package manager config files). No template engine needed — the template files ARE valid source code, readable and debuggable as-is.

**Variables requiring substitution:**
- `{{projectName}}` — project name in `package.json`, README, config files
- `{{projectNameKebab}}` — kebab-case for directory/file naming
- Package manager lock file selection (copy correct lock file, remove others)
- Package manager install/run commands in README and scripts

### Repository Structure

**Decision:** Single npm package with templates as directories

```
create-rell-app/
├── src/                     # CLI source code (TypeScript)
│   ├── index.ts             # Entry point, Commander setup
│   ├── prompts.ts           # Inquirer prompt definitions
│   ├── scaffold.ts          # File copying, variable substitution
│   ├── install.ts           # Package manager detection and install
│   └── utils.ts             # Shared utilities (chalk output, validation)
├── templates/
│   ├── monolith/            # Full-Stack Monolith template
│   │   ├── web/             # Next.js frontend
│   │   ├── mobile/          # React Native/Expo client
│   │   ├── shared/          # Shared types, Drizzle schema
│   │   └── package.json
│   ├── mobile/              # Solo Mobile template
│   │   └── ...
│   └── web/                 # Solo Web template
│       └── ...
├── tests/
│   ├── unit/                # Vitest unit tests for CLI logic
│   └── smoke/               # Smoke test scripts (scaffold → install → build → lint)
├── package.json
├── tsconfig.json
├── tsup.config.ts           # Build config
└── README.md
```

**Rationale:** No monorepo tooling overhead. Templates are plain directories of source files. CLI source and templates ship in one npm package.

### CI/CD & Publishing

**Decision:** GitHub Actions

**Smoke test pipeline (on every push/PR):**
1. Build CLI from TypeScript source
2. For each template: scaffold with flag-based arguments → `npm install` → `npm run build` → `npm run lint`
3. Verify key files exist in scaffold output
4. All 3 templates must pass

**Publish pipeline (on tagged release):**
1. Run full smoke test suite
2. Build CLI
3. Publish to npm public registry

### Template Dependency Management

**Decision:** Each template's `package.json` is the source of truth for pinned dependency versions. No floating ranges — all exact versions.

**Update workflow:**
- Renovate or Dependabot for automated update PRs
- Every update PR triggers smoke tests
- Manual review and merge within 2-week commitment window for major upstream releases

### Generated Code Architecture (Defined by PRD)

These decisions are locked by the PRD — they describe the generated template code, not the CLI:

| Concern | Decision | Source |
|---|---|---|
| Auth | Clerk + Supabase Third-Party Auth | PRD FR16-FR20 |
| Billing | Clerk Billing | PRD FR21-FR25 |
| RBAC | Three-tier: server middleware, client hooks, Supabase RLS | PRD FR26-FR32 |
| Database | Supabase + Drizzle ORM | PRD FR33-FR36 |
| State | Zustand with persistence | PRD FR37 |
| Forms | React Hook Form + Zod | PRD FR38 |
| Web UI | shadcn/ui + Tailwind CSS | PRD FR39, FR42 |
| Mobile UI | NativeWind | PRD FR40 |
| DX | ESLint + Prettier + Husky | PRD FR13, FR47 |

### Decision Impact Analysis

**Implementation Sequence:**
1. Set up CLI project structure (src/, templates/, tests/)
2. Wire Commander + Inquirer for prompt flow
3. Build scaffold engine (file copy + string replacement)
4. Build package manager abstraction (install + lock file selection)
5. Create Full-Stack Monolith template (the master template)
6. Extract Solo Mobile template from monolith
7. Extract Solo Web template from monolith
8. Wire smoke tests in GitHub Actions
9. Configure npm publish pipeline

**Cross-Component Dependencies:**
- Scaffold engine depends on template directory structure being finalized
- Smoke tests depend on both CLI and templates being functional
- Solo templates depend on monolith template being complete first

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Two pattern domains:** CLI source code (small scope) and generated template code (the baseline for every scaffolded project). Template patterns are the critical ones — they define the "Wayne standard" across all projects.

### Naming Patterns

**Generated Code — File Naming:**
- Directories: `kebab-case` (e.g., `pricing-page/`, `user-roles/`)
- React components: `PascalCase.tsx` (e.g., `PricingPage.tsx`, `UserCard.tsx`)
- Non-component files: `kebab-case.ts` (e.g., `auth-middleware.ts`, `db-client.ts`)
- Next.js App Router files: framework conventions (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`)
- Barrel exports: avoid — import directly from source files

**Generated Code — Database Naming (Drizzle + Supabase):**
- Tables: `snake_case` plural (e.g., `user_roles`, `subscriptions`, `webhook_events`)
- Columns: `snake_case` (e.g., `clerk_user_id`, `created_at`, `subscription_tier`)
- Foreign keys: `<table>_id` (e.g., `user_role_id`)
- Indexes: `idx_<table>_<column>` (e.g., `idx_user_roles_clerk_user_id`)
- RLS policies: `<action>_<table>_<context>` (e.g., `select_user_roles_own`, `insert_subscriptions_authenticated`)

**Generated Code — Environment Variables:**
- All `UPPER_SNAKE_CASE`
- Prefixed by service: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `SUPABASE_URL`, `CLERK_SECRET_KEY`
- Documented in `.env.example` with comments explaining each key

**CLI Source Code — Naming:**
- Functions/variables: `camelCase` (e.g., `scaffoldProject`, `installDependencies`)
- Types/interfaces: `PascalCase` (e.g., `TemplateConfig`, `PromptAnswers`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for derived values
- Files: `kebab-case.ts` (e.g., `scaffold.ts`, `prompts.ts`)

### Structure Patterns

**Generated Code — Next.js App Router Organization:**
```
app/
├── (auth)/                  # Auth route group
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/             # Protected route group
│   ├── layout.tsx           # Dashboard layout with auth check
│   ├── page.tsx             # Dashboard home
│   └── billing/page.tsx     # Billing/pricing page
├── api/
│   └── webhooks/
│       └── clerk-billing/route.ts
├── layout.tsx               # Root layout (Clerk provider)
└── page.tsx                 # Landing/public page
components/
├── ui/                      # shadcn/ui components
├── auth/                    # Auth-related components (role gates, paywall)
└── shared/                  # Skeleton loaders, common components
lib/
├── supabase/
│   ├── client.ts            # Supabase client with Clerk token
│   └── server.ts            # Server-side Supabase client
├── auth/
│   ├── middleware.ts         # Clerk middleware config
│   └── roles.ts             # RBAC helpers and role checks
└── utils.ts                 # General utilities
db/
├── schema.ts                # Drizzle schema definitions
├── queries.ts               # Typed query helpers
└── migrations/              # Drizzle migration files
stores/
└── app-store.ts             # Zustand store with persistence
```

**Generated Code — Test Location:** Co-located `__tests__/` directories within feature folders. No separate top-level test directory for template code.

**CLI Source Code — Organization:** Flat `src/` directory (already defined in Step 4 repo structure).

### Format Patterns

**Generated Code — API Routes (Next.js App Router):**
- Return consistent shape: `NextResponse.json({ data })` on success, `NextResponse.json({ error: message }, { status: code })` on failure
- Use standard HTTP status codes (200, 201, 400, 401, 403, 500)
- Validate request bodies with Zod schemas before processing
- Webhook routes validate signatures before processing payload

**Generated Code — TypeScript Conventions:**
- Strict mode enabled, no `any`
- Named exports only (except where framework requires default: `page.tsx`, `layout.tsx`)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Explicit return types on exported functions
- Zod schemas as the single source of truth for validation — derive TypeScript types from schemas with `z.infer<>`

### Process Patterns

**Generated Code — Error Handling:**
- Next.js `error.tsx` boundary per route group for client-side errors
- API routes: try/catch with consistent error response format
- Auth errors: redirect to sign-in, never expose auth state details
- Database errors: log server-side, return generic message to client

**Generated Code — Loading States:**
- Next.js `loading.tsx` per route group using skeleton components
- Skeleton components match the layout of the content they replace
- No global loading spinners — always localized loading states

**Generated Code — Auth Flow (Native 3P Auth — NOT deprecated JWT templates):**
- Clerk `<ClerkProvider>` at root layout
- `clerkMiddleware()` in Next.js middleware for route protection
- `useSession()` hook to get session for Supabase client initialization
- Supabase client created with `accessToken` callback: `session?.getToken() ?? null`
- Server-side Supabase client uses `auth().getToken()` from Clerk Next.js SDK
- RLS policies use `auth.jwt()->>'sub'` to match Clerk user ID
- **CRITICAL: Do NOT use deprecated `getToken({ template: 'supabase' })` JWT template pattern** (deprecated April 2025)

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow the naming conventions above — no deviations without explicit approval
- Use the directory structure as defined — no reorganizing
- Match the API response format exactly — `{ data }` or `{ error }`
- Use Zod for all validation — no manual validation logic
- Use the Clerk + Supabase integration pattern as documented — no alternative auth flows

**Pattern Verification:**
- ESLint rules enforce naming conventions where possible
- Smoke tests verify generated project structure matches expected layout
- PR review checks for pattern compliance

## Project Structure & Boundaries

### Complete Project Directory Structure

#### CLI Project (create-rell-app repo)

```
create-rell-app/
├── .github/
│   └── workflows/
│       ├── ci.yml                # Smoke tests on push/PR
│       └── publish.yml           # npm publish on tagged release
├── src/
│   ├── index.ts                  # Entry point: Commander setup, bin entry
│   ├── prompts.ts                # Inquirer prompt definitions
│   ├── scaffold.ts               # File copy + variable substitution engine
│   ├── install.ts                # Package manager abstraction (npm/pnpm/yarn)
│   └── utils.ts                  # Chalk output, validation, path helpers
├── templates/
│   ├── web/                      # Solo Web App template
│   ├── mobile/                   # Solo Mobile App template
│   └── monolith/                 # Full-Stack Monolith template
├── tests/
│   ├── unit/
│   │   ├── scaffold.test.ts      # Variable substitution tests
│   │   ├── prompts.test.ts       # Prompt logic tests
│   │   └── install.test.ts       # Package manager abstraction tests
│   └── smoke/
│       └── smoke-test.sh         # Scaffold all templates → install → build → lint
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

#### Solo Web App Template (`templates/web/`)

```
{{projectName}}/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Auth-protected layout
│   │   ├── page.tsx                      # Dashboard home
│   │   └── billing/page.tsx              # Pricing + checkout
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk-billing/route.ts    # Billing webhook handler
│   ├── layout.tsx                        # Root layout (ClerkProvider)
│   ├── page.tsx                          # Public landing page
│   ├── error.tsx                         # Global error boundary
│   ├── loading.tsx                       # Global loading skeleton
│   └── globals.css                       # Tailwind imports
├── components/
│   ├── ui/                               # shadcn/ui components
│   ├── auth/
│   │   ├── RoleGate.tsx                  # Client-side RBAC gate
│   │   └── PaywallPrompt.tsx             # Upgrade prompt for free users
│   └── shared/
│       ├── SkeletonCard.tsx              # Skeleton loader components
│       └── SkeletonTable.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client (accessToken callback)
│   │   └── server.ts                     # Server Supabase client (auth().getToken())
│   ├── auth/
│   │   └── roles.ts                      # RBAC helpers (hasRole, isAdmin, etc.)
│   └── utils.ts                          # General utilities (cn, formatDate, etc.)
├── db/
│   ├── schema.ts                         # Drizzle schema (user_roles table)
│   ├── queries.ts                        # Typed query helpers
│   └── migrations/                       # Drizzle migration files
├── stores/
│   └── app-store.ts                      # Zustand store with persistence
├── middleware.ts                          # Clerk middleware for route protection
├── .env.example                          # All required env vars documented
├── package.json                          # Pinned dependencies
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── .husky/
│   └── pre-commit                        # Lint-staged hook
├── .gitignore
└── README.md
```

#### Solo Mobile App Template (`templates/mobile/`)

```
{{projectName}}/
├── app/                                  # Expo Router file-based routing
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx                   # Tab navigation layout
│   │   ├── index.tsx                     # Home/dashboard tab
│   │   └── billing.tsx                   # Pricing/billing tab
│   ├── _layout.tsx                       # Root layout (ClerkProvider)
│   └── index.tsx                         # Entry redirect
├── components/
│   ├── auth/
│   │   ├── RoleGate.tsx
│   │   └── PaywallPrompt.tsx
│   └── shared/
│       └── SkeletonCard.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts                     # Supabase client (accessToken callback)
│   ├── auth/
│   │   └── roles.ts                      # RBAC helpers
│   └── utils.ts
├── db/
│   ├── schema.ts                         # Drizzle schema
│   ├── queries.ts
│   └── migrations/
├── stores/
│   └── app-store.ts                      # Zustand with MMKV persistence
├── .env.example
├── package.json
├── app.json                              # Expo config
├── tsconfig.json
├── tailwind.config.ts                    # NativeWind config
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

#### Full-Stack Monolith Template (`templates/monolith/`)

```
{{projectName}}/
├── web/                                  # Next.js frontend (mirrors Solo Web)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── stores/
│   ├── middleware.ts
│   ├── package.json
│   ├── next.config.ts
│   └── tailwind.config.ts
├── mobile/                               # Expo mobile client (mirrors Solo Mobile)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── stores/
│   ├── package.json
│   ├── app.json
│   └── tailwind.config.ts
├── shared/                               # Shared between web and mobile
│   ├── db/
│   │   ├── schema.ts                     # Single Drizzle schema source of truth
│   │   ├── queries.ts                    # Shared typed queries
│   │   └── migrations/
│   ├── types/
│   │   ├── roles.ts                      # Role type definitions
│   │   └── api.ts                        # Shared API types
│   └── package.json
├── .env.example
├── package.json                          # Root package.json (workspace config)
├── tsconfig.base.json                    # Shared TypeScript config
├── .eslintrc.json
├── .prettierrc
├── .husky/
│   └── pre-commit
├── .gitignore
└── README.md
```

### Requirements to Structure Mapping

| FR Range | Capability | CLI Location | Template Location |
|---|---|---|---|
| FR1-FR8 | CLI Interaction | `src/index.ts`, `src/prompts.ts`, `src/utils.ts` | — |
| FR9-FR15 | Project Scaffolding | `src/scaffold.ts`, `src/install.ts` | — |
| FR16-FR20 | Authentication | — | `lib/supabase/`, `middleware.ts`, `app/(auth)/` |
| FR21-FR25 | Billing | — | `app/(dashboard)/billing/`, `app/api/webhooks/` |
| FR26-FR32 | Access Control | — | `lib/auth/roles.ts`, `components/auth/`, `db/schema.ts` (RLS) |
| FR33-FR36 | Database | — | `db/schema.ts`, `db/queries.ts`, `db/migrations/` |
| FR37-FR42 | App Foundation | — | `stores/`, `components/ui/`, `components/shared/`, `tailwind.config.ts` |
| FR43-FR46 | Template Consistency | `src/scaffold.ts` (ensures same patterns) | All templates share patterns |
| FR47-FR50 | Quality & Automation | `tests/smoke/`, `.github/workflows/` | `.eslintrc.json`, `.prettierrc`, `.husky/` |

### Architectural Boundaries

**CLI ↔ Templates boundary:** The CLI reads from `templates/` and writes to the user's filesystem. No runtime dependency between CLI code and template code.

**Web ↔ Mobile boundary (Monolith):** Web and mobile are independent applications sharing only `shared/db/` and `shared/types/`. No cross-imports between `web/` and `mobile/`.

**Generated App ↔ External Services boundary:** All external service communication (Clerk, Supabase) happens through client libraries configured with environment variables. No direct HTTP calls to service APIs.

### External Integration Points

| Service | Integration Point | Template Files |
|---|---|---|
| Clerk Auth | ClerkProvider, clerkMiddleware, useSession | `app/layout.tsx`, `middleware.ts`, `lib/supabase/` |
| Supabase | Native 3P Auth via accessToken callback | `lib/supabase/client.ts`, `lib/supabase/server.ts` |
| Clerk Billing | Billing UI + webhook handler | `app/(dashboard)/billing/`, `app/api/webhooks/clerk-billing/` |
| Drizzle ORM | Schema → Supabase PostgreSQL | `db/schema.ts`, `db/queries.ts`, `db/migrations/` |

### Supabase Auth Integration (Critical)

**Uses Native Third-Party Auth — NOT deprecated JWT templates.**

Client-side (`lib/supabase/client.ts`):
```typescript
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  async accessToken() {
    return session?.getToken() ?? null
  }
})
```

Server-side (`lib/supabase/server.ts`):
```typescript
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  async accessToken() {
    return (await auth()).getToken() ?? null
  }
})
```

RLS policies reference `auth.jwt()->>'sub'` for the Clerk user ID. No JWT template configuration in Clerk dashboard required.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are compatible. Commander.js + @inquirer/prompts + chalk + fs-extra + execa is a standard CLI combination. Template technologies (Next.js + Clerk + Supabase + Drizzle + Tailwind + shadcn/ui) are commonly used together. Native 3P auth approach aligns with current Clerk and Supabase documentation.

**Pattern Consistency:** Naming conventions follow standard conventions for each layer (kebab-case files, PascalCase components, snake_case database). No conflicts between CLI patterns and template patterns.

**Structure Alignment:** Repository structure supports static file copy cleanly. Template structures follow Next.js App Router and Expo Router conventions. Monolith template properly separates web/mobile/shared.

### Requirements Coverage Validation ✅

**Functional Requirements:** 50/50 covered. All FR categories mapped to architectural components with specific file locations.

**Non-Functional Requirements:** 20/20 covered. Performance (file copy inherently fast), Security (env vars, RLS, webhook validation, no telemetry), Accessibility (semantic HTML, ARIA), Integration Correctness (native 3P auth, pinned versions), Maintainability (smoke tests, Renovate/Dependabot).

### Implementation Readiness Validation ✅

All critical decisions documented. All three template structures defined at file level. FR-to-structure mapping complete. Naming, structure, format, process, and auth flow patterns defined with examples.

### Gap Analysis Results

**One minor gap addressed:** Monolith workspace configuration — use npm `workspaces` field in root `package.json` (`["web", "mobile", "shared"]`). Supported by npm, pnpm, and yarn.

**No critical or important gaps found.**

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented
- [x] Technology stack fully specified
- [x] Integration patterns defined (including corrected 3P auth)
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Complete directory structure defined for CLI + 3 templates
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level:** High

**Key Strengths:**
- Simple, proven architecture (static file copy CLI + opinionated templates)
- Complete FR and NFR coverage with explicit file mapping
- Critical auth integration corrected to current approach (native 3P auth)
- Monolith-first build strategy maximizes pattern reuse
- Clear boundaries between CLI, templates, and external services

**Areas for Future Enhancement:**
- Exact dependency versions for CLI libraries (pin at implementation time)
- Detailed Expo/React Native auth flow patterns (mobile-specific Clerk integration)
- Smoke test implementation details (shell script vs Node.js test runner)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use native Supabase 3P auth — NOT deprecated JWT templates
- Use implementation patterns consistently across all templates
- Respect project structure and boundaries
- Build monolith template first, then extract solo templates

**First Implementation Priority:**
Set up CLI project structure: `package.json`, TypeScript config, Commander + Inquirer wiring, basic scaffold engine with one placeholder template.
