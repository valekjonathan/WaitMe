-- Temporizador de reserva: reserved_until + función para expirar
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

-- Función que reactiva alertas cuya reserva expiró (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH updated AS (
    UPDATE public.parking_alerts
    SET status = 'active', reserved_by = NULL, reserved_until = NULL
    WHERE status = 'reserved'
      AND reserved_until IS NOT NULL
      AND reserved_until < now()
    RETURNING id
  )
  SELECT count(*)::integer INTO affected FROM updated;
  RETURN affected;
END;
$$;

-- Cualquier usuario autenticado puede invocar (necesario para que getNearbyAlerts lo llame)
GRANT EXECUTE ON FUNCTION public.expire_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_reservations() TO anon;
