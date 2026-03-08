# Data Layer — Patrón Adapter (Strangler)

Los componentes **nunca** llaman directamente a Base44 ni a Supabase. Toda la comunicación con backends pasa por la capa de datos.

---

## 1. Qué es el adapter

El **Data Adapter** es una capa de abstracción entre la UI y los servicios de backend. Implementa el [Strangler Fig Pattern](https://martinfowler.com/articles/strangler-fig-application.html):

- Los componentes importan desde `@/data/*`.
- El adapter delega internamente al proveedor actual (Supabase, Base44, etc.).
- Para migrar: se cambia el proveedor en el adapter, sin tocar componentes.

---

## 2. Estructura

```
src/
├── data/                    # Data layer (adapters)
│   └── alerts.js           # Adapter de alertas
├── services/                # Implementaciones por proveedor
│   ├── alertsSupabase.js   # Supabase
│   └── alertService.js     # Legacy (schema antiguo)
└── pages/
    └── History.jsx         # import * as alerts from '@/data/alerts'
```

---

## 3. Uso del adapter de alertas

### API pública (`src/data/alerts.js`)

| Función | Descripción |
|---------|-------------|
| `getMyAlerts(sellerId)` | Alertas del vendedor |
| `getAlertsReservedByMe(buyerId)` | Alertas reservadas por el comprador |
| `createAlert(payload)` | Crear alerta |
| `updateAlert(alertId, updates)` | Actualizar alerta |
| `deleteAlert(alertId)` | Eliminar alerta |
| `subscribeAlerts({ onUpsert, onDelete })` | Realtime |

### En componentes

```js
import * as alerts from '@/data/alerts';

// Nunca:
// import { base44 } from '@/api/base44Client';
// import * as alertsSupabase from '@/services/alertsSupabase';

const { data } = await alerts.getMyAlerts(userId);
await alerts.updateAlert(alertId, { status: 'cancelled' });
```

---

## 4. Cómo terminar la migración

### Fase actual

- **Proveedor:** `alertsSupabase.js` (Supabase).
- **Componentes migrados:** useMyAlerts, History, HistorySellerView, HistoryBuyerView.

### Para migrar Home.jsx y el resto

1. Sustituir en cada componente:
   - `base44.entities.ParkingAlert.*` → `alerts.*` (desde `@/data/alerts`).
2. No importar nunca `base44` ni `alertsSupabase` en componentes.
3. Si hace falta una función nueva (ej. `getNearbyAlerts`), añadirla al adapter y al proveedor.

### Para cambiar de proveedor

Editar solo `src/data/alerts.js`:

```js
// Antes (Supabase)
import * as provider from '@/services/alertsSupabase';

// Después (Base44 u otro)
import * as provider from '@/services/alertsBase44';
```

Las firmas de las funciones deben ser compatibles entre proveedores.

### Para soportar ambos proveedores (A/B)

```js
const USE_SUPABASE = import.meta.env.VITE_ALERTS_PROVIDER === 'supabase';
const provider = USE_SUPABASE
  ? await import('@/services/alertsSupabase')
  : await import('@/services/alertsBase44');

export const getMyAlerts = provider.getMyAlerts;
// ...
```

---

## 5. Reglas

1. **Componentes** → solo importan de `@/data/*`.
2. **Hooks** → solo importan de `@/data/*`.
3. **Services** → implementan la lógica por proveedor; no se importan en UI.
4. **Base44** → no se elimina hasta migrar todo; el adapter oculta el proveedor activo.

---

## 6. Archivos

| Archivo | Rol |
|---------|-----|
| `src/data/alerts.js` | Adapter; re-exporta del proveedor actual |
| `src/services/alertsSupabase.js` | Implementación Supabase |
| `docs/DATA_LAYER.md` | Esta documentación |
