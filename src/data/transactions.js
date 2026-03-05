/**
 * Data Adapter para transacciones (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 *
 * Proveedor actual: transactionsSupabase.
 */
import * as provider from '@/services/transactionsSupabase';

export const createTransaction = provider.createTransaction;
export const listTransactions = provider.listTransactions;
