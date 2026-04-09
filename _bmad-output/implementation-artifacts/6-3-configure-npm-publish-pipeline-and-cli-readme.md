# Story 6.3: Configure npm Publish Pipeline and CLI README

Status: done

## Story

As a developer ready to ship the CLI,
I want an npm publish pipeline and a polished README,
so that anyone can install and use the tool via `npx create-rell-app`.

## Acceptance Criteria

1. A new file `.github/workflows/publish.yml` defines the npm publish pipeline.
2. The publish workflow triggers on pushed tags matching `v*` (e.g. `v0.1.0`, `v1.0.0-beta.1`).
3. The publish workflow runs the full smoke test suite (reusing the same steps as `ci.yml`'s `smoke` job, but on `ubuntu-latest` only — no need for macos during publish since CI already validated cross-platform).
4. After smoke tests pass, the workflow runs `npm run build` to produce `dist/cli.js`, then publishes to the npm public registry via `npm publish` with `--provenance` for supply chain transparency.
5. The workflow uses `secrets.NPM_TOKEN` (a repository secret the maintainer configures) for npm authentication. The workflow sets `NODE_AUTH_TOKEN` for the `npm publish` step only.
6. The workflow sets `id-token: write` permission for npm provenance attestation.
7. A `README.md` file exists at the repository root with:
   - Tool name and one-line description
   - Quick-start usage (`npx create-rell-app my-project`)
   - Template comparison table (Solo Web, Solo Mobile, Full-Stack Monolith) with key features per template
   - Flag reference (`--template`, `--pm`, `--no-install`, `--help`, `--version`)
   - What you get section (brief list of what the generated project includes: Clerk auth, Supabase, Drizzle, billing, RBAC, etc.)
   - Requirements (Node 22+)
   - License
8. The README does NOT include internal development instructions (contributing, architecture, test commands) — those belong in a future CONTRIBUTING.md if needed.
9. `package.json` `bin` field already points to `./dist/cli.js` as `create-rell-app` (verified, no change needed).
10. `npx create-rell-app --help` already displays correct usage information (verified, no change needed).
11. `npm test` still passes with zero regressions.
12. The publish YAML passes basic syntax validation.

## Tasks / Subtasks

- [ ] Write `.github/workflows/publish.yml`
- [ ] Write `README.md` at project root
- [ ] Validate YAML syntax
- [ ] Run `npm test` to confirm no regressions
- [ ] Commit

## Dev Notes

### Publish workflow design

The publish workflow is intentionally separate from `ci.yml`:
- Different trigger (`tags` vs `push/PR`)
- Different permissions (`id-token: write` for provenance)
- Different scope (publish to npm vs validate code)

The smoke tests run again during publish even though CI already ran them on the branch. This is belt-and-suspenders: the tag might point to a commit that was force-pushed after CI passed, or CI might have been skipped.

### npm provenance

`npm publish --provenance` signs the package with a Sigstore attestation linked to the GitHub Actions workflow that built it. This lets consumers verify:
- Which commit produced the package
- Which workflow published it
- That no human touched the build between source and registry

Requires `id-token: write` permission and `registry-url` set on `actions/setup-node`.

### NPM_TOKEN setup (manual, not automated)

The maintainer must:
1. Create an npm access token at https://www.npmjs.com/settings/tokens (type: Automation)
2. Add it as a repository secret named `NPM_TOKEN` in GitHub repo settings

The workflow references `secrets.NPM_TOKEN` — if the secret is missing, the publish step fails with a clear auth error.

### README scope

The README is the npm package README — it's what users see on the npmjs.com page and when they run `npm info create-rell-app`. It should sell the tool and show usage, not document internal development workflows. Keep it concise.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD & Publishing — "Publish pipeline"]
- [Source: _bmad-output/planning-artifacts/prd.md#FR48 NFR18]
