-- CivilHub public opportunities marketplace foundation

CREATE TABLE IF NOT EXISTS public.opportunities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  opportunity_type   TEXT NOT NULL,
  organization_name  TEXT,
  location           TEXT,
  deadline           DATE,
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opportunities_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT opportunities_description_not_blank CHECK (char_length(trim(description)) > 0),
  CONSTRAINT opportunities_type_not_blank CHECK (char_length(trim(opportunity_type)) > 0)
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunities: public read" ON public.opportunities;
CREATE POLICY "opportunities: public read"
  ON public.opportunities
  FOR SELECT
  USING (
    is_published = TRUE
    AND status = 'open'
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP TRIGGER IF EXISTS opportunities_updated_at ON public.opportunities;
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS opportunities_type_idx
  ON public.opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS opportunities_location_idx
  ON public.opportunities(location);
CREATE INDEX IF NOT EXISTS opportunities_active_idx
  ON public.opportunities(is_published, status, deadline, published_at DESC);
