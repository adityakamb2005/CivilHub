# Migration 016 local security review

Reviewed 18 October 2026. **Prepared, unapplied; no PostgreSQL tests executed.**
Read migrations 001–013 and 015, migration 016, project application actions,
client create/edit payloads, admin project actions and prepared tests. This is
source review plus documentation research, not verification of deployed objects.

## Confirmed defects corrected

- `serialize_project_application_insert` had bare-dollar body delimiters. Both
  are now `$$`. The integration script also contained malformed/mismatched DO
  delimiters; those were corrected. Text regression checks cover both artifacts
  and the isolation specification; these checks are not a PostgreSQL parser.
- Function ACL changes followed ownership transfer. A non-superuser installer
  with SET ROLE permission need not inherit the new owner's ownership rights.
  ACL changes now occur before transfer, while the installer is still owner.
- The insert trigger was attached after function ownership transfer and EXECUTE
  revocation. CREATE TRIGGER checks the installer's EXECUTE permission. Attachment
  now precedes revocation/transfer; execution by an existing trigger is a separate
  mechanism. No runtime EXECUTE grants were added to ordinary users.
- Supabase can explicitly default-grant EXECUTE to service_role, independently of
  PUBLIC. New function ACLs now explicitly revoke the three standard API roles,
  then grant only authenticated execution on the acceptance RPC. Other custom
  defaults/inherited rights remain an inventory requirement, not presumed absent.
- The action rejected an already accepted retry after project completion although
  the RPC deliberately permits a matching no-op retry. Only pending acceptance
  now requires active project status in preflight; assignment consistency checks
  remain. Added a mocked regression test for the completed-project retry.

Ownership and CREATE TRIGGER rules: [ALTER FUNCTION](https://www.postgresql.org/docs/17/sql-alterfunction.html),
[CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html).
Default grants: [Supabase custom-role privilege guidance](https://supabase.com/docs/guides/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c).

## Review findings

| Requested area | Source assessment and unresolved evidence |
| --- | --- |
| Capability creation / hosted compatibility | NOLOGIN and NOINHERIT do not prevent SET ROLE through membership. PostgreSQL 16/17 permits BYPASSRLS creation by an appropriately privileged creator; PostgreSQL 15 requires a superuser. Supabase postgres is not a true superuser and hosted restrictions/extensions vary. Non-superuser ownership transfer requires SET ROLE to the target plus target schema CREATE. Temporary schema CREATE alone is insufficient. Actual server version, installer attributes, createrole_self_grant/membership SET/INHERIT options and platform restrictions are unknown. No membership workaround or owner substitution was introduced. |
| Capability SQL privileges | Explicit SELECT covers the five tables and both row types. UPDATE(engineer_profile_id) / UPDATE(status) supplies the relevant writes and at least one UPDATE column for each FOR UPDATE relation. public/auth USAGE and EXECUTE(auth.uid,is_admin) are explicit. Defaults, language usage, effective grants, owners and extra deployed triggers still need inspection. Updating NEW.updated_at inside the existing timestamp trigger does not require widening caller column UPDATE grants. |
| Notification privileges | 013's AFTER trigger calls a SECURITY DEFINER function; notification INSERTs use that existing function owner's rights, not civilhub_acceptor's. No notification INSERT grant is needed for the capability role in the source design. The actual notification function owner must retain SELECT/INSERT and its existing RLS bypass/authorization. Errors are not swallowed by acceptance. Runtime behavior and exactly-once notifications remain untested. |
| auth.uid identity | Standard Supabase auth.uid reads authenticated request claims, not current_user. Entering SECURITY DEFINER changes current_user but does not replace request claims, so original client/engineer identity is expected to survive nested calls. The auth.uid definition is platform-provided, absent from 001–016; actual definition/ACL and real JWT requests need verification. Raw SQL callers able to set request claims are outside the ordinary Data API threat boundary. |
| is_admin in invoker guards | 006's helper is SECURITY DEFINER and tests profiles.id=auth.uid and role=admin, not current_user or editable metadata. authenticated and civilhub_acceptor have explicit EXECUTE. Thus ordinary JWT admins retain the shared-role admin path in source; capability updates are admitted by current_user, not by pretending the client is admin. Trusted service/SQL writes without a canonical admin UID can fail guards, even when RLS is bypassed. |
| Trigger order and 015 coexistence | INSERT BEFORE order is require_pending_insert then serialize_insert. UPDATE BEFORE order is guard_decision, protect_identity, updated_at. Projects run guard_assignment then updated_at. 013 notifications run AFTER. The serializer's SECURITY DEFINER context ends on return, before the outer INSERT's RLS/AFTER processing. Status-only RPC updates preserve the unconditional 015 immutable-field checks, including for admins. Unknown extra BEFORE triggers could change NEW after a guard; inventory is mandatory. |
| Lock serialization | Both submission's BEFORE INSERT function and acceptance lock the project FOR UPDATE. At READ COMMITTED, the expected protocol is submit-first commits a row the later acceptance sees; accept-first makes the later submission recheck assigned state and fail. Acceptance then locks all existing application rows by immutable UUID. VOLATILE PL/pgSQL functions obtain new snapshots for their SQL statements; higher isolation may instead require a whole-transaction retry. These are design expectations, not proven concurrency safety. |
| Deadlocks / authorization failures | Single pending withdrawal/rejection does not explicitly lock the project and checks visible own-profile/own-project rows. It can race on application row locks; bulk updates can visit them in a different order from acceptance. Admin transactions, FK cascades/deletion and multi-project batches can invert the project/application/engineer locking order. Deadlock/serialization errors should abort all writes, but real schedules must be tested. Project identity/assignment guards also affect FK-driven SET NULL and identity-changing jobs; caller identity/owner context matters and must be tested, rather than assuming RLS bypass bypasses triggers. |
| Direct authenticated bypasses | Against source policies and active triggers, ordinary nonpending INSERT is blocked by 015; changed acceptance status by 016; project assignment on INSERT/change on UPDATE by 016; application identity rewrites by 015. Ordinary users have no application DELETE policy. Existing accepted-status no-op UPDATE can refresh timestamps, but cannot select another engineer or emit a new status-change notification in 013. No client-controlled flag enables capability access. Broad shared-role grants remain, with triggers as the write boundary. Extra grants/policies, RPC writers, role-assumption privileges, DDL rights or trigger-disable rights are unresolved deployed risks. |
| Existing workflows | Client creation omits engineer assignment; client edit omits protected IDs; engineer withdrawal is pending-to-withdrawn; client rejection is pending-to-rejected. Their source payloads fit the guards. Canonical JWT admin project create/edit retains engineer assignment, and admin application edits retain 015 identity constraints. engineer_portfolios and existing assignment rows are not rewritten. Admin workflows can still create accepted/assigned mismatches, but cannot create two accepted rows with the new index. Existing pre-RPC app instances will fail acceptance after cutover. |
| Legacy unique index | A nonconcurrent partial unique index checks all existing accepted rows, including admin imports and ownerless projects. Duplicates fail the migration transaction; no winner is chosen and no data is repaired. It also blocks table writes during construction. It does not check assigned/accepted agreement or clean up legacy pending rivals beside a matching accepted retry. Read-only global data inventory and separately approved repairs remain prerequisites. |

Rules consulted: [PostgreSQL 17 CREATE ROLE](https://www.postgresql.org/docs/17/sql-createrole.html),
[PostgreSQL 15 CREATE ROLE](https://www.postgresql.org/docs/15/sql-createrole.html),
[Supabase hosted superuser limitations](https://supabase.com/docs/guides/database/postgres/roles-superuser),
[SELECT locking privileges](https://www.postgresql.org/docs/17/sql-select.html),
[trigger order](https://www.postgresql.org/docs/17/trigger-definition.html),
[Supabase authentication helpers](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Isolated-test readiness and gates

The corrected artifacts are ready to attempt testing on an explicitly authorized
disposable PostgreSQL installation with a suitably privileged installer and the
reviewed migrations/fixture accounts. This is **not** a declaration of PostgreSQL
compatibility, hosted installability, concurrency safety or deployment readiness.

The current SQL integration script intentionally requires a true test superuser;
it is not a hosted-Supabase migration-role compatibility test. A passing local
superuser test cannot establish that Supabase's postgres role can install 016.
Test the actual proposed installer privileges separately in a representative
isolated environment before authorizing hosted use. Do not grant API identities
membership in the capability role to get past ownership/ACL errors.

Required database tests still include migration installation under the intended
installer; effective ACLs/defaults and role-assumption denial; claim preservation
through nested definers; 015/016 trigger order; real notification failure rollback;
both submit/accept orderings; accept versus withdraw/reject, project edits and
FK deletion; bulk/admin deadlocks and retries; portfolio/admin editing; unique
index failure on pre-existing duplicates; no-op retries and inconsistent legacy
states. Existing SQL assertions/isolation permutations cover only part of that
matrix and have not been executed. Keep the coordinated write-pause/data-review
requirements in ATOMIC_ACCEPTANCE.md.

## Validation for this review

- node --test tests/marketplace.test.cjs: **45 passed, 0 failed** (mocked actions
  and text regression checks only).
- npm.cmd run build: **passed** compilation, TypeScript and 36-page generation
  inside the sandbox. Process-only Supabase URL/keys pointed to loopback;
  no environment file was edited and no Supabase connection was made.
- git diff --check: **passed**. The newly prepared/untracked migration, SQL test
  and review notes were also checked separately for trailing whitespace.
- No SQL parser/database execution or isolation test was run. No migration was
  applied; no Docker, staging, commit or push was used.
