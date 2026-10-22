# P0 application identity containment — prepared, unapplied

## Scope and files

New migration: `supabase/migrations/015_project_application_identity_guard.sql`.
New PostgreSQL test script: `tests/sql/project_application_identity_guard.sql`.
This note records compatibility, limits and later test requirements. All paths
are relative to `A:\civix\CivilHub`.

015 deliberately leaves number 014 unused rather than reviving its rejected
recursive/private-profile visibility design. No existing migration or application
file is edited. Only project_applications policies/triggers and their new trigger
functions are changed. No database connection, SQL execution or migration
application is authorized by this implementation task.

## Protections

The unconditional BEFORE UPDATE trigger compares OLD and NEW with IS DISTINCT
FROM for id, project_id, engineer_profile_id, cover_message and created_at. It
raises SQLSTATE 23000 when any differs, including changes to/from NULL. The
trigger is attached to every UPDATE, not UPDATE OF particular columns, and
contains no role or policy exception. It applies to engineer, client and admin
UPDATE paths and also trusted SQL updates unless an operator disables/bypasses
the trigger. Echoing identical immutable values is allowed. Existing rows are
not rewritten or repaired.

status and updated_at are intentionally not frozen. The existing
project_applications_updated_at BEFORE UPDATE trigger still sets updated_at;
the new guard does not assign it. In the checked-in trigger names the identity
guard runs before the timestamp trigger, and neither mutates the other's fields.
The existing 013 AFTER INSERT/UPDATE notification trigger is untouched.

The existing engineer INSERT policy gains status='pending', retaining its
canonical engineer-role, own engineer-profile and published/active/unassigned
project predicates. Project correlation is explicit. It does not broaden any
SELECT policy, add an eligible status, or change messaging rules.

The existing admin FOR ALL policy is permissive and combines with the engineer
policy using OR. It is intentional that a canonical database administrator can
manage/import applications independently. Ordinary SQL grants do not bypass
RLS, but table owners/BYPASSRLS can, and unknown deployed permissive policies
could separately authorize INSERT. A second BEFORE INSERT trigger therefore
rejects non-pending status unless existing public.is_admin() returns true. NULL
from that helper is treated as false. The helper from 006 reads profiles.role
for auth.uid() as a SECURITY DEFINER; it does not trust user_metadata or a
caller-provided admin flag. There is **no admin exception to identity freezing**.

Both new functions are SECURITY INVOKER with search_path=pg_catalog and qualified
references to public.is_admin(). Direct function execution is revoked from
PUBLIC, anon and authenticated, following 013's trigger-function ACL pattern.
Migration changes and revocations are enclosed in one transaction. Existing
table/column privileges and the admin management policy are not altered.

## Compatibility assessment (source inspection, not live verification)

| Workflow | Effect |
| --- | --- |
| Engineer submission | Current action omits status; existing pending default satisfies policy/trigger. Existing uniqueness and FK checks remain |
| Engineer withdrawal | Current action writes only status='withdrawn'; identity guard allows it; existing ownership/pending RLS remains |
| Client acceptance | Current action writes assignment on projects, then status='accepted' on application and rejects competitors; immutable fields are not touched |
| Client rejection | Current action writes only status='rejected'; remains allowed by existing owner policy |
| Admin management | Canonical admin INSERTs (including non-pending imports), status updates, reads and deletes retain existing policy behavior; historical identity/content rewrites are deliberately rejected even for admins |
| updated_at | Existing handle_updated_at trigger is retained and not modified |
| Migration 013 notifications | Existing AFTER triggers continue firing for successful submissions and decisions; rejected identity/INSERT statements abort before notification side effects |
| Application uniqueness | UNIQUE(project_id,engineer_profile_id) is unchanged; duplicate submissions still fail |

There is no app-level privilege escalation or new RLS subquery cycle. Migration
015 does not enforce all status transitions, acceptance cardinality or atomic
assignment; those belong to later stages of the plan. Canonical admins can still
import accepted rows and client owners can still directly update status under
the existing policy. Treat those as retained management capabilities and
remaining consistency risks, not as solved by the pending engineer rule.

## Deployed-state and operator review gates

Before authorizing application, compare actual deployed policies, effective
table/column/function grants, owners, function definitions and trigger ordering
with the read-only inventory in MARKETPLACE_SECURITY_PLAN.md. In particular:

- Confirm public.is_admin() is the canonical helper from 006, profiles.role is
  protected, and authenticated has the required helper execution privilege.
- Confirm the named engineer INSERT policy exists. DROP POLICY deliberately
  fails if it is missing rather than silently masking unexpected deployment
  drift; CREATE FUNCTION/TRIGGER also fails on an unexpected name collision.
- Inspect extra permissive policies. The new INSERT trigger still blocks
  ordinary non-pending inserts, but cannot repair a separate policy that permits
  unauthorized *pending* identities or project eligibility. Such drift requires
  separate review; do not blindly delete unknown policies.
- Confirm ordinary callers cannot alter/disable triggers/functions or set
  replication mode to bypass them. Database owners/privileged operators remain
  trusted infrastructure, not an adversarial user boundary.
- A service-role/database session without an authenticated canonical admin
  identity can no longer insert non-pending applications through this guard.
  Review seed/import/maintenance writers; do not add an unreviewed role/GUC
  bypass. Existing pending inserts and subsequent authorized status updates work.
- Admin identity corrections and migrations rewriting submitted context now
  require a separately authorized maintenance procedure. No bypass is provided.

Do not apply the migration to production or development as part of this task.
No existing data is modified, deleted or globally validated by preparing it.

## Prepared PostgreSQL tests — NOT EXECUTED

No isolated PostgreSQL test environment/configuration is established in the
repository. SQL execution is explicitly prohibited for this task, so even an
available database would require separate authorization. The prepared psql
script requires an operator-approved disposable environment with reviewed
migrations 001–013 and 015 already installed. It never installs a migration.

Required pre-existing dedicated fixtures: a client with client_profiles row, an
engineer with engineer_profiles row, and a canonical admin account. Pass their
user UUIDs as psql variables client_user_id, engineer_user_id and admin_user_id,
plus isolated_test_confirmed=true. Do not invent credentials or use production
accounts. A trusted test operator must be able to SET ROLE authenticated and
create/drop a temporary test policy; these capabilities are never granted to
application users by the script or migration. The script does not grant missing
database privileges to make a failing test pass.

All projects/applications/notification side effects are created within BEGIN
and rolled back. Real protected writes run as authenticated with a simulated
auth.uid() request context, not owner RLS bypass. The script does not verify JWT
signatures or constitute a browser/API authentication test. ON_ERROR_STOP aborts
on an assertion; disconnect/ROLLBACK an interrupted session instead of committing
it. The explicit isolation flag is an operator acknowledgement, not automatic
proof of database identity; inspect the connection target independently.

Prepared assertions cover:

- Pending default submission and unchanged application uniqueness.
- Each of the five forbidden identity/content changes during withdrawal,
  requiring the exact guard SQLSTATE/message, plus unchanged original state.
- The manufactured relationship failing to expose an unrelated private project.
- Pending→withdrawn with database-managed updated_at; client pending→accepted
  and pending→rejected using the current action's payloads.
- Rejected non-pending inserts, including accepted status with forged admin
  metadata and under an extra permissive INSERT policy. That test policy is
  rolled back and never added to the migration.
- Canonical admin non-pending import/status management, and admin/client identity
  rewrites being rejected by the same unconditional guard.
- Migration 013 submission/accepted/rejected notifications in the correct accounts.

These SQL assertions must not be reported as passed until executed against an
approved isolated PostgreSQL environment. Existing JavaScript tests exercise
application control flow using mocks and cannot establish database security.

## Validation and remaining work

`node --test tests/marketplace.test.cjs`: 37 passed, 0 failed (existing mocked
application tests). `npm.cmd run build`: production compilation, TypeScript
checking and static generation passed outside the sandbox, using process-only
dummy Supabase settings pointing to loopback to avoid production access. No
environment file was edited. `git diff --check` passed; the three new files also
received whitespace review. SQL assertions were not executed. No dependency or
test framework is added. Starting hashes are checked for all pre-existing
uncommitted files and migrations 001–013; final preservation is reported below
in the task response.

Remaining risks: multi-request acceptance, multiple accepted applications,
direct project assignment/status changes, verification-field edits, private
participant visibility, notification content updates, legacy manipulated data,
and the analogous opportunity application pattern. This migration intentionally
does not solve those separate stages or change unrelated tables.

The migration remains unapplied. Stop for review and explicit authorization
before any deployment or database-backed test run.
