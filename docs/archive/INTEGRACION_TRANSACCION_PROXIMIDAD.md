# Integración del motor de transacción por proximidad

**Fecha:** 2025-03-07

---

## Uso con pagos reales

El motor `transactionEngine` monitorea proximidad y llama `onCompleted` cuando la condición se cumple. Para integrar con pagos reales:

1. **En NAVIGATE** (comprador en ruta):
   - `getUserALocation` = ubicación del vendedor (alert.latitude, alert.longitude)
   - `getUserBLocation` = ubicación del comprador (desde useLocationEngine)
   - `onCompleted` = llamar a la API de liberación de pago (ej. `transactions.releasePayment(alertId)`)

2. **En CREATE** (vendedor esperando):
   - Si el vendedor también se mueve, usar ubicación en tiempo real de ambos.
   - `onCompleted` = mismo flujo de liberación.

3. **Validación en backend**:
   - El backend debe validar proximidad ≤5m antes de liberar.
   - Usar haversine o `getMetersBetween` equivalente en el servidor.
   - No confiar solo en el cliente.

4. **Hook useTransactionMonitoring**:
   - Activar con `enabled={!!alert && isTracking}`.
   - Pasar getters que devuelvan posiciones actuales.
   - Conectar `onCompleted` con la mutación de liberación.
