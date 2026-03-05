/**
 * Data Adapter para notificaciones (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: notificationsSupabase.
 */
import * as provider from '@/services/notificationsSupabase';

export const createNotification = provider.createNotification;
export const listNotifications = provider.listNotifications;
export const markAsRead = provider.markAsRead;
export const markAllAsRead = provider.markAllAsRead;
export const subscribeNotifications = provider.subscribeNotifications;
