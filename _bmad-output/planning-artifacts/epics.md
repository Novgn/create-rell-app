---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
status: 'complete'
completedAt: '2026-04-06'
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/architecture.md"]
---

# create-rell-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for create-rell-app, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Developer can run the CLI via `npx create-rell-app <project-name>` to start a new scaffold
- FR2: Developer can select a template (Solo Web, Solo Mobile, Full-Stack Monolith) via interactive prompt
- FR3: Developer can select a package manager (npm, pnpm, yarn) via interactive prompt
- FR4: Developer can confirm or modify the project name via interactive prompt
- FR5: Developer can bypass all interactive prompts using command-line flags (`--template`, `--pm`)
- FR6: Developer can provide partial flags, with missing values triggering interactive prompts for only those fields
- FR7: CLI provides clear error messages when invalid flags or project names are provided
- FR8: CLI displays progress feedback during scaffold and dependency installation
- FR9: CLI generates a complete, self-contained project directory for the selected template
- FR10: CLI installs all dependencies using the developer's selected package manager
- FR11: CLI generates the correct lock file for the selected package manager
- FR12: CLI generates an `.env.example` file documenting every required environment variable with descriptions
- FR13: CLI generates configuration files for ESLint, Prettier, Husky, and TypeScript
- FR14: CLI generates a project README with setup instructions, architecture overview, and common tasks
- FR15: Generated project builds and starts without errors when environment variables are configured
- FR16: Generated project includes Clerk authentication provider wrapped at the application root
- FR17: Generated project includes sign-in and sign-up pages fully scaffolded
- FR18: Generated project includes server middleware configured for protected routes
- FR19: Generated project includes Supabase Third-Party Auth integration — Supabase trusts Clerk JWTs via RLS policies
- FR20: Generated project includes Supabase client configured with Clerk token passthrough
- FR21: Generated project includes Clerk Billing integration
- FR22: Generated project includes a pricing page with subscription tier display
- FR23: Generated project includes subscription checkout flow
- FR24: Generated project includes billing lifecycle webhook handling
- FR25: Generated project includes billing portal redirect for subscription management
- FR26: Generated project enforces three-tier RBAC across server middleware, client-side hooks, and Supabase RLS policies
- FR27: Generated project includes three default roles: super_admin, paid, and free
- FR28: Generated project includes super_admin god-mode with full access across the application
- FR29: Generated project includes role-based route protection at the server layer
- FR30: Generated project includes role-based UI gating at the client layer
- FR31: Generated project includes RLS policies that enforce role-based data access at the database layer
- FR32: Generated project includes paywall/upgrade prompts for free-tier users accessing paid features
- FR33: Generated project includes Drizzle ORM configured with Supabase
- FR34: Generated project includes typed database schema with user roles table
- FR35: Generated project includes database migration scripts
- FR36: Generated project includes example typed database queries
- FR37: Generated project includes Zustand state management with persistence
- FR38: Generated project includes React Hook Form with Zod validation and an example form
- FR39: Generated project includes shadcn/ui component library (web templates)
- FR40: Generated project includes NativeWind styling (mobile templates)
- FR41: Generated project includes skeleton loading components
- FR42: Generated project includes Tailwind CSS configured and ready to use
- FR43: All three templates share consistent naming conventions, file structure patterns, and code style
- FR44: The web portion of the Full-Stack Monolith uses identical patterns to the Solo Web template
- FR45: The mobile portion of the Full-Stack Monolith uses identical patterns to the Solo Mobile template
- FR46: The Full-Stack Monolith includes shared TypeScript types and Drizzle schema between web and mobile
- FR47: Generated project passes ESLint and Prettier with zero errors on fresh scaffold
- FR48: CLI returns appropriate exit codes for success and failure states
- FR49: CLI produces deterministic output — same inputs produce the same project structure
- FR50: Generated project inline comments explain non-obvious wiring (Clerk + Supabase 3P Auth, RLS policy construction, webhook handling)

### NonFunctional Requirements

- NFR1: CLI scaffold operation (file generation + dependency install) completes within 60 seconds on a standard broadband connection
- NFR2: Generated projects start dev server within 10 seconds of `npm run dev`
- NFR3: Generated projects produce production builds within 30 seconds
- NFR4: Generated code never stores secrets in source files — all sensitive values via environment variables
- NFR5: Generated Supabase RLS policies enforce row-level security by default — no open tables
- NFR6: Generated webhook endpoints validate request signatures before processing
- NFR7: Generated auth middleware rejects unauthenticated requests to protected routes with no bypass paths
- NFR8: Generated `.gitignore` excludes `.env`, credentials, and local database files
- NFR9: CLI does not transmit telemetry, project data, or environment variables to any external service
- NFR10: Generated web templates use semantic HTML elements (nav, main, form, button)
- NFR11: Generated auth and billing pages include appropriate ARIA labels
- NFR12: Generated web templates support keyboard navigation for core flows (sign-in, sign-up, billing)
- NFR13: Generated Clerk + Supabase Third-Party Auth integration functions without manual JWT configuration beyond environment variables
- NFR14: Generated Drizzle schema and migration files execute against a fresh Supabase database without errors
- NFR15: Generated Clerk Billing webhook handler correctly processes subscription lifecycle events (create, update, cancel)
- NFR16: All third-party SDK versions pinned to specific compatible versions — no floating ranges
- NFR17: Each template's dependency versions documented in a single manifest for easy audit
- NFR18: Automated smoke tests validate all three templates on every change to the CLI or template code
- NFR19: Template code structured so upstream SDK updates require changes in predictable, localized locations
- NFR20: Templates updated within two weeks of major upstream stable releases (Clerk, Supabase, Drizzle, Expo)

### Additional Requirements

From Architecture document:

- **Starter approach:** Commander.js + @inquirer/prompts + chalk + fs-extra + execa (no framework)
- **Template storage:** Static files with string replacement (no template engine)
- **Variable substitution:** `{{projectName}}`, `{{projectNameKebab}}`, package manager lock file selection, package manager commands in README
- **Repository structure:** Single npm package with `src/`, `templates/`, `tests/` directories
- **Build tooling:** tsup for TypeScript compilation to distributable JS
- **Testing:** Vitest for unit tests, shell script smoke tests
- **CI/CD:** GitHub Actions for smoke tests (on push/PR) and npm publish (on tagged release)
- **Monolith workspace:** npm `workspaces` field in root package.json (`["web", "mobile", "shared"]`)
- **Auth integration:** Native Supabase 3P Auth with `accessToken` callback — NOT deprecated JWT templates
- **Template build order:** Monolith first → Solo Mobile → Solo Web (monolith establishes patterns, solos are subsets)
- **Cross-platform:** macOS, Linux, Windows support
- **Node.js target:** 22+ LTS

### UX Design Requirements

No UX Design document — not applicable for this project. Generated templates use shadcn/ui and NativeWind defaults; the generated code is the design deliverable.

### FR Coverage Map

- FR1: Epic 1 — CLI entry point via npx
- FR2: Epic 1 — Template selection prompt
- FR3: Epic 1 — Package manager selection prompt
- FR4: Epic 1 — Project name confirmation prompt
- FR5: Epic 1 — Flag-based prompt bypass
- FR6: Epic 1 — Partial flag support
- FR7: Epic 1 — Error messages for invalid input
- FR8: Epic 1 — Progress feedback during scaffold
- FR9: Epic 1 — Project directory generation
- FR10: Epic 1 — Dependency installation
- FR11: Epic 1 — Lock file generation
- FR12: Epic 1 — .env.example generation
- FR13: Epic 1 — ESLint/Prettier/Husky/TypeScript config generation
- FR14: Epic 1 — README generation
- FR15: Epic 1 — Generated project builds and starts
- FR16: Epic 2 — Clerk auth provider at root
- FR17: Epic 2 — Sign-in/sign-up pages
- FR18: Epic 2 — Server middleware for protected routes
- FR19: Epic 2 — Supabase 3P Auth integration
- FR20: Epic 2 — Supabase client with Clerk token passthrough
- FR21: Epic 3 — Clerk Billing integration
- FR22: Epic 3 — Pricing page
- FR23: Epic 3 — Subscription checkout flow
- FR24: Epic 3 — Billing webhook handling
- FR25: Epic 3 — Billing portal redirect
- FR26: Epic 3 — Three-tier RBAC enforcement
- FR27: Epic 3 — Three default roles (super_admin, paid, free)
- FR28: Epic 3 — Super_admin god-mode
- FR29: Epic 3 — Role-based route protection (server)
- FR30: Epic 3 — Role-based UI gating (client)
- FR31: Epic 3 — RLS role-based data access (database)
- FR32: Epic 3 — Paywall/upgrade prompts
- FR33: Epic 2 — Drizzle ORM configured with Supabase
- FR34: Epic 2 — Typed schema with user roles table
- FR35: Epic 2 — Database migration scripts
- FR36: Epic 2 — Example typed queries
- FR37: Epic 4 — Zustand with persistence
- FR38: Epic 4 — React Hook Form + Zod example
- FR39: Epic 4 — shadcn/ui component library
- FR40: Epic 4 — NativeWind styling
- FR41: Epic 4 — Skeleton loading components
- FR42: Epic 4 — Tailwind CSS configured
- FR43: Epic 5 — Consistent naming across templates
- FR44: Epic 5 — Monolith web = Solo Web patterns
- FR45: Epic 5 — Monolith mobile = Solo Mobile patterns
- FR46: Epic 5 — Shared TypeScript types and Drizzle schema
- FR47: Epic 4 — Zero lint errors on fresh scaffold
- FR48: Epic 1, Epic 6 — CLI exit codes
- FR49: Epic 1 — Deterministic output
- FR50: Epic 4 — Inline comments on non-obvious wiring

## Epic List

### Epic 1: CLI Foundation & Scaffold Engine
Developer can run `npx create-rell-app my-project`, select a template and package manager via interactive prompts or flags, and get a complete project directory generated with dependencies installed.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR48, FR49

### Epic 2: Monolith Template — Authentication & Database
The Full-Stack Monolith template generates a working Next.js + Expo project with Clerk auth (native Supabase 3P auth), sign-in/sign-up pages, protected routes, Drizzle schema with user roles, and typed database queries. Auth works on first `npm run dev`.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR33, FR34, FR35, FR36

### Epic 3: Monolith Template — Billing & Access Control
The monolith template adds Clerk Billing (pricing page, checkout flow, webhook handling, billing portal) and synchronized three-tier RBAC (super_admin/paid/free) across server middleware, client hooks, and Supabase RLS. Generated project has a complete auth + billing + access control system.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32

### Epic 4: Monolith Template — Application Foundation & DX
The monolith template is complete — Zustand with persistence, React Hook Form + Zod example, shadcn/ui components, NativeWind styling, skeleton loaders, Tailwind configured, ESLint + Prettier + Husky, and inline code comments explaining non-obvious wiring. The generated project is a fully wired, lint-clean starting point.
**FRs covered:** FR37, FR38, FR39, FR40, FR41, FR42, FR47, FR50

### Epic 5: Solo Templates & Cross-Template Consistency
Solo Web and Solo Mobile templates are extracted from the monolith. All three templates share consistent naming, structure, and code style. A developer can choose any template and get the same quality foundation.
**FRs covered:** FR43, FR44, FR45, FR46

### Epic 6: CI/CD, Smoke Tests & npm Publishing
Automated smoke tests validate all three templates on every push. The CLI is published to npm. Anyone can run `npx create-rell-app` and get a working scaffold. Production-ready.
**FRs covered:** FR48, NFR18, CI/CD architecture requirements

## Epic 1: CLI Foundation & Scaffold Engine

Developer can run `npx create-rell-app my-project`, select a template and package manager, and get a complete project directory generated.

### Story 1.1: Initialize CLI Project with TypeScript and Commander

As a developer building create-rell-app,
I want a TypeScript project with Commander.js wired as the entry point,
So that the CLI can parse arguments and be invoked via `npx`.

**Acceptance Criteria:**

**Given** the project is set up with package.json, tsconfig.json, and tsup.config.ts
**When** the CLI is built and run with `npx create-rell-app my-project`
**Then** Commander parses the project name argument and `--template` and `--pm` flags
**And** the bin field in package.json points to the compiled entry point
**And** running with `--help` displays usage information

### Story 1.2: Add Interactive Prompts for Template and Package Manager Selection

As a developer scaffolding a new project,
I want interactive prompts to select my template and package manager,
So that I can configure my scaffold without memorizing flag syntax.

**Acceptance Criteria:**

**Given** the CLI is run without flags (e.g., `npx create-rell-app my-project`)
**When** the interactive prompt flow starts
**Then** the developer is asked to select a template (Solo Web, Solo Mobile, Full-Stack Monolith)
**And** the developer is asked to select a package manager (npm, pnpm, yarn)
**And** the developer can confirm or modify the project name
**And** partial flags skip their corresponding prompts (e.g., `--template web` skips template prompt)
**And** all flags provided skips all prompts entirely

### Story 1.3: Build Scaffold Engine with File Copy and Variable Substitution

As a developer scaffolding a new project,
I want the CLI to copy template files and substitute project-specific variables,
So that I get a correctly named, ready-to-use project directory.

**Acceptance Criteria:**

**Given** a template directory exists in `templates/` and the developer has selected a template
**When** the scaffold engine runs
**Then** all files from the selected template directory are copied to the target project directory
**And** `{{projectName}}` is replaced with the actual project name in package.json, README, and config files
**And** `{{projectNameKebab}}` is replaced with the kebab-case project name where needed
**And** the output is deterministic — same inputs produce the same directory structure
**And** an `.env.example` file is included with all required environment variables documented

### Story 1.4: Add Package Manager Abstraction and Dependency Installation

As a developer scaffolding a new project,
I want dependencies installed automatically using my chosen package manager,
So that I can run the project immediately after scaffolding.

**Acceptance Criteria:**

**Given** the scaffold engine has copied template files to the target directory
**When** dependency installation runs
**Then** `npm install`, `pnpm install`, or `yarn install` executes based on the developer's selection
**And** the correct lock file is generated (package-lock.json, pnpm-lock.yaml, or yarn.lock)
**And** non-selected lock files are removed from the project directory
**And** package manager-specific commands in README are updated to match the selection
**And** progress feedback is displayed during installation via chalk

### Story 1.5: Add Error Handling, Validation, and Exit Codes

As a developer using the CLI,
I want clear error messages for invalid input and proper exit codes,
So that I can fix issues quickly and use the CLI in CI scripts.

**Acceptance Criteria:**

**Given** the developer provides invalid input (empty project name, non-existent template, invalid flag values)
**When** the CLI processes the input
**Then** a clear, actionable error message is displayed
**And** the CLI exits with a non-zero exit code on failure
**And** the CLI exits with code 0 on successful scaffold
**And** if the target directory already exists, the CLI warns and asks for confirmation
**And** progress feedback is displayed during scaffold and install operations

## Epic 2: Monolith Template — Authentication & Database

The Full-Stack Monolith template generates a working Next.js + Expo project with Clerk auth (native Supabase 3P auth), sign-in/sign-up pages, protected routes, Drizzle schema with user roles, and typed database queries.

### Story 2.1: Create Monolith Template Base Structure

As a developer scaffolding a full-stack monolith,
I want the template to generate a project with Next.js web, Expo mobile, and shared directories,
So that I have a properly structured monorepo to build on.

**Acceptance Criteria:**

**Given** the developer selects the Full-Stack Monolith template
**When** the scaffold completes
**Then** the project contains `web/`, `mobile/`, and `shared/` directories
**And** the root `package.json` has `workspaces: ["web", "mobile", "shared"]`
**And** a `tsconfig.base.json` provides shared TypeScript configuration
**And** `web/` has a working Next.js App Router project that starts with `npm run dev`
**And** `mobile/` has a working Expo project with Expo Router
**And** `shared/` has a `package.json` and is importable from both web and mobile

### Story 2.2: Add Clerk Authentication with Native Supabase Third-Party Auth

As a developer building a SaaS product,
I want Clerk authentication wired with Supabase via native 3P auth,
So that my users can sign in and Supabase RLS policies trust Clerk tokens.

**Acceptance Criteria:**

**Given** the monolith template is scaffolded with environment variables configured
**When** the web app starts
**Then** `<ClerkProvider>` wraps the root layout
**And** the Supabase client is initialized with an `accessToken` callback using `session?.getToken()`
**And** the server-side Supabase client uses `auth().getToken()` from Clerk Next.js SDK
**And** RLS policies reference `auth.jwt()->>'sub'` for user identification
**And** the deprecated `getToken({ template: 'supabase' })` pattern is NOT used
**And** `.env.example` documents all required Clerk and Supabase keys

### Story 2.3: Add Sign-In/Sign-Up Pages and Protected Route Middleware

As a developer building a SaaS product,
I want sign-in and sign-up pages scaffolded with Clerk middleware protecting dashboard routes,
So that unauthenticated users are redirected and protected routes are secure.

**Acceptance Criteria:**

**Given** Clerk auth is configured in the template
**When** the generated project runs
**Then** `/sign-in` and `/sign-up` routes render Clerk's auth components
**And** `clerkMiddleware()` is configured in `middleware.ts` to protect `(dashboard)` routes
**And** unauthenticated requests to protected routes redirect to `/sign-in`
**And** authenticated users can access the dashboard
**And** the auth middleware has no bypass paths

### Story 2.4: Add Drizzle Schema, Migrations, and Typed Queries

As a developer building a SaaS product,
I want a Drizzle ORM schema with user roles table, migration scripts, and example typed queries,
So that I have a working database layer from day one.

**Acceptance Criteria:**

**Given** Supabase is configured via environment variables
**When** the developer runs Drizzle migrations
**Then** the `user_roles` table is created with `clerk_user_id`, `role`, `created_at` columns
**And** the schema is defined in `shared/db/schema.ts` (single source of truth for monolith)
**And** typed query helpers exist in `shared/db/queries.ts`
**And** migration files are generated in `shared/db/migrations/`
**And** all table names use `snake_case` plural, all columns use `snake_case`
**And** example queries demonstrate typed select and insert operations

## Epic 3: Monolith Template — Billing & Access Control

The monolith template adds Clerk Billing (pricing page, checkout flow, webhook handling, billing portal) and synchronized three-tier RBAC (super_admin/paid/free) across server middleware, client hooks, and Supabase RLS.

### Story 3.1: Add Clerk Billing with Pricing Page and Checkout Flow

As a developer building a subscription SaaS,
I want a pricing page with subscription tiers and a checkout flow,
So that my users can view plans and subscribe.

**Acceptance Criteria:**

**Given** Clerk Billing is configured via environment variables
**When** the generated project runs
**Then** a pricing page at `(dashboard)/billing/` displays subscription tiers
**And** users can initiate a subscription checkout flow
**And** the checkout redirects through Clerk Billing
**And** the pricing page is accessible to both free and paid users

### Story 3.2: Add Billing Webhook Handling and Billing Portal

As a developer building a subscription SaaS,
I want webhook handling for billing lifecycle events and a billing portal redirect,
So that subscription changes are processed and users can manage their billing.

**Acceptance Criteria:**

**Given** the billing webhook endpoint exists at `api/webhooks/clerk-billing/route.ts`
**When** Clerk sends subscription lifecycle webhooks (create, update, cancel)
**Then** the webhook handler validates the request signature before processing
**And** subscription status changes are handled appropriately
**And** the handler returns appropriate HTTP status codes
**And** a billing portal redirect allows users to manage their subscription
**And** inline comments explain the webhook signature validation and event handling

### Story 3.3: Add Three-Tier RBAC with Server, Client, and Database Enforcement

As a developer building a SaaS with role-based access,
I want synchronized RBAC across server middleware, client hooks, and Supabase RLS,
So that access control is enforced consistently with no holes.

**Acceptance Criteria:**

**Given** the user roles table exists with `super_admin`, `paid`, and `free` roles
**When** role-based access is checked
**Then** server helpers in `lib/auth/roles.ts` provide `hasRole()`, `isAdmin()` functions
**And** `clerkMiddleware()` enforces role checks on protected API routes
**And** RLS policies in Supabase enforce `auth.jwt()->>'sub'` and role-based data access
**And** `super_admin` has full god-mode access across all routes and data
**And** inline comments explain the three-tier RBAC architecture and RLS policy construction

### Story 3.4: Add Paywall Prompts and Role-Based UI Gating

As a developer building a freemium SaaS,
I want client-side role gating and upgrade prompts for free users,
So that paid features are visible but gated with clear upgrade paths.

**Acceptance Criteria:**

**Given** the RBAC system is in place with role helpers
**When** a free-tier user accesses a paid feature
**Then** a `<RoleGate>` component conditionally renders content based on user role
**And** a `<PaywallPrompt>` component displays an upgrade CTA for free users
**And** role checks use the `useAuth()` hook for client-side gating
**And** the components are reusable across any route or feature

## Epic 4: Monolith Template — Application Foundation & DX

The monolith template is complete — Zustand with persistence, React Hook Form + Zod example, shadcn/ui components, NativeWind styling, skeleton loaders, Tailwind configured, ESLint + Prettier + Husky, and inline code comments.

### Story 4.1: Add Zustand State Management with Persistence

As a developer building a SaaS product,
I want Zustand configured with persistence,
So that I have a ready-to-use state management layer.

**Acceptance Criteria:**

**Given** the monolith template is scaffolded
**When** the developer opens the project
**Then** a Zustand store exists in `stores/app-store.ts` with persistence middleware
**And** the web store uses `localStorage` persistence
**And** the mobile store uses MMKV persistence
**And** the store includes an example state slice demonstrating usage patterns

### Story 4.2: Add React Hook Form with Zod Validation and Example Form

As a developer building forms,
I want React Hook Form with Zod validation pre-configured with an example,
So that I have a working form pattern to build on.

**Acceptance Criteria:**

**Given** the monolith template is scaffolded
**When** the developer opens the project
**Then** an example form component demonstrates React Hook Form + Zod integration
**And** the Zod schema is the single source of truth — TypeScript types derived via `z.infer<>`
**And** form validation errors display inline
**And** the example includes both client-side validation and form submission handling

### Story 4.3: Add shadcn/ui, NativeWind, Skeleton Loaders, and Tailwind

As a developer starting a new project,
I want UI frameworks and loading components pre-configured,
So that I can build polished interfaces immediately.

**Acceptance Criteria:**

**Given** the monolith template is scaffolded
**When** the developer opens the project
**Then** shadcn/ui is configured in `web/` with base components installed
**And** NativeWind is configured in `mobile/` with Tailwind support
**And** Tailwind CSS is configured and working in both web and mobile
**And** skeleton loader components exist in `components/shared/` (SkeletonCard, SkeletonTable)
**And** `loading.tsx` files use skeleton components for route-level loading states
**And** web templates use semantic HTML elements (nav, main, form, button)
**And** auth and billing pages include appropriate ARIA labels
**And** keyboard navigation works for sign-in, sign-up, and billing flows

### Story 4.4: Add ESLint, Prettier, Husky Configuration and Inline Comments

As a developer starting a new project,
I want DX tooling pre-configured and non-obvious code explained with comments,
So that code quality is enforced and I can understand the wiring.

**Acceptance Criteria:**

**Given** the monolith template is scaffolded
**When** the developer runs `npm run lint`
**Then** ESLint and Prettier run with zero errors on the fresh scaffold
**And** Husky pre-commit hook runs lint-staged on commit
**And** TypeScript strict mode is enabled with no `any` types
**And** inline comments explain Clerk + Supabase 3P auth `accessToken` callback pattern
**And** inline comments explain RLS policy construction and `auth.jwt()->>'sub'` usage
**And** inline comments explain billing webhook signature validation
**And** `.gitignore` excludes `.env`, credentials, and local database files

## Epic 5: Solo Templates & Cross-Template Consistency

Solo Web and Solo Mobile templates are extracted from the monolith. All three templates share consistent naming, structure, and code style.

### Story 5.1: Extract Solo Web Template from Monolith

As a developer who only needs a web app,
I want a Solo Web template that uses the same patterns as the monolith's web portion,
So that I get a lighter scaffold without mobile code.

**Acceptance Criteria:**

**Given** the monolith template is complete and validated
**When** the Solo Web template is created
**Then** it contains the same `app/`, `components/`, `lib/`, `db/`, `stores/` structure as monolith's `web/`
**And** the `db/` directory is at the project root (not in `shared/`)
**And** all auth, billing, RBAC, and DX patterns are identical to the monolith web portion
**And** no references to mobile code, shared workspace, or monolith structure remain
**And** the template builds and starts without errors

### Story 5.2: Extract Solo Mobile Template from Monolith

As a developer who only needs a mobile app,
I want a Solo Mobile template that uses the same patterns as the monolith's mobile portion,
So that I get a lighter scaffold without web code.

**Acceptance Criteria:**

**Given** the monolith template is complete and validated
**When** the Solo Mobile template is created
**Then** it contains the same `app/`, `components/`, `lib/`, `db/`, `stores/` structure as monolith's `mobile/`
**And** the `db/` directory is at the project root (not in `shared/`)
**And** all auth, billing, RBAC, and DX patterns are identical to the monolith mobile portion
**And** no references to web code, shared workspace, or monolith structure remain
**And** the template builds and starts without errors

### Story 5.3: Validate Cross-Template Consistency

As a developer using any template,
I want all three templates to share consistent conventions,
So that switching between projects or templates is predictable.

**Acceptance Criteria:**

**Given** all three templates exist (monolith, web, mobile)
**When** comparing templates side-by-side
**Then** naming conventions are identical (file naming, component naming, database naming)
**And** code style is identical (TypeScript conventions, export patterns, import patterns)
**And** auth/billing/RBAC wiring uses the same patterns across all templates
**And** environment variable names and `.env.example` format are consistent
**And** README structure and content style is consistent

## Epic 6: CI/CD, Smoke Tests & npm Publishing

Automated smoke tests validate all three templates on every push. The CLI is published to npm. Production-ready.

### Story 6.1: Create Smoke Test Scripts for All Templates

As a developer maintaining the CLI tool,
I want automated smoke tests that validate all templates,
So that I catch breakage before publishing.

**Acceptance Criteria:**

**Given** all three templates exist
**When** the smoke test script runs
**Then** each template is scaffolded using flag-based (non-interactive) mode
**And** `npm install` succeeds for each scaffold
**And** `npm run build` succeeds for each scaffold
**And** `npm run lint` passes with zero errors for each scaffold
**And** key files are verified to exist in the scaffold output (.env.example, package.json, README.md)
**And** the script reports pass/fail per template and exits with appropriate code

### Story 6.2: Set Up GitHub Actions CI Pipeline

As a developer maintaining the CLI tool,
I want smoke tests to run automatically on every push and PR,
So that I'm alerted to breakage before merging.

**Acceptance Criteria:**

**Given** the smoke test scripts exist
**When** a push or PR is made to the repository
**Then** GitHub Actions builds the CLI from TypeScript source
**And** runs the full smoke test suite across all three templates
**And** the pipeline fails if any template's scaffold, build, or lint fails
**And** the pipeline runs on macOS and Linux (minimum)

### Story 6.3: Configure npm Publish Pipeline and CLI README

As a developer ready to ship the CLI,
I want an npm publish pipeline and a polished README,
So that anyone can install and use the tool via `npx create-rell-app`.

**Acceptance Criteria:**

**Given** all smoke tests pass and the CLI is ready for release
**When** a tagged release is pushed to the repository
**Then** GitHub Actions runs the full smoke test suite
**And** on success, publishes the package to the npm public registry
**And** the npm README includes tool description, usage examples, template comparison, and flag reference
**And** the package.json `bin` field is configured for `create-rell-app`
**And** `npx create-rell-app --help` displays correct usage information
