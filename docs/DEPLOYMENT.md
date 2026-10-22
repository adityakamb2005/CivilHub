# Deployment preparation

Reviewed: **23 October 2026**, release commit **`9d28f85`**.
This is a preparation guide. No hosting project, deployment, hosted database
inspection, migration or production credential change was performed.

## Verified state and open gates

| Area | Observed state | Before launch |
| --- | --- | --- |
| GitHub | Public repository; remote `main` matched `9d28f85` through read-only Git inspection | Review and publish documentation separately |
| Hosting | No tracked `vercel.json`, deployment workflow, Dockerfile or local Vercel project link found | Owner must identify an existing integration or choose a host; external dashboard state is unknown |
| Build | `build: next build`, `start: next start`; prior local build passed | Validate on the selected supported host runtime with target settings |
| Runtime | Locked Supabase JS requires Node >=22; Next.js alone requires >=20.9; no repository Node pin; inspection runtime was Node 25.9 | Recommend Node 24 LTS; host-runtime parity remains unverified |
| Database | SQL order and local evidence reviewed | Hosted history, schema, ownership, grants, data and backup status unknown |
| Authentication | Email/password, confirmation callback and recovery implemented | Verify target Site URL, redirects, mail delivery and canonical roles |
| Website | GitHub homepage field empty; source metadata refers to unverified `civilhub.com` | **WEBSITE URL REQUIRED AFTER DEPLOYMENT** |
| Monitoring / CI | No repository deployment/CI workflow or monitoring integration found | Choose monitoring and verify any externally configured integrations |
| Screenshots | Three genuine local public-page captures | Authenticated screen gallery remains optional follow-up |

The application and migration files are unchanged by this documentation task.
The [historical integration report](../ATOMIC_INTEGRATION_TEST_REPORT.md) records
local testing; none of its results is production verification.

During this documentation task, three public local pages returned HTTP 200 and
were captured in Edge. The verification SQL below also parsed and executed in a
read-only transaction against the verified isolated PostgreSQL instance. No
application integration suite or production build was rerun.

## Hosting plan: recommendation, not existing configuration

Vercel is the recommended starting option for this Next.js application because
it supports the full-stack framework. A server-capable Node host is also possible.
A static GitHub Pages export is unsuitable for the current Server Actions,
session handling and server-rendered database access. See
[Vercel's Next.js guide](https://vercel.com/docs/frameworks/full-stack/nextjs).

**Only after separate deployment authorization:**

1. Verify which hosting project, account and billing owner will be used. Importing
   a Git repository can trigger a build/deployment; do not click through as a
   supposedly read-only setup step.
2. Select the Next.js preset and repository root. Use `npm ci` to install,
   `npm run build` to build, and the platform's default Next.js output handling.
   Do not set the output directory to `out`.
3. Select Node 24.x in host settings and validate there. Vercel currently documents
   24.x and 22.x support; the repository has no `engines` override. See
   [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
4. Configure preview and production separately. Preview deployments must use an
   isolated staging backend, not production accounts/data.
5. Review the production branch and automatic deployment behavior before enabling
   Git integration. No GitHub Actions automation was added here.
6. Coordinate database cutover, compatible application version and a marketplace
   write pause. Obtain approval before the first build/deployment against hosted
   infrastructure, including builds that may read backend data.

For a separately approved self-hosted Node installation, use `npm ci`,
`npm run build` and `npm run start` behind HTTPS and an appropriate reverse proxy.
Keep server instances on the same release and review Server Action origin,
cookie and cache behavior. Do not share the development server publicly.

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

After the real HTTPS origin is established, an authorized operator should:

- Set Supabase Auth **Site URL** to that origin.
- Allow the exact registration callback destination
  `<approved-origin>/api/auth/callback`.
- Allow recovery through
  `<approved-origin>/api/auth/callback?next=/update-password`, matching the
  application's `redirectTo` value. Verify query matching and the actual email
  template behavior rather than assuming the configured path is enough.
- Keep preview/local callbacks in their respective isolated environments. Prefer
  exact production paths over broad wildcard redirect allowlists, following
  [Supabase redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls).
- Verify confirmation/recovery templates, SMTP delivery, expiry, throttling and
  cookie behavior over HTTPS in a complete email round trip.
- Verify signup creates canonical client/engineer profiles through
  `handle_new_user()`; public signup must not create administrators. Provision
  admins through a separately controlled operator process, then test cross-role
  denials. Do not authorize from editable user metadata.

The callback exchanges a code, obtains the canonical database role and redirects
to a local path. This does not prove hosted redirect settings or email templates
are already correct.

## Supabase migration assessment

### Order and dependencies

There are **16 SQL files**: **001 through 013, then 015, 016 and 017**.
There is deliberately **no 014**. Review the exact source at the release SHA;
do not invent or recover the rejected visibility migration.

| Stage | Purpose / dependency |
| --- | --- |
| 001-012 | Base profiles/Auth trigger, engineer/client workspaces, resources, opportunities, projects, applications, messages, notifications and portfolio schema |
| 013 | Associated-project read helper, conversation eligibility, recipient-only message-content protections and event-generated notifications; depends on the existing application/messaging tables and helper functions |
| 015 | Freezes application identity/submitted content, requires ordinary inserts to be pending, replaces the named engineer INSERT policy; depends on 001-013 |
| 016 | Atomic acceptance, assignment/decision guards, one accepted application per project and submission serialization; requires 015 and the existing `postgres` owner |
| 017 | Canonical workspace/project/conversation roles, identity/verification/notification guards and scoped messaging/applicant display RPCs; requires 016 and ships with its application call sites |

The final signup trigger implementation comes from the ordered history, including
009's client-workspace support. Replaying 001 or 008 out of order can replace it
with an older definition. The historical 015-only contract test is incompatible
after 016; do not run it as a post-release test.

### Hosted history comparison and preflight

**Hosted state is unknown.** An authorized operator must first obtain the target
project identity through a secure operator channel and perform read-only review.

1. Export migration history and inspect actual schema/function/policy definitions.
   Compare versions, names and contents with the repository. Short source numbers
   are not proof of equivalence to timestamped CLI versions.
2. The prior isolated test installation mapped files to timestamped copies outside
   this repository. That mapping is evidence for that installation only, not a
   production baseline. Do not rename committed migrations or repair hosted
   history merely to make a CLI comparison green.
3. If the target already has equivalent 001-013, review only pending 015-017.
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
015-017 contain explicit transactions; 013 has no explicit wrapper, so the
installer must provide transactional execution and stop on error. Do not execute
selected fragments or continue after failed guards.

There are no reviewed automatic down migrations. Prefer a reviewed forward fix
or coordinated restore under a write pause. Restoring only application code can
break compatibility: old three-write acceptance is rejected by 016, while newer
messaging code needs 017's RPCs. Do not disable RLS, drop guards or grant privileged
role membership as a rollback shortcut. A full restore must account for writes
after the backup and Auth/data consistency.

### Read-only verification SQL (prepared, not executed on hosted systems)

Run only in an authorized session against a separately verified target.
Capture results securely; definitions/history may contain sensitive operational
details. Missing history/objects or unexpected counts are blockers, not a reason
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

## Launch checklist

Checked items are preparation evidence only. Empty boxes require manual
verification/authorization; none imply a failed production test.

- [x] GitHub release source synchronized at the inspected SHA.
- [x] Application features, dependency versions and environment names reviewed.
- [x] Local integration report preserved; safe screenshots captured.
- [x] Hosting plan, migration order and rollback considerations prepared.
- [ ] Review and publish the documentation; choose a repository license.
- [ ] Approve host/account, runtime, branch integration and the actual website origin.
- [ ] Verify backup/restore, hosted history/schema/ACL/data compatibility and migration plan.
- [ ] Authorize migrations and compatible app rollout with a marketplace-write pause.
- [ ] Configure production public environment values before the approved fresh build.
- [ ] Set Auth Site URL, exact callbacks, recovery, email templates and SMTP delivery.
- [ ] Resolve source metadata/contact-domain ownership and review public policy text.
- [ ] Deploy only after separate authorization; record SHA, host runtime and operator.
- [ ] Verify HTTPS, public pages, tools, resources, directory and project detail pages.
- [ ] Verify client and engineer signup, confirmation, login, logout and password recovery.
- [ ] Verify canonical admin authorization and client/engineer cross-role denials.
- [ ] With authorized test accounts: create/edit/publish a project, discover it,
      submit/review an application, accept once, reject/withdraw eligible pending
      applications, and confirm assignment/notifications. Clean up exact test IDs.
- [ ] Verify eligible conversation creation, sending from both roles, read receipts
      and history; deny guest/rival/unrelated access and sender spoofing.
- [ ] Configure error monitoring/alerts and log retention/redaction; check Auth,
      database and function errors without recording tokens or message contents.
- [ ] Confirm no production bundles target loopback/staging and no preview targets production.
- [ ] Verify public accessibility and project identity, then add the real website
      to GitHub About and README. Obtain approval for any release publication.

Higher-isolation, bulk/admin and FK-delete interactions remain documented
operational test gaps. The owner must decide their release requirements against
the actual workload; local successful schedules do not remove those limits.
