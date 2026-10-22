-- Prepared only. Requires 001-013, 015 and 016. Never run against production
-- without separate deployment approval. No existing rows are rewritten.
BEGIN;
DO $$ BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Run as the postgres migration owner';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname IN ('profiles','engineer_profiles','client_profiles','projects',
        'project_applications','conversations','messages','notifications')
      AND (c.relowner <> 'postgres'::regrole OR NOT c.relrowsecurity OR c.relforcerowsecurity)
  ) THEN
    RAISE EXCEPTION 'Unexpected marketplace ownership or RLS configuration';
  END IF;
END $$;

-- Owning a workspace row is not a substitute for the canonical account role.
-- Replace the existing permissive paths rather than adding another OR policy.
DROP POLICY "client_profiles: insert own" ON public.client_profiles;
CREATE POLICY "client_profiles: insert own" ON public.client_profiles
  FOR INSERT TO authenticated WITH CHECK (
    profile_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client'
    )
  );
DROP POLICY "engineer_profiles: insert own" ON public.engineer_profiles;
CREATE POLICY "engineer_profiles: insert own" ON public.engineer_profiles
  FOR INSERT TO authenticated WITH CHECK (
    profile_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer'
    )
  );
DROP POLICY "projects: client manage own" ON public.projects;
CREATE POLICY "projects: client manage own" ON public.projects
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client')
    AND client_profile_id IN (SELECT id FROM public.client_profiles WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client')
    AND client_profile_id IN (SELECT id FROM public.client_profiles WHERE profile_id = auth.uid())
  );

-- Public profile identifiers are relationship anchors, not editable content.
CREATE FUNCTION public.protect_marketplace_profile_identity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$ BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Profile identity is immutable' USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER engineer_profiles_protect_identity BEFORE UPDATE ON public.engineer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_marketplace_profile_identity();
CREATE TRIGGER client_profiles_protect_identity BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_marketplace_profile_identity();

-- A normal engineer may neither self-verify on INSERT nor edit verification.
CREATE FUNCTION public.protect_engineer_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$ BEGIN
  IF current_user = 'postgres' OR public.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_verified THEN
      RAISE EXCEPTION 'Verification requires an administrator' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Verification requires an administrator' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER engineer_profiles_protect_verification BEFORE INSERT OR UPDATE ON public.engineer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_engineer_verification();

CREATE FUNCTION public.protect_notification_content()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$ BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.data IS DISTINCT FROM OLD.data
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only notification read status is editable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notifications_protect_content BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.protect_notification_content();

-- Resolve only the identifiers needed to start a conversation. A private
-- counterpart profile stays private; this does not grant SELECT on its row.
CREATE FUNCTION public.project_messaging_context(target_project_id UUID, target_engineer_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  actor UUID := auth.uid();
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'project_id', p.id, 'client_profile_id', cp.id,
    'engineer_profile_id', ep.id, 'client_user_id', cp.profile_id,
    'engineer_user_id', ep.profile_id
  ) INTO result
  FROM public.projects p
  JOIN public.client_profiles cp ON cp.id = p.client_profile_id
  JOIN public.engineer_profiles ep ON ep.id = target_engineer_id
  JOIN public.profiles owner_user ON owner_user.id = cp.profile_id AND owner_user.role = 'client'
  JOIN public.profiles engineer_user ON engineer_user.id = ep.profile_id AND engineer_user.role = 'engineer'
  WHERE p.id = target_project_id
    AND actor IN (cp.profile_id, ep.profile_id)
    AND (p.engineer_profile_id = ep.id OR EXISTS (
      SELECT 1 FROM public.project_applications a
      WHERE a.project_id = p.id AND a.engineer_profile_id = ep.id
    ));
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.project_messaging_context(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.project_messaging_context(UUID, UUID) TO authenticated;

-- Direct Data API inserts must use the same canonical participant relationship
-- as the action, including when one counterpart's profile is private.
DROP POLICY "conversations: insert eligible" ON public.conversations;
CREATE POLICY "conversations: insert eligible" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (
    (public.project_messaging_context(project_id, engineer_profile_id)->>'client_profile_id')::uuid
      = client_profile_id
  );
DROP POLICY "conversations: select own" ON public.conversations;
CREATE POLICY "conversations: select own" ON public.conversations
  FOR SELECT TO authenticated USING (
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'client')
      AND client_profile_id IN (SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()))
    OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'engineer')
      AND engineer_profile_id IN (SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()))
    OR public.is_admin()
  );

-- Clients can review a deliberately limited applicant card, including private
-- applicants who intentionally submitted to their project. Never return phone,
-- contact URLs, CV JSON, or unrestricted private engineer rows.
CREATE FUNCTION public.project_applicant_cards(target_project_id UUID)
RETURNS SETOF JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'id', ep.id, 'profile_id', ep.profile_id, 'headline', ep.headline,
    'specialization', ep.specialization, 'years_experience', ep.years_experience,
    'skills', ep.skills, 'is_available', ep.is_available, 'visibility', ep.visibility,
    'profiles', jsonb_build_object('id', pr.id, 'full_name', pr.full_name,
      'avatar_url', pr.avatar_url, 'location', pr.location)
  )
  FROM public.engineer_profiles ep JOIN public.profiles pr ON pr.id = ep.profile_id AND pr.role = 'engineer'
  WHERE EXISTS (
    SELECT 1 FROM public.project_applications a
    JOIN public.projects p ON p.id = a.project_id
    JOIN public.client_profiles cp ON cp.id = p.client_profile_id
    JOIN public.profiles owner_user ON owner_user.id = cp.profile_id
    WHERE a.engineer_profile_id = ep.id AND p.id = target_project_id
      AND cp.profile_id = auth.uid() AND owner_user.role = 'client'
  );
$$;
REVOKE ALL ON FUNCTION public.project_applicant_cards(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.project_applicant_cards(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.protect_marketplace_profile_identity() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_engineer_verification() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.protect_notification_content() FROM PUBLIC, anon, authenticated, service_role;
-- Inbox/thread display gets only names and avatars for existing participants.
CREATE FUNCTION public.conversation_participant_cards()
RETURNS SETOF JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object('conversation_id', c.id,
    'client_name', cp_user.full_name, 'client_avatar', cp_user.avatar_url,
    'client_company', cp.company,
    'engineer_name', ep_user.full_name, 'engineer_avatar', ep_user.avatar_url)
  FROM public.conversations c
  JOIN public.client_profiles cp ON cp.id = c.client_profile_id
  JOIN public.engineer_profiles ep ON ep.id = c.engineer_profile_id
  JOIN public.profiles cp_user ON cp_user.id = cp.profile_id
  JOIN public.profiles ep_user ON ep_user.id = ep.profile_id
  WHERE (cp.profile_id = auth.uid() AND cp_user.role = 'client')
    OR (ep.profile_id = auth.uid() AND ep_user.role = 'engineer');
$$;
REVOKE ALL ON FUNCTION public.conversation_participant_cards() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.conversation_participant_cards() TO authenticated;
COMMIT;
