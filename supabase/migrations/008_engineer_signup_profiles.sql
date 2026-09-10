-- Create the engineer workspace record as part of the existing auth signup
-- trigger. This runs before a session exists, so it also works when Supabase
-- email confirmation is enabled.

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

  RETURN NEW;
END;
$$;
