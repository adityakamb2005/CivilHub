# CivilHub marketplace database security plan

**REVIEW ONLY — NOT FOR EXECUTION.** Prepared 14 October 2026 against the current working tree at `A:\civix\CivilHub`. No SQL has been executed, no database connection has been made, and no application or migration file is changed by this planning task. Existing uncommitted marketplace fixes and tests are inputs to this plan and must be preserved.

## 1. Recommendation and scope

Keep the current tables and single-engineer assignment model. Use three complementary controls:

1. Row policies continue to control which rows users can read and ordinarily edit. Add immutable application-context protection immediately as a separately reviewable P0 containment change.
2. Column privileges prevent ordinary API callers from assigning projects, changing verification, or editing notification content. Move project application mutations into narrowly authorized RPCs so all writers follow one locking and transition protocol. Administrators use explicit privileged operations rather than an unrestricted shared-role grant.
3. A unique accepted-application index plus deferred relationship checks enforce final assignment consistency. Minimal participant-display RPCs resolve messaging visibility without widening raw private-profile SELECT policies.

Do not recreate the rejected recursive/private-profile migration 014. Do not reapply 013. No migration number or executable migration is assigned here. The SQL blocks below are read-only inspection proposals for a later authorized operator, not instructions to run now. This plan supersedes the abbreviated SQL design in MARKETPLACE_AUDIT.md for future implementation; that existing audit artifact is preserved unchanged.

**P0:** prevent application context mutation that can manufacture a relationship with a private project. **P1:** prevent forged decisions/direct assignment, make acceptance atomic, protect verification and private participant access. Notification field restriction can be a small independent stage.

## 2. Evidence, assumptions and deployed-state boundary

Reviewed all migration files 001–013; current project/client forms, admin project actions/form, engineer profile form and alternate upsert action; project/opportunity application actions; messaging and notification actions; relevant inbox, conversation, application review and workspace queries; and tests/marketplace.test.cjs.

Confirmed means confirmed in source. The deployed PostgreSQL version, grants, default privileges, function owners, applied migration history, extra policies, external writers and current data are **unknown**. The user's confirmation that 013 is applied does not establish absence of later/manual changes. Supabase Data API grants are not fully declared by these migrations. Never infer that RLS alone grants SQL privileges, or that a source policy proves a live exploit passed.

Trust boundary: API users use anon/authenticated database roles and verified Supabase JWTs; application roles come from public.profiles.role, not editable user metadata. A service-role key, database owner, privileged SQL operator and function owner are trusted infrastructure, never browser credentials. No security design can constrain a superuser who can remove it. Inventory existing privileged jobs before restricting DML. Do not use arbitrary session settings, client-supplied role flags, request headers or a caller-settable custom GUC as a trusted “inside RPC” switch.

## 3. Cumulative source inventory

### Tables, constraints and row policies

| Object | Effective source controls after 001–013 | Important dependencies |
| --- | --- | --- |
| profiles (001,006,009) | PK references auth.users; engineer/client/admin CHECK; public read; own UPDATE with role=current_user_role() | auth routing, displayed names; current_user_role and is_admin read canonical role; public rows also contain phone/location |
| engineer_profiles (001,002,007,012) | Unique profile_id FK; is_verified defaults false; public/self SELECT plus admin read; own INSERT/UPDATE; no field-level verification protection | profile form inserts/updates; alternate action upserts on profile_id; public directory; applicant and conversation embeds |
| client_profiles (001,009) | Unique profile_id FK; own SELECT/UPDATE/INSERT | signup bootstrap, project ownership, conversation participation; no participant read grant |
| projects (005,006,009,013) | Required/nonblank fields, date order, status CHECK; nullable engineer/client FKs ON DELETE SET NULL; public published/time read; client-own FOR ALL; admin FOR ALL; engineer associated read via helper | client INSERT omits engineer FK; ordinary edit omits both ownership/assignment changes; admin create/update sends engineer FK |
| project_applications (010) | FK project/engineer ON DELETE CASCADE; nonblank cover; status CHECK/default pending; UNIQUE(project_id, engineer_profile_id); own-engineer SELECT; eligible-engineer INSERT; own-pending withdrawal UPDATE; client-owner SELECT/UPDATE; admin FOR ALL | separate submission, withdrawal, acceptance and rejection actions; accepted assignment is not constrained |
| conversations (011,013) | FK project/client/engineer ON DELETE CASCADE; unique project/client/engineer tuple; own-participant/admin SELECT; eligible participant INSERT using correlated project relationship | no ordinary UPDATE/DELETE policy in source; IDs/tuple must remain stable; ownership transfer has implications |
| messages (011,013) | FK conversation/sender; nonblank body; participant/admin SELECT; participant INSERT bound to auth.uid(); recipient UPDATE | 013 trigger prohibits message content changes; read action changes read_at only |
| notifications (001,013) | FK profile; own SELECT; own UPDATE with same owner WITH CHECK; no ordinary INSERT policy after 013 | actions change is_read only; content/data otherwise writable if grants allow |
| opportunity_applications (007) | Similar own INSERT/withdrawal and admin management; unique opportunity/engineer; no pending-only INSERT or immutable-context check | separate admin application workflow, unrelated to project assignment; assess same pattern separately without imposing project cardinality |
| engineer_portfolios (012) | Engineer FK; nonblank title/summary; public/self/admin SELECT; own INSERT/UPDATE/DELETE | private fields should not become visible through new project helpers |
| resources/opportunities (003,004,006,007) | Published read; opportunity open/time condition; admin manage; applicant historical opportunity read | preserve unchanged; do not include in broad grant rewrites |

“FOR ALL” includes DELETE. Client projects policy currently permits owner deletion if DELETE privilege exists; preserving or removing that permission requires an explicit product decision. Explicit USING-only UPDATE policies also need examination of effective new-row checks; they do not freeze old/new column values.

### Functions, triggers and grants

- 009 replaces the earlier signup function from 001/006/008 and creates the correct engineer/client profile with safe signup roles. Keep signup behavior and the auth.users trigger unchanged.
- handle_updated_at triggers cover profiles, engineer_profiles, client_profiles, projects, applications, conversations and portfolio rows; server timestamp writes must continue to work even when callers cannot alter identity timestamps.
- 006 is_admin() and current_user_role() are SECURITY DEFINER, fixed search_path=public, PUBLIC execution revoked, authenticated execution granted. 013 engineer_can_read_project(uuid) is also a definer helper and grants execution only to authenticated after revoking PUBLIC/anon. It avoids the projects/application RLS cycle.
- 013 replaces conversation INSERT eligibility, removes 011 arbitrary notification INSERT policy, and protects notification UPDATE ownership. Preserve these improvements.
- 013 messages_protect_content calls prevent_message_content_update BEFORE UPDATE. messages_notify_recipient and project_applications_notify_participants are AFTER row triggers calling SECURITY DEFINER notification functions. Message notification also updates conversation.updated_at. Do not duplicate these notifications in RPC or TypeScript.
- 013 revokes direct PUBLIC/anon/authenticated execution on the three trigger functions. SQL function ownership and any inherited execution grants still require deployed inspection. Trigger execution permissions and trusted owners must be accounted for independently of API grants.
- No complete table/column/default privilege inventory is present in migration SQL. SELECT/INSERT/UPDATE grants may originate from platform defaults or manual operations. No assumption that removing a policy or revoking one column overrides broader inherited grants is acceptable.
- Admin engineer SELECT from 007 has no TO authenticated clause while is_admin execution is restricted. Test anonymous directory queries against actual deployed grants; do not claim a runtime failure solely from this text.

## 4. Confirmed source-level vulnerabilities and controls

| Priority | Finding and impact | Smallest effective control |
| --- | --- | --- |
| P0 | Engineer withdrawal can also change project_id; 013 then recognizes the manufactured relationship for private project reads | Immutable application identity/context on UPDATE, pending-only engineer INSERT, and inventory/deny other writable identity paths |
| P1 | INSERT allows caller-supplied accepted/rejected status; client UPDATE can change submitted identity/context and arbitrary statuses | Explicit transition contract, no direct application DML after cutover, database-validated RPC input |
| P1 | No one-accepted-per-project constraint; independent assignment/status requests permit partial commits | Partial unique accepted index and one atomic acceptance RPC with final relationship checks |
| P1 | Owner FOR ALL plus broad grants permit direct assignment or assignment on INSERT | Remove authenticated assignment column INSERT/UPDATE grants; preserve ordinary owner RLS and editing columns; admin RPC |
| P1 | Own profile INSERT/UPDATE can write is_verified | Remove is_verified from untrusted INSERT/UPDATE grants; default false; explicit admin verification RPC |
| P1 | Counterparty client profiles and private engineer profiles are hidden from legitimate messaging checks | Scoped participant display/context and conversation-creation RPCs; authorize via underlying relationship; no raw-profile read expansion |
| P2 | Notification own UPDATE can alter type/title/body/data/timestamps | UPDATE(is_read) only plus existing own-row USING/WITH CHECK; preserve trigger INSERTs |

profiles.role already has self-promotion protection in 006; preserve it. Public profiles expose more than the UI may display; do not expand that existing exposure. Reducing public phone/location reads is a separate privacy design because current queries use SELECT *. The same application-context issue exists in opportunity_applications; include an explicitly reviewed parallel containment change, not a blanket rewrite of opportunity behavior.

## 5. Application mutation and transition contract

Immutable after insertion: id, project_id, engineer_profile_id, cover_message, created_at. updated_at is database-maintained. Submitted cover text remains historical; allow future edits only through an explicit product decision. For P0 containment this can be an unconditional BEFORE UPDATE comparison trigger (IS DISTINCT FROM for null safety), also covering admin changes; admin status edits do not require identity rewrites. Correcting a bad historical identity is a separately approved operation, not an ordinary admin exception.

| Operation | Actor/checks | Permitted effect |
| --- | --- | --- |
| submit_project_application(project_id, cover_message) | Canonical engineer role; derive own engineer FK; active, currently published/due, client-owned, unassigned project | Insert one pending row; no caller-supplied status, engineer identity, IDs or timestamps |
| withdraw_project_application(project_id, application_id) | Own engineer; application belongs to project | pending → withdrawn only; withdrawn retry returns existing state without a write |
| reject_project_application(project_id, application_id) | Client owner or authorized admin | pending → rejected only; rejected retry is no-op |
| accept_project_application(project_id, application_id) | Client owner or authorized admin; matching pending application; active project; valid engineer | pending → accepted and matching project assignment; competing pending → rejected in same transaction |
| accepted retry | Same application is accepted and same engineer assigned | No-op success; no additional notification; inconsistent legacy state is reported, not silently repaired |
| rejected/withdrawn → pending/accepted | No ordinary caller | Denied; reconsideration/reapplication is an approval decision |
| accepted → another status / replace assignment | No ordinary caller | Denied; dedicated admin correction transaction if approved |

Pending→pending identical/no-op requests need not execute a status UPDATE. Rejected/withdrawn/accepted must be terminal in the ordinary workflow. PostgreSQL CHECK(status IN(...)) validates values, not transitions; RLS alone cannot compare all OLD/NEW history. A trigger validates permitted transitions and a narrow privilege boundary prevents ordinary accepted updates. Do not rely on a client-selected status or application-provided engineer ID even inside an RPC.

Recommended database cover validation for future submissions matches current action length 20–3000 after trimming. Audit legacy short/long texts before a global constraint; a new-insert guard avoids invalidating old rows during unrelated operations. Require client_profile_id for new engineer marketplace applications: otherwise existing application code can accept an admin portfolio project with no client to review/message it. This is a small eligibility tightening requiring approval.

## 6. Atomicity, locks and structural invariants

### Recommended write boundary

Use four typed, SECURITY DEFINER mutation entry points (submit/withdraw/reject/accept) and private implementation helpers; do not add an assignment table or arbitrary status-setting endpoint. One RPC call is one SQL transaction. Trusted functions explicitly check auth.uid(), canonical role, project ownership and application identity even if their owner bypasses RLS. Existing server action checks remain useful feedback but are not the database boundary.

The existing audit's security-invoker RPC sketch is insufficient once assignment/application column privileges are revoked: an invoker still lacks those privileges. A definer function supplies only this narrow capability. Use a reviewed trusted owner with no membership granted to anon/authenticated. If platform ownership cannot safely meet the requirements, use a dedicated NOLOGIN capability owner with minimum rights and explicit policies; this is an implementation option, not a prerequisite to add a large role architecture. Inspect FORCE RLS/owner/bypass behavior first.

Every mutation entry point must:

1. Reject missing auth identity before reading sensitive data; use fully qualified object/function names, fixed trusted search_path (prefer pg_catalog with explicit public/auth qualifiers), no dynamic SQL, no caller-specified actor or role. Do not trust user_metadata.
2. Lock the target project row **first**, with a mode that conflicts with all other marketplace writers (FOR UPDATE is sufficient). Recheck ownership, active state, publication eligibility if required, and assignment after acquiring the lock. Each operation uses a fresh statement to re-read state under READ COMMITTED. Higher-isolation serialization failures must abort/retry as whole RPCs.
3. Lock target/competing applications in deterministic application-ID order; recheck current status and identity after waiting. All entry points and admin correction operations follow project→application order. An early existence check may return a generic error, but is never authorization for a later write.
4. Perform only the allowed changes; allow constraints and the 013 triggers to fire. Any error rolls back assignment, statuses and all resulting notifications. Do not catch a notification/constraint error and return success or commit a subset.
5. Return small stable results/error codes with identifiers already authorized to the caller; normalize forbidden/not-found failures to avoid an existence oracle. Keep detailed diagnostics in trusted logs.

Acquire the same project lock during **submission**, not just acceptance. If submit wins, accept subsequently sees and rejects its pending row. If accept wins, submit rechecks and rejects the now-assigned project. A BEFORE UPDATE trigger acquiring the parent lock is not a safe substitute for this protocol: direct UPDATE may already hold an application row lock, inverting project→application order and creating deadlocks. Therefore revoke direct application DML at atomic cutover and route withdrawal/rejection/submission as well as acceptance through RPCs. Ordinary project edits already lock that project row; recheck activity/publication after lock waits. Multi-project admin operations lock projects in stable UUID order.

### Final state rules

- Keep UNIQUE(project_id, engineer_profile_id).
- Add a partial UNIQUE index on project_applications(project_id) WHERE status='accepted'. Existing duplicates block installation; do not auto-select a winner. Unique indexes cannot be added NOT VALID; a concurrent build, if needed for size, is a separate operational stage with invalid-index detection and a fresh preflight.
- For client-owned marketplace projects, commit-time accepted applications must agree with projects.engineer_profile_id, and a non-null assignment must have the one corresponding accepted application. No assignment means no accepted application. Enforce with DEFERRABLE INITIALLY DEFERRED constraint triggers on relevant project INSERT/UPDATE and application INSERT/UPDATE/DELETE, reading final state. Statement-level checks would reject valid intermediate state inside acceptance.
- Deferred checks must protect all entry points and re-read committed/final transaction state under the shared lock protocol. Partial uniqueness alone cannot ensure FK/status agreement. Prevent manual DML by application/admin JWTs; trusted maintenance must follow the same invariant or stop writes.
- A project deleted in the transaction has nothing left to validate; FK cascades still run. Engineer deletion simultaneously cascades applications and SET NULLs assignments; final checks must permit the resulting empty relationship. Test ordering and FK-trigger interaction. Client deletion SET NULLs client_profile_id; decide whether surviving assignments become legacy portfolio records or require separate retention behavior before enabling checks.
- Existing admin portfolio projects use client_profile_id IS NULL and may have an associated engineer without an application. Do **not** impose a universal assignment↔accepted rule until data classification is approved. Recommended initial exemption is only preflight-reviewed ownerless portfolio projects. Null client_profile_id is not proof of portfolio provenance (client deletion also produces it); freeze ownership fields for ordinary users and classify ambiguous rows explicitly. If nullness is insufficient, a small explicit provenance field/allowlist is a separate approved schema decision, not an inferred exemption.

Immutable and transition triggers apply to ordinary/admin JWT operations; structural consistency applies to all normal writes. Do not add an unrestricted “admin bypass everything” branch. Admin corrections preserve the final invariant, acquire the same locks, and leave an operator reason/audit record where existing trusted logging supports it. New durable audit schema, if desired, needs separate approval.

## 7. Column privileges and ordinary edit compatibility

Privileges are additive: a whole-table UPDATE grant still permits the protected column even if its column grant is revoked. Resolve PUBLIC/inherited roles and existing per-column ACLs before narrowing grants. Do not issue a broad schema-wide REVOKE. Retain SELECT needed for filters/RETURNING, schema USAGE and all unrelated tables. PostgreSQL describes this table/column interaction in [GRANT](https://www.postgresql.org/docs/18/sql-grant.html).

| Object | Intended authenticated direct rights after cutover | Compatibility |
| --- | --- | --- |
| project_applications | SELECT under existing RLS; no INSERT/UPDATE/DELETE grants, including inherited/column grants | All four current actions must call RPCs. Raw Data API mutations fail even if an old permissive policy exists; tighten obsolete write policies as defense in depth |
| projects | Existing SELECT/DELETE where authorized; INSERT(title,description,project_type,location,status,start_date,end_date,client_profile_id,client_name,is_published,published_at); UPDATE(title,description,project_type,location,status,start_date,end_date,is_published,published_at,updated_at,client_name) | Client creation/edit payloads continue working; id/created_at/server defaults and assignment excluded; ownership not mutable. Admin ordinary publication toggle still works. Keep generated defaults/RETURNING(id) usable |
| engineer_profiles | Own INSERT of profile_id and editable fields; own UPDATE editable fields and profile_id if required by upsert, guarded immutable on change; never is_verified | Existing form omits is_verified and works. Alternate upsert includes profile_id and updated_at: allow unchanged profile_id in conflict update or change that action later. Never omit this compatibility test |
| notifications | SELECT plus UPDATE(is_read), no ordinary INSERT/DELETE | Both current mark-read actions work, including id filters and returning id; 013 owner WITH CHECK remains |
| messages/conversations | Current narrow behavior and 013 content trigger retained | Optional later column restriction UPDATE(read_at) for messages is compatible but not needed to solve the listed issues; do not rewrite message policies casually |

Engineer editable fields: title, headline, specialization, about, years_experience, is_available, visibility, website_url, linkedin_url, skills, education, certifications, work_experience, updated_at; insert also profile_id. Neither id, created_at nor is_verified is writable by an ordinary API caller. Test INSERT default false and upsert conflict on an already verified row to ensure verification stays true rather than resetting it.

Application administrators and ordinary users share the SQL role authenticated. An RLS admin predicate cannot restore revoked SQL column privileges. Route admin project create/update (which currently always sends engineer_profile_id, even null) through an admin-specific RPC before the grant change. Portfolio assignment in that RPC remains allowed for an approved ownerless portfolio project. For client-owned projects the admin path must call the atomic marketplace acceptance/correction helper, not change assignment alone. Preserve admin publication toggle/delete with current authorized grants; review cascades before deletion. There is no existing engineer-verification admin UI in this code; define a minimal admin-checked set_engineer_verification RPC for the future trusted admin workflow, with optional expected-current-value checking and no edit-self shortcut.

Signup runs via an existing trusted definer and still inserts default-unverified profiles. Restricting authenticated field grants must not revoke the signup/notification function owner's privileges. Notifications should permit is_read changes only; current UI uses true, and supporting mark-unread false can remain harmless if approved. Block ownership/content/timestamp changes even when values are echoed unchanged in a broad client payload. No broad UPDATE grant for “admin convenience.”

## 8. Messaging privacy without recursive RLS

Do not add SELECT policies on private profiles that traverse conversations/projects/applications while those policies traverse the same profile tables. Do not make client_profiles globally readable. RLS protects rows, not selected fields: allowing one private profile row can expose all its skills, history, about and contact-related data through the Data API.

Recommended minimum capability surface:

- **get_or_create_project_conversation(project_id, engineer_profile_id)**: validate caller is the client owner or exact engineer, validate the correct client FK and current application/assignment relationship, then insert/select the unique tuple. Accept canonical engineer-profile IDs only; do not silently treat auth-profile UUIDs as interchangeable. Use the existing unique constraint and handle a concurrent duplicate by returning the authorized existing tuple. No participant profile INSERT or visibility change. Lock/recheck the project if assignment/ownership can change; no leaked IDs on forbidden requests.
- **get_conversation_display(conversation_id)**, or a batched/paginated equivalent: validate actual conversation membership from stored FKs and raw trusted joins, then return only counterpart display name/avatar, role label and authorized project title/context. No email/phone, about, certification/history arrays or unrestricted profile objects. Existing admin conversation read can be supported by an explicit canonical admin check; it must not implicitly enable admin message sending.
- **get_project_applicant_display(project_id, application_ids)**: require project ownership/admin review permission and match every requested application to that project. Return minimal display fields and a public-profile link only for a public profile. Private professional headline/specialization/experience/skills are not automatically public just because an application exists; approve an exact display allowlist. Bound batch sizes and never enumerate unrelated profiles.

Sending/read updates can keep the existing messages table and RLS. In sendMessage, authorize by reading the visible conversation's participant FKs and comparing only the caller's own client/engineer-profile ID; do not require SELECT access to the hidden counterparty to authorize. Inbox/conversation pages replace hidden nested profile embeds with the scoped display result. Keep the current message sender=auth.uid(), recipient-only read update and 013 content trigger intact. A display RPC alone does not fix the current getOrCreateConversation or sendMessage code; those call sites must change together.

The participant RPCs are SECURITY DEFINER with fixed, fully qualified references and minimal output; they do not run from profile RLS policies. The policy dependency graph remains profiles/self → conversations → messages, with 013's existing project helper breaking the project/application cycle. No new back-edge from a profile SELECT policy to conversations/applications is introduced. Do not implement private-data output in a plain owner-bypassing view with SELECT *.

Existing eligibility permits any historical application, including rejected/withdrawn; existing conversations remain readable/sending-enabled by membership even if the relationship later changes. Preserve that behavior initially rather than silently deleting conversations or revoking history. Changing new-conversation eligibility or ongoing-message eligibility is an explicit product/security decision. Once immutable/pending controls are installed, malicious legacy relationships may still exist: inventory them, do not automatically trust or erase them. Do not broaden engineer_can_read_project or rewrite 013 merely to make a UI join work.

## 9. Read-only deployed inventory and data checks

**NOT FOR EXECUTION in this task.** A separately authorized operator must run against an approved environment with an appropriate read-only administrative view. RLS-limited query results may hide inconsistencies; zero rows under an ordinary JWT is not a global clean bill of health. Do not export private data or credentials. These queries deliberately omit message bodies, JWTs, keys and auth.users records. Deployed identifiers/types must be verified first.

### Catalog state and privilege drift

```sql
SELECT version();
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT n.nspname, c.relname, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity, c.relforcerowsecurity, c.relacl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v') ORDER BY c.relname;

SELECT table_name, grantee, privilege_type, is_grantable
FROM information_schema.table_privileges WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;
SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges WHERE table_schema = 'public'
ORDER BY table_name, column_name, grantee;

SELECT rolname, rolsuper, rolbypassrls, rolinherit FROM pg_roles
WHERE rolname IN ('anon','authenticated','service_role','authenticator','postgres');
SELECT pg_get_userbyid(roleid) AS granted_role, pg_get_userbyid(member) AS member
FROM pg_auth_members ORDER BY 1,2;
SELECT defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl
FROM pg_default_acl;

SELECT p.oid::regprocedure AS function_signature, pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef, p.proconfig, p.proacl, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' ORDER BY 1;
SELECT t.tgrelid::regclass AS table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t WHERE t.tgrelid IN
  (SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public') ORDER BY 1,2;
SELECT conrelid::regclass, conname, convalidated, condeferrable, condeferred,
       pg_get_constraintdef(oid) FROM pg_constraint
WHERE connamespace = 'public'::regnamespace ORDER BY 1,2;
SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname='public' ORDER BY tablename,indexname;
```

Include non-public helpers referenced by returned definitions in follow-up read-only inspection. Verify effective has_table_privilege/has_column_privilege/has_function_privilege for anon/authenticated and all inherited capability roles, not just direct ACL text. Catalog visibility and information_schema grant visibility depend on operator rights. Check migration-history existence/version separately without assuming its schema or dumping arbitrary execution logs. Ensure anonymous-callable helpers cannot expose private context or fail on authenticated-only functions in public policies.

### Multiple accepted applications and mismatched assignments

```sql
SELECT project_id, count(*) AS accepted_count, array_agg(id ORDER BY id) AS application_ids
FROM public.project_applications WHERE status='accepted'
GROUP BY project_id HAVING count(*) > 1;

SELECT a.id, a.project_id, a.engineer_profile_id, p.engineer_profile_id AS assigned_engineer
FROM public.project_applications a JOIN public.projects p ON p.id=a.project_id
WHERE a.status='accepted' AND p.engineer_profile_id IS DISTINCT FROM a.engineer_profile_id;

SELECT p.id, p.client_profile_id, p.engineer_profile_id, p.status
FROM public.projects p WHERE p.engineer_profile_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.project_applications a
                WHERE a.project_id=p.id AND a.engineer_profile_id=p.engineer_profile_id
                  AND a.status='accepted');

SELECT p.id, p.client_profile_id, p.engineer_profile_id,
       count(a.id) AS applications, count(a.id) FILTER (WHERE a.status='accepted') AS accepted
FROM public.projects p LEFT JOIN public.project_applications a ON a.project_id=p.id
WHERE p.client_profile_id IS NULL GROUP BY p.id;
```

The third query intentionally includes legitimate portfolio assignments: classify, do not automatically “repair.” Check assigned engineers' canonical role and accepted rows on inactive projects as review candidates; a completed project's valid historical acceptance is not an invalid transition.

### Current-state anomalies and historical transition limits

```sql
SELECT a.id, a.project_id, a.engineer_profile_id, a.status, a.created_at, a.updated_at
FROM public.project_applications a
JOIN public.engineer_profiles ep ON ep.id=a.engineer_profile_id
JOIN public.profiles pr ON pr.id=ep.profile_id
WHERE a.status NOT IN ('pending','accepted','rejected','withdrawn')
   OR pr.role <> 'engineer' OR a.updated_at < a.created_at;

SELECT id, project_id, status, char_length(btrim(cover_message)) AS cover_length
FROM public.project_applications
WHERE char_length(btrim(cover_message)) NOT BETWEEN 20 AND 3000;

SELECT a.id, a.project_id, a.status
FROM public.project_applications a JOIN public.projects p ON p.id=a.project_id
WHERE p.client_profile_id IS NULL;
```

There is **no status/identity history table in migrations 001–013**. No read-only query over current rows can prove prior transitions were valid or detect all past identity rewrites. Notifications are supporting evidence, not an authoritative mutation log. If trusted external audit logs exist, obtain separately approved read-only access and compare old/new identities/statuses and actor permissions. Do not invent historical results or treat an accepted row on a completed project as proof of forged acceptance. Decide whether future durable transition auditing is needed independently.

### Verification and conversations

```sql
SELECT ep.id, ep.profile_id, ep.is_verified, ep.visibility, pr.role,
       ep.created_at, ep.updated_at
FROM public.engineer_profiles ep JOIN public.profiles pr ON pr.id=ep.profile_id
ORDER BY ep.is_verified DESC, ep.id;

SELECT c.id, c.project_id, c.client_profile_id, c.engineer_profile_id,
       p.client_profile_id AS project_client, p.engineer_profile_id AS assigned_engineer,
       EXISTS (SELECT 1 FROM public.project_applications a
               WHERE a.project_id=c.project_id AND a.engineer_profile_id=c.engineer_profile_id)
         AS has_application,
       (SELECT count(*) FROM public.messages m WHERE m.conversation_id=c.id) AS message_count
FROM public.conversations c JOIN public.projects p ON p.id=c.project_id
ORDER BY c.id;

SELECT c.id FROM public.conversations c JOIN public.projects p ON p.id=c.project_id
WHERE c.client_profile_id IS DISTINCT FROM p.client_profile_id
   OR (c.engineer_profile_id IS DISTINCT FROM p.engineer_profile_id
       AND NOT EXISTS (SELECT 1 FROM public.project_applications a
                       WHERE a.project_id=c.project_id
                         AND a.engineer_profile_id=c.engineer_profile_id));

SELECT project_id, client_profile_id, engineer_profile_id, count(*)
FROM public.conversations GROUP BY 1,2,3 HAVING count(*) > 1;
```

Verification=true is not proof of administrator approval: source schema contains no verified_by/verified_at provenance. Do not reset or endorse existing verification values without trusted evidence and approval. Conversation anomalies may be legacy/ownership/deletion consequences or evidence of manipulated applications. Preserve records; classify with an owner-authorized review before deciding access changes. Verify FK constraints are actually validated; dangling rows need separate left-join checks if deployed constraints differ.

## 10. Migration sequencing and coordinated application release

| Stage | Safe grouping | Gate / compatibility risk |
| --- | --- | --- |
| 0 — Read-only preflight | Catalog/grant inventory, data classification, administrator workflow inventory, backup/restore plan, approved disposable test database | No SQL or production contact during this planning task. Do not use source as deployed truth |
| 1 — P0 containment | Immutable project application context; pending-only engineer INSERT policy/guard; analogous opportunity containment if approved | Preserves current submitted payloads/status-only decisions. Does not make acceptance atomic or fix direct project assignment. No identity-repair admin bypass |
| 1b — independent field restrictions | Notification UPDATE(is_read); verification field restrictions plus admin verification capability | Can ship independently after effective ACL/upsert/signup tests. Does not require changing owner/profile read visibility; admin capability must exist before removing a real admin path |
| 2 — Capability preparation | Private typed RPC helpers, explicit function ACLs, participant display/create APIs, staged RPC tests | Additive functions alone do not close legacy writes. No privileged PUBLIC execution window: create and revoke/grant atomically. Do not enable functions that assume cleaned invariants before those gates pass |
| 3 — Atomic cutover | Accepted unique index; compatible final-state guards; RPC-only application writes; project assignment column denial; obsolete write-policy tightening; admin capability paths | One coordinated security release after data approval. Pause application/assignment writes, deploy database + RPC-based application, drain old clients/jobs, validate before reopening. Do not maintain an insecure legacy fallback |
| 4 — Scoped display cutover | Messaging/review/inbox callers use the approved minimal APIs | Can follow atomic cutover, or ship alongside it; no profile RLS broadening. Verify user/admin/history privacy separately |

If a concurrent index build is necessary, prepare it in a separate operational stage while writes are paused or appropriately controlled; re-run consistency preflight at cutover. A regular unique index can be installed inside the coordinated transaction for a small table. Constraints must not be enabled on knowingly inconsistent data with the hope that a later job repairs it. Data reconciliation is a separate approval and must not send misleading 013 decision notifications accidentally.

### Required future application changes (not implemented here)

| Call site | Required change / preservation |
| --- | --- |
| lib/applications/projectActions.ts | Replace INSERT and status UPDATEs with typed submit/withdraw/reject/accept RPCs; eliminate three-write acceptance, keep revalidation/user feedback; handle no-op retries/constraint/deadlock/serialization errors as whole operations |
| components/applications/ClientApplicationActions.tsx | Keep pending/error handling; remove obsolete partial-commit repair assumptions after atomic rollout; never infer authorization from disabled buttons |
| lib/admin/actions.ts and components/admin/AdminProjectForm.tsx | Preserve portfolio associate/unassociate behavior via admin RPC; client-owned project changes obey accepted-assignment invariant; regular publication and content operations still work |
| ProfileEditorForm.tsx / lib/engineer/profileActions.ts | Verify insert/update/upsert field lists and return behavior against column ACLs; never send is_verified; preserve already verified state |
| lib/messaging/messagingActions.ts | Use scoped get/create operation and caller-own-FK authorization; remove hidden-counterparty dependency and ambiguous profile-ID fallback |
| Both messages inbox/conversation pages; client applicants page | Replace private nested embeds with scoped display results; public-profile links only if public; retain onboarding and database error UI |
| lib/notifications/notificationActions.ts | Existing is_read-only payloads can remain; retain error/ownership handling |
| types/database.ts, tests/marketplace.test.cjs | Add RPC type definitions and action mocks; retain current regression suite; add real PostgreSQL/RLS tests outside this planning task |

No application code is changed now. Existing tests intentionally assert the current multi-query action behavior and will need explicit updates when RPC implementation is authorized. Do not “fix” them during planning or claim their current success validates the proposed RPCs.

## 11. Function hardening, policy graph and admin safety

For every new SECURITY DEFINER function: explicit trusted owner, no untrusted schema/object creation, fixed search_path, qualified SQL/auth calls, no dynamic SQL, explicit actor/role checks, bounded work, minimal result, no helper returning arbitrary private rows. Revoke PUBLIC/anon execution and grant only the needed authenticated entry points in the creation transaction; private helpers must not be exposed through PostgREST. Inspect schema exposure and every overload; revoke unintended inherited execution. Function creation commonly grants PUBLIC execution unless restricted. [PostgreSQL CREATE FUNCTION guidance](https://www.postgresql.org/docs/18/sql-createfunction.html).

RLS owner bypass is a reason to authorize explicitly, not a permission shortcut. Policies are ordinarily combined permissively; a narrow new policy does not neutralize an older broad one. Inventory and tighten named write policies and effective grants together. Owners/BYPASSRLS roles and FORCE RLS require deployed inspection. [PostgreSQL row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

Administrator workflows must be tested using an ordinary authenticated JWT whose canonical profiles.role is admin, **not** a service-role key. Preserve content management on unrelated resources/opportunities and existing allowed project deletion/publication. Do not infer that the role's SQL name is “admin.” Never give browser users SQL owner membership or grant a broad protected-column right to authenticated merely because one member is an admin.

Constraint triggers validate final state and must be tested with FK cascades, no-op retries and error rollback. Trigger-fired notification writes stay in the calling transaction; failure must abort it. Keep 013 trigger definitions and their protected function ACLs intact unless a separately reviewed compatibility change is necessary. [PostgreSQL trigger behavior](https://www.postgresql.org/docs/18/trigger-definition.html).

## 12. Authenticated RLS and concurrency acceptance criteria

Not run in this task. Use a disposable approved database with migrations plus the reviewed proposal, real anon/authenticated JWTs, Client A/B, Engineer A/B, Admin, and separate sessions. Inspect global invariant results only with a trusted read-only administrative connection; adversarial writes must use user JWTs, not service credentials.

| Area | Required positive and negative scenarios |
| --- | --- |
| Creation/editing | Client A creates/edits/deletes own project as product permits; Client B/engineer/anon denied; setting engineer FK on INSERT/UPDATE or moving owner denied; RETURNING and unchanged filters work |
| Applications | Own pending submit succeeds exactly once; caller-supplied accepted/status/identity/timestamps and direct DML denied; empty/short/long cover and inactive/draft/future-published/assigned/ownerless eligibility checked; duplicate remains unique |
| P0 identity attack | Attempt to change project_id/engineer_profile_id/id/created_at/cover_message while withdrawing; request fails and unrelated private project remains inaccessible; parallel opportunity pattern tested separately |
| Withdrawal/rejection | Own pending withdrawal and owner pending rejection succeed; wrong actor/role/project ID denied; accepted/terminal transitions denied; repeated terminal operation is no-op with no notification |
| Acceptance | Owner/admin success commits one matching accepted row + assignment + competitor rejection; wrong owner, swapped project/application ID, rejected/withdrawn and inactive projects denied |
| Atomic failure | Force controlled notification/constraint error during acceptance; verify **all** row changes/notifications roll back; no partial project update or false accepted notification |
| Races | Two acceptances; accept vs submit; accept vs withdraw/reject; accept vs project on-hold/unpublish/delete; duplicate RPC retry after lost response. Use concurrent sessions/barriers and assert coherent outcomes; no deadlock-induced partial commits; retry whole aborted RPC |
| Assignment consistency | Partial unique rejects two accepted rows; deferred check rejects mismatched final assignment, permits valid intermediate steps; engineer/client/project FK deletion outcomes exercised |
| Verification | Own insert/update/upsert with is_verified denied; ordinary edit of verified profile preserves value; signup default false; admin RPC sets/revokes; non-admin caller denied |
| Privacy | Public/self profile reads unchanged; private counterparty minimal display only for authorized relationship; unrelated UUIDs, arbitrary batch IDs and anon denied without existence leaks; no private history/contact fields in return payload |
| Conversations/messages | Authorized client/engineer start/reply with private profiles; one tuple on duplicate race; sender spoof and third-party read/write/read-status denied; historical application/conversation behavior matches approved decision; admin read does not grant sending |
| Notifications | Recipient marks one/all read; content/type/data/owner/timestamp INSERT/UPDATE denied; nonrecipient denied; exactly one trigger notification per real event, none on no-op retries; 013 message-content protection survives |
| Administrator compatibility | Admin portfolio assignment/edit/publication/delete; marketplace acceptance/correction; verification; opportunity status workflow. No general identity/transition bypass through raw table API |
| Grant/recursion tests | Catalog and effective privilege checks for every relevant role/overload; no inherited protected-column grant; anonymous directories work; no RLS recursion or helper permission errors; new helpers not directly callable beyond their grants |

Record actual SQLSTATE/result, affected rows and resulting invariants. Mocks prove application control flow, not grants/row policies, locking, trigger behavior or privacy. Load-test bounded participant functions and consistent lock ordering before reopening writes.

## 13. Rollback and failure handling

- Before any future change, capture exact deployed policy/function/ACL/index/trigger definitions and approved data snapshot/backup strategy; do not reconstruct rollback from source 001–013 alone.
- A failed migration transaction should roll back its DDL atomically; a concurrent index build has separate cleanup/invalid-index handling and cannot be assumed part of that transaction.
- If RPC application deployment fails, keep protected writes paused or disable the affected feature. Do not restore broad table assignment/application grants merely to make old code run; retain the P0 containment and field restrictions whenever compatible.
- Prefer forward-fixing the RPC/application release. Retain older safe RPC signatures for a bounded compatibility period if needed, all using the same checks/locks. Do not retain the old three-request acceptance as a fallback.
- Dropping deferred checks/indexes or relaxing transitions is a security regression requiring approval and a write pause; preserve new data and generated notifications. Do not silently reverse accepted assignments or reset verification during rollback.
- Restoring participant UI to generic labels is safer than broad private-profile access. Notification field restriction can remain while UI rollback occurs; current actions already comply.
- Data repair, assignment replacement, notification reconciliation and verification provenance recovery are separate approved operations, not rollback side effects.

## 14. Decisions requiring approval

1. Confirm one accepted/assigned engineer per marketplace project; no multi-assignee design is proposed.
2. Approve pending-only/no reconsideration ordinary transitions, and whether acceptance requires the project still published (current action checks active but permits unpublished existing applications). Recommended preserve active-only acceptance; new submission must be published and due.
3. Classify ownerless/admin portfolio and orphaned-client projects, and define admin correction/unassignment/ownership-transfer rules before final-state constraints. Preserve current legitimate portfolio assignment capability without exempting every ambiguous row silently.
4. Approve the exact private participant display allowlist and historical rejected/withdrawn conversation eligibility. Recommended preserve current eligibility initially and disclose only minimal identity/display context.
5. Approve coordinated RPC/application write cutover, maintenance window, capability owner and staging/authenticated test environment. Grant changes alone will break current actions/admin payloads.
6. Approve evidence-based treatment of existing duplicate/mismatched applications, suspicious relationships and unproven verification records. No automated repair/deletion is authorized.
7. Decide whether durable transition/admin-verification auditing, stricter public profile privacy, and opportunity-application parity should be separate stages. No new audit/provenance table is assumed.

## 15. Validation and task boundaries

Existing test command: `node --test tests/marketplace.test.cjs` — 37 passed, 0 failed. No test/lint/standalone type-check script exists in package.json; Next build performs TypeScript checking. These are tests of the preserved working-tree implementation, not of this database design.

`npm.cmd run build` initially failed in the sandbox with the known SWC Windows path canonicalization Access denied error. The approved rerun outside the sandbox passed production compilation, TypeScript checking and static generation. It used process-only dummy Supabase settings pointing to loopback, preventing production access; no environment file was edited. No SQL parser/database test is claimed for fenced proposals.

Review scope is this newly created document only. All pre-existing changed/untracked audit files are checked against their starting hashes. No executable migration, SQL script, application edit, staging, commit or push is part of this task. No production/development database SQL has been executed and no authenticated database security result is claimed. Stop for review; approval is required before implementing the staged proposal.
