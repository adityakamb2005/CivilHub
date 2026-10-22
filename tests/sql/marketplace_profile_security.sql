-- PREPARED, NOT EXECUTED. Isolated disposable DB only; never production.
-- Requires 001-013,015-017 and dedicated canonical fixture accounts.
-- psql vars: isolated_test_confirmed=true, client_user_id, engineer_user_id,
-- rival_user_id, admin_user_id. All changes and fixtures roll back.
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
       set_config('test.conversation', gen_random_uuid()::text, true),
       set_config('test.notification', gen_random_uuid()::text, true);
DO $$ BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Use the isolated postgres test owner';
  END IF;
  IF (SELECT role FROM public.profiles WHERE id=current_setting('test.client')::uuid) IS DISTINCT FROM 'client'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.engineer')::uuid) IS DISTINCT FROM 'engineer'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.rival')::uuid) IS DISTINCT FROM 'engineer'
    OR (SELECT role FROM public.profiles WHERE id=current_setting('test.admin')::uuid) IS DISTINCT FROM 'admin'
    OR current_setting('test.engineer')=current_setting('test.rival')
    OR NOT EXISTS (SELECT 1 FROM public.client_profiles WHERE profile_id=current_setting('test.client')::uuid)
    OR (SELECT count(*) FROM public.engineer_profiles WHERE profile_id IN
      (current_setting('test.engineer')::uuid,current_setting('test.rival')::uuid)) <> 2
    OR EXISTS (SELECT 1 FROM public.client_profiles WHERE profile_id=current_setting('test.engineer')::uuid)
    OR EXISTS (SELECT 1 FROM public.engineer_profiles WHERE profile_id=current_setting('test.client')::uuid)
  THEN RAISE EXCEPTION 'Dedicated canonical fixtures without cross-role workspaces required'; END IF;
END $$;
SELECT set_config('test.client_profile', (SELECT id::text FROM public.client_profiles
  WHERE profile_id=current_setting('test.client')::uuid), true),
  set_config('test.engineer_profile', (SELECT id::text FROM public.engineer_profiles
    WHERE profile_id=current_setting('test.engineer')::uuid), true);
UPDATE public.engineer_profiles SET visibility='private',is_verified=false
  WHERE profile_id=current_setting('test.engineer')::uuid;
INSERT INTO public.projects(id,title,description,project_type,status,is_published,client_profile_id)
VALUES (current_setting('test.project')::uuid,'Profile security fixture','Disposable test','Other','planned',true,
  current_setting('test.client_profile')::uuid);
SELECT set_config('request.jwt.claim.sub',current_setting('test.engineer'),true);
SET LOCAL ROLE authenticated;
INSERT INTO public.project_applications(project_id,engineer_profile_id,cover_message)
VALUES (current_setting('test.project')::uuid,current_setting('test.engineer_profile')::uuid,'A disposable private applicant fixture');
DO $$ BEGIN
  BEGIN
    UPDATE public.engineer_profiles SET is_verified=true WHERE id=current_setting('test.engineer_profile')::uuid;
    RAISE EXCEPTION 'Engineer self-verification succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.engineer_profiles SET created_at=created_at + interval '1 day'
    WHERE id=current_setting('test.engineer_profile')::uuid;
    RAISE EXCEPTION 'Engineer identity rewrite succeeded';
  EXCEPTION WHEN integrity_constraint_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.client_profiles(profile_id) VALUES (auth.uid());
    RAISE EXCEPTION 'Engineer created a client workspace';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.profiles SET role='admin' WHERE id=auth.uid();
    RAISE EXCEPTION 'Self-promotion succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',current_setting('test.client'),true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE card jsonb; context jsonb; BEGIN
  IF EXISTS (SELECT 1 FROM public.engineer_profiles WHERE id=current_setting('test.engineer_profile')::uuid) THEN
    RAISE EXCEPTION 'Client can select private applicant profile';
  END IF;
  SELECT * INTO card FROM public.project_applicant_cards(current_setting('test.project')::uuid);
  IF card IS NULL OR card->>'id' IS DISTINCT FROM current_setting('test.engineer_profile')
    OR card ?| ARRAY['phone','about','education','work_experience','website_url','linkedin_url']
    OR (card->'profiles') ? 'phone' THEN
    RAISE EXCEPTION 'Private applicant card missing or overexposed';
  END IF;
  context := public.project_messaging_context(current_setting('test.project')::uuid,current_setting('test.engineer_profile')::uuid);
  IF context->>'client_user_id' IS DISTINCT FROM current_setting('test.client')
    OR context->>'engineer_user_id' IS DISTINCT FROM current_setting('test.engineer') THEN
    RAISE EXCEPTION 'Canonical private messaging context missing';
  END IF;
  BEGIN
    UPDATE public.client_profiles SET created_at=created_at + interval '1 day'
    WHERE id=current_setting('test.client_profile')::uuid;
    RAISE EXCEPTION 'Client identity rewrite succeeded';
  EXCEPTION WHEN integrity_constraint_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.engineer_profiles(profile_id) VALUES (auth.uid());
    RAISE EXCEPTION 'Client created an engineer workspace';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.conversations(project_id,client_profile_id,engineer_profile_id)
    VALUES(current_setting('test.project')::uuid,gen_random_uuid(),current_setting('test.engineer_profile')::uuid);
    RAISE EXCEPTION 'Forged conversation owner accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO public.conversations(id,project_id,client_profile_id,engineer_profile_id)
VALUES(current_setting('test.conversation')::uuid,current_setting('test.project')::uuid,
  current_setting('test.client_profile')::uuid,current_setting('test.engineer_profile')::uuid);
INSERT INTO public.messages(conversation_id,sender_profile_id,body)
VALUES(current_setting('test.conversation')::uuid,auth.uid(),'Client fixture message');
RESET ROLE;
INSERT INTO public.notifications(id,profile_id,type,title,body)
VALUES(current_setting('test.notification')::uuid,current_setting('test.engineer')::uuid,'test','Fixture','Immutable body');
SELECT set_config('request.jwt.claim.sub',current_setting('test.engineer'),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversation_participant_cards() card
    WHERE card->>'conversation_id'=current_setting('test.conversation')) THEN
    RAISE EXCEPTION 'Engineer missing participant card';
  END IF;
  BEGIN
    UPDATE public.notifications SET body='forged' WHERE id=current_setting('test.notification')::uuid;
    RAISE EXCEPTION 'Notification content rewrite succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.messages(conversation_id,sender_profile_id,body)
    VALUES(current_setting('test.conversation')::uuid,current_setting('test.client')::uuid,'forged sender');
    RAISE EXCEPTION 'Sender spoofing succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.notifications SET is_read=true WHERE id=current_setting('test.notification')::uuid;
UPDATE public.messages SET read_at=now() WHERE conversation_id=current_setting('test.conversation')::uuid;
INSERT INTO public.messages(conversation_id,sender_profile_id,body)
VALUES(current_setting('test.conversation')::uuid,auth.uid(),'Engineer fixture reply');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',current_setting('test.rival'),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.conversations WHERE id=current_setting('test.conversation')::uuid)
    OR EXISTS (SELECT 1 FROM public.messages WHERE conversation_id=current_setting('test.conversation')::uuid)
    OR EXISTS (SELECT 1 FROM public.conversation_participant_cards() card
      WHERE card->>'conversation_id'=current_setting('test.conversation'))
    OR EXISTS (SELECT 1 FROM public.project_applicant_cards(current_setting('test.project')::uuid))
    OR public.project_messaging_context(current_setting('test.project')::uuid,current_setting('test.engineer_profile')::uuid) IS NOT NULL THEN
    RAISE EXCEPTION 'Nonparticipant can read private relationship data';
  END IF;
  BEGIN
    INSERT INTO public.messages(conversation_id,sender_profile_id,body)
    VALUES(current_setting('test.conversation')::uuid,auth.uid(),'unauthorized message');
    RAISE EXCEPTION 'Nonparticipant sent a message';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ DECLARE signature text; api_role text; BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.accept_project_application(uuid,uuid)',
    'public.project_messaging_context(uuid,uuid)',
    'public.project_applicant_cards(uuid)',
    'public.conversation_participant_cards()'
  ] LOOP
    IF NOT has_function_privilege('authenticated',signature,'EXECUTE')
      OR has_function_privilege('anon',signature,'EXECUTE')
      OR has_function_privilege('service_role',signature,'EXECUTE') THEN
      RAISE EXCEPTION 'Unexpected RPC ACL for %',signature;
    END IF;
  END LOOP;
  FOREACH signature IN ARRAY ARRAY[
    'public.protect_project_application_identity()', 'public.require_pending_project_application_insert()',
    'public.guard_project_assignment()', 'public.guard_project_application_decision()',
    'public.serialize_project_application_insert()', 'public.protect_marketplace_profile_identity()',
    'public.protect_engineer_verification()', 'public.protect_notification_content()'
  ] LOOP
    FOREACH api_role IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF has_function_privilege(api_role,signature,'EXECUTE') THEN
        RAISE EXCEPTION 'Trigger function % executable by %',signature,api_role;
      END IF;
    END LOOP;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE id=current_setting('test.notification')::uuid AND is_read)
    OR (SELECT count(*) FROM public.messages WHERE conversation_id=current_setting('test.conversation')::uuid) <> 2 THEN
    RAISE EXCEPTION 'Legitimate read-status or messaging workflow failed';
  END IF;
END $$;
ROLLBACK;
\echo 'Profile-security assertions complete; fixtures rolled back.'
