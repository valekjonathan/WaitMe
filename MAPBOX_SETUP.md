# Configuración de Mapbox

## Token requerido

1. Abre **.env** en la raíz del proyecto.
2. Sustituye `YOUR_MAPBOX_PUBLIC_TOKEN` por tu token real (empieza por `pk.`).
3. Ejemplo: `VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbG...`
4. Guarda el archivo y reinicia el servidor: `npm run dev`

Obtén tu token en: https://account.mapbox.com/access-tokens/

## Verificación en consola (modo dev)

Al cargar el Home verás:
- `[MapboxMap] Token: pk.eyJ1... | Valid: true` → Token cargado
- `[MapboxMap] new mapboxgl.Map() ejecutado correctamente` → Mapbox inicializa
- `[MapboxMap] Mapa cargado, contenedor: W x H` → Mapa renderizado

Si hay error: `[MapboxMap] Error Mapbox: ...` mostrará el mensaje real.
