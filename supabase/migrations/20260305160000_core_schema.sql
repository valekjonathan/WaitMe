-- =============================================================================
-- WaitMe Core Schema - Migración profesional (idempotente, sin borrado de tablas)
-- Requiere: public.profiles, auth.users, public.parking_alerts (de migraciones previas)
--
-- Si ALTER PUBLICATION falla con "already member", añadir tablas en Dashboard:
--   Database → Replication → supabase_realtime
-- =============================================================================

-- 1) parking_alerts: ya existe de 20260304150000, migrado por 20260305155000
--    Solo aseguramos trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parking_alerts_updated_at ON public.parking_alerts;
CREATE TRIGGER parking_alerts_updated_at
  BEFORE UPDATE ON public.parking_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) alert_reservations
CREATE TABLE IF NOT EXISTS public.alert_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.parking_alerts(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('requested','accepted','active','completed','cancelled','expired')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_reservations_alert_id ON public.alert_reservations(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_reservations_buyer_id ON public.alert_reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_alert_reservations_status ON public.alert_reservations(status);

ALTER TABLE public.alert_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_reservations_select" ON public.alert_reservations;
DROP POLICY IF EXISTS "alert_reservations_insert" ON public.alert_reservations;
DROP POLICY IF EXISTS "alert_reservations_update" ON public.alert_reservations;
CREATE POLICY "alert_reservations_select" ON public.alert_reservations FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND (pa.seller_id = auth.uid() OR pa.user_id = auth.uid()))
  );
CREATE POLICY "alert_reservations_insert" ON public.alert_reservations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "alert_reservations_update" ON public.alert_reservations FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND (pa.seller_id = auth.uid() OR pa.user_id = auth.uid()))
  );

DROP TRIGGER IF EXISTS alert_reservations_updated_at ON public.alert_reservations;
CREATE TRIGGER alert_reservations_updated_at
  BEFORE UPDATE ON public.alert_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.parking_alerts(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alert_id, buyer_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 4) messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- 5) user_locations
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  heading double precision,
  speed_mps double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_locations_select_all" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_insert_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_update_own" ON public.user_locations;
CREATE POLICY "user_locations_select_all" ON public.user_locations FOR SELECT USING (true);
CREATE POLICY "user_locations_insert_own" ON public.user_locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_locations_update_own" ON public.user_locations FOR UPDATE USING (user_id = auth.uid());

-- Realtime: añadir tablas a la publicación (ignorar si ya están)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_alerts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_reservations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
