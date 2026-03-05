/**
 * Data Adapter para uploads (Strangler pattern).
 * Sustituye base44.integrations.Core.UploadFile.
 *
 * Proveedor actual: uploadsSupabase.
 */
import * as provider from '@/services/uploadsSupabase';

export const uploadFile = provider.uploadFile;
export const getPublicUrl = provider.getPublicUrl;
export const deleteFile = provider.deleteFile;
