# CivilHub End-to-End Verification Report

Date: 2026-09-10
Environment: local Next.js development server (`http://localhost:3000`), configured Supabase project from `.env.local`

## Overall status

PARTIAL / BLOCKED by the configured Supabase database state and unavailable authenticated test credentials.

The application started successfully and all reachable public/UI-only flows were exercised. The configured Supabase project does not currently expose the four required application/content tables, so database-backed opportunity, resource, project, application, engineer-authenticated, and admin workflows could not be completed safely.

## Migration/database inspection

The configured project was queried directly through its REST endpoint using the configured publishable key. Results:

| Table | Result |
| --- | --- |
| `profiles` | PASS — returned rows |
| `engineer_profiles` | PASS — returned rows |
| `resources` | BLOCKED — PostgREST `PGRST205`, table not found in schema cache |
| `opportunities` | BLOCKED — PostgREST `PGRST205`, table not found in schema cache |
| `projects` | BLOCKED — PostgREST `PGRST205`, table not found in schema cache |
| `opportunity_applications` | BLOCKED — PostgREST `PGRST205`, table not found in schema cache |

Because the target tables are absent and only a publishable key is configured, the actual production columns, indexes, and RLS policies for migrations 003, 004, 005, and 007 could not be inspected. No database password, service-role key, Supabase CLI, or authorized migration runner was available, so migrations were not applied.

## PASS

1. Development server started successfully and reported ready on `http://localhost:3000`.
2. `/` rendered successfully.
3. `/engineers` rendered publicly after the middleware boundary fix.
4. An available public engineer detail route rendered successfully.
5. `/tools` rendered successfully.
6. All nine calculator routes rendered successfully:
   - Area
   - Volume
   - Concrete
   - Cement
   - Sand
   - Steel
   - Unit Converter
   - Brick/Block
   - Cost Estimator
7. All nine calculators were exercised with valid values; finite result output was observed.
8. All nine calculators were exercised with zero input; validation feedback appeared and no `NaN` or `Infinity` was rendered.
9. Negative area input was rejected by the native minimum constraint without unsafe output.
10. Reset controls were exercised on all nine calculators; values/results were cleared or restored to the component’s documented defaults.
11. Unit conversion was exercised: `1 m` converted to `3.28084 ft`.
12. `/resources`, `/opportunities`, and `/projects` rendered their handled unavailable/empty states rather than crashing when their missing tables were queried.
13. Malformed detail URLs returned the expected not-found states for engineers, resources, and opportunities.
14. Valid-but-unavailable opportunity and project IDs returned their handled unavailable states.
15. Unauthenticated access to `/engineer/dashboard`, `/engineer/profile`, `/admin/dashboard`, `/admin/opportunities`, `/admin/applications`, and `/client/dashboard` redirected to the login flow with the original route preserved.
16. Login and registration pages rendered with accessible labels, controls, and redirect support.
17. Invalid login submission displayed an authentication error from Supabase.
18. Browser console inspection found no warnings or errors during the reachable route/calculator sweep.
19. `npm.cmd run build` passed after the verification bug fix.
20. `git diff --check` passed; only CRLF normalization warnings were emitted.

## FAIL

1. Footer navigation links `/about`, `/contact`, `/privacy`, and `/terms` each return a 404 page. Severity: P2 navigation defect. These pages are outside the applications MVP and were not added during verification.

## BLOCKED

1. Applying and verifying migrations 003, 004, 005, and 007: target tables are absent and no authorized database migration credentials/runner are configured.
2. Verifying live columns, indexes, and RLS policies for those tables: blocked by the missing tables and lack of privileged metadata access.
3. Engineer login, logout, authenticated dashboard, profile save/update, visibility changes, workspace data, and associated project/resource links: no authorized engineer credentials were provided; content tables are also absent.
4. Admin login and admin dashboard/content CRUD/publish workflows: no authorized admin credentials were provided; resource/opportunity/project tables are absent.
5. Published/open opportunity detail and end-to-end application submission: no published opportunity is available because `opportunities` is absent.
6. Duplicate application prevention, status display, withdrawal, and admin status update: `opportunity_applications` is absent.
7. Non-engineer authenticated application denial: no authenticated test account was available and no opportunity exists to reach the application action.
8. Email confirmation/SMTP-dependent registration completion: no test mailbox or SMTP verification path was available.

## Bug fixed during verification

`proxy.ts` used raw `startsWith('/engineer')`, which incorrectly classified the public `/engineers` route as protected `/engineer/*`. The matcher now requires an exact segment boundary. `/engineers` was re-tested and rendered publicly.

## Remaining limitations

- Apply the project’s migrations through an authorized Supabase migration path, then rerun the blocked database and authenticated workflow checks.
- Provide disposable engineer/admin test credentials (and email verification access if required) for full role and mutation coverage.
- The four missing footer destinations remain unresolved.

## Final Git state

No commit or push was performed. The working tree contains the applications MVP changes, the middleware boundary fix, and this report.
