-- CivilHub MVP Batch — Messaging & Notifications Migration
-- Additive-only schema migration for Conversations, Messages, and Notification policies

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  engineer_profile_id UUID NOT NULL REFERENCES public.engineer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_unique_project_client_engineer UNIQUE (project_id, client_profile_id, engineer_profile_id)
);

CREATE INDEX IF NOT EXISTS conversations_project_idx ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS conversations_client_profile_idx ON public.conversations(client_profile_id);
CREATE INDEX IF NOT EXISTS conversations_engineer_profile_idx ON public.conversations(engineer_profile_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  CONSTRAINT messages_body_not_blank CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_profile_id);

-- 3. ROW LEVEL SECURITY — CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations: select own" ON public.conversations;
CREATE POLICY "conversations: select own"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()
    )
    OR engineer_profile_id IN (
      SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "conversations: insert eligible" ON public.conversations;
CREATE POLICY "conversations: insert eligible"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Client creating conversation for their project with an applicant/assigned engineer
    (
      client_profile_id IN (
        SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND p.client_profile_id = client_profile_id
          AND (
            p.engineer_profile_id = engineer_profile_id
            OR EXISTS (
              SELECT 1 FROM public.project_applications pa
              WHERE pa.project_id = project_id
                AND pa.engineer_profile_id = engineer_profile_id
            )
          )
      )
    )
    OR
    -- Engineer creating conversation for project they applied to or are assigned to
    (
      engineer_profile_id IN (
        SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
          AND p.client_profile_id = client_profile_id
          AND (
            p.engineer_profile_id = engineer_profile_id
            OR EXISTS (
              SELECT 1 FROM public.project_applications pa
              WHERE pa.project_id = project_id
                AND pa.engineer_profile_id = engineer_profile_id
            )
          )
      )
    )
  );

-- 4. ROW LEVEL SECURITY — MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: select conversation participants" ON public.messages;
CREATE POLICY "messages: select conversation participants"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_profile_id IN (
            SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()
          )
          OR c.engineer_profile_id IN (
            SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
          )
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS "messages: insert conversation participants" ON public.messages;
CREATE POLICY "messages: insert conversation participants"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_profile_id IN (
            SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()
          )
          OR c.engineer_profile_id IN (
            SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "messages: update read_at for recipient" ON public.messages;
CREATE POLICY "messages: update read_at for recipient"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.client_profile_id IN (
            SELECT id FROM public.client_profiles WHERE profile_id = auth.uid()
          )
          OR c.engineer_profile_id IN (
            SELECT id FROM public.engineer_profiles WHERE profile_id = auth.uid()
          )
        )
    )
  );

-- 5. NOTIFICATIONS INSERT POLICY FOR AUTHENTICATED EVENT TRIGGERS
DROP POLICY IF EXISTS "notifications: insert authenticated triggers" ON public.notifications;
CREATE POLICY "notifications: insert authenticated triggers"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = profile_id
    )
  );
