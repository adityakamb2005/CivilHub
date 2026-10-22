# Contributing to CivilHub

Use the [README](README.md#local-setup) for local setup and
[documentation index](docs/README.md) for the current architecture and security notes.

## Before changing code

1. Work on a focused branch or worktree. Preserve unrelated pending changes.
2. Read `AGENTS.md`. Next.js 16 has changed APIs; consult the installed guides in
   `node_modules/next/dist/docs/` rather than relying on older examples.
3. Use an isolated disposable backend. Do not run a local build or test with
   unverified hosted environment settings.
4. Keep credentials, environment files, browser sessions and generated output out
   of commits. Do not introduce dependencies or change database policy casually.

## Validation and review

- Run affected Node checks with `node --test tests/*.test.cjs` when appropriate.
  Keep mocked unit coverage distinct from real SQL/JWT/browser evidence.
- Build and type-check changes that affect application behavior using verified
  local public Supabase settings. The opt-in HTTP runner enforces a fresh build
  and requires the external test installation described in the integration report.
- Use the correct SQL test stage: the 015-only contract precedes 016; current
  acceptance/profile suites require the later schema. SQL security suites create
  fixtures and must never run against production.
- Python browser/all phases deliberately rotate dedicated disposable passwords.
  They are not required for ordinary documentation edits.
- ESLint is not configured; do not claim a lint pass.
- Run `git diff --check`, review the exact diff and describe behavior, tests and
  remaining limits in the pull request. Include genuine local screenshots for
  visible changes when practical.

Do not rewrite an already-deployed migration. Propose a separately reviewed
forward migration and preserve ownership, RLS, grants and application compatibility.
Production rollout, hosted schema changes and credentials require separate
maintainer approval under the [deployment procedure](docs/DEPLOYMENT.md).

For suspected security vulnerabilities, use GitHub private vulnerability reporting
if enabled. Otherwise ask the [maintainer](https://github.com/adityakamb2005) for a
private channel; do not publish credentials or exploit details in an issue.

No license file is currently included; this guide does not select a license.
