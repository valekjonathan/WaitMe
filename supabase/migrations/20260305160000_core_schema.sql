-- =============================================================================
-- WaitMe Core Schema - Migración profesional
-- Requiere: public.profiles y auth.users existentes
--
-- Si ALTER PUBLICATION falla con "already member", añadir tablas en Dashboard:
--   Database → Replication → supabase_realtime
-- =============================================================================

-- Drop tablas antiguas/incompatibles antes de recrear (orden por dependencias)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.alert_reservations CASCADE;
DROP TABLE IF EXISTS public.parking_alerts CASCADE;

-- 1) parking_alerts
CREATE TABLE public.parking_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','reserved','expired','completed','cancelled')),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address_text text,
  price_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_parking_alerts_status ON public.parking_alerts(status);
CREATE INDEX IF NOT EXISTS idx_parking_alerts_seller_id ON public.parking_alerts(seller_id);
CREATE INDEX IF NOT EXISTS idx_parking_alerts_expires_at ON public.parking_alerts(expires_at);

ALTER TABLE public.parking_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parking_alerts_select_all" ON public.parking_alerts FOR SELECT USING (true);
CREATE POLICY "parking_alerts_insert_own" ON public.parking_alerts FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "parking_alerts_update_own" ON public.parking_alerts FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "parking_alerts_delete_own" ON public.parking_alerts FOR DELETE USING (seller_id = auth.uid());

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
CREATE TABLE public.alert_reservations (
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

CREATE POLICY "alert_reservations_select" ON public.alert_reservations FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND pa.seller_id = auth.uid())
  );
CREATE POLICY "alert_reservations_insert" ON public.alert_reservations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "alert_reservations_update" ON public.alert_reservations FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND pa.seller_id = auth.uid())
  );

DROP TRIGGER IF EXISTS alert_reservations_updated_at ON public.alert_reservations;
CREATE TRIGGER alert_reservations_updated_at
  BEFORE UPDATE ON public.alert_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) conversations
CREATE TABLE public.conversations (
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

CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 4) messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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
CREATE TABLE public.user_locations (
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

CREATE POLICY "user_locations_select_all" ON public.user_locations FOR SELECT USING (true);
CREATE POLICY "user_locations_insert_own" ON public.user_locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_locations_update_own" ON public.user_locations FOR UPDATE USING (user_id = auth.uid());

-- Realtime: añadir tablas a la publicación (ejecutar en Dashboard si falla)
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
