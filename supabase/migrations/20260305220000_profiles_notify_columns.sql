-- Añadir columnas de preferencias de notificación a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_reservations boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_payments boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_proximity boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_promotions boolean DEFAULT true;
