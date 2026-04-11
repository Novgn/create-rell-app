# Database migrations — {{projectName}}

This directory holds the Drizzle schema, typed query helpers, and SQL migration files for {{projectName}}. Every change to the database shape should land here first, be reviewed, and only then applied to Supabase.

## Files

- `schema.ts` — Drizzle table definitions. **Single source of truth.**
- `queries.ts` — typed helper functions the app uses to read/write the schema.
- `client.ts` — lazy-initialized Drizzle client factory.
- `migrations/` — hand-written and generated SQL, applied in order.

## Workflow

### Adding a column or table

1. Edit `schema.ts` to declare the new column/table.
2. Run `{{pmRunCmd}} db:generate`. Drizzle Kit diffs `schema.ts` against the current migration history and writes a new file under `migrations/`.
3. Inspect the generated SQL. Edit if you need custom indexes, RLS policies, or `SECURITY DEFINER` helpers — those live in hand-written migrations alongside the generated ones.
4. Commit both `schema.ts` and the new migration file in the same commit so they stay in lockstep.
5. Apply with `{{pmRunCmd}} db:migrate` (against your Supabase database URL exported in the shell or loaded via a .env file).

### Hand-written migrations

Some changes — RLS policies, SECURITY DEFINER helpers, extension installs — aren't generated automatically. Write them by hand in a new file named `NNNN_<slug>.sql` where `NNNN` is one higher than the last existing migration. Keep them forward-only: no rollbacks. If a change is risky, gate it behind a feature flag at the application layer.

See `0001_rbac_helpers.sql` for an example of a hand-written RLS helper.

## Row-Level Security

RLS is ENABLED on the `user_roles` table. The policies reference `auth.jwt()->>'sub'` to match Clerk's user ID — see `0000_initial.sql` for the baseline and `0001_rbac_helpers.sql` for the `is_super_admin()` helper. Any new table that stores per-user data MUST enable RLS and add an equivalent scoped policy.
