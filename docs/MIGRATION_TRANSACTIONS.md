# Migración Transactions: Base44 → Supabase (Data Adapter)

## Objetivo

Eliminar la dependencia de Base44 para transacciones usando el patrón Data Adapter. Los componentes importan `import * as transactions from "@/data/transactions"` y nunca llaman a Base44 ni Supabase directamente.

## Archivos creados/modificados

### Nuevos

- **`src/data/transactions.js`** – Adapter que reexporta el proveedor actual (transactionsSupabase).
- **`src/services/transactionsSupabase.js`** – Proveedor Supabase para transacciones.
- **`supabase/migrations/20260305190000_transactions.sql`** – Crea la tabla `transactions`.

### Modificados

- **`src/pages/Navigate.jsx`** – Usa `transactions.createTransaction` y `alerts.updateAlert`.
- **`src/pages/History.jsx`** – Usa `transactions.listTransactions`.
- **`src/pages/Home.jsx`** – Usa `transactions.createTransaction` al reservar una alerta.

## API del adapter (`src/data/transactions.js`)

| Función | Descripción |
|---------|-------------|
| `createTransaction(payload)` | Crea una transacción. |
| `listTransactions(userId, opts?)` | Lista transacciones del usuario (buyer o seller). |

### createTransaction payload

```ts
{
  buyer_id: string;      // uuid
  seller_id: string;     // uuid
  alert_id?: string;    // uuid, opcional
  amount: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  seller_name?: string;
  buyer_name?: string;
  seller_earnings?: number;
  platform_fee?: number;
  address?: string;
}
```

## Tabla Supabase `transactions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| buyer_id | uuid | FK auth.users |
| seller_id | uuid | FK auth.users |
| alert_id | uuid | FK parking_alerts, nullable |
| amount | numeric(10,2) | Importe en euros |
| status | text | pending, completed, cancelled, refunded |
| seller_earnings | numeric(10,2) | Opcional |
| platform_fee | numeric(10,2) | Opcional |
| address | text | Opcional |
| metadata | jsonb | Datos extra (seller_name, buyer_name, etc.) |
| created_at | timestamptz | |

## RLS

- **SELECT**: `buyer_id = auth.uid() OR seller_id = auth.uid()`
- **INSERT**: `buyer_id = auth.uid() OR seller_id = auth.uid()`
- **UPDATE**: `buyer_id = auth.uid() OR seller_id = auth.uid()`

## Mapeo Base44 → Supabase

| Base44 | Supabase |
|--------|----------|
| Transaction.create | createTransaction |
| Transaction.list | listTransactions |
| buyer_email, seller_email | Filtrado por buyer_id/seller_id (uuid) |
| created_date | created_at |

## Lo que sigue usando Base44

- **ParkingAlert.update** en Home (reserva de alerta).
- **ChatMessage.create** en Home y Navigate.
- Resto de entidades no migradas.

## Ejecutar migración

```bash
npx supabase db push
```
