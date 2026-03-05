-- Añadir vehicle_color a parking_alerts para iconos en mapa
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS vehicle_color text;
