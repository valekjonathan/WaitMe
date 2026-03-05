-- =============================================================================
-- WaitMe Core Schema - Migración profesional
-- Requiere: public.profiles y auth.users existentes
-- parking_alerts ya existe (20260304150000, 20260304170000); solo añadimos
-- columnas/triggers/publication de forma idempotente.
-- =============================================================================

-- 1) parking_alerts: NO crear (ya existe). Añadir columnas y trigger si faltan.
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS address_text text;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS price_cents int;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill seller_id desde user_id si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parking_alerts' AND column_name = 'user_id') THEN
    UPDATE public.parking_alerts SET seller_id = user_id WHERE seller_id IS NULL AND user_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_parking_alerts_seller_id ON public.parking_alerts(seller_id);

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

-- Políticas core: eliminar antiguas y crear nuevas
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can view active and own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can update own or reserve active alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_select_all" ON public.parking_alerts;
CREATE POLICY "parking_alerts_select_all" ON public.parking_alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "parking_alerts_insert_own" ON public.parking_alerts;
CREATE POLICY "parking_alerts_insert_own" ON public.parking_alerts FOR INSERT WITH CHECK (COALESCE(seller_id, user_id) = auth.uid());

DROP POLICY IF EXISTS "parking_alerts_update_own" ON public.parking_alerts;
CREATE POLICY "parking_alerts_update_own" ON public.parking_alerts FOR UPDATE USING (COALESCE(seller_id, user_id) = auth.uid());

DROP POLICY IF EXISTS "parking_alerts_delete_own" ON public.parking_alerts;
CREATE POLICY "parking_alerts_delete_own" ON public.parking_alerts FOR DELETE USING (COALESCE(seller_id, user_id) = auth.uid());

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
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND COALESCE(pa.seller_id, pa.user_id) = auth.uid())
  );
CREATE POLICY "alert_reservations_insert" ON public.alert_reservations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "alert_reservations_update" ON public.alert_reservations FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND COALESCE(pa.seller_id, pa.user_id) = auth.uid())
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

-- Realtime: añadir tablas solo si no están ya en la publicación
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['parking_alerts', 'alert_reservations', 'messages', 'user_locations'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
