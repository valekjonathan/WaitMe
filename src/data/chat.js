/**
 * Data Adapter para chat (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: chatSupabase.
 * Para cambiar: sustituir el import y re-exportar las mismas firmas.
 */
import * as provider from '@/services/chatSupabase';

export const getConversations = provider.getConversations;
export const getConversation = provider.getConversation;
export const getMessages = provider.getMessages;
export const sendMessage = provider.sendMessage;
export const subscribeMessages = provider.subscribeMessages;
