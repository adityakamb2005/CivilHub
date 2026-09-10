-- Engineer applications for published CivilHub opportunities.

CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  engineer_profile_id UUID NOT NULL REFERENCES public.engineer_profiles(id) ON DELETE CASCADE,
  cover_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opportunity_applications_cover_message_not_blank
    CHECK (char_length(trim(cover_message)) > 0),
  -- One application record is retained as the application's history. This
  -- prevents duplicate active submissions and avoids accidental resubmission.
  CONSTRAINT opportunity_applications_one_per_engineer
    UNIQUE (opportunity_id, engineer_profile_id)
);

CREATE INDEX IF NOT EXISTS opportunity_applications_engineer_created_idx
  ON public.opportunity_applications(engineer_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunity_applications_opportunity_created_idx
  ON public.opportunity_applications(opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunity_applications_status_idx
  ON public.opportunity_applications(status);

DROP TRIGGER IF EXISTS opportunity_applications_updated_at ON public.opportunity_applications;
CREATE TRIGGER opportunity_applications_updated_at
  BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunity_applications: engineer read own"
  ON public.opportunity_applications
  FOR SELECT
  TO authenticated
  USING (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "opportunity_applications: engineer create own"
  ON public.opportunity_applications
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
      SELECT 1 FROM public.opportunities
      WHERE id = opportunity_id
        AND is_published = TRUE
        AND status = 'open'
        AND (published_at IS NULL OR published_at <= NOW())
    )
  );

CREATE POLICY "opportunity_applications: engineer withdraw own pending"
  ON public.opportunity_applications
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

CREATE POLICY "opportunity_applications: admin manage"
  ON public.opportunity_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Administrators need the associated engineer identity, including private
-- profiles, when reviewing an application. This does not grant public access.
CREATE POLICY "engineer_profiles: admin read"
  ON public.engineer_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- An engineer may continue to see an opportunity tied to their own application
-- after it has been closed or unpublished, so the application history retains
-- its title and link. It remains invisible to everyone else.
CREATE POLICY "opportunities: applicant read own"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.opportunity_applications AS application
      JOIN public.engineer_profiles AS engineer
        ON engineer.id = application.engineer_profile_id
      WHERE application.opportunity_id = opportunities.id
        AND engineer.profile_id = auth.uid()
    )
  );
