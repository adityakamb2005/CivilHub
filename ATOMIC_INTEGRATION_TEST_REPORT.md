# CivilHub integration and pre-commit correction report

Updated: 23 October 2026 (Asia/Calcutta). Branch: `integration/atomic-acceptance`.
Starting and final HEAD: `71ec4d0048d64c73923060eb6cb0bca305a9083e`.

The PostgreSQL routing guard, mandatory local build, concurrency dispatch and
cleanup corrections passed focused validation. No hosted Supabase service was
contacted, migration applied, database reset, account password rotated, dependency
installed, change staged or commit created during this correction. No push, merge
or deployment occurred.

## Newly verified on 23 October

| Check | Result | Evidence |
| --- | --- | --- |
| Build safety regressions | 6 passed, 0 failed | Unsafe configuration, failed/timed-out builds and inherited hosted public settings cannot authorize server startup. Every invocation requires a new build. |
| Python safety regressions | 9 passed, 0 failed | Includes 18 invalid connection strings and 11 environment override cases rejected before mocked connect, explicit connection parameters, all ten dispatched race labels, cleanup failures and removed reuse flag. No network operations. |
| Real PostgreSQL concurrency | 13 distinct scenarios passed, 0 failed | Independent connections observe `pg_blocking_pids()` before releasing the first transaction. Corrected acceptance-then-completion executes the completion UPDATE and checks completed status with one accepted assignment. |
| Disposable project cleanup | 13 passed, 0 failed | Every concurrency fixture was removed; aggregate cleanup passed. |
| Fresh Next.js production build | PASS | Verified local CLI settings and container mappings; compilation, TypeScript and 38 static pages completed. |
| HTTP smoke | 23 passed, 0 failed | Owned loopback production server starts only after the fresh build succeeds. |
| Windows CLI invocation | PASS | Actual local configuration and container mapping discovery passed after removing the shell invocation warning; no credentials printed. |
| Git whitespace/scope | PASS | Final diff and empty index checked; no conflict entries, dependency or migration changes. |
| ESLint | WARNING | No installed binary, lint script or project configuration. Not run; adding dependencies is unnecessary for these focused corrections and was not authorized. |

Executed from `A:\civix\release-preparation\atomic-integration`:

```powershell
node --test tests/local-build-safety.test.cjs
& 'A:/civix/release-preparation/atomic-db-test/.venv/Scripts/python.exe' -B tests/local_release_safety_test.py
& 'A:/civix/release-preparation/atomic-db-test/.venv/Scripts/python.exe' -B tests/local_release_validation.py --phase concurrency
node scripts/atomic-http-smoke.cjs
git diff --check
git diff --cached --check
git diff --cached --name-only
git ls-files -u
```

The six Node and nine Python regressions also passed after the final CLI invocation
and case-insensitive environment-guard adjustments. No full browser replay or
password rotation was required for this correction.

### Corrected concurrency coverage

The previous report counted 13 labels, but `accept then completed` incorrectly
ran rejection, duplicating an existing case. Its claimed completion coverage was
invalid. The corrected runner now has **13 actually executed distinct scenarios**:

- Rival acceptance and same-application retry.
- Both accept/reject orderings and both accept/withdraw orderings.
- Completion before acceptance, completion after acceptance and on-hold before acceptance.
- Unpublication before acceptance.
- Duplicate conversation creation with authorized recovery.
- Submission before acceptance and acceptance before submission.

The dispatch regression audits all ten labels using the shared conditional chain;
the three separate conversation/submission cases were inspected and rerun against
PostgreSQL. Final assignment, application states, uniqueness and relevant
acceptance-notification counts are checked. These results cover the tested
schedules, not every possible concurrent workload.

## Previously verified on 22 October; not rerun here

| Check | Previously successful result |
| --- | --- |
| Marketplace Node suite | 89 tests |
| Standalone TypeScript | PASS |
| SQL security | 2 scripts: external local-operator adaptation of atomic acceptance, and `tests/sql/marketplace_profile_security.sql` |
| Authenticated Edge browser | 18 grouped scenarios: authentication 4, role authorization 4, project/application 3, messaging and access security 7 |
| Local migration history/copies | 16 applied versions: 001 through 013, then 015, 016 and 017; source copies matched; no 014 |

The browser evidence includes immediate sending for both participants without
reloading the sender, read receipts, history preservation, notifications,
accept/reject/withdraw workflows and guest/rival/unrelated-client denials. The
three-line `ConversationView.tsx` success refresh and its four additional Node
regressions remain pending from that validation, unchanged by this correction.
Mocked component tests also check failed-draft preservation and no success refresh
on failure. These earlier results are separate from today's focused tests.

The 015-only contract script belongs before 016 and was not run against the current
schema. The `.spec` isolation file itself was not executed; the Python runner
exercised its races against real PostgreSQL. Earlier claims that local SQL testing
was blocked are superseded by the dated execution evidence above.

## Isolated environment and safe procedure

The existing test installation is outside this worktree at
`A:\civix\release-preparation\atomic-db-test`. CLI status is captured in memory;
API and PostgreSQL must be exactly `http://127.0.0.1:54321` and
`127.0.0.1:54322/postgres`. Named DB/Auth containers and the DB/Kong published
ports are verified before tests. Docker discovery/inspection have 15-second
timeouts. This correction did not modify that installation or apply migrations.

The Python guard parses effective libpq parameters, rejects every URI query or
fragment, socket/multi-host strings and nonempty PG-prefixed environment settings.
Connections use explicit host, hostaddr, port, database and user, a disabled
password file and a connection timeout. Errors do not echo connection strings.

`node scripts/atomic-http-smoke.cjs` obtains the actual local CLI publishable key
and always runs a fresh production build with forced local public Supabase
settings before starting its owned loopback server. The Python browser/all phases
use this same gate. Cached-build reuse is unsupported and `--skip-commands` is
removed. Runtime environment overrides alone never authorize a build. Next.js may
load `.env.local`; verified process values override its public Supabase settings.
No environment file was printed or edited, and credentials are not committed.

`--phase concurrency` performs races without authenticating or changing passwords.
Browser/all phases deliberately rotate passwords for the four dedicated disposable
accounts after verifying their UUIDs and emails. That side effect occurred during
the earlier browser validation, not this correction. Cleanup attempts every
tracked project even after individual failure, retains failed IDs for remediation,
and reports aggregate failure. Browser contexts and the browser close in `finally`;
server shutdown and unrelated-user cleanup also run on failure. Cleanup remains
best effort if the local database becomes unavailable; failed IDs must be resolved.

## Exact file scope

Changed or added during this correction:

1. `tests/local_release_validation.py`
2. `scripts/atomic-http-smoke.cjs`
3. `scripts/local-test-build.cjs` (new)
4. `tests/local-build-safety.test.cjs` (new)
5. `tests/local_release_safety_test.py` (new)
6. `docs/ATOMIC_ACCEPTANCE.md`
7. `docs/ATOMIC_ACCEPTANCE_REVIEW.md`
8. `ATOMIC_INTEGRATION_TEST_REPORT.md`

Preserved earlier pending changes: `components/messaging/ConversationView.tsx`
and `tests/marketplace.test.cjs`. These make ten task files pending relative to
HEAD. The pre-existing untracked `supabase/.gitignore` remains excluded.
No dependency, migration, application authorization or production configuration
change was introduced by this correction.

## Git and remaining limits

The index is empty. No secrets, environment files, generated test output or local
Supabase configuration are staged. HEAD remains `71ec4d0`; `main` remains
`1d270544e4383406f28f4720ade0305d17ec375f` and the preserved backup remains
`b55aadef37f570d7a8e1abd1d4c6a554fa39f79b`. No original-repository files were edited.

Missing ESLint remains a tooling limitation. Hosted ACL/data drift, higher
isolation, bulk/admin writes and FK deletion workloads remain unverified.
Cross-user live subscriptions, pagination, broad base-profile visibility and
admin correction policy are unchanged. Local success is not production validation
or release authorization.

Manual review should cover these ten task files and exclude local configuration
and generated files. Any later hosted migration/deployment requires separate
authorization, hosted schema/ACL/data review and a coordinated app/migration
rollout. Nothing has been staged, committed, merged, pushed or deployed here.

**SAFE TO COMMIT — MANUAL APPROVAL REQUIRED**
