-- Phase 2.1A: Engineer Profiles Database Foundation

-- 1. Alter engineer_profiles table to add new fields
ALTER TABLE public.engineer_profiles
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT CHECK (
    specialization IN (
      'Structural Engineering',
      'Civil Construction',
      'Geotechnical Engineering',
      'Transportation Engineering',
      'Water Resources',
      'Environmental Engineering',
      'Construction Management',
      'Surveying',
      'Quantity Surveying',
      'Other'
    )
  ),
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

-- 2. Update existing policies
DROP POLICY IF EXISTS "engineer_profiles: public read" ON public.engineer_profiles;

CREATE POLICY "engineer_profiles: read"
  ON public.engineer_profiles FOR SELECT
  USING (
    visibility = 'public' OR auth.uid() = profile_id
  );

-- 3. Ensure insert policy exists
DROP POLICY IF EXISTS "engineer_profiles: insert own" ON public.engineer_profiles;

CREATE POLICY "engineer_profiles: insert own"
  ON public.engineer_profiles FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- 4. Ensure update policy exists (replacing any existing subquery version)
DROP POLICY IF EXISTS "engineer_profiles: update own" ON public.engineer_profiles;

CREATE POLICY "engineer_profiles: update own"
  ON public.engineer_profiles FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- 5. Add updated_at trigger for engineer_profiles
DROP TRIGGER IF EXISTS engineer_profiles_updated_at ON public.engineer_profiles;
CREATE TRIGGER engineer_profiles_updated_at
  BEFORE UPDATE ON public.engineer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
