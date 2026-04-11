# create-rell-app

Scaffold a fully wired **Clerk + Supabase + Drizzle** starter app in one command. Pick a template, choose your package manager, and get a production-ready project with authentication, billing, RBAC, and database — all pre-configured and ready to run.

## Quick start

```bash
npx create-rell-app my-project
```

Follow the interactive prompts to select a template and package manager. Or skip prompts entirely with flags:

```bash
npx create-rell-app my-project --template web --pm pnpm
```

## Templates

| | Solo Web | Solo Mobile | Full-Stack Monolith |
|---|---|---|---|
| **Framework** | Next.js (App Router) | Expo (Expo Router) | Next.js + Expo monorepo |
| **Auth** | Clerk + Supabase 3P Auth | Clerk + Supabase 3P Auth | Clerk + Supabase 3P Auth |
| **Database** | Drizzle ORM + Supabase | Drizzle ORM + Supabase | Shared Drizzle schema |
| **Billing** | Clerk Billing | Clerk Billing | Clerk Billing |
| **RBAC** | Server + Client + RLS | Client + RLS | Server + Client + RLS |
| **State** | Zustand (localStorage) | Zustand (MMKV) | Both |
| **Forms** | React Hook Form + Zod | React Hook Form + Zod | Both |
| **UI** | shadcn/ui + Tailwind | NativeWind + Tailwind | Both |
| **DX** | ESLint + Prettier + Husky | ESLint + Prettier + Husky | ESLint + Prettier + Husky |

**Solo Web** — standalone Next.js app. Best for web-only SaaS products.

**Solo Mobile** — standalone Expo app. Best for mobile-only products.

**Full-Stack Monolith** — npm workspaces monorepo with `apps/web/`, `apps/mobile/`, and `packages/shared/` directories. The web and mobile portions mirror the solo templates. The shared package holds the Drizzle schema and TypeScript types used by both.

## What you get

Every generated project includes:

- **Authentication** — Clerk provider, sign-in/sign-up pages, protected route middleware, Supabase native Third-Party Auth (no deprecated JWT templates)
- **Database** — Drizzle ORM with typed schema, migration scripts, and example queries against Supabase PostgreSQL
- **Billing** — Clerk Billing with pricing page, checkout flow, webhook handler, and billing portal redirect
- **Access control** — Three-tier RBAC (super_admin / paid / free) enforced at server middleware, client hooks, and Supabase RLS policies
- **State management** — Zustand with platform-appropriate persistence
- **Forms** — React Hook Form + Zod validation with an example form
- **UI framework** — shadcn/ui (web) or NativeWind (mobile) with Tailwind CSS, skeleton loaders, and semantic HTML
- **Code quality** — ESLint, Prettier, Husky pre-commit hooks, TypeScript strict mode, zero lint errors on fresh scaffold
- **Environment config** — `.env.example` documenting every required key, `.gitignore` excluding secrets

## Flags

| Flag | Description | Example |
|---|---|---|
| `--template`, `-t` | Template to use: `web`, `mobile`, or `monolith` | `--template web` |
| `--pm` | Package manager: `npm`, `pnpm`, or `yarn` | `--pm pnpm` |
| `--no-install` | Skip dependency installation after scaffolding | `--no-install` |
| `--version`, `-v` | Print the CLI version | `-v` |
| `--help`, `-h` | Show usage information | `--help` |

When all flags are provided, prompts are skipped entirely. Partial flags skip only their corresponding prompts.

## Requirements

- **Node.js 22** or later

## License

MIT
