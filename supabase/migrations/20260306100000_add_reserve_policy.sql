-- Permitir que cualquier usuario autenticado reserve una alerta activa.
-- Solo puede actualizar status a 'reserved' y reserved_by a sí mismo.
CREATE POLICY "parking_alerts_reserve_active" ON public.parking_alerts
  FOR UPDATE
  USING (status = 'active' AND auth.uid() IS NOT NULL)
  WITH CHECK (status = 'reserved' AND reserved_by = auth.uid());
