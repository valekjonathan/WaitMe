/**
 * Servicio de uploads (Supabase Storage).
 * Sustituye base44.integrations.Core.UploadFile.
 */
import { getSupabase } from '@/lib/supabaseClient';

const BUCKET = 'uploads';

/**
 * Sube un archivo al bucket uploads.
 * @param {File} file - Archivo a subir
 * @param {string} path - Ruta en el bucket (ej: "userId/1234567890.jpg")
 * @returns {{ url?: string, file_url?: string, error?: Error }}
 */
export async function uploadFile(file, path) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase no configurado') };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) return { error };
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, file_url: urlData.publicUrl };
}

/**
 * Obtiene la URL pública de un archivo.
 * @param {string} path - Ruta en el bucket
 * @returns {string}
 */
export function getPublicUrl(path) {
  const supabase = getSupabase();
  if (!supabase) return '';
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Elimina un archivo del bucket.
 * @param {string} path - Ruta en el bucket
 * @returns {{ error?: Error }}
 */
export async function deleteFile(path) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error };
}
