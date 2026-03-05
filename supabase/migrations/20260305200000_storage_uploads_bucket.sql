-- Bucket para uploads (chat adjuntos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: usuarios autenticados pueden subir; público puede leer
DROP POLICY IF EXISTS "uploads_insert_authenticated" ON storage.objects;
CREATE POLICY "uploads_insert_authenticated" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'uploads');
DROP POLICY IF EXISTS "uploads_select_public" ON storage.objects;
CREATE POLICY "uploads_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');
DROP POLICY IF EXISTS "uploads_delete_authenticated" ON storage.objects;
CREATE POLICY "uploads_delete_authenticated" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'uploads');
