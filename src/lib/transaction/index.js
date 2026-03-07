/**
 * Motor de transacción por proximidad — exports.
 */

export { startTransactionMonitoring, stopTransactionMonitoring } from './transactionEngine.js';
export { TRANSACTION_STATE } from './transactionStates.js';
export { logProximityEvent, getProximityLogs } from './transactionLogger.js';
