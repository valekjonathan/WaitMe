-- Tabla user_location_updates: ubicaciones de compradores por alerta (para SellerLocationTracker)
-- Sustituye el modelo Base44 UserLocation con alert_id.
-- user_locations (existente) queda para ubicación global por usuario; esta tabla es por (user, alert).
CREATE TABLE IF NOT EXISTS public.user_location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id uuid NOT NULL REFERENCES public.parking_alerts(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_id)
);

CREATE INDEX IF NOT EXISTS idx_user_location_updates_alert_id ON public.user_location_updates(alert_id);
CREATE INDEX IF NOT EXISTS idx_user_location_updates_alert_active ON public.user_location_updates(alert_id, is_active) WHERE is_active = true;

ALTER TABLE public.user_location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_location_updates_select_all" ON public.user_location_updates FOR SELECT USING (true);
CREATE POLICY "user_location_updates_insert_own" ON public.user_location_updates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_location_updates_update_own" ON public.user_location_updates FOR UPDATE USING (user_id = auth.uid());

-- Realtime para SellerLocationTracker
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_location_updates;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
