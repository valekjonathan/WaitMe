# Checklist de diagnóstico — Mapa WaitMe

Cuando el mapa no se renderiza en simulador o build local, seguir este checklist en orden.

---

## 1. Token Mapbox

- [ ] Existe archivo `.env` en la raíz del proyecto
- [ ] `.env` contiene `VITE_MAPBOX_TOKEN=pk.xxx` (token real, no placeholder)
- [ ] El token NO es `PEGA_AQUI_EL_TOKEN` ni `YOUR_MAPBOX_PUBLIC_TOKEN`
- [ ] Obtener token en: https://account.mapbox.com/access-tokens/
- [ ] Tras cambiar `.env`, reiniciar `npm run dev` o hacer `npm run build` de nuevo

**Síntoma:** Mensaje "Mapa no disponible" o área gris sin tiles.

---

## 2. Contenedor del mapa

- [ ] En DevTools → Elements, el div con `ref` del MapboxMap tiene `height > 0` y `width > 0`
- [ ] El padre del mapa tiene `min-h-[100dvh]` o altura definida
- [ ] No hay `display: none` ni `visibility: hidden` en ancestros del mapa
- [ ] El mapa está en `z-index: 0`; overlays en `z-[1]` y contenido en `z-10`

**Síntoma:** Mapa carga pero se ve vacío o recortado.

---

## 3. Simulador iOS / Capacitor

- [ ] Si usas dev server: `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`
- [ ] La URL del dev server en `capacitor.config.ts` es accesible desde el simulador (misma red)
- [ ] Si usas build: `npm run build` → `npx cap sync ios` → abrir en Xcode
- [ ] En build, las variables `VITE_*` se inyectan en tiempo de build; asegurar `.env` correcto antes de `npm run build`

**Síntoma:** Mapa funciona en navegador pero no en simulador.

---

## 4. Errores de red

- [ ] En DevTools → Network, filtrar por "mapbox" o "tiles"
- [ ] No hay respuestas 401 (Unauthorized) — indica token inválido o expirado
- [ ] No hay bloqueos CORS para `*.mapbox.com`

**Síntoma:** Tiles no cargan, mapa gris con cuadrícula.

---

## 5. Resize y layout

- [ ] MapboxMap usa ResizeObserver para llamar `map.resize()` cuando cambia el contenedor
- [ ] Hay resizes escalonados (100, 400, 800 ms) tras el load
- [ ] Si el mapa aparece tras cambiar de orientación o redimensionar, el problema es de resize

**Síntoma:** Mapa aparece solo tras rotar dispositivo o redimensionar ventana.

---

## 6. Componentes relacionados

| Componente    | Uso                          | Token requerido |
|---------------|------------------------------|-----------------|
| MapboxMap     | Fondo fullscreen en Home     | Sí              |
| ParkingMap    | Mapas en modos search/create | Sí              |
| SellerLocationTracker | Mapa en Navigate      | Sí              |

Todos comparten `VITE_MAPBOX_TOKEN`. Si uno falla, los demás también.

---

## 7. Comandos de verificación

```bash
# Build local (debe completar sin errores)
npm run build

# Preview del build
npm run preview

# Verificar que .env tiene las variables
grep VITE_ .env 2>/dev/null || echo "Crear .env desde .env.example"
```

---

## 8. Fixes aplicados (referencia)

- Contenedor MapboxMap: `minHeight: 100dvh`, `minWidth: 100%`
- ResizeObserver para `map.resize()` al cambiar tamaño
- Resizes escalonados tras load
- Parent en Home: `min-h-[100dvh]` para altura estable en móvil
