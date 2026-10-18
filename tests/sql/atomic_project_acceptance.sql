-- PREPARED / NOT EXECUTED. Disposable DB only, separately authorized operator.
-- Requires migrations 001-013,015,016 installed and existing dedicated accounts.
-- psql vars: isolated_test_confirmed=true, client_user_id, engineer_user_id,
-- rival_user_id, admin_user_id. Never use production accounts/connection.
\set ON_ERROR_STOP on
\if :{?isolated_test_confirmed}
\else
  \quit 3
\endif
\if :isolated_test_confirmed
\else
  \quit 3
\endif
BEGIN;
SELECT set_config('test.client', :'client_user_id', true),
       set_config('test.engineer', :'engineer_user_id', true),
       set_config('test.rival', :'rival_user_id', true),
       set_config('test.admin', :'admin_user_id', true),
       set_config('test.project', gen_random_uuid()::text, true),
       set_config('test.application', gen_random_uuid()::text, true),
       set_config('test.competitor', gen_random_uuid()::text, true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolsuper) THEN
    RAISE EXCEPTION 'Disposable test superuser required';
  END IF;
  IF (SELECT role FROM public.profiles WHERE id=current_setting('test.client')::uuid) IS DISTINCT FROM 'client'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.engineer')::uuid) IS DISTINCT FROM 'engineer'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.rival')::uuid) IS DISTINCT FROM 'engineer'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.admin')::uuid) IS DISTINCT FROM 'admin'
    OR current_setting('test.engineer') = current_setting('test.rival') THEN
    RAISE EXCEPTION 'Dedicated canonical fixtures required';
  END IF;
END $$;
SELECT set_config('test.engineer_profile', (SELECT id::text FROM public.engineer_profiles WHERE profile_id=current_setting('test.engineer')::uuid), true);
SELECT set_config('test.client_profile', (SELECT id::text FROM public.client_profiles WHERE profile_id=current_setting('test.client')::uuid), true);
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
SET LOCAL ROLE authenticated;
INSERT INTO public.projects(id,title,description,project_type,status,is_published,client_profile_id)
VALUES (current_setting('test.project')::uuid, 'Atomic acceptance fixture',
  'Disposable transactional fixture', 'Other', 'planned', true, current_setting('test.client_profile')::uuid);
INSERT INTO public.project_applications(id,project_id,engineer_profile_id,cover_message)
SELECT CASE WHEN profile_id=current_setting('test.engineer')::uuid
  THEN current_setting('test.application')::uuid ELSE current_setting('test.competitor')::uuid END,
  current_setting('test.project')::uuid, id, 'Disposable application fixture message'
FROM public.engineer_profiles
WHERE profile_id IN (current_setting('test.engineer')::uuid,current_setting('test.rival')::uuid);
RESET ROLE;
-- Failure after assignment, selected status and its notification have been written.
CREATE FUNCTION public.test_fail_acceptance_competitor() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
  IF NEW.id=current_setting('test.competitor')::uuid AND NEW.status='rejected' THEN
    RAISE EXCEPTION 'Injected atomic rollback test' USING ERRCODE='ZT001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER test_fail_acceptance_competitor BEFORE UPDATE ON public.project_applications
FOR EACH ROW EXECUTE FUNCTION public.test_fail_acceptance_competitor();
SELECT set_config('request.jwt.claim.sub', current_setting('test.engineer'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
    RAISE EXCEPTION 'Unauthorized acceptance succeeded';
  EXCEPTION WHEN SQLSTATE 'PA001' THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.accept_project_application(gen_random_uuid(),current_setting('test.application')::uuid);
    RAISE EXCEPTION 'Unowned/missing project accepted';
  EXCEPTION WHEN SQLSTATE 'PA002' THEN NULL; END;
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,gen_random_uuid());
    RAISE EXCEPTION 'Unrelated/missing application accepted';
  EXCEPTION WHEN SQLSTATE 'PA003' THEN NULL; END;
  BEGIN
    UPDATE public.projects SET engineer_profile_id=current_setting('test.engineer_profile')::uuid
    WHERE id=current_setting('test.project')::uuid;
    RAISE EXCEPTION 'Direct assignment succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.project_applications SET status='accepted' WHERE id=current_setting('test.application')::uuid;
    RAISE EXCEPTION 'Direct acceptance succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
    RAISE EXCEPTION 'Injected failure did not fire';
  EXCEPTION WHEN SQLSTATE 'ZT001' THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF (SELECT engineer_profile_id FROM public.projects WHERE id=current_setting('test.project')::uuid) IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.project_applications WHERE project_id=current_setting('test.project')::uuid AND status<>'pending')
    OR EXISTS (SELECT 1 FROM public.notifications WHERE type IN ('application_accepted','application_rejected')
      AND body LIKE '%"Atomic acceptance fixture"%') THEN
    RAISE EXCEPTION 'Atomic rollback failed';
  END IF;
END $$;
DROP TRIGGER test_fail_acceptance_competitor ON public.project_applications;
DROP FUNCTION public.test_fail_acceptance_competitor();
-- Withdrawn and conflicting legacy assignments are rejected by the database.
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
SET LOCAL ROLE authenticated;
UPDATE public.project_applications SET status='withdrawn' WHERE id=current_setting('test.application')::uuid;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
    RAISE EXCEPTION 'Withdrawn application accepted';
  EXCEPTION WHEN SQLSTATE 'PA003' THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
SET LOCAL ROLE authenticated;
UPDATE public.project_applications SET status='pending' WHERE id=current_setting('test.application')::uuid;
UPDATE public.projects SET engineer_profile_id=(SELECT id FROM public.engineer_profiles
  WHERE profile_id=current_setting('test.rival')::uuid) WHERE id=current_setting('test.project')::uuid;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
    RAISE EXCEPTION 'Conflicting assignment replaced';
  EXCEPTION WHEN SQLSTATE 'PA004' THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
SET LOCAL ROLE authenticated;
UPDATE public.projects SET engineer_profile_id=NULL WHERE id=current_setting('test.project')::uuid;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
SELECT public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
SELECT public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.application')::uuid);
DO $$ BEGIN
  BEGIN
    PERFORM public.accept_project_application(current_setting('test.project')::uuid,current_setting('test.competitor')::uuid);
    RAISE EXCEPTION 'Competing acceptance succeeded';
  EXCEPTION WHEN SQLSTATE 'PA003' THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.projects p JOIN public.project_applications a
    ON a.project_id=p.id AND a.engineer_profile_id=p.engineer_profile_id
    WHERE p.id=current_setting('test.project')::uuid AND a.id=current_setting('test.application')::uuid AND a.status='accepted')
    OR (SELECT status FROM public.project_applications WHERE id=current_setting('test.competitor')::uuid) IS DISTINCT FROM 'rejected'
    OR (SELECT count(*) FROM public.notifications WHERE type='application_accepted'
      AND profile_id=current_setting('test.engineer')::uuid AND body LIKE '%"Atomic acceptance fixture"%') <> 1
    OR (SELECT count(*) FROM public.notifications WHERE type='application_rejected'
      AND profile_id=current_setting('test.rival')::uuid AND body LIKE '%"Atomic acceptance fixture"%') <> 1 THEN
    RAISE EXCEPTION 'Assignment, competitor rejection or retry notification invariant failed';
  END IF;
END $$;
ROLLBACK;
\echo 'Assertions complete, fixtures rolled back.'
