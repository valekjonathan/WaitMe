/**
 * Estados de transacción por proximidad.
 * Cada alerta reservada debe tener un transactionId asociado.
 *
 * @module transactionStates
 */

export const TRANSACTION_STATE = {
  CREATED: 'CREATED',
  RESERVED: 'RESERVED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};
