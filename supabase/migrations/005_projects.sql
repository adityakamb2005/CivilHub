-- CivilHub public project directory foundation

CREATE TABLE IF NOT EXISTS public.projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  project_type        TEXT NOT NULL,
  location            TEXT,
  client_name         TEXT,
  engineer_profile_id UUID REFERENCES public.engineer_profiles(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  start_date          DATE,
  end_date            DATE,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT projects_description_not_blank CHECK (char_length(trim(description)) > 0),
  CONSTRAINT projects_type_not_blank CHECK (char_length(trim(project_type)) > 0),
  CONSTRAINT projects_dates_in_order CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date >= start_date
  )
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects: public read" ON public.projects;
CREATE POLICY "projects: public read"
  ON public.projects
  FOR SELECT
  USING (
    is_published = TRUE
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS projects_type_idx
  ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS projects_location_idx
  ON public.projects(location);
CREATE INDEX IF NOT EXISTS projects_engineer_profile_idx
  ON public.projects(engineer_profile_id);
CREATE INDEX IF NOT EXISTS projects_published_idx
  ON public.projects(is_published, published_at DESC, end_date DESC);
