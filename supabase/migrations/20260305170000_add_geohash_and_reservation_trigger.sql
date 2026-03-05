-- Añadir geohash a parking_alerts para búsquedas por proximidad (getNearbyAlerts)
-- Trigger: al aceptar reserva, actualizar status de la alerta a 'reserved'

-- Geohash para consultas espaciales
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS geohash text;
CREATE INDEX IF NOT EXISTS idx_parking_alerts_geohash_status ON public.parking_alerts(geohash, status);

-- Trigger: cuando reservation pasa a status 'accepted', marcar alerta como reserved
CREATE OR REPLACE FUNCTION public.on_reservation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.parking_alerts
    SET status = 'reserved', updated_at = now()
    WHERE id = NEW.alert_id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_reservation_accepted_insert ON public.alert_reservations;
CREATE TRIGGER trigger_on_reservation_accepted_insert
  AFTER INSERT ON public.alert_reservations
  FOR EACH ROW EXECUTE FUNCTION public.on_reservation_accepted();

DROP TRIGGER IF EXISTS trigger_on_reservation_accepted_update ON public.alert_reservations;
CREATE TRIGGER trigger_on_reservation_accepted_update
  AFTER UPDATE ON public.alert_reservations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.on_reservation_accepted();
