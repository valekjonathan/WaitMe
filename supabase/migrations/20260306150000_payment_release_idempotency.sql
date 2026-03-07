-- Tabla para idempotencia en liberación de pagos
CREATE TABLE IF NOT EXISTS public.payment_release_log (
  idempotency_key text PRIMARY KEY,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  alert_id uuid REFERENCES public.parking_alerts(id) ON DELETE SET NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_release_log_alert_id ON public.payment_release_log(alert_id);

ALTER TABLE public.payment_release_log ENABLE ROW LEVEL SECURITY;

-- RLS: bloquea acceso directo; solo service_role puede insertar/leer
CREATE POLICY "payment_release_log_no_direct" ON public.payment_release_log
  FOR ALL USING (false) WITH CHECK (false);
