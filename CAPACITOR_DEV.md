# Flujo Vite + Capacitor para iOS (dev server)

Para que el simulador iOS **siempre** cargue desde el servidor de desarrollo (y no una build vieja):

## Flujo correcto

1. **Arrancar Vite:**
   ```bash
   npm run dev
   ```

2. **Ejecutar en simulador (usa dev server):**
   ```bash
   npm run ios:run:dev
   ```
   O manualmente:
   ```bash
   CAPACITOR_USE_DEV_SERVER=true npx cap run ios
   ```

## ⚠️ Importante

- **NO** uses `npx cap run ios` sin la variable: sobrescribe `capacitor.config.json` y elimina el bloque `server`, haciendo que cargue la build local.
- **SÍ** usa `npm run ios:run:dev` o `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`.

## Verificación

- `ios/App/App/capacitor.config.json` debe contener:
  ```json
  "server": {
    "url": "http://192.168.0.11:5173",
    "cleartext": true
  }
  ```

- Si ves build vieja: `rm -rf ios/App/App/public` y re-sync con:
  ```bash
  CAPACITOR_USE_DEV_SERVER=true npx cap sync ios
  ```
