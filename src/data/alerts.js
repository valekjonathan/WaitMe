/**
 * Data Adapter para alertas (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: alertsSupabase.
 * Para cambiar: sustituir el import y re-exportar las mismas firmas.
 */
import * as provider from '@/services/alertsSupabase';

export const getAlert = provider.getAlert;
export const getMyAlerts = provider.getMyAlerts;
export const getAlertsReservedByMe = provider.getAlertsReservedByMe;
export const getAlertsForChats = provider.getAlertsForChats;
export const createAlert = provider.createAlert;
export const updateAlert = provider.updateAlert;
export const deleteAlert = provider.deleteAlert;
export const subscribeAlerts = provider.subscribeAlerts;
export const getNearbyAlerts = provider.getNearbyAlerts;
export const reserveAlert = provider.reserveAlert;
