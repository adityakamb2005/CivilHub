# Atomic acceptance — prepared, unapplied

Migration `016_atomic_project_acceptance.sql` depends on 001–013 and 015.
014 remains unused. No SQL or integration tests were executed. This note extends,
and does not replace, MARKETPLACE_SECURITY_PLAN.md and P0_APPLICATION_IDENTITY.md.
See ATOMIC_ACCEPTANCE_REVIEW.md for the later static review, confirmed fixes and unresolved hosted-compatibility gates.

## Implemented boundary

`accept_project_application(uuid,uuid)` authenticates auth.uid(), checks the
canonical client role, project owner, matching application and canonical engineer.
It locks the project then all its applications in UUID order, rechecks state,
assigns the engineer, accepts the pending application and rejects pending rivals.
An accepted/matching retry performs no writes. A pending application with any
existing assignment is inconsistent and is not silently repaired. Acceptance
retains active-only eligibility; existing applications need not remain published.
The server keeps its authentication and preflight checks and existing UI strings,
then sends one RPC. Partial-success messages have been removed because failures
now roll back every write. Cache paths and component interfaces are preserved.

The dedicated `civilhub_acceptor` NOLOGIN/NOINHERIT/BYPASSRLS owner receives explicit grants for
schema usage, canonical identity helper execution, required SELECT and two UPDATE
columns. It has no INSERT/DELETE, role memberships, or persistent schema CREATE.
Do not grant membership to authenticated, anon, authenticator or any API identity.
This implementation uses BYPASSRLS here to authorize and lock private application rows without
changing private-profile SELECT policies. Execution of the acceptance RPC is
revoked from PUBLIC/anon and granted only to authenticated. Trigger functions are
not API entry points; their execution is revoked from PUBLIC/anon/authenticated.
All new functions use pg_catalog search_path and qualified application references.

Invoker guards distinguish the unassumable function owner from authenticated.
They forbid ordinary project assignment on INSERT/change on UPDATE, project
ownership/ID changes, and accepted-status transitions outside the RPC. Ordinary
pending withdrawal and owner rejection retain their existing direct action/RLS
paths. Migration 015 still freezes application identities and prevents ordinary
nonpending INSERTs. A definer INSERT trigger serializes new applications on the
project before checking eligibility, so an acceptance cannot miss a late pending
submission. It adds no private data output and changes no SELECT policies.

The partial unique index permits at most one accepted application per project,
including administrator writes. Ordinary project fields remain editable; existing
assignments and engineer_portfolios are untouched. Canonical admins retain direct
project creation/edit/assignment and application status management, subject to
015 identity immutability and the unique index. Shared authenticated grants and
existing RLS are deliberately retained; unconditional triggers protect the fields
rather than trying to restore revoked privileges with an admin RLS predicate.

013 notification functions/triggers are unchanged. Selected acceptance and rival
rejection notifications run in the same transaction. No-op retries emit none.
Any trigger error aborts assignment, statuses and notifications together.

## Coordinated deployment gates — not authorized here

1. Review actual deployed owners, grants, memberships, policies, security-definer
   functions and trigger definitions against source. Ensure API roles cannot
   disable triggers, assume the capability role, alter protected objects or invoke
   another owner-privileged arbitrary writer. Review inherited and column ACLs.
   The migration intentionally fails on role/name collisions instead of adopting
   an unknown role. A sufficiently privileged operator must approve creation and
   ownership transfer of the BYPASSRLS role; platform support is not assumed.
2. Inventory all existing accepted rows, duplicate accepted projects, pending rows
   with assignments, mismatched assignments and non-engineer assigned identities.
   The unique index fails the entire migration on duplicates. No automatic repair
   is included. Large-table index build/lock duration requires operator assessment.
3. Approve a marketplace-write pause covering old app instances and external
   writers. Apply the complete migration transaction and deploy the RPC app while
   paused; verify isolated authenticated tests and admin/client editing before
   reopening writes. The old three-request app will fail after guards activate.
   Do not deploy these guards separately or restore broad bypasses on rollback.
4. Run the prepared SQL assertions and concurrency specification only in an
   explicitly authorized disposable PostgreSQL environment. Validate real JWT API
   requests separately; simulated SQL claims do not test JWT verification.

## Testing

`tests/marketplace.test.cjs` runs real transpiled actions with mocked Supabase.
It verifies one RPC, parameters, auth/preflight denial, retries, safe RPC errors,
cache paths and absence of direct acceptance writes. It cannot prove atomicity,
locks, RLS, notification behavior or database privileges.

`tests/sql/atomic_project_acceptance.sql` is an unexecuted psql integration test.
It requires dedicated client, two distinct engineer and admin accounts plus a
trusted disposable test superuser. It creates fixtures as authenticated admin,
exercises authenticated decisions, injects a competitor-trigger failure after
the selected acceptance, checks full rollback, success/retry/conflict behavior,
bypass denial, rival rejection and exactly-once decision notifications, then
rolls everything back. The fixed fixture title must be absent beforehand.
`tests/sql/atomic_project_acceptance.spec` defines unexecuted multi-session races
for PostgreSQL isolationtester. Setup requirements are recorded in that file.
The old 015 SQL script tests the pre-016 contract: its direct client acceptance
assertion is expected to fail after cutover; run it against the 015 stage only.

## Remaining risks / decisions

This is a bounded ordinary-user acceptance boundary, not the entire security plan.
Admin corrections can still produce mismatched accepted/assigned state (but not
multiple accepted rows); the RPC detects these rather than repairing them. Global
deferred assignment/application consistency constraints are deferred because
existing admin assignments, portfolios, client deletion and historical assignments
need provenance and correction rules first. Approve those rules before extending
constraints; no existing assignment is reclassified by this migration.

Direct withdrawals/rejections do not take the parent lock. They contend on
application rows with acceptance; behavior is unverified and admin/bulk writers can deadlock;
a deadlock/serialization error aborts the whole transaction and the caller retries.
Admins and trusted writers should use project-before-application order for batches.
The project guard can block FK-driven owner/engineer nulling during ordinary user
profile deletion. No such delete UI is present; review account deletion jobs and
run them with a canonical admin identity or approve a narrowly designed maintenance
path before cutover. Existing assignment/edit operations themselves are preserved.

Live ACL/policy drift, legacy data manipulation, broad notification updates,
engineer verification/profile identity edits, opportunity applications and private
participant display remain separate review areas. No new privacy policy or 014
visibility design is introduced. Deployment, data repairs, role capability choice,
active-only acceptance and future admin correction/invariant policy require review.
No deployment or SQL execution is authorized by this local implementation.

## Local validation

- node --test tests/marketplace.test.cjs: 42 passed, 0 failed.
- npm.cmd run build: passed compilation, TypeScript and 36-page generation.
  A sandbox cache access-denied failure required an approved outside-sandbox run.
  Process-only Supabase settings pointed to loopback; no env file was changed.
- git diff --check: passed; new untracked artifacts also checked for whitespace.
- SQL assertions and isolation permutations: prepared only, not executed.


