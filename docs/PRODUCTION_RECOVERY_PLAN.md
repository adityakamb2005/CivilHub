# CivilHub database recovery and release preparation

Reviewed: 23 October 2026. Source baseline: `2ed84d5988fdd5c93083dd85e7b014375b03a42d`.
Target: Supabase project `meolxzjkpsyzvrnwehbf`.

Production has not been migrated, its history has not been repaired, and no
hosting deployment or Git publication is authorized by this document.

## Backup and isolated recovery evidence

Backup location, outside Git:
`%LOCALAPPDATA%/CivilHubBackups/meolxzjkpsyzvrnwehbf/20261023-43747086e3c9/`.
The directory has inheritance disabled and grants access only to the current
Windows user and SYSTEM. Backup data and diagnostic logs must stay there.

The backup contains a full PostgreSQL custom archive, the Supabase role export,
role attributes/settings/memberships, database ownership/settings/ACL metadata,
object ownership/effective ACLs/default privileges, extension metadata, and a
masked provider-configuration diff. The Auth and Storage schemas, application
schema, data, and custom Auth signup trigger are included in the archive.

Verified in a new Docker environment using the matching PostgreSQL image
`public.ecr.aws/supabase/postgres:17.6.1.155`:

- Networking disabled, no published ports, a new volume, and Unix-socket-only
  restore commands targeting the local `civilhub_recovery` database.
- All 50 COPY tables / 278 rows matched archive content hashes; sequence values
  matched. The four production Auth users and their stored authentication data
  are covered by that comparison; no user information was printed.
- All 174 captured schema/table/routine owners and effective permissions matched;
  all five extension versions/owners and default privileges matched.
- Fifteen role definitions, role settings and membership options were recovered.
  PostgreSQL serializes one timeout setting differently with equivalent semantics.
- The standalone local-only recovery helper also completed from scratch in a
  separate fresh container, which was stopped after successful verification.
- Local 015, 016, 017 and proposed 018 rehearsal passed. Synthetic privacy and
  existing marketplace-security fixtures rolled back; original data still matched.

Recovery requires the steps recorded in the restricted `RECOVERY.md` and
`restore_local.py`, not just an unqualified `pg_restore`. The Docker image's
supautils extension hook otherwise changes extension ownership. The local-only
procedure preserves original extension creators, restores database ownership
(`pg_database_owner` depends on it), and replays captured platform ACLs and roles.
Temporary local elevation/configuration changes are removed after restoration.
Do not copy that Docker-specific elevation procedure to hosted Supabase.

## Coverage and limitations

The backup is a verified logical database recovery source for the proposed
database changes. It is not a complete export of the hosted Supabase project:

- Database login-role passwords are not included. Auth users' stored password
  hashes and other exported Auth table data are included. A new hosted target
  requires its own securely provisioned database/service credentials.
- Hosted JWT signing material, API credentials, SMTP/OAuth secrets, complete Auth
  service settings, DNS, hosting configuration and external provider state are not
  recovered by the database archive. The masked config diff is only supporting
  evidence; it is not a complete configuration backup.
- Storage file bytes are not included. There were zero `storage.objects` rows at
  the snapshot; this does not establish whether unreferenced blobs exist.
- Native backups were not listed and PITR was disabled. This local copy has no
  off-site/device-loss protection, and cannot recover writes made after its
  snapshot. Preserve the restricted backup and volume until the release is stable.
- A restore into hosted Supabase still needs a separately approved target,
  compatible managed schemas/extensions, configuration reconstruction, and a
  coordinated write pause. Never restore over a live project as a routine retry.

Before production changes, recheck drift and obtain a current consistent backup
or establish that no relevant writes occurred since this snapshot. The data dump
uses a PostgreSQL snapshot; ancillary roles/configuration were captured separately.

## Minimum proposed production change

The existing schema represents the reviewed 001-013 baseline, but the hosted
`supabase_migrations.schema_migrations` table is absent. There is no migration 014.
Do not replay the historical SQL or infer execution history from object presence.

After separate production approval, execute only these reviewed files as
`postgres`, in this order, stopping at the first error:

1. `015_project_application_identity_guard.sql`: immutable submitted application
   identity/content, pending-only submissions, replacement engineer INSERT policy.
2. `016_atomic_project_acceptance.sql`: acceptance RPC, assignment/decision guards,
   submission serialization, one accepted application per project unique index.
3. `017_marketplace_profile_security.sql`: canonical workspace/participant roles,
   identity/verification/notification guards and three scoped display/context RPCs.
4. `018_profile_phone_privacy.sql`: a SELECT-only public display view without phone
   and owner/admin-only reads of the existing private base profile rows.

Exact execution method, repeated once for each explicitly approved file:

```powershell
npx.cmd --no-install supabase db query --linked --project-ref meolxzjkpsyzvrnwehbf --file supabase/migrations/<approved-filename.sql>
```

Each file contains its own transaction. Verify resulting definitions, constraints,
RLS, permissions and canonical relationships after each file. Do not use `db push`,
reset, automatic retries or a partial SQL fragment. The unique index takes a write
lock; stricter guards can reject old clients. Coordinate the change window and
drain incompatible application instances. No existing rows are rewritten.

Migration 018 must accompany the application changes to public engineer and
project pages, which now read `public_profiles`. Owners still read/edit their own
full profiles; admin access and the 017 messaging/applicant RPCs are preserved.
Verify any existing external consumer before restricting its old profile reads.
Create the approved view/application cutover under a coordinated maintenance
window, or separately review a staged additive-view-first rollout if an existing
public deployment is discovered.

There are no reviewed down migrations. Prefer a reviewed forward fix. Recovery
requires a coordinated compatible application version and database restore; a
restore loses later writes unless they are separately recovered.

## History reconciliation: separate approval

Explicit SQL execution above does not write CLI migration history. The minimum
schema operation can leave history untouched while keeping an execution audit.
Before subsequently using CLI-managed deployment, separately review and approve
the short numeric version mapping and baseline adoption:

- Record 001-013 as an explicitly adopted, verified baseline, not as evidence the
  original files were executed. Preserve the source SHA, SQL hashes and pre-change
  inventory supporting equivalence.
- Record 015-018 only after each actual migration and its verification succeed.
- Do not insert 014, rewrite source migration IDs, or mark all files applied merely
  to make `migration list` appear clean.
- Use `supabase migration repair --linked --project-ref meolxzjkpsyzvrnwehbf
  --status applied <explicitly-approved-versions>` only after separate approval of
  those exact history writes. No repair command was executed during preparation.

## Local verification

- 98 Node tests passed, including three public-profile component tests.
- TypeScript check passed.
- New phone-privacy SQL suite and existing marketplace-profile SQL suite passed
  against restored data plus dedicated synthetic fixtures, with rollback.
- Fresh local Next.js production build passed with loopback-only placeholder
  Supabase settings. It did not validate production API/Auth configuration and
  must not be published. Production deployment needs a fresh approved build with
  verified production values.
- Browser login, email round trips and live-site tests have not been performed.

Next approvals must identify the project, exact SQL files, history writes (if any),
maintenance/cutover window, recovery plan, and companion application publication.
Vercel creation, hosted environment/Auth changes and Git pushes remain separate.
