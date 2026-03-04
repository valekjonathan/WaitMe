-- Añadir columna geohash a parking_alerts
alter table public.parking_alerts add column if not exists geohash text;

-- Índice compuesto para búsquedas por geohash + status
create index if not exists idx_parking_alerts_geohash_status on public.parking_alerts(geohash, status);
