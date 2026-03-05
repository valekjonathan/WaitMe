/**
 * Data Adapter para ubicaciones de usuario.
 */
import * as provider from '@/services/userLocationsSupabase';

export const getLocationsByAlert = provider.getLocationsByAlert;
export const upsertLocationForAlert = provider.upsertLocationForAlert;
