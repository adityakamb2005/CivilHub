# Atomic acceptance security review

Source review: 22 October 2026. Local execution/correction update: 23 October 2026.
Local PostgreSQL security tests, JWT/browser checks and 13 distinct concurrency
scenarios have execution evidence in [the integration report](../ATOMIC_INTEGRATION_TEST_REPORT.md).
Hosted ownership, data and operational compatibility have not been validated.
This supersedes the earlier dedicated `civilhub_acceptor` design.

## Findings and corrections

| Area | Current implementation and evidence boundary |
| --- | --- |
| Hosted role compatibility | No CREATE ROLE, BYPASSRLS attribute change, ownership transfer or privileged membership grant. 016 runs as existing postgres owner and refuses unexpected ownership/RLS/API memberships. Local Supabase installation was already successful; hosted owners, privileges and drift still need separate review. |
| Authorization | RPC authenticates auth.uid(), canonical client role and project owner under locks, then checks application project/status and canonical engineer identity, including accepted retries. Definer rights never substitute for application authorization. |
| RLS and privileges | Existing table policies remain active for ordinary requests. Explicit RPC ACLs remove PUBLIC/anon/service_role execution and allow authenticated. No API role receives trigger-function EXECUTE. 017 tightens workspace/project/conversation role checks and uses a scoped nonrecursive relationship helper for conversation INSERT. Standard local RPC/trigger ACL assertions passed; hosted custom/default/inherited grants remain unverified. |
| Search paths | All new 015-017 functions use pg_catalog and qualified public/auth references. No dynamic SQL or caller-controlled relation names. Older helper definitions remain separate deployed-inventory checks. |
| Assignment consistency | Invoker guards block ordinary direct assignments and accepted transitions. 015 freezes application identity/content. One accepted application per project is enforced by a partial index. Historical accepted/assigned mismatches and duplicates fail migration rather than being rewritten. Admin corrections still require deliberate policy. |
| Transactions | Assignment, selected decision, rival decisions and notification triggers execute in one RPC transaction without an exception-swallowing handler. Mocked safe error responses and the real local rollback-injection/notification assertions passed on 22 October. |
| Locks | Acceptance locks project then applications by UUID. Submission locks the same project and rechecks eligibility. Prepared specifications cover both submission/acceptance orderings, rival accepts and same-target retries. Thirteen local scenarios passed on 23 October, including both withdrawal/rejection orderings and actual completion after acceptance. Higher isolation, admin batches and FK deletion remain unverified. |
| Retry semantics | A matching accepted retry performs no SQL writes, even on a completed project; an accepted record without the matching assignment fails. Unknown/deadlock/serialization errors return safe failure feedback and permit a fresh user retry. |
| Private profiles | Scoped RPCs return existing applicant-card fields or conversation names/avatars/company only for the authorized relationship. They never return unrestricted private rows, phone or CV/history JSON. Base profiles still have their original broad read policy; broader privacy policy is outside this cutover. |
| 017 syntax | Malformed bare-dollar function delimiters were corrected. Dollar-quote text checks include 015-017 and SQL artifacts. These checks do not parse PostgreSQL or PL/pgSQL. |
| Signup/profile editing | Canonical workspace INSERT policies permit the matching user role. Trusted signup uses its existing owner function and default-unverified data. Workspace IDs, ownership and created_at are immutable; descriptive fields remain editable. Admin verification is retained through the canonical admin guard. |
| Authentication | Login, callback and proxy use database roles, never user metadata. Missing roles go to account-unavailable without a protected-route loop. Redirects retain refreshed cookies and sanitize local destinations. Password recovery points through the callback to update-password; handlers reject invalid sessions. |
| Project form | Each mounted form initializes/reuses one UUID, checks ownership before accepting a duplicate retry and rejects unconfirmed inserts. Validation covers required fields and date order. Raw database diagnostics are no longer displayed. This does not survive reloads. |
| Messaging | Context errors deny conversation creation; duplicate races select the authorized existing tuple. Sending binds the current sender and checks membership without requiring the hidden counterpart. Private display lookup errors are surfaced by both inboxes. Existing recipient-only read updates and content trigger remain. |

## Source and platform references

The hosted owner-based alternative follows these documented behaviors, rather
than presuming arbitrary privileged-role creation is available:

- [Supabase restricted postgres role](https://supabase.com/docs/guides/database/postgres/roles-superuser).
- [PostgreSQL row security and owner bypass](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- [Supabase database function security and permissions](https://supabase.com/docs/guides/database/functions).
- [Supabase custom-role/default privilege guidance](https://supabase.com/docs/guides/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c).

The platform docs support the design choice, not a claim about this project's
deployed owners, migration-role permissions or runtime results. No hosted
database was contacted. Do not grant owner membership or disable RLS to work
around a failing preflight.

## Before applying or releasing

Keep tests version-compatible: the 015-only script belongs before 016, while
the current local schema uses the acceptance/profile security suites and Python
races. Before hosted use, inspect intended installer privileges, trigger order,
ACLs and schema drift; local success does not certify the hosted environment.
Review legacy data, index locking cost, admin/portfolio corrections, maintenance deletion and
private applicant field disclosure. Validate real JWTs and browser flows in that
isolated environment. Coordinate app/migrations with a write pause; keep database
and application rollback compatible. Committing, pushing, main merging and
deployment remain outside this task's authorization.

## Pre-commit safety corrections

Connection validation now parses effective libpq parameters, rejects all URI query
options and nonempty PG-prefixed environment settings, and pins the exact verified
loopback endpoint. Fresh local builds are mandatory for both entry points; unsafe
cached-build reuse is removed. The completion race dispatch and final-state
assertion are corrected. Stubbed negative/cleanup tests ran without external
connections or browser account mutations; see the report for exact commands.
