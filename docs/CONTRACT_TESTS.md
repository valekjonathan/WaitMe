# Contract Tests (Data Layer API)

## Objetivo

Validar que la capa de datos (`src/data/*`) mantiene el contrato esperado por los consumidores. Los tests verifican que las funciones existen y devuelven la forma `{ data, error }`.

## Ubicación

```
tests/contracts/
├── alerts.test.js
├── chat.test.js
└── transactions.test.js
```

## Funciones validadas

| Módulo | Funciones |
|--------|-----------|
| **alerts** | createAlert, getMyAlerts, getAlertsReservedByMe, updateAlert, deleteAlert, subscribeAlerts |
| **chat** | sendMessage, getMessages, getConversations, getConversation, subscribeMessages |
| **transactions** | createTransaction, listTransactions |

## Contrato

Todas las funciones asíncronas devuelven un objeto con:

- `data`: resultado (objeto, array o null)
- `error`: Error o null

Los tests no requieren backend real: sin Supabase configurado, las funciones devuelven `{ data: null/[], error }`, lo que basta para validar la forma.

## Ejecución

```bash
npm run test:contracts
```

## CI

Los contract tests se ejecutan en CI antes del build:

1. Check migrations safety
2. Lint
3. Typecheck
4. Playwright tests
5. **Contract tests** ← antes de build
6. Build

## Preview protection (Vercel)

Para preview deployments en PRs:

1. Conectar el repo a Vercel (Vercel for GitHub).
2. Vercel crea automáticamente preview URLs para cada PR.
3. `vercel.json` define `framework: vite`, `buildCommand` y `outputDirectory`.

Las previews permiten probar cambios en PR antes de merge a main.
