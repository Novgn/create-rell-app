# Security Policy

## Supported versions

Only the latest published version of `create-rell-app` receives security updates.

## Reporting a vulnerability

If you discover a security vulnerability in the CLI or in the templates it
ships, please report it privately rather than filing a public GitHub issue.

**Preferred channel:** open a [Private Vulnerability Report](https://github.com/Novgn/create-rell-app/security/advisories/new)
via GitHub.

**Alternative:** email the maintainer listed in `package.json` with the
subject line `[create-rell-app security]`.

Please include:

- A description of the issue and its potential impact
- Steps to reproduce (CLI invocation, template, environment)
- Any proof-of-concept code

We aim to acknowledge reports within 72 hours and publish a fix within
14 days for critical issues.

## Scope

In scope:

- The CLI itself (path traversal, command injection, subprocess handling)
- Default security posture of the generated templates (auth gaps, RLS, webhook verification, CSRF, XSS)

Out of scope:

- Third-party services referenced by the templates (Clerk, Supabase) — report those directly to the vendor
- User-introduced misconfiguration of a scaffolded project
