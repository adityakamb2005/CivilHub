-- Engineer applications for CivilHub client projects.

CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  engineer_profile_id UUID NOT NULL REFERENCES public.engineer_profiles(id) ON DELETE CASCADE,
  cover_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_applications_cover_message_not_blank
    CHECK (char_length(trim(cover_message)) > 0),
  CONSTRAINT project_applications_one_per_engineer
    UNIQUE (project_id, engineer_profile_id)
);

CREATE INDEX IF NOT EXISTS project_applications_engineer_created_idx
  ON public.project_applications(engineer_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_applications_project_created_idx
  ON public.project_applications(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_applications_status_idx
  ON public.project_applications(status);

DROP TRIGGER IF EXISTS project_applications_updated_at ON public.project_applications;
CREATE TRIGGER project_applications_updated_at
  BEFORE UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;

-- 1. Engineers can read their own project applications
DROP POLICY IF EXISTS "project_applications: engineer read own" ON public.project_applications;
CREATE POLICY "project_applications: engineer read own"
  ON public.project_applications
  FOR SELECT
  TO authenticated
  USING (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );

-- 2. Engineers can create applications for published, active, unassigned projects
DROP POLICY IF EXISTS "project_applications: engineer create own" ON public.project_applications;
CREATE POLICY "project_applications: engineer create own"
  ON public.project_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'engineer'
    )
    AND engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND is_published = TRUE
        AND engineer_profile_id IS NULL
        AND status IN ('planned', 'in_progress')
    )
  );

-- 3. Engineers can withdraw their own pending applications
DROP POLICY IF EXISTS "project_applications: engineer withdraw own pending" ON public.project_applications;
CREATE POLICY "project_applications: engineer withdraw own pending"
  ON public.project_applications
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'withdrawn'
    AND engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );

-- 4. Clients can read applications for projects they own
DROP POLICY IF EXISTS "project_applications: client read project applications" ON public.project_applications;
CREATE POLICY "project_applications: client read project applications"
  ON public.project_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.client_profiles cp ON cp.id = p.client_profile_id
      WHERE p.id = project_applications.project_id
        AND cp.profile_id = auth.uid()
    )
  );

-- 5. Clients can update (accept/reject) applications for projects they own
DROP POLICY IF EXISTS "project_applications: client update project applications" ON public.project_applications;
CREATE POLICY "project_applications: client update project applications"
  ON public.project_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.client_profiles cp ON cp.id = p.client_profile_id
      WHERE p.id = project_applications.project_id
        AND cp.profile_id = auth.uid()
    )
  );

-- 6. Admins retain full management permissions
DROP POLICY IF EXISTS "project_applications: admin manage" ON public.project_applications;
CREATE POLICY "project_applications: admin manage"
  ON public.project_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
