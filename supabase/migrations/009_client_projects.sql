-- CivilHub Client MVP — client project ownership & profile bootstrap
-- Additive-only: no existing columns or policies are dropped.

-- 1. Add client_profile_id FK to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_profile_id UUID
    REFERENCES public.client_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_client_profile_idx
  ON public.projects(client_profile_id);

-- 2. RLS: Clients can manage (INSERT, SELECT, UPDATE) their own projects
DROP POLICY IF EXISTS "projects: client manage own" ON public.projects;
CREATE POLICY "projects: client manage own"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (
    client_profile_id IS NOT NULL
    AND client_profile_id = (
      SELECT cp.id FROM public.client_profiles cp WHERE cp.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    client_profile_id IS NOT NULL
    AND client_profile_id = (
      SELECT cp.id FROM public.client_profiles cp WHERE cp.profile_id = auth.uid()
    )
  );

-- 3. client_profiles: allow clients to insert their own row
DROP POLICY IF EXISTS "client_profiles: insert own" ON public.client_profiles;
CREATE POLICY "client_profiles: insert own"
  ON public.client_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

-- 4. client_profiles: add updated_at trigger (was missing)
DROP TRIGGER IF EXISTS client_profiles_updated_at ON public.client_profiles;
CREATE TRIGGER client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Extend handle_new_user() to auto-create client_profiles for client signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
  safe_role TEXT := CASE
    WHEN requested_role IN ('engineer', 'client') THEN requested_role
    ELSE 'client'
  END;
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    safe_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF safe_role = 'engineer' THEN
    INSERT INTO public.engineer_profiles (profile_id, visibility)
    VALUES (NEW.id, 'private')
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  IF safe_role = 'client' THEN
    INSERT INTO public.client_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
