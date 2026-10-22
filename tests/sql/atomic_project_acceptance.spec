# PREPARED, NOT EXECUTED. PostgreSQL isolationtester specification.
# Disposable DB only; operator must install reviewed migrations separately.
# All connections must inherit PGOPTIONS custom settings:
# civilhub_test.client, .admin, .engineer, .rival (canonical auth UUIDs),
# .project, .application, .competitor (new reserved fixture UUIDs).
# A trusted superuser launches the test; tested sessions SET ROLE authenticated.
# Fixture UUIDs must be absent; never point this at production. Setup commits
# fixtures for cross-session visibility; teardown deletes only the fixture project.
setup
{
  SELECT set_config('request.jwt.claim.sub',current_setting('civilhub_test.admin'),false);
  INSERT INTO public.projects(id,title,description,project_type,status,is_published,client_profile_id)
  SELECT current_setting('civilhub_test.project')::uuid,
    'Isolation acceptance ' || current_setting('civilhub_test.project'),
    'Disposable isolation fixture','Other','planned',true,id
  FROM public.client_profiles WHERE profile_id=current_setting('civilhub_test.client')::uuid;
  INSERT INTO public.project_applications(id,project_id,engineer_profile_id,cover_message)
  SELECT CASE WHEN profile_id=current_setting('civilhub_test.engineer')::uuid
      THEN current_setting('civilhub_test.application')::uuid
      ELSE current_setting('civilhub_test.competitor')::uuid END,
    current_setting('civilhub_test.project')::uuid,id,'Disposable isolation application'
  FROM public.engineer_profiles WHERE profile_id IN
    (current_setting('civilhub_test.engineer')::uuid,current_setting('civilhub_test.rival')::uuid);
}
teardown
{
  DELETE FROM public.notifications WHERE body LIKE
    '%"Isolation acceptance ' || current_setting('civilhub_test.project') || '"%'
    OR data->>'link'='/client/projects/' || current_setting('civilhub_test.project') || '/applications';
  DELETE FROM public.projects WHERE id=current_setting('civilhub_test.project')::uuid;
}

session "a"
setup
{
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub',current_setting('civilhub_test.client'),false);
}
step "a_begin" { BEGIN; }
step "a_accept" { SELECT public.accept_project_application(current_setting('civilhub_test.project')::uuid,current_setting('civilhub_test.application')::uuid); }
step "a_commit" { COMMIT; }

session "b"
setup
{
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub',current_setting('civilhub_test.client'),false);
}
step "b_begin" { BEGIN; }
step "b_accept" { SELECT public.accept_project_application(current_setting('civilhub_test.project')::uuid,current_setting('civilhub_test.competitor')::uuid); }
step "b_retry" { SELECT public.accept_project_application(current_setting('civilhub_test.project')::uuid,current_setting('civilhub_test.application')::uuid); }
step "b_commit" { COMMIT; }

session "observer"
step "prepare_submission"
{
  DELETE FROM public.project_applications WHERE id=current_setting('civilhub_test.competitor')::uuid;
}
step "verify_no_submission"
{
  DO $$ BEGIN
    IF (SELECT count(*) FROM public.project_applications WHERE project_id=current_setting('civilhub_test.project')::uuid) <> 1
      OR NOT EXISTS (SELECT 1 FROM public.projects p JOIN public.project_applications a
        ON a.project_id=p.id AND a.engineer_profile_id=p.engineer_profile_id AND a.status='accepted'
        WHERE p.id=current_setting('civilhub_test.project')::uuid)
    THEN RAISE EXCEPTION 'Late submission committed after acceptance'; END IF;
  END $$;
}
step "verify"
{
  DO $$ BEGIN
    IF (SELECT count(*) FROM public.project_applications WHERE project_id=current_setting('civilhub_test.project')::uuid AND status='accepted') <> 1
      OR (SELECT count(*) FROM public.project_applications WHERE project_id=current_setting('civilhub_test.project')::uuid AND status='rejected') <> 1
      OR NOT EXISTS (SELECT 1 FROM public.projects p JOIN public.project_applications a
        ON a.project_id=p.id AND a.engineer_profile_id=p.engineer_profile_id AND a.status='accepted'
        WHERE p.id=current_setting('civilhub_test.project')::uuid)
      OR (SELECT count(*) FROM public.notifications WHERE type='application_accepted'
        AND body LIKE '%"Isolation acceptance ' || current_setting('civilhub_test.project') || '"%') <> 1
      OR (SELECT count(*) FROM public.notifications WHERE type='application_rejected'
        AND body LIKE '%"Isolation acceptance ' || current_setting('civilhub_test.project') || '"%') <> 1
    THEN RAISE EXCEPTION 'Concurrent acceptance invariant failed'; END IF;
  END $$;
}

session "submitter"
setup
{
  SET ROLE authenticated;
  SELECT set_config('request.jwt.claim.sub',current_setting('civilhub_test.rival'),false);
}
step "s_begin" { BEGIN; }
step "s_submit"
{
  INSERT INTO public.project_applications(id,project_id,engineer_profile_id,cover_message)
  SELECT current_setting('civilhub_test.competitor')::uuid,current_setting('civilhub_test.project')::uuid,
    id,'Concurrent disposable application'
  FROM public.engineer_profiles WHERE profile_id=current_setting('civilhub_test.rival')::uuid;
}
step "s_commit" { COMMIT; }

# The second acceptance blocks on the project, then fails PA003 (rival rejected).
permutation "a_begin" "b_begin" "a_accept" "b_accept" "a_commit" "b_commit" "verify"
permutation "b_begin" "a_begin" "b_accept" "a_accept" "b_commit" "a_commit" "verify"
# Lost-response retry blocks, then returns a no-op without duplicate notifications.
permutation "a_begin" "b_begin" "a_accept" "b_retry" "a_commit" "b_commit" "verify"
# Submission commits first: acceptance must see and reject that rival.
permutation "prepare_submission" "s_begin" "s_submit" "a_begin" "a_accept" "s_commit" "a_commit" "verify"
# Acceptance commits first: late submission blocks and then fails 42501.
permutation "prepare_submission" "a_begin" "a_accept" "s_begin" "s_submit" "a_commit" "s_commit" "verify_no_submission"
