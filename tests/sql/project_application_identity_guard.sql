-- PREPARED, NOT EXECUTED. Only for a separately authorized disposable database.
-- Requires reviewed migrations 001-013 and 015 already installed by an operator.
-- This file does NOT install any migration. See docs/P0_APPLICATION_IDENTITY.md.
-- psql variables: isolated_test_confirmed=true, client_user_id, engineer_user_id,
-- admin_user_id. Accounts/profiles must already exist in that disposable DB.
-- Run as a trusted BYPASSRLS/superuser test operator able to SET ROLE authenticated.
-- Unfiltered final checks run as that operator so RLS cannot hide forbidden rows.
-- Tested writes use authenticated + auth.uid(), not owner/service-role RLS bypass. Fixture
-- claims here simulate the DB request context, not JWT signature verification.
\set ON_ERROR_STOP on
\if :{?isolated_test_confirmed}
\else
  \echo 'STOP: explicit isolated_test_confirmed=true is required.'
  \quit 3
\endif
\if :isolated_test_confirmed
\else
  \echo 'STOP: database must be disposable and separately authorized.'
  \quit 3
\endif
\if :{?client_user_id}
\else
  \echo 'STOP: client_user_id is required.'
  \quit 3
\endif
\if :{?engineer_user_id}
\else
  \echo 'STOP: engineer_user_id is required.'
  \quit 3
\endif
\if :{?admin_user_id}
\else
  \echo 'STOP: admin_user_id is required.'
  \quit 3
\endif

BEGIN;
SELECT set_config('civilhub_p0.client_user', :'client_user_id', true);
SELECT set_config('civilhub_p0.engineer_user', :'engineer_user_id', true);
SELECT set_config('civilhub_p0.admin_user', :'admin_user_id', true);

-- Read-only preconditions: fail before creating test project/application rows.
DO $$
DECLARE
  client_profile uuid;
  engineer_profile uuid;
  label text;
BEGIN
  IF current_user IS DISTINCT FROM session_user THEN
    RAISE EXCEPTION 'Start the test as the trusted session user without an existing SET ROLE override';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles
                 WHERE rolname=current_user AND (rolsuper OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Trusted BYPASSRLS test operator required for unfiltered persistence checks';
  END IF;
  IF to_regprocedure('public.protect_project_application_identity()') IS NULL
     OR to_regprocedure('public.require_pending_project_application_insert()') IS NULL THEN
    RAISE EXCEPTION 'Reviewed migration 015 must already be installed';
  END IF;
  -- 010 explicitly names this UNIQUE constraint. Check its actual table and
  -- ordered key columns as well; accepting an arbitrary 23505 is insufficient.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conrelid='public.project_applications'::regclass
      AND c.conname='project_applications_one_per_engineer'
      AND c.contype='u' AND c.convalidated
      AND ARRAY(SELECT a.attname::text FROM pg_attribute a
                WHERE a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
                ORDER BY array_position(c.conkey,a.attnum))
          = ARRAY['project_id','engineer_profile_id']::text[]
  ) THEN
    RAISE EXCEPTION 'Expected 010 UNIQUE(project_id,engineer_profile_id) constraint is missing or different';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles
                 WHERE id=current_setting('civilhub_p0.client_user')::uuid AND role='client')
     OR NOT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id=current_setting('civilhub_p0.engineer_user')::uuid AND role='engineer')
     OR NOT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id=current_setting('civilhub_p0.admin_user')::uuid AND role='admin') THEN
    RAISE EXCEPTION 'Provide existing dedicated client/engineer/admin test accounts';
  END IF;
  SELECT id INTO STRICT client_profile FROM public.client_profiles
  WHERE profile_id=current_setting('civilhub_p0.client_user')::uuid;
  SELECT id INTO STRICT engineer_profile FROM public.engineer_profiles
  WHERE profile_id=current_setting('civilhub_p0.engineer_user')::uuid;
  PERFORM set_config('civilhub_p0.client_profile', client_profile::text, true);
  PERFORM set_config('civilhub_p0.engineer_profile', engineer_profile::text, true);
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject','forged','admin','private'] LOOP
    PERFORM set_config('civilhub_p0.project_' || label, gen_random_uuid()::text, true);
    PERFORM set_config('civilhub_p0.application_' || label, gen_random_uuid()::text, true);
  END LOOP;
  PERFORM set_config('civilhub_p0.application_duplicate', gen_random_uuid()::text, true);
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('civilhub_p0.client_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('civilhub_p0.client_user'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE label text;
BEGIN
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject','forged','admin','private'] LOOP
    INSERT INTO public.projects
      (id,title,description,project_type,status,client_profile_id,is_published,published_at)
    VALUES
      (current_setting('civilhub_p0.project_' || label)::uuid,
       'P0 isolated fixture ' || label || ' ' || current_setting('civilhub_p0.project_' || label),
       'Disposable transactional security test',
       'Other','planned',current_setting('civilhub_p0.client_profile')::uuid,
       label <> 'private',CASE WHEN label <> 'private' THEN now() ELSE NULL END);
  END LOOP;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('civilhub_p0.engineer_user'), true);
-- Deliberately forged metadata: canonical profiles.role is still engineer.
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('civilhub_p0.engineer_user'),'role','authenticated',
  'user_metadata',jsonb_build_object('role','admin'))::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE label text;
BEGIN
  IF public.is_admin() IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'Engineer must not become an admin through metadata';
  END IF;
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject'] LOOP
    -- Omit status, exactly as submitProjectApplication does. Set an old
    -- updated_at only to prove that the existing UPDATE timestamp trigger runs.
    INSERT INTO public.project_applications
      (id,project_id,engineer_profile_id,cover_message,updated_at)
    VALUES
      (current_setting('civilhub_p0.application_' || label)::uuid,
       current_setting('civilhub_p0.project_' || label)::uuid,
       current_setting('civilhub_p0.engineer_profile')::uuid,
       'Relevant engineering qualifications for this isolated test.',
       '2000-01-01T00:00:00Z');
    IF NOT EXISTS (SELECT 1 FROM public.project_applications
                   WHERE id=current_setting('civilhub_p0.application_' || label)::uuid
                     AND status='pending') THEN
      RAISE EXCEPTION 'Legitimate pending submission failed: %', label;
    END IF;
  END LOOP;
END;
$$;

-- All five protected fields are tested alongside a permitted withdrawal.
-- Require the guard's exact SQLSTATE/message: an FK/RLS error or zero-row
-- UPDATE must not masquerade as proof that the trigger blocked the attack.
DO $$
DECLARE
  assignment text;
  affected integer;
  original_row public.project_applications%ROWTYPE;
  after_row public.project_applications%ROWTYPE;
BEGIN
  SELECT * INTO STRICT original_row FROM public.project_applications
  WHERE id=current_setting('civilhub_p0.application_identity')::uuid;
  FOREACH assignment IN ARRAY ARRAY[
    format('project_id = %L::uuid', current_setting('civilhub_p0.project_private')),
    format('engineer_profile_id = %L::uuid', gen_random_uuid()::text),
    format('id = %L::uuid', gen_random_uuid()::text),
    'cover_message = ''Changed application content''',
    'created_at = created_at + interval ''1 second'''
  ] LOOP
    BEGIN
      EXECUTE format('UPDATE public.project_applications SET status=''withdrawn'', %s WHERE id=%L::uuid',
        assignment,current_setting('civilhub_p0.application_identity'));
      GET DIAGNOSTICS affected = ROW_COUNT;
      RAISE EXCEPTION 'Expected identity guard, got % updated rows for %', affected, assignment;
    EXCEPTION WHEN SQLSTATE '23000' THEN
      IF SQLERRM <> 'Project application identity and submitted content are immutable' THEN RAISE; END IF;
    END;
    SELECT * INTO STRICT after_row FROM public.project_applications WHERE id=original_row.id;
    IF to_jsonb(after_row) IS DISTINCT FROM to_jsonb(original_row) THEN
      RAISE EXCEPTION 'Failed identity update changed the stored row: %', assignment;
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.project_applications
                 WHERE id=current_setting('civilhub_p0.application_identity')::uuid
                   AND status='pending'
                   AND project_id=current_setting('civilhub_p0.project_identity')::uuid) THEN
    RAISE EXCEPTION 'Rejected mutations changed the original row';
  END IF;
  IF EXISTS (SELECT 1 FROM public.projects
             WHERE id=current_setting('civilhub_p0.project_private')::uuid) THEN
    RAISE EXCEPTION 'Identity attack exposed the unrelated private fixture';
  END IF;
END;
$$;

DO $$
DECLARE
  proposed_status text;
  violated_constraint text;
  violated_table text;
  violated_schema text;
BEGIN
  FOREACH proposed_status IN ARRAY ARRAY['accepted','rejected','withdrawn'] LOOP
    BEGIN
      INSERT INTO public.project_applications (id,project_id,engineer_profile_id,cover_message,status)
      VALUES (current_setting('civilhub_p0.application_forged')::uuid,
              current_setting('civilhub_p0.project_forged')::uuid,
              current_setting('civilhub_p0.engineer_profile')::uuid,
              'Forged non-pending submission must not be stored.', proposed_status);
      RAISE EXCEPTION 'Forged INSERT succeeded: %', proposed_status;
    EXCEPTION WHEN SQLSTATE '42501' THEN
      IF SQLERRM <> 'Non-admin project applications must be submitted as pending' THEN RAISE; END IF;
    END;
    IF EXISTS (SELECT 1 FROM public.project_applications
               WHERE id=current_setting('civilhub_p0.application_forged')::uuid
                  OR project_id=current_setting('civilhub_p0.project_forged')::uuid) THEN
      RAISE EXCEPTION 'Forbidden application persisted after failed INSERT: %', proposed_status;
    END IF;
  END LOOP;
  -- Uniqueness still rejects a repeated legitimate submission.
  BEGIN
    INSERT INTO public.project_applications (id,project_id,engineer_profile_id,cover_message)
    VALUES (current_setting('civilhub_p0.application_duplicate')::uuid,
            current_setting('civilhub_p0.project_identity')::uuid,
            current_setting('civilhub_p0.engineer_profile')::uuid,
            'Duplicate submission must still hit the unique constraint.');
    RAISE EXCEPTION 'Duplicate application unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME,
      violated_table = TABLE_NAME, violated_schema = SCHEMA_NAME;
    IF violated_constraint IS DISTINCT FROM 'project_applications_one_per_engineer'
       OR violated_table IS DISTINCT FROM 'project_applications'
       OR violated_schema IS DISTINCT FROM 'public' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.project_applications
             WHERE id=current_setting('civilhub_p0.application_duplicate')::uuid)
     OR (SELECT count(*) FROM public.project_applications
          WHERE project_id=current_setting('civilhub_p0.project_identity')::uuid
            AND engineer_profile_id=current_setting('civilhub_p0.engineer_profile')::uuid) <> 1 THEN
    RAISE EXCEPTION 'Failed duplicate INSERT changed the intended unique pair';
  END IF;
END;
$$;

-- Demonstrate that an additional permissive INSERT policy cannot bypass the
-- pending guard. This temporary policy exists only in this rolled-back test
-- transaction, never in a migration, and is removed before other cases.
RESET ROLE;
CREATE POLICY civilhub_p0_test_permissive_insert ON public.project_applications
FOR INSERT TO authenticated WITH CHECK (TRUE);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.project_applications (id,project_id,engineer_profile_id,cover_message,status)
    VALUES (current_setting('civilhub_p0.application_forged')::uuid,
            current_setting('civilhub_p0.project_forged')::uuid,
            current_setting('civilhub_p0.engineer_profile')::uuid,
            'A permissive policy must not allow a forged accepted insert.', 'accepted');
    RAISE EXCEPTION 'Permissive INSERT policy bypassed pending guard';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    IF SQLERRM <> 'Non-admin project applications must be submitted as pending' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.project_applications
             WHERE id=current_setting('civilhub_p0.application_forged')::uuid
                OR project_id=current_setting('civilhub_p0.project_forged')::uuid) THEN
    RAISE EXCEPTION 'Forbidden INSERT persisted under permissive policy';
  END IF;
END;
$$;
RESET ROLE;
-- Repeat persistence checks without RLS, before dropping the test policy.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.project_applications
             WHERE id IN (current_setting('civilhub_p0.application_forged')::uuid,
                          current_setting('civilhub_p0.application_duplicate')::uuid)
                OR project_id=current_setting('civilhub_p0.project_forged')::uuid) THEN
    RAISE EXCEPTION 'Unfiltered check found a forbidden or duplicate application';
  END IF;
END;
$$;
DROP POLICY civilhub_p0_test_permissive_insert ON public.project_applications;
SET LOCAL ROLE authenticated;

DO $$
DECLARE affected integer;
BEGIN
  UPDATE public.project_applications SET status='withdrawn'
  WHERE id=current_setting('civilhub_p0.application_withdraw')::uuid AND status='pending';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 OR NOT EXISTS (SELECT 1 FROM public.project_applications
      WHERE id=current_setting('civilhub_p0.application_withdraw')::uuid
        AND status='withdrawn' AND updated_at=now()) THEN
    RAISE EXCEPTION 'Legitimate withdrawal / database-managed updated_at failed';
  END IF;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('civilhub_p0.client_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('civilhub_p0.client_user'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE affected integer; label text;
BEGIN
  -- Preserve the current application action's assignment-then-status flow.
  -- This test does not assert atomic acceptance (a later hardening stage).
  UPDATE public.projects SET engineer_profile_id=current_setting('civilhub_p0.engineer_profile')::uuid
  WHERE id=current_setting('civilhub_p0.project_accept')::uuid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Client assignment compatibility failed'; END IF;
  UPDATE public.project_applications SET status='accepted'
  WHERE id=current_setting('civilhub_p0.application_accept')::uuid AND status='pending';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Legitimate acceptance failed'; END IF;
  UPDATE public.project_applications SET status='rejected'
  WHERE id=current_setting('civilhub_p0.application_reject')::uuid AND status='pending';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Legitimate rejection failed'; END IF;
  -- Client-owner policy is a different authorization path from withdrawal.
  BEGIN
    UPDATE public.project_applications SET cover_message='Client rewrite'
    WHERE id=current_setting('civilhub_p0.application_identity')::uuid;
    RAISE EXCEPTION 'Client identity/content rewrite unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE '23000' THEN
    IF SQLERRM <> 'Project application identity and submitted content are immutable' THEN RAISE; END IF;
  END;
  -- 013 stores the destination in notifications.data.link (not a project_id
  -- JSON field). Check each fixture individually: duplicates cannot cancel a
  -- missing notification elsewhere.
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject'] LOOP
    IF (SELECT count(*) FROM public.notifications
         WHERE profile_id=auth.uid() AND type='project_application'
           AND data->>'link'='/client/projects/' || current_setting('civilhub_p0.project_' || label) || '/applications') <> 1 THEN
      RAISE EXCEPTION '013 submission notification missing/duplicated for %', label;
    END IF;
  END LOOP;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('civilhub_p0.admin_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('civilhub_p0.admin_user'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE affected integer;
BEGIN
  IF public.is_admin() IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Canonical admin required'; END IF;
  -- Retain the existing admin INSERT policy, including non-pending imports.
  INSERT INTO public.project_applications (id,project_id,engineer_profile_id,cover_message,status)
  VALUES (current_setting('civilhub_p0.application_admin')::uuid,
          current_setting('civilhub_p0.project_admin')::uuid,
          current_setting('civilhub_p0.engineer_profile')::uuid,
          'Canonical administrator application import fixture.', 'accepted');
  IF NOT EXISTS (SELECT 1 FROM public.project_applications
                 WHERE id=current_setting('civilhub_p0.application_admin')::uuid AND status='accepted') THEN
    RAISE EXCEPTION 'Admin non-pending import was not stored as accepted';
  END IF;
  UPDATE public.project_applications SET status='rejected'
  WHERE id=current_setting('civilhub_p0.application_admin')::uuid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Admin status management failed'; END IF;
  BEGIN
    UPDATE public.project_applications SET project_id=current_setting('civilhub_p0.project_private')::uuid
    WHERE id=current_setting('civilhub_p0.application_admin')::uuid;
    RAISE EXCEPTION 'Admin identity rewrite unexpectedly bypassed guard';
  EXCEPTION WHEN SQLSTATE '23000' THEN
    IF SQLERRM <> 'Project application identity and submitted content are immutable' THEN RAISE; END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.project_applications
                 WHERE id=current_setting('civilhub_p0.application_accept')::uuid AND status='accepted')
     OR NOT EXISTS (SELECT 1 FROM public.project_applications
                    WHERE id=current_setting('civilhub_p0.application_reject')::uuid AND status='rejected') THEN
    RAISE EXCEPTION 'Client decision state was not preserved';
  END IF;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('civilhub_p0.engineer_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('civilhub_p0.engineer_user'),'role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.notifications
       WHERE profile_id=auth.uid() AND type='application_accepted'
         AND data->>'link'='/engineer/projects'
         AND position('P0 isolated fixture accept ' || current_setting('civilhub_p0.project_accept') IN body) > 0) <> 1
     OR (SELECT count(*) FROM public.notifications
          WHERE profile_id=auth.uid() AND type='application_rejected'
            AND data->>'link'='/engineer/projects'
            AND position('P0 isolated fixture reject ' || current_setting('civilhub_p0.project_reject') IN body) > 0) <> 1 THEN
    RAISE EXCEPTION '013 accepted/rejected notifications changed';
  END IF;
END;
$$;

RESET ROLE;
-- Authoritative global checks must not rely on user-level SELECT visibility.
DO $$
DECLARE
  label text;
  expected_status text;
  expected_notifications integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.project_applications
             WHERE id IN (current_setting('civilhub_p0.application_forged')::uuid,
                          current_setting('civilhub_p0.application_duplicate')::uuid)
                OR project_id IN (current_setting('civilhub_p0.project_forged')::uuid,
                                  current_setting('civilhub_p0.project_private')::uuid)) THEN
    RAISE EXCEPTION 'Forbidden application persisted outside user RLS visibility';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.projects
                 WHERE id=current_setting('civilhub_p0.project_accept')::uuid
                   AND engineer_profile_id=current_setting('civilhub_p0.engineer_profile')::uuid) THEN
    RAISE EXCEPTION 'Client assignment was not persisted with the expected engineer';
  END IF;
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject','admin'] LOOP
    expected_status := CASE label WHEN 'identity' THEN 'pending' WHEN 'withdraw' THEN 'withdrawn'
                          WHEN 'accept' THEN 'accepted' ELSE 'rejected' END;
    IF (SELECT count(*) FROM public.project_applications
         WHERE project_id=current_setting('civilhub_p0.project_' || label)::uuid) <> 1
       OR NOT EXISTS (SELECT 1 FROM public.project_applications
          WHERE id=current_setting('civilhub_p0.application_' || label)::uuid
            AND project_id=current_setting('civilhub_p0.project_' || label)::uuid
            AND engineer_profile_id=current_setting('civilhub_p0.engineer_profile')::uuid
            AND status=expected_status
            AND cover_message=CASE WHEN label='admin'
                 THEN 'Canonical administrator application import fixture.'
                 ELSE 'Relevant engineering qualifications for this isolated test.' END
            AND created_at=now()) THEN
      RAISE EXCEPTION 'Unexpected final application state for %', label;
    END IF;
  END LOOP;
  FOREACH label IN ARRAY ARRAY['identity','withdraw','accept','reject','forged','admin','private'] LOOP
    expected_notifications := CASE WHEN label IN ('forged','private') THEN 0
                              WHEN label IN ('accept','reject','admin') THEN 2 ELSE 1 END;
    IF (SELECT count(*) FROM public.notifications n
         WHERE position('"P0 isolated fixture ' || label || ' ' || current_setting('civilhub_p0.project_' || label) || '"' IN n.body) > 0
            OR n.data->>'link'='/client/projects/' || current_setting('civilhub_p0.project_' || label) || '/applications')
       <> expected_notifications THEN
      RAISE EXCEPTION 'Wrong number of fixture notifications (including hidden recipients) for %', label;
    END IF;
    IF label NOT IN ('forged','private') AND (SELECT count(*) FROM public.notifications
         WHERE profile_id=current_setting('civilhub_p0.client_user')::uuid
           AND type='project_application'
           AND data->>'link'='/client/projects/' || current_setting('civilhub_p0.project_' || label) || '/applications') <> 1 THEN
      RAISE EXCEPTION 'Wrong submission notification recipient/type/link for %', label;
    END IF;
    IF label IN ('accept','reject','admin') AND (SELECT count(*) FROM public.notifications n
         WHERE n.profile_id=current_setting('civilhub_p0.engineer_user')::uuid
           AND n.type=CASE WHEN label='accept' THEN 'application_accepted' ELSE 'application_rejected' END
           AND n.data->>'link'='/engineer/projects'
           AND position('"P0 isolated fixture ' || label || ' ' || current_setting('civilhub_p0.project_' || label) || '"' IN n.body) > 0) <> 1 THEN
      RAISE EXCEPTION 'Wrong decision notification recipient/type/link for %', label;
    END IF;
  END LOOP;
END;
$$;
ROLLBACK;
\echo 'P0 SQL assertions completed; all fixture writes rolled back.'
