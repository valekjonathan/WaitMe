/**
 * Servicio Stripe para pagos con captura manual (tipo Uber/Bolt).
 * Requiere VITE_STRIPE_PUBLISHABLE_KEY y STRIPE_SECRET_KEY (backend).
 *
 * Flujo:
 * 1. Usuario B reserva → crear PaymentIntent (capture_method: manual)
 * 2. Dinero queda retenido
 * 3. Proximidad validada en backend
 * 4. Capturar PaymentIntent vía release-payment
 */

const STRIPE_PK = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY;

/**
 * @returns {boolean} true si Stripe está configurado
 */
export function isStripeConfigured() {
  return Boolean(STRIPE_PK && String(STRIPE_PK).trim() !== '');
}

/**
 * Obtiene la clave pública de Stripe (para cliente).
 * @returns {string|null}
 */
export function getStripePublishableKey() {
  return isStripeConfigured() ? STRIPE_PK : null;
}
