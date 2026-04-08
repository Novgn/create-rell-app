---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments: ["_bmad-output/planning-artifacts/product-brief-create-rell-app.md"]
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: "cli_tool / developer_tool"
  domain: "general"
  complexity: "low"
  projectContext: "greenfield"
workflowType: 'prd'
---

# Product Requirements Document - create-rell-app

**Author:** Wayne
**Date:** 2026-04-04

## Executive Summary

**create-rell-app** is a personal npm CLI tool that eliminates the zero-to-runnable gap for solo/indie builders on a modern TypeScript stack. Run one command, pick a template, and get a fully wired application shell — not config files, not boilerplate, a working app with auth flows, billing, role-based access, database queries, and loading states functioning end to end on first `npm run dev`.

The tool solves a specific, recurring problem: the modern indie stack has converged — Clerk, Supabase, Drizzle, Tailwind, shadcn/ui — but no tool wires them together. Every new project means hours re-connecting the same integrations, producing inconsistent results across a portfolio of apps. create-rell-app codifies one developer's exact opinions and wiring patterns into a reusable CLI, ensuring velocity and consistency across every project.

Three templates cover the three shapes a solo builder's project takes: **Solo Web App** (Next.js), **Solo Mobile App** (React Native/Expo), and **Full-Stack Monolith** (both, shared schema). Each ships with Clerk auth + Supabase Third-Party Auth integration, Clerk Billing with pricing/checkout/webhooks, synchronized three-tier RBAC (server, client, database), Drizzle ORM with migrations, and full DX tooling.

### What Makes This Special

- **Wired, not configured.** The hardest integrations — Clerk JWTs trusted by Supabase RLS, three-tier RBAC enforcement, billing lifecycle webhooks — are solved once and reused on every scaffold. Competitors ship config; create-rell-app ships a running application.
- **Mobile-first gap.** No CLI scaffolder exists for React Native SaaS apps. The Solo Mobile and Full-Stack Monolith templates have zero direct competition.
- **Personal infrastructure layer.** Not a framework or kitchen-sink starter. It encodes one developer's exact stack choices and workflow, published on npm for anyone who shares the same opinions. Every project starts from the same high-quality baseline.
- **Free and CLI-driven.** Paid boilerplates ($199–$349) require git-cloning and manual configuration. create-rell-app is free, interactive, and distributed through npm.

## Project Classification

- **Project Type:** CLI Tool / Developer Tool — npm-distributed command-line scaffolder with interactive prompts and flag-based usage
- **Domain:** General (developer tooling)
- **Complexity:** Low — no regulatory or compliance requirements; complexity lives in template quality and integration correctness
- **Project Context:** Greenfield — new product, no existing codebase

## Success Criteria

### User Success

- **Time-to-feature:** Scaffold to writing product feature code in under 15 minutes (including env var configuration).
- **Confidence on first run:** `npm run dev` produces a working app with auth flows, billing page, RBAC enforcement, and database queries functioning — no debugging integration wiring.
- **Code ownership:** Generated code is clean, readable, and immediately modifiable. No black boxes or abstraction layers to learn.

### Business Success

- **Personal velocity:** Measurably faster project starts across a portfolio of apps. The tool pays for its development investment within the first 2-3 projects scaffolded.
- **Consistency:** Every project shares the same foundation patterns, making context-switching between projects frictionless.
- **Published on npm:** Available via `npx` for anyone who shares the same stack opinions. Adoption metrics are not a primary success measure.

### Technical Success

- **Scaffold integrity:** All three templates install, build, and start without errors — validated by automated smoke tests.
- **Zero lint errors:** Generated code passes ESLint + Prettier with zero warnings or errors out of the box.
- **Template currency:** Core dependencies stay current with stable releases; templates updated within two weeks of major upstream stable releases.
- **Integration correctness:** Clerk + Supabase Third-Party Auth, three-tier RBAC, and billing webhooks function correctly on first scaffold with no manual wiring.

### Measurable Outcomes

- Scaffold-to-dev-server time under 15 minutes (including env var setup)
- 0 lint errors on fresh scaffold
- 100% of smoke tests passing across all three templates
- All auth/billing/RBAC integrations functional on first `npm run dev`

## User Journeys

### Journey 1: Wayne Scaffolds a New Web SaaS — Happy Path

**Who:** Wayne, solo builder with a new product idea. Has Clerk and Supabase accounts ready.

**Opening Scene:** Saturday morning. Wayne has a new SaaS idea. Previously, this moment meant 3-4 hours wiring Clerk, Supabase, Drizzle, billing, and RBAC before writing a single line of product code — copy-pasting middleware configs from the last project, debugging subtle differences.

**Rising Action:**
1. Runs `npx create-rell-app my-saas`
2. Interactive prompts ask: template? (Solo Web App) Project name? Package manager?
3. CLI scaffolds the project, installs dependencies
4. Wayne copies Clerk and Supabase keys into `.env` using the documented template
5. Runs `npm run dev`

**Climax:** The browser opens. Auth pages work. He signs in, sees the dashboard, navigates to the billing page — pricing tiers render. Supabase RLS policies trust his Clerk JWT. RBAC is enforced at server, client, and database layers. Everything is wired and running.

**Resolution:** By 9:15am, Wayne is writing his first product feature. The foundation is identical to his last three projects — same patterns, same conventions, same quality.

---

### Journey 2: Wayne Picks the Wrong Template — Edge Case

**Who:** Wayne, starting what he thought was a web-only project.

**Opening Scene:** Wayne scaffolds a Solo Web App. Two days into building features, he realizes this needs a mobile companion app and should have been a Full-Stack Monolith.

**Rising Action:**
1. No migration path between templates (known v1 limitation)
2. Wayne runs `npx create-rell-app my-saas-v2` and selects Full-Stack Monolith
3. A fresh scaffold generates with shared schema, web frontend, and mobile client
4. Wayne migrates his 2 days of feature code into the new scaffold manually

**Climax:** The migration is straightforward because the web portion of the Full-Stack Monolith uses the same patterns, conventions, and file structure as the Solo Web App. Feature code drops in with minimal changes.

**Resolution:** Wayne loses some time but not much — consistent foundation across templates means moving between them is predictable.

---

### Journey 3: External Developer Discovers create-rell-app on npm

**Who:** Alex, an indie developer who uses Clerk + Supabase + Next.js. Found create-rell-app while searching npm for scaffolders.

**Opening Scene:** Alex has been copy-pasting from a private boilerplate repo for months. The Clerk + Supabase Third-Party Auth integration breaks every time Clerk updates, and RLS policies are inconsistent across projects.

**Rising Action:**
1. Reads the npm README — sees the exact stack they already use
2. Runs `npx create-rell-app test-project` to evaluate
3. Selects Solo Web App, uses default settings
4. Opens the generated code — reads through auth middleware, RLS policies, billing webhook handler

**Climax:** Alex sees the Clerk + Supabase 3P Auth integration wired correctly — the exact problem they've been struggling with. Three-tier RBAC is consistent across all layers. Code is clean and readable — no framework abstractions to learn.

**Resolution:** Alex adopts create-rell-app for their next project. The opinionated stack matches their opinions exactly.

---

### Journey 4: CI Smoke Test Validation

**Who:** Wayne (or automated CI pipeline) validating scaffold integrity after template changes.

**Opening Scene:** Wayne updated a dependency in the Solo Web template (e.g., new Clerk SDK version). Before publishing, he needs to verify all three templates still scaffold, install, build, and start correctly.

**Rising Action:**
1. CI pipeline triggers on push to the create-rell-app repo
2. For each template: runs `create-rell-app` with flag-based (non-interactive) arguments
3. Each scaffold runs `npm install`, `npm run build`, `npm run lint`
4. Smoke tests verify key files exist, no lint errors, build succeeds

**Climax:** One template fails — the new Clerk SDK changed an import path. CI catches it before publish.

**Resolution:** Wayne fixes the import, CI passes across all three templates, and he publishes with confidence that every template produces a working scaffold.

---

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---|---|
| **Happy Path Scaffold** | Interactive prompts, template selection, dependency installation, env var templates, fully wired integrations on first run |
| **Wrong Template Edge Case** | Consistent patterns across templates, clear template descriptions to aid selection, no migration tooling needed for v1 |
| **External Developer** | Clear README/documentation, readable generated code, no hidden abstractions, standard npm distribution |
| **CI Smoke Tests** | Flag-based (non-interactive) CLI mode, scriptable execution, automated build/lint/start validation |

## CLI Tool / Developer Tool Specific Requirements

### Project-Type Overview

create-rell-app is a dual-mode CLI scaffolder: interactive prompts for hands-on use, flag-based arguments for CI and scripting. Distributed via npm, it generates complete project directories with installed dependencies. The command surface is intentionally small — one command, a few prompts, done.

### Command Structure

**Primary command:**
```
npx create-rell-app <project-name> [options]
```

**Interactive mode (default):**
- Template selection (Solo Web, Solo Mobile, Full-Stack Monolith)
- Package manager preference (npm, pnpm, yarn)
- Project name confirmation

**Flag-based mode (CI/scripting):**
```
npx create-rell-app my-project --template web --pm pnpm
```
- `--template` / `-t`: web | mobile | monolith
- `--pm`: npm | pnpm | yarn
- All flags optional — missing flags trigger interactive prompts for those fields only

No shell completion for v1 — command surface is too small to warrant it.

### Output Structure

Each template generates a complete, self-contained project directory:
- Package files (`package.json` with all dependencies specified)
- Source code with fully wired integrations
- Environment variable template (`.env.example`) with every required key documented
- Configuration files (ESLint, Prettier, Husky, TypeScript)
- Database schema and migration files (Drizzle)
- README with setup instructions

### Package Manager Support

- **Distribution:** npm public registry (`npx create-rell-app`)
- **Generated projects:** User selects package manager at scaffold time (npm, pnpm, yarn)
- Dependencies installed automatically using the selected package manager
- Lock files generated match selected package manager

### Documentation Strategy (v1)

- **Generated project README:** Setup instructions, env var documentation, architecture overview, common tasks
- **Inline code comments:** Explain non-obvious wiring (e.g., Clerk + Supabase 3P Auth integration, RLS policy construction)
- **npm README:** Tool description, usage examples, template comparison
- No dedicated docs site for v1

### Scripting & CI Support

- Full non-interactive execution via flags
- Exit codes for success/failure (scaffold, install, build)
- Deterministic output — same flags produce same project structure
- Suitable for automated smoke testing in CI pipelines

### Implementation Considerations

- **Template engine:** File copying with variable substitution (project name, package manager config)
- **Dependency management:** Each template pins specific dependency versions for reproducibility
- **Cross-platform:** Must work on macOS, Linux, and Windows (Node.js runtime)
- **Node.js version:** Target current LTS (Node.js 22+)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — the minimum that lets you scaffold a new project and start writing feature code immediately. Validated by personal use: does this actually save time on the next project?

**Resource Requirements:** Solo developer build. The CLI scaffolder itself is relatively simple; the real work is in crafting and validating the three template codebases.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Happy path scaffold (Journey 1) — all three templates
- CI smoke test validation (Journey 4) — automated integrity checks

**Must-Have Capabilities:**
- CLI with interactive prompts and flag-based non-interactive mode
- Package manager selection (npm, pnpm, yarn)
- Three templates: Full-Stack Monolith, Solo Mobile, Solo Web
- Fully wired per template: Clerk auth + Supabase 3P Auth, Clerk Billing, three-tier RBAC, Drizzle ORM, Zustand, React Hook Form + Zod, shadcn/ui (web), NativeWind (mobile), ESLint + Prettier + Husky
- Environment variable templates with documentation
- Generated README with setup instructions and inline code comments
- Published to npm public registry
- Automated smoke tests for all templates

**Template Build Order:**
1. **Full-Stack Monolith** — contains both web and mobile; most complex template built first
2. **Solo Mobile** — extracted/simplified from monolith's mobile client
3. **Solo Web** — extracted/simplified from monolith's web frontend

This order maximizes reuse: the monolith establishes all patterns, and the solo templates are subsets.

### Phase 2: Growth (Post-MVP)

- Deployment platform configuration (Vercel for web, EAS Build for mobile)
- Automated dependency health monitoring
- Template versioning with upstream improvement tracking
- Security vulnerability scanning for generated output

### Phase 3: Expansion (Future)

- Post-scaffold update/sync mechanism to pull template improvements into existing projects
- Custom template authoring or plugin system
- AI-powered features (automated vulnerability scanning, dependency monitoring)
- Multi-tenancy and team-based access patterns

### Risk Mitigation Strategy

**Technical Risks:**
- *Clerk + Supabase 3P Auth integration complexity:* Hardest wiring. Mitigated by building it once in the monolith template and validating thoroughly before extracting to solo templates.
- *Clerk Billing API stability:* Clerk Billing is relatively new. Mitigate by pinning SDK versions and monitoring changelogs. Template update commitment (within 2 weeks of major releases) provides a safety net.
- *React Native + Expo unknowns:* Mobile template has more moving parts (NativeWind, Expo router, native auth flows). Mitigate by building the monolith first — mobile issues surface early.

**Market Risks:**
- Minimal — personal tool. Risk is "does it actually save time?" validated by using it on the next 2-3 projects.

**Resource Risks:**
- *Maintenance surface area:* Three templates across 8+ third-party libraries is the primary ongoing risk. Mitigate with automated smoke tests that catch breakage on dependency updates. Monolith-first build order reduces maintenance overhead — shared patterns mean fixes propagate predictably.
- *Solo developer bandwidth:* If maintenance becomes unsustainable, fallback is to freeze template versions and update only on breaking changes rather than tracking every upstream release.

## Functional Requirements

### CLI Interaction

- **FR1:** Developer can run the CLI via `npx create-rell-app <project-name>` to start a new scaffold
- **FR2:** Developer can select a template (Solo Web, Solo Mobile, Full-Stack Monolith) via interactive prompt
- **FR3:** Developer can select a package manager (npm, pnpm, yarn) via interactive prompt
- **FR4:** Developer can confirm or modify the project name via interactive prompt
- **FR5:** Developer can bypass all interactive prompts using command-line flags (`--template`, `--pm`)
- **FR6:** Developer can provide partial flags, with missing values triggering interactive prompts for only those fields
- **FR7:** CLI provides clear error messages when invalid flags or project names are provided
- **FR8:** CLI displays progress feedback during scaffold and dependency installation

### Project Scaffolding

- **FR9:** CLI generates a complete, self-contained project directory for the selected template
- **FR10:** CLI installs all dependencies using the developer's selected package manager
- **FR11:** CLI generates the correct lock file for the selected package manager
- **FR12:** CLI generates an `.env.example` file documenting every required environment variable with descriptions
- **FR13:** CLI generates configuration files for ESLint, Prettier, Husky, and TypeScript
- **FR14:** CLI generates a project README with setup instructions, architecture overview, and common tasks
- **FR15:** Generated project builds and starts without errors when environment variables are configured

### Authentication Integration

- **FR16:** Generated project includes Clerk authentication provider wrapped at the application root
- **FR17:** Generated project includes sign-in and sign-up pages fully scaffolded
- **FR18:** Generated project includes server middleware configured for protected routes
- **FR19:** Generated project includes Supabase Third-Party Auth integration — Supabase trusts Clerk JWTs via RLS policies
- **FR20:** Generated project includes Supabase client configured with Clerk token passthrough

### Billing Integration

- **FR21:** Generated project includes Clerk Billing integration
- **FR22:** Generated project includes a pricing page with subscription tier display
- **FR23:** Generated project includes subscription checkout flow
- **FR24:** Generated project includes billing lifecycle webhook handling
- **FR25:** Generated project includes billing portal redirect for subscription management

### Access Control

- **FR26:** Generated project enforces three-tier RBAC across server middleware, client-side hooks, and Supabase RLS policies
- **FR27:** Generated project includes three default roles: super_admin, paid, and free
- **FR28:** Generated project includes super_admin god-mode with full access across the application
- **FR29:** Generated project includes role-based route protection at the server layer
- **FR30:** Generated project includes role-based UI gating at the client layer
- **FR31:** Generated project includes RLS policies that enforce role-based data access at the database layer
- **FR32:** Generated project includes paywall/upgrade prompts for free-tier users accessing paid features

### Database Integration

- **FR33:** Generated project includes Drizzle ORM configured with Supabase
- **FR34:** Generated project includes typed database schema with user roles table
- **FR35:** Generated project includes database migration scripts
- **FR36:** Generated project includes example typed database queries

### Application Foundation

- **FR37:** Generated project includes Zustand state management with persistence
- **FR38:** Generated project includes React Hook Form with Zod validation and an example form
- **FR39:** Generated project includes shadcn/ui component library (web templates)
- **FR40:** Generated project includes NativeWind styling (mobile templates)
- **FR41:** Generated project includes skeleton loading components
- **FR42:** Generated project includes Tailwind CSS configured and ready to use

### Template Consistency

- **FR43:** All three templates share consistent naming conventions, file structure patterns, and code style
- **FR44:** The web portion of the Full-Stack Monolith uses identical patterns to the Solo Web template
- **FR45:** The mobile portion of the Full-Stack Monolith uses identical patterns to the Solo Mobile template
- **FR46:** The Full-Stack Monolith includes shared TypeScript types and Drizzle schema between web and mobile

### Quality & Automation

- **FR47:** Generated project passes ESLint and Prettier with zero errors on fresh scaffold
- **FR48:** CLI returns appropriate exit codes for success and failure states
- **FR49:** CLI produces deterministic output — same inputs produce the same project structure
- **FR50:** Generated project inline comments explain non-obvious wiring (Clerk + Supabase 3P Auth, RLS policy construction, webhook handling)

## Non-Functional Requirements

### Performance

- CLI scaffold operation (file generation + dependency install) completes within 60 seconds on a standard broadband connection
- Generated projects start dev server within 10 seconds of `npm run dev`
- Generated projects produce production builds within 30 seconds

### Security

- Generated code never stores secrets in source files — all sensitive values via environment variables
- Generated Supabase RLS policies enforce row-level security by default — no open tables
- Generated webhook endpoints validate request signatures before processing
- Generated auth middleware rejects unauthenticated requests to protected routes with no bypass paths
- Generated `.gitignore` excludes `.env`, credentials, and local database files
- CLI does not transmit telemetry, project data, or environment variables to any external service

### Accessibility

- Generated web templates use semantic HTML elements (nav, main, form, button)
- Generated auth and billing pages include appropriate ARIA labels
- Generated web templates support keyboard navigation for core flows (sign-in, sign-up, billing)

### Integration Correctness

- Generated Clerk + Supabase Third-Party Auth integration functions without manual JWT configuration beyond environment variables
- Generated Drizzle schema and migration files execute against a fresh Supabase database without errors
- Generated Clerk Billing webhook handler correctly processes subscription lifecycle events (create, update, cancel)
- All third-party SDK versions pinned to specific compatible versions — no floating ranges

### Maintainability

- Each template's dependency versions documented in a single manifest for easy audit
- Automated smoke tests validate all three templates on every change to the CLI or template code
- Template code structured so upstream SDK updates require changes in predictable, localized locations — not scattered across the codebase
- Templates updated within two weeks of major upstream stable releases (Clerk, Supabase, Drizzle, Expo)
