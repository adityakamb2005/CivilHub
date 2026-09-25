-- CivilHub Migration 012 — Engineer Profile & Portfolio Enhancements
-- Additive-only schema migration for skills, education, certifications, work experience, and portfolio entries.

-- 1. Extend engineer_profiles table
ALTER TABLE public.engineer_profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';

-- 2. Create engineer_portfolios table
CREATE TABLE IF NOT EXISTS public.engineer_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_profile_id UUID NOT NULL REFERENCES public.engineer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  detailed_description TEXT,
  skills TEXT[] DEFAULT '{}',
  project_date DATE,
  project_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT engineer_portfolios_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT engineer_portfolios_short_desc_not_blank CHECK (char_length(trim(short_description)) > 0)
);

CREATE INDEX IF NOT EXISTS engineer_portfolios_engineer_profile_idx
  ON public.engineer_portfolios(engineer_profile_id, created_at DESC);

DROP TRIGGER IF EXISTS engineer_portfolios_updated_at ON public.engineer_portfolios;
CREATE TRIGGER engineer_portfolios_updated_at
  BEFORE UPDATE ON public.engineer_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row Level Security for engineer_portfolios
ALTER TABLE public.engineer_portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "engineer_portfolios: select" ON public.engineer_portfolios;
CREATE POLICY "engineer_portfolios: select"
  ON public.engineer_portfolios
  FOR SELECT
  USING (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles
      WHERE profile_id = auth.uid() OR visibility = 'public'
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "engineer_portfolios: insert own" ON public.engineer_portfolios;
CREATE POLICY "engineer_portfolios: insert own"
  ON public.engineer_portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "engineer_portfolios: update own" ON public.engineer_portfolios;
CREATE POLICY "engineer_portfolios: update own"
  ON public.engineer_portfolios
  FOR UPDATE
  TO authenticated
  USING (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "engineer_portfolios: delete own" ON public.engineer_portfolios;
CREATE POLICY "engineer_portfolios: delete own"
  ON public.engineer_portfolios
  FOR DELETE
  TO authenticated
  USING (
    engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
  );
