-- CivilHub public resources

CREATE TABLE IF NOT EXISTS public.resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL,
  content       TEXT NOT NULL,
  author_name   TEXT,
  source_name   TEXT,
  source_url    TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT resources_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT resources_category_not_blank CHECK (char_length(trim(category)) > 0),
  CONSTRAINT resources_description_not_blank CHECK (char_length(trim(description)) > 0),
  CONSTRAINT resources_content_not_blank CHECK (char_length(trim(content)) > 0)
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources: public read" ON public.resources;
CREATE POLICY "resources: public read"
  ON public.resources
  FOR SELECT
  USING (
    is_published = TRUE
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP TRIGGER IF EXISTS resources_updated_at ON public.resources;
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS resources_category_idx ON public.resources(category);
CREATE INDEX IF NOT EXISTS resources_published_idx
  ON public.resources(is_published, published_at DESC);
