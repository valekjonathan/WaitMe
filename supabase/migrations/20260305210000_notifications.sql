-- Tabla notifications para notificaciones de usuario
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'status_update',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Habilitar Realtime para subscribeNotifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
