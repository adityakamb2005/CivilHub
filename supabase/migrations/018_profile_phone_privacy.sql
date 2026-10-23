-- Prepared for separate production approval. Requires 001-013 and 015-017.
-- Keep contact data in the existing row; no data is moved or deleted.
BEGIN;

DO $$ BEGIN
  IF current_user <> 'postgres' OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles'
      AND c.relowner = 'postgres'::regrole AND c.relrowsecurity
      AND NOT c.relforcerowsecurity
  ) THEN
    RAISE EXCEPTION 'Run as the postgres owner of the RLS-enabled profiles table';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND cmd IN ('SELECT', 'ALL') AND policyname <> 'profiles: public read'
  ) THEN
    RAISE EXCEPTION 'Review unexpected profile read policies before this migration';
  END IF;
END $$;

-- This deliberately owner-executed view exposes only public display fields.
-- A security-invoker view would hide other users' display cards under the new RLS.
CREATE VIEW public.public_profiles WITH (security_barrier = true) AS
  SELECT id, role, full_name, avatar_url, location FROM public.profiles;
ALTER VIEW public.public_profiles OWNER TO postgres;
-- Supabase default privileges may grant writes on new views: remove them first.
REVOKE ALL ON public.public_profiles FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;

DROP POLICY "profiles: public read" ON public.profiles;
CREATE POLICY "profiles: read own or admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

COMMENT ON VIEW public.public_profiles IS
  'Public profile display fields only. Phone is readable from profiles by its owner or an administrator.';
NOTIFY pgrst, 'reload schema';
COMMIT;
