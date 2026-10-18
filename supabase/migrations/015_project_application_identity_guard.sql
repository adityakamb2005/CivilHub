-- P0 containment only. Prepared for review; do not apply without authorization.
-- 014 is intentionally unused here: its rejected visibility/RLS design is not
-- part of this migration. Existing data, messaging and notification logic stay
-- unchanged. Deploy atomically so new functions never have public execution.
BEGIN;

CREATE FUNCTION public.protect_project_application_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.project_id IS DISTINCT FROM OLD.project_id
    OR NEW.engineer_profile_id IS DISTINCT FROM OLD.engineer_profile_id
    OR NEW.cover_message IS DISTINCT FROM OLD.cover_message
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23000',
      MESSAGE = 'Project application identity and submitted content are immutable';
  END IF;
  -- status remains governed by the existing policies; updated_at remains
  -- managed by project_applications_updated_at / handle_updated_at().
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_applications_protect_identity
  BEFORE UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_project_application_identity();

-- Permissive INSERT policies are ORed together. Keep the existing canonical
-- admin management path, but require pending for every non-admin INSERT even
-- if another policy authorizes it. Neither JWT user_metadata nor SQL role
-- names are accepted as evidence that the user is an application admin.
CREATE FUNCTION public.require_pending_project_application_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    IF NOT COALESCE(public.is_admin(), FALSE) THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'Non-admin project applications must be submitted as pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_applications_require_pending_insert
  BEFORE INSERT ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.require_pending_project_application_insert();

-- Only replace the existing engineer INSERT policy. Preserve the same role,
-- engineer ownership and project eligibility checks, with explicit correlation.
DROP POLICY "project_applications: engineer create own" ON public.project_applications;
CREATE POLICY "project_applications: engineer create own"
  ON public.project_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'engineer'
    )
    AND engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_applications.project_id
        AND p.is_published = TRUE
        AND p.engineer_profile_id IS NULL
        AND p.status IN ('planned', 'in_progress')
    )
  );

-- Trigger functions are not callable API entry points. This follows 013's
-- trigger-function ACL pattern and does not alter table/column privileges.
REVOKE ALL ON FUNCTION public.protect_project_application_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.require_pending_project_application_insert() FROM PUBLIC, anon, authenticated;

COMMIT;
