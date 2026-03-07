# Stripe - Pagos con captura manual

Para activar pagos reales:

1. **Cliente:** `VITE_STRIPE_PUBLISHABLE_KEY=pk_...` en `.env`
2. **Backend (Edge Function release-payment):** `STRIPE_SECRET_KEY=sk_...` en Supabase Secrets

Flujo:
- Reserva → crear PaymentIntent con `capture_method: manual`
- Proximidad validada → `stripe.paymentIntents.capture()` en la Edge Function

Si Stripe no está configurado, el sistema usa la tabla `transactions` como fallback (status pending → completed).
