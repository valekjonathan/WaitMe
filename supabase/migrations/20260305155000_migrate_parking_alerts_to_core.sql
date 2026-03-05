-- Migración segura: parking_alerts de schema antiguo (user_id, price) a core (seller_id, price_cents)
-- Solo ALTERs, idempotente con IF NOT EXISTS. No usar borrado de tablas.

-- Añadir columnas del schema core
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS address_text text;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS price_cents int;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill: seller_id desde user_id, price_cents desde price
UPDATE public.parking_alerts SET seller_id = user_id WHERE seller_id IS NULL AND user_id IS NOT NULL;
UPDATE public.parking_alerts SET price_cents = COALESCE(price_cents, GREATEST(0, floor(COALESCE(price, 0) * 100)::int)) WHERE price_cents IS NULL;
UPDATE public.parking_alerts SET updated_at = created_at WHERE updated_at IS NULL;

-- Constraints y defaults para filas nuevas (solo si la columna existe)
ALTER TABLE public.parking_alerts ALTER COLUMN price_cents SET DEFAULT 0;
ALTER TABLE public.parking_alerts ALTER COLUMN currency SET DEFAULT 'EUR';
ALTER TABLE public.parking_alerts ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE public.parking_alerts ALTER COLUMN updated_at SET DEFAULT now();

-- Índice para seller_id
CREATE INDEX IF NOT EXISTS idx_parking_alerts_seller_id ON public.parking_alerts(seller_id);

-- Políticas core: eliminar antiguas y crear nuevas (DROP POLICY es seguro, no borra datos)
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can view active and own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can update own or reserve active alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_select_all" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_insert_own" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_update_own" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_delete_own" ON public.parking_alerts;

CREATE POLICY "parking_alerts_select_all" ON public.parking_alerts FOR SELECT USING (true);
CREATE POLICY "parking_alerts_insert_own" ON public.parking_alerts FOR INSERT WITH CHECK (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));
CREATE POLICY "parking_alerts_update_own" ON public.parking_alerts FOR UPDATE USING (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));
CREATE POLICY "parking_alerts_delete_own" ON public.parking_alerts FOR DELETE USING (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));
