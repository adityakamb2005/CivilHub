# Atomic acceptance integration - locally validated

Source review: 22 October 2026. Pre-commit corrections: 23 October 2026.
The disposable local Supabase instance has migrations 001-013 and 015-017.
No hosted migration or deployment was performed. See
[the integration report](../ATOMIC_INTEGRATION_TEST_REPORT.md) for prior results
and newly verified corrections, including 13 distinct local concurrency scenarios.

## Transaction boundary

The server action authenticates the user, checks the canonical client role,
loads the client workspace, verifies project ownership and checks application
eligibility. It calls `accept_project_application(target_project_id,
target_application_id)` exactly once. There is no fallback to three table writes.
The RPC repeats authorization and state checks under database locks; application
preflight reads are never its authorization boundary.

The RPC locks the project first, then all existing applications in UUID order.
It verifies the canonical engineer, assigns the engineer, accepts the selected
pending application and rejects pending rivals. Existing notification triggers
participate in the same transaction. Any constraint, notification, trigger,
deadlock or serialization error aborts the transaction. A matching accepted retry
returns without writes or new notifications, including after project completion.
Mismatched historical assignments are rejected, never silently repaired.

Ordinary users cannot assign engineers directly or transition applications to
accepted outside the RPC. Pending withdrawal and owner rejection retain their
existing direct actions, RLS and decision guards. Migration 015 preserves submitted
identity/content for all callers, including admins. A partial unique index limits
each project to one accepted application. The insert serializer locks the same
project and rechecks eligibility so a new pending rival cannot slip past acceptance.

## Owner and permissions

The current migration does **not** create `civilhub_acceptor`, request BYPASSRLS,
transfer ownership or grant membership in an elevated role. It must be installed
as the existing `postgres` table owner. The preflight refuses unexpected table
ownership, disabled/FORCE RLS, elevated ordinary API roles or API membership in
`postgres`. Unexpected historical accepted/assigned mismatches also fail closed;
duplicate accepted rows fail the unique-index creation. No existing data is fixed.

The two SECURITY DEFINER functions run with the existing owner's rights and use
`search_path = pg_catalog` plus qualified application references. The RPC checks
`auth.uid()` and canonical roles explicitly. Only `authenticated` receives RPC
EXECUTE; PUBLIC, anon and service_role grants are revoked. Trigger functions have
no API EXECUTE grant. Invoker guards recognize trusted owner execution or a
canonical application admin, never editable metadata or a custom GUC flag.

This avoids the previous privileged-role installation requirement. It remains a
powerful owner function: deployed owners, default/custom grants, existing definer
writers and trigger-disable/DDL privileges must be audited. Hosted installation
has not been executed or certified. PostgreSQL ownership bypass and Supabase's
restricted postgres role are documented in the linked review.

## Migration ordering and profile integration

Install 001-013, then 015, 016 and 017 in an explicitly isolated disposable test
database first. There is no 014 dependency; no rejected visibility migration is
recreated. The 015-only test must run before 016; it now fails fast after cutover.

017 protects client/engineer workspace identity, engineer verification and
notification content. It requires canonical roles when users create workspaces
or manage projects. Scoped messaging/applicant display RPCs return the fields
needed by existing screens without granting SELECT on private counterpart rows.
Conversation INSERT uses the same canonical relationship helper as the action;
conversation SELECT also checks the caller's canonical role. Existing messages
policies and content guards continue to protect sender and recipient operations.
No profile SELECT policy is broadened and no recursive profile policy is added.

017 and its call sites must ship together: the inbox/thread display and
conversation-start actions depend on its functions. Missing-function errors are
reported as messaging setup failures where the display uses that distinction.

## Verification and release gates

Node tests exercise actual transpiled actions/pages/form handlers through mocked
boundaries. SQL text checks catch quoting regressions. Neither proves PostgreSQL
syntax, RLS, locking, notifications, hosted compatibility or JWT verification.

Database artifacts and execution scope:

- `tests/sql/project_application_identity_guard.sql`: the pre-016 contract;
  not run against the current schema.
- `tests/sql/atomic_project_acceptance.sql`: authorization, direct-write denial,
  rollback injection, assignment conflict, success, retries and notifications.
  Its external local-operator adaptation passed on 22 October.
- `tests/sql/atomic_project_acceptance.spec`: rival accepts, same-application
  retry and both orderings of submission versus acceptance. The specification
  itself was not executed; the Python runner exercised these races against PostgreSQL.
- `tests/sql/marketplace_profile_security.sql`: private participant/applicant
  cards, identity/verification/notification guards, canonical roles, message
  permissions and effective RPC/trigger ACL assertions; passed on 22 October.

Before committing, review the final integration diff and focused correction
results. The current local SQL suites and 13 race scenarios have passed. Before
migration/deployment, separately authorize the release, audit actual schema/ACL/data
drift, review private applicant disclosure,
and coordinate a marketplace-write pause across old application instances.
Old three-request acceptance code will fail once the guards activate. Never
roll back to that code while leaving guards installed or remove authorization
to force compatibility. Failed migration transactions must roll back completely.

## Known limits

Admins retain direct project/application management and can create a single
accepted/assigned mismatch; the RPC detects it rather than repairing it. A global
deferred consistency constraint would require a separate legacy/portfolio/admin
correction policy. Existing broad base-profile visibility and opportunity workflow
hardening remain separate review items. Rejected/withdrawn applicants retain the
existing messaging eligibility rule; changing that is a product decision.

Withdrawal/rejection, bulk/admin writes and FK deletion can interact with the
project/application lock order. Thirteen local race scenarios passed on 23
October; higher isolation, bulk/admin writes and FK deletion remain test gates.
Ordinary profile deletion can be stopped by assignment/identity guards;
maintenance paths must be reviewed. The create form reuses an ID only
within its mounted lifetime, so retries after reload are not durable idempotency.
Inbox/card fetches remain unpaginated. No production migration or deployment is
authorized by these files.

## Safe local validation

Run `node scripts/atomic-http-smoke.cjs` for a fresh production build followed by
23 HTTP checks. Both standalone HTTP and browser validation obtain the actual
local CLI publishable key, verify container port mappings and build with forced
loopback settings. Existing build output is never accepted as provenance;
`--skip-commands` has been removed. Next.js may load `.env.local`, but the verified
process settings override its public Supabase values. No environment file is edited.

The Python runner rejects URI query options, multi-host/socket destinations and
nonempty PG-prefixed environment overrides before connecting. It pins host,
hostaddr, port and database explicitly. Use `--phase concurrency` for races only;
this does not rotate passwords. Browser/all phases intentionally rotate passwords
for the four dedicated disposable local accounts and should only be run when that
side effect is intended. Cleanup attempts every fixture and reports failed IDs;
resource cleanup closes browser contexts and the browser even after failures.

ESLint remains unavailable; no lint pass is claimed and no dependency was added.
