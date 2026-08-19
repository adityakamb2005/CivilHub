-- ============================================================
-- CivilHub — Phase 1 Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ---------------------------------------------------------------
-- PROFILES TABLE
-- Extends auth.users with role and display info
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('engineer', 'client', 'admin')),
  full_name    TEXT,
  avatar_url   TEXT,
  phone        TEXT,
  location     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------
-- UPDATED_AT TRIGGER HELPER
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------
-- ROW-LEVEL SECURITY — PROFILES
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profile info (needed for engineer discovery)
CREATE POLICY "profiles: public read"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------
-- ENGINEER PROFILES (stub — fully built in Phase 2)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.engineer_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline        TEXT,
  about           TEXT,
  years_experience INTEGER DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  website_url     TEXT,
  linkedin_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.engineer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engineer_profiles: public read"
  ON public.engineer_profiles FOR SELECT USING (true);

CREATE POLICY "engineer_profiles: update own"
  ON public.engineer_profiles FOR UPDATE
  USING (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

-- ---------------------------------------------------------------
-- CLIENT PROFILES (stub — fully built in Phase 4)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company     TEXT,
  about       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_profiles: read own"
  ON public.client_profiles FOR SELECT
  USING (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

CREATE POLICY "client_profiles: update own"
  ON public.client_profiles FOR UPDATE
  USING (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

-- ---------------------------------------------------------------
-- NOTIFICATIONS (stub — fully used in Phase 5+)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  data        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: read own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "notifications: update own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = profile_id);

-- ---------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
