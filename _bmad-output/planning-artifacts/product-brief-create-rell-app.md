---
title: "Product Brief: create-rell-app"
status: "draft"
created: "2026-04-01"
updated: "2026-04-01"
inputs: ["user brain dump", "competitive web research"]
---

# Product Brief: create-rell-app

## Executive Summary

Every new project starts the same way: hours of dead time wiring auth, billing, database, state management, forms, and UI components before you can write a single line of actual product code. The tools exist — Clerk, Supabase, Drizzle, shadcn/ui — but none of them ship pre-connected. You configure each one, then spend a full day making them talk to each other.

**create-rell-app** is a personal npm CLI tool that eliminates this zero-to-runnable gap. Run one command, pick a template, and get a fully wired application shell — not config files, not boilerplate, a *working app* you can `npm run dev` immediately and see auth flows, billing, role-based access, database queries, and loading states functioning end to end. Three templates cover the three shapes a solo builder's project takes: web (Next.js), mobile (React Native/Expo), and full-stack monolith (both, shared schema).

The timing is right. The modern indie stack has converged — Clerk, Supabase, Drizzle, Tailwind, shadcn/ui are each at mainstream adoption — but no tool wires them together in a runnable shell. Paid SaaS boilerplates ($199–$349) solve pieces but ship as git-clone repos, not CLI scaffolders, and none touch mobile. The mobile and full-stack monolith gap is wide open — no CLI scaffolder exists for React Native SaaS apps, making create-rell-app the first to address this space.

## The Problem

Starting a new project in 2026 means assembling the same foundational stack from scratch — every single time:

- **Auth:** Configure Clerk provider, wire middleware for protected routes, integrate Supabase Third-Party Auth so JWTs are trusted, build sign-in/sign-up pages. The Clerk + Supabase Third-Party Auth integration — making Supabase trust Clerk JWTs so RLS policies work seamlessly — is one of the most-searched and most-frustrating configurations in the modern indie stack. Developers burn hours on this exact problem, navigating sparse documentation and edge cases around token refresh and RLS policy construction.
- **Billing:** Set up Clerk Billing, build a pricing page, wire subscription checkout, handle lifecycle webhooks, add a billing portal redirect.
- **Access control:** Implement RBAC across three synchronized layers — server middleware, client-side hooks, and Supabase RLS policies — with role checks for super_admin, paid, and free tiers. Most boilerplates get one layer right and leave the others as an exercise. Getting all three layers to enforce the same rules consistently is an architecturally significant problem with real security implications when done wrong.
- **Database:** Configure Drizzle ORM, write schema files, set up migrations, initialize the Supabase client with Clerk token passthrough.
- **State, forms, UI, DX:** Zustand with persistence, React Hook Form + Zod, shadcn/ui components, skeleton loaders, ESLint + Prettier + Husky.

None of this is novel work. It's the same stack, the same wiring, the same patterns — but it takes hours because every provider, client, middleware, and layout has to be manually connected. That's time that should be spent building the actual product.

Existing solutions don't solve this:

| Tool | What it does | What's still missing |
|------|-------------|---------------------|
| create-t3-app | Scaffolds Next.js + tRPC + Drizzle + Tailwind | No auth, billing, RBAC, or mobile |
| ShipFast, MakerKit, Supastarter ($199–$349) | Git-clone SaaS boilerplates with auth + payments | No CLI, no mobile, no interactive scaffolding |
| Expo community starters | Scattered repos for React Native + Supabase | No standardized tool, no billing or RBAC wired |

The market has 70+ Next.js starter templates. Nearly all are git-clone repos, not CLI tools. None ship a fully wired web + mobile monolith. The gap between "configured" and "working" remains the developer's problem.

## The Solution

**One command. Pick a template. Start building.**

```bash
npx create-rell-app my-project
```

Interactive prompts walk you through template selection and project configuration. Flags are available for power users and CI environments. The output is a runnable application shell with every integration connected and functioning.

**Prerequisites:** A Clerk account (with Billing enabled), a Supabase project, and their respective API keys. Environment variable templates ship with every scaffold, documenting every required key.

**Three templates:**

- **Solo Web App** — Next.js, TypeScript, Tailwind, shadcn/ui, Clerk auth + Supabase 3P integration, Clerk Billing, RBAC, Drizzle ORM, Zustand, React Hook Form + Zod, ESLint + Prettier + Husky
- **Solo Mobile App** — React Native + Expo, TypeScript, NativeWind, same auth/billing/RBAC/database/state stack
- **Full-Stack Monolithic App** — Next.js frontend + API routes, React Native + Expo mobile client, shared TypeScript types and Drizzle schema, shadcn/ui on web, unified auth and billing

**Every template ships fully wired:**

- Auth provider wrapped at root, middleware configured, Supabase RLS policies trusting Clerk JWTs, sign-in/sign-up pages scaffolded
- Billing integration with pricing page, checkout flow, webhook handling, billing portal
- Three-tier RBAC (super_admin, paid, free) enforced consistently at server, client, and database layers — with a personal super_admin god-mode across every app. Built for people who are the CEO, the engineer, and the support team.
- Database schema with typed queries, user roles table, migration scripts
- Zustand store with persistence, example form with validation, skeleton loading components, paywall/upgrade prompts
- Environment variable templates with every key documented

**Code quality commitment:** Every generated file is code you would be comfortable reading, modifying, and owning — no black boxes, no abstraction layers you can't see through. You delete the example code and start building your actual features.

## What Makes This Different

1. **Wired, not configured.** Competitors ship config files. create-rell-app ships a working application where auth, billing, and access control are integrated and functioning on first run. The hardest integration — Clerk JWTs trusted by Supabase RLS — is solved out of the box.

2. **Mobile-first gap.** No CLI scaffolder exists for React Native SaaS apps. The Solo Mobile and Full-Stack Monolithic templates have zero direct competition in the CLI scaffolding space.

3. **Free and CLI-driven.** Paid boilerplates ($199–$349) require git-cloning a repo and manual configuration. create-rell-app is free, interactive, and on npm — the distribution channel developers already use.

4. **Opinionated for solo builders.** Not a kitchen-sink framework. Three templates, one stack, zero decisions. The super_admin god-mode role encodes a specific worldview: solo builders need to move fast and see everything across every app they ship.

5. **Subscriptions from day one.** Auth and billing are baked into the architecture from the start. You never have to retrofit subscription management or role checks into an app that was built without them.

6. **Synchronized three-tier RBAC.** Role-based access enforced consistently across server middleware, client-side hooks, and Supabase RLS policies. Most starters get one layer right — create-rell-app wires all three so access control doesn't have holes.

## Who This Serves

**Primary user: The solo/indie builder** who ships web and mobile products on a modern TypeScript stack. Knows the tools, has strong opinions about the stack, but is tired of re-wiring the same foundation for every new project. Values speed-to-feature over flexibility-of-choice.

This is a personal tool — built to match one developer's exact stack and workflow. Published on npm for anyone who shares the same opinions.

## Success Criteria

- **Zero config-to-running friction:** `npx create-rell-app my-project && cd my-project && npm run dev` produces a working app with auth, billing, and RBAC functioning (after environment variables are configured)
- **Clean, ownable output:** Generated code passes lint with zero errors, follows consistent conventions, and is structured for easy modification
- **All three templates ship in v1:** Web, mobile, and full-stack monolith
- **Template currency:** Core dependencies stay current with stable releases; templates updated within two weeks of major upstream stable releases
- **Scaffold integrity:** Each template installs, builds, and starts without errors — validated by automated smoke tests

## Scope

**In scope for v1:**
- CLI with interactive prompts and flag-based usage
- Three templates: Solo Web, Solo Mobile, Full-Stack Monolith
- Fully wired auth, billing, RBAC, database, state, forms, UI, and DX tooling in every template
- Comprehensive README and inline documentation in every scaffolded project
- Environment variable templates with setup instructions
- Published to npm public registry

**Out of scope for v1:**
- AI-powered features (potential future: automated vulnerability scanning, dependency update monitoring)
- Custom template authoring or plugin system
- Multi-tenancy or team-based access patterns
- Alternative auth/database/payment providers
- Dedicated documentation site or marketing page
- Deployment platform configuration (Vercel, EAS Build)
- Post-scaffold update/sync mechanism

## Known Considerations

- **Third-party dependency:** The tool's core promise depends on Clerk, Supabase, and Clerk Billing remaining stable and available. Breaking changes in any upstream service require template updates.
- **Maintenance surface area:** Three templates across 8+ third-party libraries means a meaningful ongoing maintenance commitment to keep the "fully wired" promise intact.
- **No upgrade path:** Once scaffolded and modified, there is no mechanism to pull upstream template improvements into an existing project. This is a known limitation for v1.

## Vision

If create-rell-app succeeds, it becomes the standard starting point for every new project — a personal infrastructure layer that evolves with the stack. Future directions could include automated dependency health monitoring, security vulnerability scanning, template versioning that lets you pull upstream improvements into existing projects, and deployment wiring (Vercel, EAS Build configs). The core premise stays the same: never wire the same foundation twice.
