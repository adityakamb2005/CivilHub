-- Isolated local recovery database only. All synthetic fixtures roll back.
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'civilhub_recovery' OR current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Requires the isolated civilhub_recovery database as postgres';
  END IF;
END $$;
SELECT set_config('test.client', gen_random_uuid()::text, true),
       set_config('test.engineer', gen_random_uuid()::text, true),
       set_config('test.rival', gen_random_uuid()::text, true),
       set_config('test.admin', gen_random_uuid()::text, true),
       set_config('test.project', gen_random_uuid()::text, true);
INSERT INTO auth.users(id, email, raw_user_meta_data)
SELECT current_setting('test.' || actor)::uuid,
       current_setting('test.' || actor) || '@example.invalid',
       jsonb_build_object('role', CASE WHEN actor IN ('engineer','rival') THEN 'engineer' ELSE 'client' END,
                          'full_name', 'Privacy fixture ' || actor)
FROM unnest(ARRAY['client','engineer','rival','admin']) actor;
UPDATE public.profiles SET role = 'admin' WHERE id = current_setting('test.admin')::uuid;
UPDATE public.profiles SET phone = 'private-fixture-contact'
WHERE id IN (current_setting('test.client')::uuid, current_setting('test.engineer')::uuid);
UPDATE public.engineer_profiles SET visibility = 'public'
WHERE profile_id = current_setting('test.engineer')::uuid;

SET LOCAL ROLE anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles) THEN
    RAISE EXCEPTION 'Anonymous caller can read private base rows';
  END IF;
  IF (SELECT count(*) FROM public.public_profiles WHERE id IN
      (current_setting('test.client')::uuid, current_setting('test.engineer')::uuid)) <> 2 THEN
    RAISE EXCEPTION 'Public client or engineer display card unavailable';
  END IF;
  IF EXISTS (SELECT 1 FROM public.public_profiles p WHERE to_jsonb(p) ? 'phone') THEN
    RAISE EXCEPTION 'Public projection includes phone';
  END IF;
  BEGIN
    PERFORM phone FROM public.public_profiles;
    RAISE EXCEPTION 'Public projection exposes phone column';
  EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN
    UPDATE public.public_profiles SET full_name = 'forged';
    RAISE EXCEPTION 'Public view permits anonymous writes';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT phone FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'private-fixture-contact'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'client'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id <> auth.uid()) THEN
    RAISE EXCEPTION 'Owner dashboard/auth access or cross-user privacy failed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.public_profiles WHERE id = current_setting('test.engineer')::uuid) THEN
    RAISE EXCEPTION 'Authenticated caller lost public counterpart display fields';
  END IF;
  BEGIN
    UPDATE public.public_profiles SET full_name = 'forged' WHERE id = auth.uid();
    RAISE EXCEPTION 'Public view permits authenticated writes';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
    RAISE EXCEPTION 'Canonical role escalation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.profiles SET phone = 'updated-private-fixture-contact' WHERE id = auth.uid();
DO $$ BEGIN
  IF (SELECT phone FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'updated-private-fixture-contact' THEN
    RAISE EXCEPTION 'Owner contact edit/read failed';
  END IF;
END $$;
INSERT INTO public.projects(id, title, description, project_type, status, is_published, client_profile_id)
VALUES (current_setting('test.project')::uuid, 'Privacy fixture', 'Disposable local fixture', 'Other', 'planned', true,
  (SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()));
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('test.engineer'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT phone FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'private-fixture-contact'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'engineer' THEN
    RAISE EXCEPTION 'Engineer dashboard/auth profile unavailable';
  END IF;
END $$;
INSERT INTO public.project_applications(project_id, engineer_profile_id, cover_message)
VALUES (current_setting('test.project')::uuid,
  (SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()), 'Local privacy fixture');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('test.client'), true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE card jsonb; context jsonb; conversation uuid; BEGIN
  SELECT * INTO card FROM public.project_applicant_cards(current_setting('test.project')::uuid);
  IF card IS NULL OR card->'profiles' ? 'phone' THEN
    RAISE EXCEPTION 'Applicant display missing or phone exposed';
  END IF;
  PERFORM public.accept_project_application(current_setting('test.project')::uuid,
    (SELECT id FROM public.project_applications WHERE project_id = current_setting('test.project')::uuid));
  context := public.project_messaging_context(current_setting('test.project')::uuid, (card->>'id')::uuid);
  IF context IS NULL THEN RAISE EXCEPTION 'Messaging context unavailable'; END IF;
  INSERT INTO public.conversations(project_id, client_profile_id, engineer_profile_id)
  VALUES (current_setting('test.project')::uuid, (context->>'client_profile_id')::uuid,
    (context->>'engineer_profile_id')::uuid) RETURNING id INTO conversation;
  PERFORM set_config('test.conversation', conversation::text, true);
  INSERT INTO public.messages(conversation_id, sender_profile_id, body)
  VALUES (conversation, auth.uid(), 'Synthetic local message');
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('test.engineer'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversation_participant_cards() card
    WHERE card->>'conversation_id' = current_setting('test.conversation') AND card->>'client_name' = 'Privacy fixture client')
    OR NOT EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = current_setting('test.conversation')::uuid) THEN
    RAISE EXCEPTION 'Messaging display or message visibility failed';
  END IF;
END $$;
UPDATE public.messages SET read_at = now() WHERE conversation_id = current_setting('test.conversation')::uuid;
INSERT INTO public.messages(conversation_id, sender_profile_id, body)
VALUES (current_setting('test.conversation')::uuid, auth.uid(), 'Synthetic local reply');
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', current_setting('test.rival'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id <> auth.uid())
    OR EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = current_setting('test.conversation')::uuid)
    OR EXISTS (SELECT 1 FROM public.conversation_participant_cards() card
      WHERE card->>'conversation_id' = current_setting('test.conversation')) THEN
    RAISE EXCEPTION 'Unrelated account gained private access';
  END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id IN
      (current_setting('test.client')::uuid, current_setting('test.engineer')::uuid) AND phone IS NOT NULL) <> 2 THEN
    RAISE EXCEPTION 'Canonical administrator lost private-profile access';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
\echo 'PASS: phone privacy, public display, owner/admin access, canonical roles, acceptance and messaging; synthetic fixtures rolled back.'
