/**
 * Motor central de transacciones ficticias para WaitMe.
 * Gestiona estados finales, reglas económicas y estado en memoria (balance, ban, comisión extra).
 * No realiza llamadas a API ni modifica UI.
 */

// --- Estados finales ---
export const OUTCOME = {
  FINALIZADA_OK: 'finalizada_ok',
  FINALIZADA_NO_SHOW: 'finalizada_no_show',
  FINALIZADA_CANCELADA_POR_COMPRADOR: 'finalizada_cancelada_por_comprador',
  FINALIZADA_CANCELADA_POR_VENDEDOR: 'finalizada_cancelada_por_vendedor'
};

// --- Reglas económicas (porcentajes 0-1) ---
const SELLER_SHARE = 0.67;
const APP_SHARE = 0.33;
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const EXTRA_COMMISSION_PENALTY = 0.33; // 33% adicional en próxima operación

// --- Estado en memoria por usuario ---
/** @type {Map<string, { balance: number, banUntil: number | null, extraCommissionNext: boolean }>} */
const userState = new Map();

function ensureUser(userId) {
  if (!userId) return null;
  const key = String(userId);
  if (!userState.has(key)) {
    userState.set(key, { balance: 0, banUntil: null, extraCommissionNext: false });
  }
  return userState.get(key);
}

/**
 * Obtiene el balance actual de un usuario (en memoria).
 * @param {string} userId
 * @returns {number}
 */
export function getBalance(userId) {
  const u = ensureUser(userId);
  return u ? u.balance : 0;
}

/**
 * Indica si el usuario está baneado (penalización 24h).
 * @param {string} userId
 * @returns {boolean}
 */
export function isBanned(userId) {
  const u = ensureUser(userId);
  if (!u || !u.banUntil) return false;
  return Date.now() < u.banUntil;
}

/**
 * Fecha/hora hasta la que el usuario está baneado (timestamp ms), o null.
 * @param {string} userId
 * @returns {number | null}
 */
export function getBanUntil(userId) {
  const u = ensureUser(userId);
  if (!u || !u.banUntil) return null;
  return Date.now() < u.banUntil ? u.banUntil : null;
}

/**
 * Indica si en la próxima operación el vendedor tiene comisión adicional (33%).
 * @param {string} userId
 * @returns {boolean}
 */
export function getExtraCommissionNext(userId) {
  const u = ensureUser(userId);
  return u ? u.extraCommissionNext : false;
}

/**
 * Aplica penalización al vendedor: ban 24h + próxima operación comisión adicional 33%.
 * @param {string} sellerId
 */
function applySellerPenalty(sellerId) {
  const u = ensureUser(sellerId);
  if (u) {
    u.banUntil = Date.now() + BAN_DURATION_MS;
    u.extraCommissionNext = true;
  }
}

/**
 * Finaliza una transacción con el resultado indicado y aplica reglas económicas.
 * Actualiza balances en memoria. No llama a API.
 *
 * @param {Object} params
 * @param {string} params.outcome - OUTCOME.FINALIZADA_* 
 * @param {number} params.amount - Importe total de la operación (ej. precio de la alerta)
 * @param {string} params.sellerId - ID del vendedor
 * @param {string} params.buyerId - ID del comprador
 * @param {boolean} [params.sellerCancelledOrMoved] - true si vendedor canceló o se movió >5m (para aplicar penalización)
 * @returns {{ sellerAmount: number, buyerAmount: number, appAmount: number, sellerBannedUntil: number | null, extraCommissionNext: boolean }}
 */
export function finalize({ outcome, amount, sellerId, buyerId, sellerCancelledOrMoved = false }) {
  const total = Number(amount) || 0;
  const seller = ensureUser(sellerId);
  const buyer = ensureUser(buyerId);

  let sellerAmount = 0;
  let buyerAmount = 0;
  const appAmount = Math.round((total * APP_SHARE) * 100) / 100;

  if (outcome === OUTCOME.FINALIZADA_CANCELADA_POR_VENDEDOR || sellerCancelledOrMoved) {
    // Vendedor cancela o se mueve >5m: vendedor 0€, comprador recupera 67%, app 33%
    buyerAmount = Math.round((total * SELLER_SHARE) * 100) / 100; // lo que “recupera” el comprador
    if (buyer) buyer.balance += buyerAmount;
    applySellerPenalty(sellerId);
  } else {
    // Operación normal (ok, no_show, cancelada_por_comprador): vendedor 67%, app 33%
    let sellerShare = SELLER_SHARE;
    if (seller && seller.extraCommissionNext) {
      // Próxima operación comisión adicional: app se queda con 33% + 33% = 66%, vendedor 34%
      sellerShare = 1 - APP_SHARE - EXTRA_COMMISSION_PENALTY; // 0.34
      seller.extraCommissionNext = false; // consumida
    }
    sellerAmount = Math.round((total * sellerShare) * 100) / 100;
    if (seller) seller.balance += sellerAmount;
  }

  const sellerBannedUntil = getBanUntil(sellerId);
  const extraCommissionNext = getExtraCommissionNext(sellerId);

  try {
    window.dispatchEvent(new Event('balanceUpdated'));
  } catch (_) {}

  return {
    sellerAmount,
    buyerAmount,
    appAmount,
    sellerBannedUntil,
    extraCommissionNext
  };
}

/**
 * Resetea el estado en memoria de un usuario (útil para tests o logout).
 * @param {string} [userId] - Si no se pasa, resetea todos.
 */
export function resetUserState(userId) {
  if (userId) {
    userState.delete(String(userId));
  } else {
    userState.clear();
  }
}
