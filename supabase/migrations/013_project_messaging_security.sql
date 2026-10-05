-- Keep project reads scoped to public projects, client-owned projects, and the
-- authenticated engineer's own applications or assignments. The SECURITY
-- DEFINER helper avoids a projects <-> project_applications RLS recursion.
CREATE OR REPLACE FUNCTION public.engineer_can_read_project(target_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engineer_profiles ep
    WHERE ep.profile_id = auth.uid()
      AND (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = target_project_id
            AND p.engineer_profile_id = ep.id
        )
        OR EXISTS (
          SELECT 1 FROM public.project_applications pa
          WHERE pa.project_id = target_project_id
            AND pa.engineer_profile_id = ep.id
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.engineer_can_read_project(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.engineer_can_read_project(UUID) TO authenticated;

DROP POLICY IF EXISTS "projects: engineer read associated" ON public.projects;
CREATE POLICY "projects: engineer read associated"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (public.engineer_can_read_project(projects.id));

-- Correlate all eligibility checks to the row being inserted. Unqualified
-- references in migration 011 could resolve to an inner table's columns.
DROP POLICY IF EXISTS "conversations: insert eligible" ON public.conversations;
CREATE POLICY "conversations: insert eligible"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.client_profiles cp
        WHERE cp.id = conversations.client_profile_id
          AND cp.profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.engineer_profiles ep
        WHERE ep.id = conversations.engineer_profile_id
          AND ep.profile_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = conversations.project_id
        AND p.client_profile_id = conversations.client_profile_id
        AND (
          p.engineer_profile_id = conversations.engineer_profile_id
          OR EXISTS (
            SELECT 1
            FROM public.project_applications pa
            WHERE pa.project_id = conversations.project_id
              AND pa.engineer_profile_id = conversations.engineer_profile_id
          )
        )
    )
  );

-- Notifications are generated from validated database events. Do not let an
-- authenticated caller insert arbitrary notifications for another profile.
DROP POLICY IF EXISTS "notifications: insert authenticated triggers" ON public.notifications;
DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;
CREATE POLICY "notifications: update own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_message_content_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
    OR NEW.sender_profile_id IS DISTINCT FROM OLD.sender_profile_id
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.read_at IS NULL
    OR (OLD.read_at IS NOT NULL AND NEW.read_at IS DISTINCT FROM OLD.read_at)
  THEN
    RAISE EXCEPTION 'Only a message recipient may mark a message as read';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_protect_content ON public.messages;
CREATE TRIGGER messages_protect_content
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_message_content_update();

CREATE OR REPLACE FUNCTION public.notify_message_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  recipient_role TEXT;
  project_title TEXT;
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  SELECT
    p.title,
    CASE
      WHEN cp.profile_id = NEW.sender_profile_id THEN ep.profile_id
      ELSE cp.profile_id
    END,
    CASE
      WHEN cp.profile_id = NEW.sender_profile_id THEN 'engineer'
      ELSE 'client'
    END
  INTO project_title, recipient_id, recipient_role
  FROM public.conversations c
  JOIN public.projects p ON p.id = c.project_id
  JOIN public.client_profiles cp ON cp.id = c.client_profile_id
  JOIN public.engineer_profiles ep ON ep.id = c.engineer_profile_id
  WHERE c.id = NEW.conversation_id
    AND NEW.sender_profile_id IN (cp.profile_id, ep.profile_id);

  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (profile_id, type, title, body, data)
    VALUES (
      recipient_id,
      'new_message',
      'New message regarding ' || COALESCE(project_title, 'Project'),
      CASE WHEN char_length(NEW.body) > 60 THEN left(NEW.body, 60) || '...' ELSE NEW.body END,
      jsonb_build_object('link', '/' || recipient_role || '/messages/' || NEW.conversation_id::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify_recipient ON public.messages;
CREATE TRIGGER messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipient();

CREATE OR REPLACE FUNCTION public.notify_project_application_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notify_profile_id UUID;
  engineer_name TEXT;
  project_title TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_body TEXT;
  notification_link TEXT;
BEGIN
  SELECT p.title, cp.profile_id, COALESCE(pr.full_name, 'An engineer')
  INTO project_title, notify_profile_id, engineer_name
  FROM public.projects p
  JOIN public.client_profiles cp ON cp.id = p.client_profile_id
  JOIN public.engineer_profiles ep ON ep.id = NEW.engineer_profile_id
  JOIN public.profiles pr ON pr.id = ep.profile_id
  WHERE p.id = NEW.project_id;

  IF TG_OP = 'INSERT' THEN
    notification_type := 'project_application';
    notification_title := 'New project application';
    notification_body := engineer_name || ' submitted an application for "' || COALESCE(project_title, 'your project') || '".';
    notification_link := '/client/projects/' || NEW.project_id::text || '/applications';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT ep.profile_id INTO notify_profile_id
    FROM public.engineer_profiles ep
    WHERE ep.id = NEW.engineer_profile_id;

    notification_link := '/engineer/projects';
    IF NEW.status = 'accepted' THEN
      notification_type := 'application_accepted';
      notification_title := 'Application Accepted!';
      notification_body := 'Your project application for "' || COALESCE(project_title, 'a project') || '" was accepted. You are now assigned to this project.';
    ELSE
      notification_type := 'application_rejected';
      notification_title := 'Project Application Status';
      notification_body := 'Your application for "' || COALESCE(project_title, 'a project') || '" was not selected.';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF notify_profile_id IS NOT NULL THEN
    INSERT INTO public.notifications (profile_id, type, title, body, data)
    VALUES (notify_profile_id, notification_type, notification_title, notification_body,
      jsonb_build_object('link', notification_link));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_applications_notify_participants ON public.project_applications;
CREATE TRIGGER project_applications_notify_participants
  AFTER INSERT OR UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_project_application_participants();

REVOKE ALL ON FUNCTION public.notify_message_recipient() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_project_application_participants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_message_content_update() FROM PUBLIC, anon, authenticated;
