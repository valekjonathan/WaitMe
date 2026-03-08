# Causa raíz del boot roto — WaitMe

**Fecha:** 2026-03-07

---

## 1. Síntoma

En simulador (y en CI): pantalla "Error cargando WaitMe".

---

## 2. Punto exacto donde explota

El **ErrorBoundary** (`src/core/ErrorBoundary.jsx`) captura errores de React. El mensaje "Error cargando WaitMe" indica que algún componente del árbol lanzó una excepción durante el render o en un lifecycle.

**Archivo:** `src/core/ErrorBoundary.jsx`  
**Línea:** `render()` cuando `this.state.hasError === true`

---

## 3. Dependencias que pueden romper el arranque

| Dependencia | Archivo que la usa | Qué falla |
|-------------|-------------------|-----------|
| **Supabase** | supabaseClient.js, AuthContext | Si URL/key vacíos o placeholder → createClient o auth.getUser() pueden fallar |
| **Mapbox** | MapboxMap, ParkingMap | Si token vacío/placeholder → los componentes muestran error, no lanzan |
| **Capacitor** | supabaseClient, App.jsx | Si Capacitor no está disponible en el entorno → import o isNativePlatform() podrían fallar |
| **Env loader** | Vite inyecta import.meta.env | Si .env no existe o build sin vars → valores undefined |
| **Sentry** | sentry.js | Carga async; si falla se captura en main.jsx |

---

## 4. Validación previa al boot (antes del fix)

- `main.jsx` solo comprobaba `getSupabaseConfig()` (URL y anon key).
- No se validaban placeholders (`tu_anon_key`, `PEGA_AQUI_EL_TOKEN`).
- No se validaba Mapbox en el boot.
- Si Supabase tenía valores placeholder, `config.ok` era true y se renderizaba App → posible crash más adelante.

---

## 5. Correcciones aplicadas

1. **runtimeConfig.js**  
   Validación centralizada de vars críticas, incluyendo placeholders.

2. **main.jsx**  
   Usa `getRuntimeConfig()` y bloquea el boot si `!canBoot` (Supabase faltante o placeholder).

3. **supabaseClient.js**  
   `getSupabaseConfig()` ahora rechaza placeholders (`tu_anon_key`, `TU_PROYECTO`).

4. **ErrorBoundary**  
   En DEV muestra `error.message` para facilitar el diagnóstico.

5. **MissingEnvScreen**  
   Título genérico "Falta configuración" y lista de variables faltantes.

---

## 6. Variables que rompen el boot

- `VITE_SUPABASE_URL` vacía o placeholder
- `VITE_SUPABASE_ANON_KEY` vacía o placeholder

Si falta alguna de estas, la app muestra MissingEnvScreen y no llega a renderizar App.

---

## 7. Variables que no rompen el boot pero afectan features

- `VITE_MAPBOX_TOKEN`: sin ella el mapa muestra "Configura VITE_MAPBOX_TOKEN".
- `VITE_SENTRY_DSN`: opcional.

---

## 8. Cómo validar

1. Sin .env o con vars vacías → MissingEnvScreen.
2. Con .env correcto → App carga.
3. Si hay crash → ErrorBoundary muestra el mensaje en DEV.
