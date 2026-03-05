# Migración Uploads: Base44 → Supabase Storage

## Objetivo

Sustituir `base44.integrations.Core.UploadFile` por Supabase Storage. Los componentes importan `import * as uploads from "@/data/uploads"` y nunca llaman a Base44 ni Supabase directamente para uploads.

## Archivos creados/modificados

### Nuevos

- **`src/data/uploads.js`** – Adapter que reexporta el proveedor actual (uploadsSupabase).
- **`src/services/uploadsSupabase.js`** – Proveedor Supabase Storage para uploads.
- **`supabase/migrations/20260305200000_storage_uploads_bucket.sql`** – Crea bucket `uploads` y políticas RLS.

### Modificados

- **`src/pages/Chat.jsx`** – Usa `uploads.uploadFile` para adjuntos en lugar de Base44.

## API del adapter (`src/data/uploads.js`)

| Función | Descripción |
|---------|-------------|
| `uploadFile(file, path)` | Sube un archivo al bucket. Devuelve `{ url, file_url, error? }`. |
| `getPublicUrl(path)` | Obtiene la URL pública de un archivo. |
| `deleteFile(path)` | Elimina un archivo del bucket. |

## Bucket Supabase

- **Nombre**: `uploads`
- **Público**: sí (lectura pública)
- **Límite**: 10MB por archivo
- **Tipos permitidos**: image/jpeg, image/png, image/gif, image/webp, application/pdf, video/mp4, video/webm

## RLS

- **INSERT**: usuarios autenticados
- **SELECT**: público (bucket público)
- **DELETE**: usuarios autenticados

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| `UploadFile({ file })` → `{ file_url }` | `uploadFile(file, path)` → `{ url, file_url }` |
| Path implícito | Path explícito: `chat/{userId}/{timestamp}_{filename}` |

## Lo que sigue usando Base44

- ChatMessage.create (mensajes de sistema en Navigate)
- ParkingAlert (en Navigate)
- Resto de entidades no migradas

## Ejecutar migración

```bash
npx supabase db push
```
