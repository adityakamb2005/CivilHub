-- Prepared only; requires 001-013 and 015. See docs/ATOMIC_ACCEPTANCE.md.
BEGIN;

-- Supabase's postgres migration role is not a superuser. Do not create a
-- BYPASSRLS role or transfer function ownership. Use the existing table owner,
-- with a fail-closed preflight; API roles must never be members of postgres.
DO $$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Run this migration as the postgres table owner';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('profiles', 'client_profiles', 'engineer_profiles', 'projects', 'project_applications')
      AND (c.relowner <> 'postgres'::regrole OR c.relforcerowsecurity OR NOT c.relrowsecurity)
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles r
    WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
      AND pg_catalog.pg_has_role(r.oid, 'postgres'::regrole, 'MEMBER')
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname IN ('anon', 'authenticated') AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'Unexpected table ownership, RLS configuration or API role membership';
  END IF;
  -- Refuse inconsistent historical application assignments; never repair data
  -- implicitly. Admin/portfolio assignments without applications remain valid.
  IF EXISTS (
    SELECT 1 FROM public.project_applications a
    JOIN public.projects p ON p.id = a.project_id
    WHERE a.status = 'accepted'
      AND p.engineer_profile_id IS DISTINCT FROM a.engineer_profile_id
  ) THEN
    RAISE EXCEPTION 'Resolve inconsistent accepted applications before migration';
  END IF;
END;
$$;

CREATE FUNCTION public.accept_project_application(target_project_id UUID, target_application_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  actor UUID := auth.uid();
  p public.projects%ROWTYPE;
  a public.project_applications%ROWTYPE;
BEGIN
  IF actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = actor AND role = 'client'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'PA001', MESSAGE = 'Client identity required';
  END IF;
  -- Project first, then ALL applications in UUID order. Never trust preflight reads.
  SELECT * INTO p FROM public.projects WHERE id = target_project_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.client_profiles WHERE id = p.client_profile_id AND profile_id = actor
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'PA002', MESSAGE = 'Project unavailable';
  END IF;
  PERFORM id FROM public.project_applications
    WHERE project_id = p.id ORDER BY id FOR UPDATE;
  SELECT * INTO a FROM public.project_applications
    WHERE id = target_application_id AND project_id = p.id;
  IF NOT FOUND OR a.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION USING ERRCODE = 'PA003', MESSAGE = 'Application unavailable';
  END IF;
  IF p.engineer_profile_id IS NOT NULL AND p.engineer_profile_id <> a.engineer_profile_id THEN
    RAISE EXCEPTION USING ERRCODE = 'PA004', MESSAGE = 'Engineer already assigned';
  END IF;
  IF EXISTS (SELECT 1 FROM public.project_applications
    WHERE project_id = p.id AND status = 'accepted' AND id <> a.id)
    OR (a.status = 'accepted' AND p.engineer_profile_id IS DISTINCT FROM a.engineer_profile_id)
    OR (a.status = 'pending' AND p.engineer_profile_id IS NOT NULL)
  THEN
    RAISE EXCEPTION USING ERRCODE = 'PA006', MESSAGE = 'Inconsistent assignment';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.engineer_profiles ep
    JOIN public.profiles pr ON pr.id = ep.profile_id
    WHERE ep.id = a.engineer_profile_id AND pr.role = 'engineer') THEN
    RAISE EXCEPTION USING ERRCODE = 'PA003', MESSAGE = 'Engineer unavailable';
  END IF;
  -- A completed project may safely retry an already committed acceptance.
  IF a.status = 'accepted' THEN RETURN; END IF;
  IF p.status NOT IN ('planned', 'in_progress') THEN
    RAISE EXCEPTION USING ERRCODE = 'PA005', MESSAGE = 'Inactive project';
  END IF;
  UPDATE public.projects SET engineer_profile_id = a.engineer_profile_id WHERE id = p.id;
  UPDATE public.project_applications SET status = 'accepted' WHERE id = a.id;
  UPDATE public.project_applications SET status = 'rejected'
    WHERE project_id = p.id AND id <> a.id AND status = 'pending';
  -- No exception handler: notification, constraint and lock errors abort everything.
END;
$$;
-- Set ACLs while the installer still owns the function. Supabase may supply
-- explicit default grants in addition to PUBLIC; remove the standard API roles.
REVOKE ALL ON FUNCTION public.accept_project_application(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_project_application(UUID, UUID) TO authenticated;

-- Invoker guards recognize only trusted postgres-owned execution or canonical
-- application admins. JWT metadata and caller-settable GUCs are not capabilities.
CREATE FUNCTION public.guard_project_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user = 'postgres' OR public.is_admin() THEN RETURN NEW; END IF;
  IF (TG_OP = 'INSERT' AND NEW.engineer_profile_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Use project application acceptance' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.engineer_profile_id IS DISTINCT FROM OLD.engineer_profile_id
      OR NEW.client_profile_id IS DISTINCT FROM OLD.client_profile_id
      OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Project assignment and ownership are protected' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER projects_guard_assignment BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_assignment();

CREATE FUNCTION public.guard_project_application_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user = 'postgres' OR public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
    OLD.status = 'pending' AND (
      (NEW.status = 'withdrawn' AND EXISTS (
        SELECT 1 FROM public.engineer_profiles ep JOIN public.profiles pr ON pr.id = ep.profile_id
        WHERE ep.id = OLD.engineer_profile_id AND pr.id = auth.uid() AND pr.role = 'engineer'))
      OR (NEW.status = 'rejected' AND EXISTS (
        SELECT 1 FROM public.projects p JOIN public.client_profiles cp ON cp.id = p.client_profile_id
        JOIN public.profiles pr ON pr.id = cp.profile_id
        WHERE p.id = OLD.project_id AND pr.id = auth.uid() AND pr.role = 'client'))
    )
  ) THEN
    RAISE EXCEPTION 'Use project application acceptance' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_applications_guard_decision BEFORE UPDATE ON public.project_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_application_decision();

-- Fail closed on legacy duplicate acceptances; never rewrite them automatically.
CREATE UNIQUE INDEX project_applications_one_accepted
  ON public.project_applications(project_id) WHERE status = 'accepted';

REVOKE ALL ON FUNCTION public.guard_project_assignment() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_project_application_decision() FROM PUBLIC, anon, authenticated, service_role;
-- Submission shares the project lock, preventing a new pending rival from
-- committing after acceptance has already scanned competitors.
CREATE FUNCTION public.serialize_project_application_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE p public.projects%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.projects WHERE id = NEW.project_id FOR UPDATE;
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.engineer_profiles ep JOIN public.profiles pr ON pr.id = ep.profile_id
    WHERE ep.id = NEW.engineer_profile_id AND pr.id = auth.uid() AND pr.role = 'engineer'
  ) OR p.id IS NULL OR NOT p.is_published
    OR p.status NOT IN ('planned', 'in_progress') OR p.engineer_profile_id IS NOT NULL
  THEN
    RAISE EXCEPTION 'Project unavailable for applications' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
-- Attach while the installer owns the function and has EXECUTE; CREATE TRIGGER
-- checks EXECUTE at creation, unlike invocation by an already attached trigger.
CREATE TRIGGER project_applications_serialize_insert BEFORE INSERT ON public.project_applications
  FOR EACH ROW EXECUTE FUNCTION public.serialize_project_application_insert();
REVOKE ALL ON FUNCTION public.serialize_project_application_insert() FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
