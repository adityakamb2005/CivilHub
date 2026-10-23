# CivilHub production deployment

Verified on **23 October 2026 (UTC)**.

Website: **[https://civilhub-six.vercel.app](https://civilhub-six.vercel.app)**.
Application release: **`eccb5102bf31b4aeb145c61a43e96d16d6c3b751`**.
Vercel deployment: `dpl_JBdvd9RYF53rhpMkwPykw8UwE23u`.

## Verified production state

| Area | Verified result |
| --- | --- |
| GitHub | Public `adityakamb2005/CivilHub`; `main` publication automatically triggered the matching production build |
| Hosting | `adiak1441-3898/civilhub`, existing Hobby plan for the noncommercial student demonstration |
| Build/runtime | Vercel READY; Next.js preset, repository root, Node 24.x; default Next.js build/output handling |
| Website | Assigned production domain serves HTTP 200 anonymously over HTTPS |
| Environment | Both required public Supabase values configured for Production and securely compared with verified local configuration |
| Database | Project `meolxzjkpsyzvrnwehbf`; existing 001-013 baseline preserved; reviewed 015-018 applied and checked in order |
| Migration history | Hosted history table remains absent; no historical replay, baseline adoption or history repair was performed |
| Authentication | Production Site URL and exact callbacks configured; email confirmation and other Auth settings preserved |
| Recovery | Full logical database backup and independent network-isolated restoration verified; pre-cutover data/schema/roles/ACLs matched the snapshot |
| Live workflows | Public routes, role login/dashboards, project publication, applications, rejection, atomic acceptance and two-way messaging passed |
| Privacy | Anonymous/cross-user phone reads and view writes denied; owner phone reads work; public/embedded paths and applicant cards omit private phone; nonparticipants cannot read conversations/messages |
| Test cleanup | Dedicated confirmed synthetic accounts and their projects removed; temporary test credentials deleted |

The deployed application was verified through the public domain and browser UI,
with user-scoped API checks for database permissions. No existing user account
was changed for testing. Previously passing 98 Node tests, two SQL suites,
TypeScript and the local build were reused after matching all prepared source
hashes; Vercel performed the required production build with production values.

## Hosting configuration

The project uses GitHub `main` for automatic production deployments. This
behavior was verified by the release push. Documentation-only publications may
also trigger a build; monitor them before declaring the release complete.
No GitHub Actions deployment workflow or extra paid resource was added.

Only Production has the verified backend values. Preview deployments are not
configured or validated for application use; use an isolated staging backend
before enabling previews. Do not copy production accounts or privileged keys
into previews. Future application/database cutovers still require approval,
compatibility review, a fresh backup/drift check and coordinated writes.

### Environment names

| Name | Required by application | Handling |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes, server and browser | Correct target project's API URL; distinct for staging and production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, server and browser | Actual target publishable key; public by design, with RLS still essential |
| `NODE_ENV` / `PORT` | Platform/runtime concerns | Normally host-managed; not extra Supabase credentials |

No service-role key, database password or direct database URL is needed by the
application code. Privileged credentials belong only in separately approved
operator tooling, never in `NEXT_PUBLIC_*`, committed docs or browser bundles.

Public Supabase values are embedded at build time. Set them before building;
changing runtime values does not retarget an existing build. Never promote local
test output to production. The local HTTP safety script intentionally refuses
hosted targets and is not a production deployment command.

The current config permits Next image optimization from `images.unsplash.com`
and `plus.unsplash.com`; the layout loads Google Fonts externally. Verify asset
availability, content policy and privacy expectations on the chosen host. The
metadata URL and informational contact mailbox use `civilhub.com`; ownership and
mail delivery are unverified. Resolve those references in a separately reviewed
application change before treating them as launch branding.

## Authentication configuration

Configured Supabase Auth Site URL:
`https://civilhub-six.vercel.app`.
Exact additional redirect URLs:

- `https://civilhub-six.vercel.app/api/auth/callback`
- `https://civilhub-six.vercel.app/api/auth/callback?next=/update-password`

Only these two configuration fields changed. Email confirmation, MFA, provider
configuration and rate limits were preserved. The repository's development
`supabase/config.toml` contains different defaults; never push it wholesale to
production. Use a reviewed minimal config and inspect declared changes first.
See [Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls).

**Email limitation:** custom SMTP host/user/sender settings are absent. Supabase's
default mail service restricts delivery to project-team addresses and imposes
strict rate limits. Arbitrary-user signup confirmation and password recovery
remain blocked until a suitable mail provider is configured. Email round trips,
templates and delivery were not verified. Do not disable confirmations to hide
this limitation. See [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).

Dedicated confirmed synthetic client/engineer accounts verified password login,
canonical signup-trigger workspace creation and role restrictions. They were
created without sending mail, then removed after testing. Their success does
not establish public self-service signup or email recovery readiness.

## Supabase migration assessment

### Order and dependencies

There are **17 SQL files**: **001 through 013, then 015 through 018**.
There is deliberately **no 014**. Review the exact source at the release SHA;
do not invent or recover the rejected visibility migration.

| Stage | Purpose / dependency |
| --- | --- |
| 001-012 | Base profiles/Auth trigger, engineer/client workspaces, resources, opportunities, projects, applications, messages, notifications and portfolio schema |
| 013 | Associated-project read helper, conversation eligibility, recipient-only message-content protections and event-generated notifications; depends on the existing application/messaging tables and helper functions |
| 015 | Freezes application identity/submitted content, requires ordinary inserts to be pending, replaces the named engineer INSERT policy; depends on 001-013 |
| 016 | Atomic acceptance, assignment/decision guards, one accepted application per project and submission serialization; requires 015 and the existing `postgres` owner |
| 017 | Canonical workspace/project/conversation roles, identity/verification/notification guards and scoped messaging/applicant display RPCs; requires 016 and ships with its application call sites |
| 018 | SELECT-only five-column public profile view; owner/admin-only base-profile reads protect phone numbers; ships with public engineer/project page changes |

The final signup trigger implementation comes from the ordered history, including
009's client-workspace support. Replaying 001 or 008 out of order can replace it
with an older definition. The historical 015-only contract test is incompatible
after 016; do not run it as a post-release test.

### Hosted history comparison and preflight

**Hosted state was inspected and verified.** Existing schema represented the
001-013 baseline with no hosted migration-history table. Only 015-018 were
executed, in order, as complete transaction files. Definitions, triggers,
policies, the unique index and view permissions were checked after execution.
No history repair was performed. Do not rerun these non-idempotent files.

The following remains the preflight procedure for future targets or changes:

1. Export migration history and inspect actual schema/function/policy definitions.
   Compare versions, names and contents with the repository. Short source numbers
   are not proof of equivalence to timestamped CLI versions.
2. The prior isolated test installation mapped files to timestamped copies outside
   this repository. That mapping is evidence for that installation only, not a
   production baseline. Do not rename committed migrations or repair hosted
   history merely to make a CLI comparison green.
3. If the target already has equivalent 001-013, review only genuinely pending files through 018.
   If later versions are already installed, do not rerun them. For a truly empty
   target, review the full ordered baseline. Stop on unknown/partial/drifted state.
4. Review table ownership, enabled/non-FORCE RLS, schema exposure, all permissive
   policies, default/custom/inherited grants, definer writers and trigger order.
   016/017 require the existing tables to be owned by `postgres`; ordinary API
   roles must not inherit that owner or have elevated privileges.
5. Check duplicate accepted applications, accepted/assignment mismatches, role
   mismatches, orphaned relationships and application volume. Approve any data
   repair independently; the migrations do not silently fix legacy rows.
6. A separately approved CLI `migration list` can compare linked histories, but
   it contacts the linked target. Never use an unverified existing link or run
   `db push`, `migration repair` or reset as a discovery command. See
   [Supabase migration guidance](https://supabase.com/docs/guides/deployment/database-migrations).

### Change impact, backup and rollback

No DROP TABLE, TRUNCATE or bulk data-delete operation was found in the reviewed
history. That does not make cutover harmless: migrations replace policies and
functions, remove execution grants, introduce immutable-field guards and build a
non-concurrent unique index. These can deny old writes, acquire locks, fail on
duplicates or conflict with extra hosted writers. The acceptance RPC itself
updates assignment and decisions when called; installing it is not a data repair.

Before any approved migration, take a restorable backup of database schema/data,
relevant Auth state and operator configuration; confirm the project's actual
backup/PITR coverage and rehearse restore in isolation. Back up stored assets
separately if used. Record the release SHA, pre-change schema/policies/grants,
migration history, time window, owner and restore procedure.

Pause marketplace writes and drain incompatible application instances. Agree on
lock/statement timeouts and expected index duration for the real table size.
015-018 contain explicit transactions; 013 has no explicit wrapper, so the
installer must provide transactional execution and stop on error. Do not execute
selected fragments or continue after failed guards.

There are no reviewed automatic down migrations. Prefer a reviewed forward fix
or coordinated restore under a write pause. Restoring only application code can
break compatibility: old three-write acceptance is rejected by 016, while newer
messaging code needs 017's RPCs and public pages need 018's view. Do not disable RLS, drop guards or grant privileged
role membership as a rollback shortcut. A full restore must account for writes
after the backup and Auth/data consistency.

### Read-only verification SQL (reference)

Run only in an authorized session against a separately verified target.
Capture results securely; definitions/history may contain sensitive operational
details. Unexpected objects/counts require inspection; known absent history is not a reason
to bypass checks.

```sql
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '5s';

-- A manually provisioned database may have no CLI history table; stop and
-- reconcile actual definitions rather than inventing history entries.
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Before and after cutover: both counts should be zero.
SELECT count(*) AS projects_with_multiple_accepted
FROM (
  SELECT project_id FROM public.project_applications
  WHERE status = 'accepted'
  GROUP BY project_id HAVING count(*) > 1
) AS duplicates;

SELECT count(*) AS accepted_assignment_mismatches
FROM public.project_applications a
JOIN public.projects p ON p.id = a.project_id
WHERE a.status = 'accepted'
  AND p.engineer_profile_id IS DISTINCT FROM a.engineer_profile_id;

SELECT c.relname, pg_get_userbyid(c.relowner) AS owner,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN ('profiles', 'client_profiles', 'engineer_profiles',
    'projects', 'project_applications', 'conversations', 'messages', 'notifications');

SELECT rolname, rolsuper, rolbypassrls,
       pg_has_role(oid, 'postgres'::regrole, 'MEMBER') AS member_of_owner
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator');

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Post-cutover: all four signatures must resolve.
SELECT signature, to_regprocedure(signature) IS NOT NULL AS present
FROM (VALUES
  ('public.accept_project_application(uuid,uuid)'),
  ('public.project_messaging_context(uuid,uuid)'),
  ('public.project_applicant_cards(uuid)'),
  ('public.conversation_participant_cards()')
) AS expected(signature);

-- All four RPCs: postgres owner, SECURITY DEFINER, pg_catalog search path;
-- authenticated EXECUTE allowed, anon and service_role denied.
SELECT p.oid::regprocedure AS function, pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef, p.proconfig, p.proacl, r.role_name,
       has_function_privilege(r.role_name, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
WHERE n.nspname = 'public' AND p.proname IN (
  'accept_project_application', 'project_messaging_context',
  'project_applicant_cards', 'conversation_participant_cards')
ORDER BY function, role_name;

-- API roles must not execute the new 015-017 trigger functions.
SELECT p.oid::regprocedure AS function, r.role_name,
       has_function_privilege(r.role_name, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) r(role_name)
WHERE n.nspname = 'public' AND p.proname IN (
  'protect_project_application_identity', 'require_pending_project_application_insert',
  'guard_project_assignment', 'guard_project_application_decision',
  'serialize_project_application_insert', 'protect_marketplace_profile_identity',
  'protect_engineer_verification', 'protect_notification_content')
ORDER BY function, role_name;

SELECT c.relname AS table_name, t.tgname, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND (
  (n.nspname = 'auth' AND c.relname = 'users') OR
  (n.nspname = 'public' AND c.relname IN ('profiles', 'engineer_profiles',
    'client_profiles', 'projects', 'project_applications', 'messages', 'notifications')))
ORDER BY table_name, tgname;

SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);
SELECT i.indisunique, i.indisvalid, pg_get_indexdef(i.indexrelid) AS definition
FROM pg_index i
WHERE i.indexrelid = to_regclass('public.project_applications_one_accepted');

COMMIT;
```

Compare the complete inventories to source, including PUBLIC/default/custom-role
privileges and overloads; a few expected names alone do not establish effective
security. The eight trigger functions should produce 24 denied role/function
rows; the four RPCs should produce 12 rows with the stated grant pattern.
The unique index must return one valid unique index with the accepted-status
predicate. Verify canonical role/workspace compatibility with reviewed aggregate
queries on the actual target. Service-role BYPASSRLS may be platform-managed;
ordinary anon/authenticated elevation and API membership in `postgres` are blockers.

Destructive rollback-injection, account-password rotation and concurrency fixture
suites belong in staging/disposable databases. Production smoke tests below use
separately authorized test accounts and a deliberate cleanup plan.

## Release verification and remaining work

- [x] Reviewed source published and matching application deployment READY.
- [x] Existing Hobby plan, production branch, Node 24.x and public HTTPS verified.
- [x] Backup restoration, pre-cutover drift, schema/owner/ACL compatibility checked.
- [x] Only approved 015-018 executed; migration history left untouched.
- [x] Production public environment values and exact Auth URLs configured.
- [x] Eight public routes and a public engineer/project detail rendered successfully.
- [x] Anonymous dashboard redirects, client/engineer password login and role
      dashboards passed; engineer access to the admin dashboard was denied.
- [x] Client project creation/publication, two applications, rejection and atomic
      acceptance passed through the live browser; direct acceptance was denied.
- [x] Conversation creation and two-way messaging passed; another engineer could
      not read the conversation/messages. Signed-out dashboard access was denied.
- [x] Anonymous and cross-user private phone reads denied; display view has only
      the approved fields; owner reads work and public view writes are denied.
- [x] Dedicated fixture projects/accounts and temporary credentials removed.
- [ ] Configure custom SMTP and verify actual signup/confirmation/recovery emails.
- [ ] Resolve unverified `civilhub.com` metadata/contact ownership and policy text.
- [ ] Configure operational monitoring, alerts and an off-device recovery copy.
- [ ] Review native backup/PITR availability before accepting valuable new data.
- [ ] Provision an isolated preview/staging backend before using preview builds.
- [ ] Decide the repository license and any future explicit history adoption.

No positive live admin login, opportunity-submission workflow, bulk/admin/FK-delete
interaction, complete email round trip or higher-isolation workload was tested in
this cutover. Local SQL suites cover additional security cases but do not turn
those live gaps into verified results.

## Recovery record

See [PRODUCTION_RECOVERY_PLAN.md](PRODUCTION_RECOVERY_PLAN.md) for the reviewed
backup evidence, owner/ACL restoration requirements and exact release scope.
The final pre-cutover check matched all 50 data tables and schema/security
metadata against the verified snapshot. After fixture cleanup, all 12 public
tables and the original Auth users matched their backup content hashes. Normal
Auth service audit entries were excluded from that comparison. Migration
installation rewrote no existing rows; smoke tests used dedicated records.

A failed migration rolls back its own transaction; prior successful files remain.
There are no reviewed down migrations. Stop publication on failure and prefer a
reviewed forward fix. Do not revert to pre-release code against the secured
schema. Full recovery requires a separately approved compatible target and write
pause; a snapshot loses later writes unless they are recovered separately.

The backup is a logical database recovery source, not a full hosted-project
export. Hosted signing/API/SMTP/OAuth credentials and configuration, role login
passwords and Storage file bytes are outside it; there were zero Storage object
rows at capture. Native backups/PITR and an off-device copy were not verified.
