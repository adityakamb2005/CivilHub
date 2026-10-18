# CivilHub marketplace audit — 14 October 2026

## 1. Executive summary

The existing marketplace implements creation, discovery, applications, review, acceptance, single-engineer assignment, conversations, messages, and database-generated notifications. The primary workflow is present; it does not need a replacement architecture. Application-level reliability fixes are implemented in this working tree.

The marketplace cannot yet be certified secure or fully tested end to end. Acceptance remains a multi-request operation, and the checked-in database policies permit application mutations that can bypass the intended workflow. Participant-profile visibility also prevents some legitimate messaging operations. These require approved database changes and authenticated tests in an isolated environment.

Repository inspection began with a clean `main` working tree at `2937b80`. All migrations 001–013 were inspected, with particular attention to the cumulative policies in 006, 009, 010, 011, and 013. No database connection, migration application, production-data mutation, commit, or push was performed. README and the existing Messages onboarding implementations were left unchanged.

Evidence labels used below:

- **User-confirmed**: supplied in the audit request, not independently repeated here.
- **Automated / mocked**: actual TypeScript functions or page components executed against scripted Supabase responses using Node's built-in test runner. No real database authorization is simulated or certified.
- **Code inspection**: source, schema, policies, and trigger review only.
- **Not tested**: authenticated browser behavior, live database grants/policies, persistence, and true concurrency.

## 2. Workflow status

| Workflow | Status | Evidence | Action required |
| --- | --- | --- | --- |
| Client project creation | Existing happy path; failure handling improved | User-confirmed creation/dashboard listing; inspected required fields, date validation, RLS ownership and database checks; mocked profile-failure test | Browser-test duplicate gestures, persistence, and failed saves; network retry idempotency remains open |
| Engineer project discovery | Existing happy path | User-confirmed listing/details; inspected published filtering, detail errors, RLS and availability filter | Test private/future-published projects as unrelated users |
| Engineer application submission | Existing happy path; database hardening required | User-confirmed submission/status; mocked eligibility, validation, identity and duplicate-error handling; UNIQUE(project_id, engineer_profile_id) inspected | Test actual uniqueness and malicious direct API requests |
| Client application review | Existing happy path; private identity visibility incomplete | User-confirmed visible application/details; page checks client role and project ownership; mocked decision ownership | Verify private applicant behavior and unrelated-client denial |
| Application acceptance | Exists; safer, still non-atomic | Mocked role/ownership, rejected/withdrawn/closed guards, lost assignment claim, partial failures, retries | Approved transactional database operation and real race tests |
| Engineer assignment | Exists, one engineer per project | projects.engineer_profile_id FK; client review badge and engineer projects/dashboard queries inspected | Verify persistence and prevent direct API changes inconsistent with applications |
| Messaging | Existing implementation with visibility blockers | Mocked participant authorization, eligibility denial, duplicate-conversation race, sender identity, read scope, profile onboarding and inbox errors; message rendering fixed by inspection | Authenticated two-party test, including private profiles; approved narrow participant access |
| Notifications | Trigger architecture exists; failure handling fixed | Migration 013 insert/status/message triggers inspected; mocked read-update ownership and failures | Verify one notification per event, links, unread changes and rollback on trigger failure |
| Authorization | Layered checks exist; database weaknesses remain | Proxy segment/role checks; server actions and policies inspected; mocked denials | Isolated authenticated RLS suite before security sign-off |

No authenticated browser test was run. No actual FK, unique constraint, trigger execution, rollback, or database lock was exercised.

## 3. Bugs identified

Reproduction procedures below involving manipulated records or failures are for a disposable local/staging database with authorized test accounts only. They were not executed against production.

### A. P0 — Application movement can bypass private-project visibility (unfixed database issue)

**Files:** `A:/civix/CivilHub/supabase/migrations/010_project_applications.sql`, `A:/civix/CivilHub/supabase/migrations/013_project_messaging_security.sql`.

The engineer withdrawal policy checks old status/engineer ownership and new withdrawn status/engineer ownership, but does not preserve project_id, engineer_profile_id, cover_message, id, or created_at. An engineer can attempt to move their pending application to another known project UUID while withdrawing it. The SECURITY DEFINER project-read helper in 013 treats any application relationship as sufficient to read that project, regardless of application status. Foreign keys ensure existence, not authorized eligibility of the new project. This creates an unauthorized private-project access path in the checked-in policy design.

**Reproduce:** create a pending application on project A; as its engineer, directly PATCH its project_id to a different private project B and status to withdrawn; request B. **Fix:** database immutability checks on application identity/context plus strictly controlled transitions, followed by authenticated negative tests. No application-only patch can prevent bypass through the Supabase API. Live grants and deployed policies were not inspected, so production exploitability is not asserted as tested.

### B. P1 — Acceptance can leave inconsistent assignment and application states (partially mitigated)

**File:** `A:/civix/CivilHub/lib/applications/projectActions.ts`.

Originally acceptance updated the project, accepted the application, and rejected competitors in three independent requests, ignoring errors in the latter two. It allowed rejected applications, repeated reassignment, and inactive projects through a manually invoked action. The UI hid failures.

**Reproduce:** accept a rejected application by invoking the action; race two different acceptances; or fail the second/third write after the assignment succeeds. **Fix implemented:** explicit role/ownership/status checks, conditional claim of an unassigned active project with returned-row verification, checked application writes, explicit partial-state errors, and retry support for the same assignee. **Still required:** a database transaction. Concurrent withdrawal/rejection after the initial reads, direct API assignment changes, and process/network failure between requests remain possible. Automatic rollback in application code would add more race-prone writes and was not introduced.

### C. P1 — Direct application writes permit forged workflow state (unfixed database issue)

**File:** `A:/civix/CivilHub/supabase/migrations/010_project_applications.sql`.

The insert policy does not require status=pending; an engineer can supply accepted/rejected/withdrawn on insert. The client UPDATE policy does not limit changed columns or allowed transitions. A project owner can change applicant identity or application details, or accept multiple applications directly without synchronizing the project assignment. No unique partial index limits accepted rows per project.

**Reproduce:** direct API insert with status=accepted as an otherwise eligible engineer; as owner, patch an application's engineer_profile_id or accept two applications. **Fix:** immutable application context, pending-only engineer inserts, explicit transition checks, transactional acceptance and a one-accepted-per-project constraint after inspecting/repairing existing inconsistent data. The existing FK establishes a single assigned engineer but does not ensure agreement with application statuses.

### D. P1 — Participant profiles are not visible for legitimate messaging (unfixed database issue)

**Files:** `A:/civix/CivilHub/supabase/migrations/001_initial_schema.sql`, `A:/civix/CivilHub/supabase/migrations/002_engineer_profiles.sql`, `A:/civix/CivilHub/lib/messaging/messagingActions.ts`.

client_profiles SELECT is own-only. engineer_profiles SELECT allows public/self/admin, not a project owner reviewing a private applicant. getOrCreateConversation and sendMessage require visible participant profiles to obtain profile_id and authorize the sender. An engineer cannot resolve the client's profile under the checked-in policies; a client cannot resolve a private engineer. Joined inbox/review identities fall back to generic labels. Migration 013 fixes project reads and conversation eligibility but does not add these participant-profile reads.

**Reproduce:** use a private engineer profile with an application; client opens applicants and starts/sends a message. As the engineer, attempt to initiate/reply to the client. **Fix:** approved narrow relationship-scoped access or a narrowly returning participant-context function. Return only fields required for the workflow; do not make client profiles or private engineer profiles globally readable. Use non-recursive helpers with fixed search_path, auth.uid() checks, and restricted execution grants. The message button now takes the application FK rather than an optional nested profile ID, but database visibility remains a blocker.

### E. P1 — Unsafe login redirect input (fixed)

**Files:** `A:/civix/CivilHub/app/(auth)/login/page.tsx`, `A:/civix/CivilHub/app/api/auth/callback/route.ts`, new `A:/civix/CivilHub/lib/auth/redirectPath.ts`.

The login query parameter was passed directly to router.push. Executable and external destinations were not rejected. **Reproduce before fix:** open login with a javascript: or external redirect parameter and authenticate. **Fix:** accept only local absolute paths; reject protocol-relative paths, backslashes and control characters; use the same validation for callback next. Local marketplace return URLs remain supported. Validation tests pass; browser exploit testing was not performed.

### F. P1 — Engineer verification is self-editable under checked-in policies (unfixed database issue)

**Files:** `A:/civix/CivilHub/supabase/migrations/001_initial_schema.sql`, `A:/civix/CivilHub/supabase/migrations/002_engineer_profiles.sql`.

is_verified belongs to engineer_profiles, whose own-row INSERT/UPDATE policies do not constrain this field. **Reproduce:** direct API patch own is_verified=true, or insert an own row with that value. **Fix:** privileged verification fields must be database-protected on insert/update, with an explicit trusted admin path. Confirm deployed column grants before assessing live exposure. No verification-policy change was made.

### G. P2 — Failed profile setup supplied an auth UUID as a client-profile FK (fixed)

**File:** `A:/civix/CivilHub/app/(client)/client/projects/new/page.tsx`.

When profile creation failed, the route passed user.id as client_profile_id. Query failure also triggered an attempted insert. **Reproduce:** fail the profile SELECT, or return no profile and fail the bootstrap INSERT, then try creating a project. **Fix:** do not insert after a failed SELECT; render a clear profile error/setup link instead of an unusable project form. Existing successful bootstrap flow is preserved. Mocked page tests pass.

### H. P2 — Rapid create submission and zero-row project updates (fixed within current UI)

**Files:** `A:/civix/CivilHub/app/(client)/client/projects/new/ProjectCreateForm.tsx`, `A:/civix/CivilHub/app/(client)/client/projects/[id]/ProjectEditForm.tsx`.

Creation relied on a disabled button without a synchronous submission guard. Editing treated a zero-row update as success. **Reproduce:** trigger repeated submit events before UI state commits; or remove/change ownership of a project between page load and Save. **Fix:** use a synchronous ref guard, retained after success and released after failure; scope edits to the original owner and require one returned updated row. No guarantee of exactly-once creation across remounts, multiple tabs, or ambiguous network failures is claimed; that needs a durable idempotency key. Browser tests remain outstanding.

### I. P2 — Notification errors and counts appeared as empty/zero data (fixed)

**Files:** both notifications pages, `components/notifications/NotificationsView.tsx`, `lib/notifications/notificationActions.ts`, and `app/(client)/client/projects/page.tsx` under `A:/civix/CivilHub/`.

Notification SELECT errors became “No notifications”; read actions ignored update errors. Application-count query errors became zero applicants. **Reproduce:** fail each query/update. **Fix:** error props/cards, checked notification mutations scoped to auth user, and Unavailable counts. Project-profile query errors also propagate. Tests cover notification ownership filters and failures; visual behavior needs browser checks.

### J. P2 — Message state ignored refreshed server messages/read receipts (fixed)

**Files:** `A:/civix/CivilHub/components/messaging/ConversationView.tsx`, `A:/civix/CivilHub/lib/messaging/messagingActions.ts`.

useState(initialMessages) retained old messages across server refreshes; locally appended temporary messages masked the issue. **Reproduce:** keep the client component mounted and refresh its server payload after a new message or read update. **Fix:** render the authoritative server array returned through action revalidation; report read-update failures and generic conversation-load failures. No realtime subscription or polling was added. Two sessions still require navigation/refresh to observe remote changes.

### K. P2 — Published was incorrectly equated to accepting applications (fixed)

**File:** `A:/civix/CivilHub/app/(client)/client/projects/[id]/applications/page.tsx`.

The no-applicants card advertised acceptance for completed/on-hold/assigned published projects. **Reproduce:** open applicants for a published completed project with no applications. **Fix:** use published + active + unassigned conditions and otherwise show closed guidance.

## 4. Fixes implemented and files changed

All paths below are under `A:/civix/CivilHub/`.

| File | Change |
| --- | --- |
| app/(auth)/login/page.tsx | Validate post-login destination |
| app/api/auth/callback/route.ts | Validate callback destination |
| lib/auth/redirectPath.ts (new) | Shared small local-path validator |
| app/(client)/client/projects/new/page.tsx | Correct profile error/bootstrap fallback |
| app/(client)/client/projects/new/ProjectCreateForm.tsx | Synchronous duplicate-submit guard |
| app/(client)/client/projects/[id]/ProjectEditForm.tsx | Owner filter and require returned row |
| app/(client)/client/projects/[id]/applications/page.tsx | Correct availability text, stable message target FK, retry same assignment |
| app/(client)/client/projects/page.tsx | Distinguish failed profile/count queries |
| lib/applications/projectActions.ts | Decision/withdrawal errors, role checks, acceptance safeguards, partial-state feedback |
| components/applications/ClientApplicationActions.tsx | Render decision errors and acceptance retry |
| components/applications/WithdrawProjectApplicationButton.tsx | Render withdrawal failures |
| app/(client)/client/notifications/page.tsx | Preserve notification query errors |
| app/(engineer)/engineer/notifications/page.tsx | Preserve notification query errors |
| components/notifications/NotificationsView.tsx | Load/update error UI |
| lib/notifications/notificationActions.ts | Validate IDs, preserve ownership, detect failed/no-row updates |
| components/messaging/ConversationView.tsx | Consume refreshed server messages, surface read errors |
| lib/messaging/messagingActions.ts | Explicit conversation-load/read-update errors |
| tests/marketplace.test.cjs (new) | 37 tests using existing TypeScript and Node runtime; no added dependencies |
| docs/MARKETPLACE_AUDIT.md (new) | This report, remaining risks and approval proposals |

No schema, RLS, notification triggers, dependencies, authentication architecture, or existing inbox onboarding were changed.

## 5. Missing features and database proposals requiring approval

Assignment exists. The current model supports one assigned engineer per project via projects.engineer_profile_id; no new assignment table is needed. Acceptance does not automatically move planned projects to in_progress, and that should be a product decision rather than a silent change.

Engineer-side conversation initiation has a server action but no visible StartConversationButton on engineer pages. The only current rendered start button is on the client's applicants page. Add a button for eligible engineer applications/assignments after resolving participant visibility; do not introduce a broad messaging permission.

Workspace navigation currently has plain Messages/Notifications links. NavBadgeIcon exists but is unused, so global unread badges are incomplete. NotificationsView calculates unread count for loaded notifications; inboxes calculate unread messages for loaded conversations. Unbounded list fetches and client-derived counts need pagination/exact counts for larger datasets. No claim is made about the remote API's configured row limit.

Other decisions: whether withdrawn/rejected applicants retain messaging eligibility (current policies accept any application); whether an unpublished project may accept an existing applicant (current action permits an active unpublished project); whether rejection can be reconsidered; assignment replacement/unassignment; public disclosure of phone/location; and durable create-project idempotency.

### Proposed SQL, documentation only — not executed or placed in migrations

The following is a review draft, not a deployable migration. Existing inconsistent records, grants, admin requirements, and allowed transitions must be evaluated first. It does not replace the need for full insert/update guards and authenticated RLS tests. No rejected migration 014 was recreated.

Application-context immutability can be enforced without changing assignment architecture:

```sql
CREATE FUNCTION public.protect_project_application_context()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.project_id IS DISTINCT FROM OLD.project_id
     OR NEW.engineer_profile_id IS DISTINCT FROM OLD.engineer_profile_id
     OR NEW.cover_message IS DISTINCT FROM OLD.cover_message
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Application identity and submitted context are immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_applications_protect_context
BEFORE UPDATE ON public.project_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_project_application_context();

-- Only after reviewing/repairing existing multiple-accepted rows:
CREATE UNIQUE INDEX project_applications_one_accepted_per_project
ON public.project_applications(project_id) WHERE status = 'accepted';
```

Atomic acceptance can use a security-invoker RPC with project and application row locks; the existing database notification triggers then participate in the same transaction. A failed notification insert will roll back the decision transaction rather than leave a partial assignment. A draft core operation is:

```sql
CREATE FUNCTION public.accept_marketplace_application(p_project uuid, p_application uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  target_project public.projects%ROWTYPE;
  target_application public.project_applications%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles
                 WHERE id = auth.uid() AND role = 'client') THEN
    RAISE EXCEPTION 'Client access required';
  END IF;
  SELECT p.* INTO target_project FROM public.projects p
  JOIN public.client_profiles cp ON cp.id = p.client_profile_id
  WHERE p.id = p_project AND cp.profile_id = auth.uid()
  FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project unavailable'; END IF;
  IF target_project.status NOT IN ('planned', 'in_progress') THEN
    RAISE EXCEPTION 'Project inactive';
  END IF;
  SELECT * INTO target_application FROM public.project_applications
  WHERE id = p_application AND project_id = p_project FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application unavailable'; END IF;
  IF target_application.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'Application ineligible';
  END IF;
  IF target_project.engineer_profile_id IS NOT NULL
     AND target_project.engineer_profile_id <> target_application.engineer_profile_id THEN
    RAISE EXCEPTION 'Project already assigned';
  END IF;
  UPDATE public.projects
  SET engineer_profile_id = target_application.engineer_profile_id WHERE id = p_project;
  UPDATE public.project_applications SET status = 'accepted' WHERE id = p_application;
  UPDATE public.project_applications SET status = 'rejected'
  WHERE project_id = p_project AND id <> p_application AND status = 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.accept_marketplace_application(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_marketplace_application(uuid, uuid) TO authenticated;
```

Before deployment, enforce insert defaults/allowed transitions and assignment consistency against direct table writes, not just RPC callers. Consider deferred constraint triggers checking the final accepted/assigned relationship, with a deliberate exception for legacy/admin portfolio assignments. Row locks do not alone stop a newly inserted competing application after acceptance eligibility was checked: insertion must coordinate with the project lock or be rejected atomically when assigned. Rejection/withdrawal paths must participate in a consistent locking/transition strategy. A partial unique index alone cannot ensure project/application agreement.

Participant access requires an additional approved, relationship-scoped function/policy design with a non-recursion review. Prefer a minimal participant-context return over full private profile exposure. Protect is_verified and notification content separately. These are new database changes requiring approval; migration 013 should not be reapplied.

## 6. Security findings

Positive controls inspected: migration 006 prevents self-promotion by preserving profiles.role; signup role is limited to engineer/client in the latest trigger; projects have owner RLS; actions derive engineer identity from authenticated profiles; application and conversation uniqueness constraints exist; conversation creation requires an application/assignment; message sender is auth.uid(); participant message reads/writes are RLS-scoped; migration 013 protects message contents and removes arbitrary notification INSERT permission; notification read/update ownership is scoped to auth.uid(). No application notification inserts were added.

Remaining material findings are A–D and F above. Additional privacy concerns: profiles SELECT USING(true) exposes full rows including phone/location to API readers, and notification own-row UPDATE permits changing own content/data/type/created_at rather than just is_read (ownership is protected by 013). These are code-inspected policy properties; inspect deployed grants and requirements before changing them. An owner can also edit their own engineer verification flag as described above.

Further investigation: the admin engineer SELECT policy introduced in 007 has no TO authenticated restriction while is_admin() execution is granted only to authenticated. Test anonymous engineer-directory queries against actual grants; do not infer a tested anonymous failure from policy text alone. Missing canonical role in proxy can redirect an authenticated user repeatedly toward the client dashboard; normally signup creates the profile, but degraded-profile scenarios need a deliberate error destination.

## 7. Test results

- `node --test tests/marketplace.test.cjs`: **37 passed, 0 failed**. Tests execute real action/page source using TypeScript transpilation and a scripted Supabase boundary. A component regression test preserves hook state across renders to check refreshed message props. They check application behavior and relevant query filters, not SQL execution. No new test dependency or framework was installed.
- `npm.cmd run build`: initial sandbox execution failed loading next.config.ts because SWC could not canonicalize the Windows workspace path (Access denied). The approved execution outside that sandbox passed production compilation, TypeScript checking and static generation. A final build was rerun after the last source changes.
- `git diff --check`: passed; Git emitted line-ending conversion notices, not whitespace errors.
- No existing test, lint or standalone type-check script was defined in package.json. Build includes the actual Next.js TypeScript check.
- No authenticated browser, live RLS, SQL integration, real concurrency or production-data test was performed. No credentials were invented. No remote database reads or writes were used for this audit.
- Complete source diffs and new files were reviewed; changed files are limited to marketplace/auth-redirect fixes, tests and this report.

## 8. Manual testing checklist

Use a disposable local/staging Supabase project with authorized accounts: Client A, Client B, Engineer A, Engineer B, and an administrator for inspection only. Do not run mutation tests on production without explicit authorization. Start the app with `npm.cmd run dev` and use separate browser profiles to preserve each account's session.

1. **Authentication:** signed out, open /client/projects/new, /engineer/projects and either inbox. Confirm login routing. With each wrong-role account, open the other workspace; confirm appropriate dashboard routing from proxy. Test login redirect=/projects/<test-id>; verify the local return URL works. External and javascript: redirect values must fall back to the role dashboard.
2. **Creation/validation:** as Client A create a uniquely named planned project with title, type and description; test blank fields and reversed dates first. Rapidly submit the valid form twice; verify one row for that gesture. Refresh client dashboard and project list and reopen Edit; verify all fields persisted. Test an unavailable client profile and a failed bootstrap insert in local fixtures; confirm no invalid project form appears. Simulate an update affecting zero rows; confirm an error.
3. **Visibility:** create a draft and a published test project. Engineer A and Client B must see only eligible public items in the directory. Directly visit the draft URL as unrelated users and signed out; expect denial/not-found. Use the accepting-applications filter; assigned, on-hold and completed projects must not qualify. Associated engineers' permitted private-project reads are a separate deliberate rule.
4. **Applications:** as Engineer A without an engineer profile, attempt applying and verify guidance; save the profile then retry. Test short/overlong cover text, valid submission and a repeated request. Verify one application with the correct engineer/project IDs. Engineer B must not modify it. Try completed, on-hold, draft and assigned projects. Withdraw a pending application and refresh; repeat and confirm failure feedback. Reapplication is currently prevented by the permanent unique application record.
5. **Review:** Client A opens their applicants page and confirms identity, cover message, counts, timestamps and statuses. Client B tries the same route and action IDs; both must deny access. Repeat with a private engineer profile and record the known visibility limitation. Simulate list/count failures and distinguish unavailable from no applicants.
6. **Acceptance/assignment:** create two pending applications from different engineers. Accept Engineer A; verify projects.engineer_profile_id, A accepted, B rejected, Client A's badge, Engineer A's Assigned Projects and dashboard. Refresh both sessions. Test rejected/withdrawn applications and inactive projects. Race acceptances from two Client A sessions; only the conditional claim should win. Fail the application write or competitor write in local fault injection; confirm explicit partial-state feedback and same-engineer retry. Acceptance/withdrawal race and direct-API consistency still require the approved database fix.
7. **Messaging:** as Client A start a conversation from the applicant row twice; verify one project/client/engineer tuple. Send both directions, refresh both sessions, verify body/order/sender and persisted read receipts. Navigate between conversations without a full reload; no prior thread should remain. Confirm unread inbox totals change on reading. Test a private engineer and engineer-side reply; expect the documented participant-profile blocker until resolved. Engineer B and Client B must not read/send/mark read on the unrelated thread.
8. **Notifications:** submit an application and verify one notification for Client A. Accept/reject and verify the target engineer's notification and correct link. Send each message and verify only its recipient receives a notification. Mark one/all read and refresh; verify ownership and unread totals. In local fault injection, fail the trigger insert: the individual triggering SQL write must roll back; current multi-request acceptance still has partial-state risk. Fail notification SELECT/UPDATE and confirm visible errors.
9. **RLS adversarial suite:** directly call Supabase with each test user's normal JWT (never a service-role key). Test another user's project/application/conversation/notification IDs, engineer-supplied status=accepted, project_id movement while withdrawing, client applicant-identity changes, multiple accepted applications, own is_verified edits, role changes, and notification ownership changes. Findings A/C/F are expected to reveal the current schema weaknesses; verify denials after approved changes. Record actual results before calling database security verified.
10. **Onboarding regression:** on both roles test missing visible profiles, profile query errors, existing profiles and conversation errors. Check the existing Setup link, save profile, and return to Messages. Never assume an empty SELECT means no underlying row exists under RLS.

## 9. Git status

Initial status was clean. Final changed-file set (all unstaged):

```text
 M app/(auth)/login/page.tsx
 M app/(client)/client/notifications/page.tsx
 M app/(client)/client/projects/[id]/ProjectEditForm.tsx
 M app/(client)/client/projects/[id]/applications/page.tsx
 M app/(client)/client/projects/new/ProjectCreateForm.tsx
 M app/(client)/client/projects/new/page.tsx
 M app/(client)/client/projects/page.tsx
 M app/(engineer)/engineer/notifications/page.tsx
 M app/api/auth/callback/route.ts
 M components/applications/ClientApplicationActions.tsx
 M components/applications/WithdrawProjectApplicationButton.tsx
 M components/messaging/ConversationView.tsx
 M components/notifications/NotificationsView.tsx
 M lib/applications/projectActions.ts
 M lib/messaging/messagingActions.ts
 M lib/notifications/notificationActions.ts
?? docs/MARKETPLACE_AUDIT.md
?? lib/auth/redirectPath.ts
?? tests/marketplace.test.cjs
```

No commits, staging or pushes. No unrelated files or migration files changed.

## 10. Recommended next steps

- **P0:** approve and validate database application-context immutability to close the private-project relationship-forging path. Confirm deployed grants/policies and assess existing data before production rollout.
- **P1:** transactional acceptance with concurrency/transition constraints; narrow participant identity visibility; protect verification fields. Then run authenticated RLS and two-account browser tests. These cannot be completed safely with frontend changes alone.
- **P2:** durable project idempotency, pagination/exact counts, persistent recovery UI for pre-existing partial acceptance, profile-query/error consistency on remaining detail pages, notification-content protection, public-profile privacy decision, degraded-role routing and anonymous-policy grant checks.
- **P3:** engineer conversation-start UI once authorized participant resolution works; global unread navigation badges; realtime updates if desired.

Stop for review of this working tree. Database proposals and remaining product decisions require separate authorization before implementation or deployment.
