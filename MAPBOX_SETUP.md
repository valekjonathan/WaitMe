# Configuración de Mapbox

## Token requerido

1. Abre **.env** en la raíz del proyecto.
2. Asigna tu token público (empieza por `pk.`) a `VITE_MAPBOX_TOKEN=`.
3. Guarda y reinicia: `npm run dev`

Obtén tu token en: https://account.mapbox.com/access-tokens/

## Verificación (modo dev)

- HUD: `tokenLength` > 0, `tokenHasDots: true`, `mapCreated: true`, `canvasPresent: true`
- El token NUNCA se muestra en logs ni HUD (solo tokenLength y tokenHasDots)
