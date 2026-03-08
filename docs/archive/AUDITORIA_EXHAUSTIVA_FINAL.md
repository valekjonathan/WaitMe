# Auditoría Exhaustiva Final — WaitMe

**Fecha:** 6 de marzo de 2025  
**Alcance:** Repo completo, migración Supabase, mapa, archivos muertos, DevOps, seguridad.

---

## 1. Resumen ejecutivo

El proyecto WaitMe está **migrado a Supabase** en todos los dominios de datos. Los restos de base44 (`base44Client.js`, `app-params.js`) han sido **eliminados** en esta auditoría. El mapa Mapbox puede fallar por **token inválido o ausente** (`VITE_MAPBOX_TOKEN`) o por **dimensiones del contenedor** en el simulador iOS; se han aplicado correcciones (ResizeObserver, `100dvh`, resizes escalonados). Los workflows de GitHub Actions están **deshabilitados** (en `workflows_disabled/`). El build pasa correctamente.

**Veredicto global:** 7.5/10 — Proyecto funcional y migrado, con margen de mejora en CI/CD y documentación de entorno.

---

## 2. Estado real de migración a Supabase

| Dominio | Estado | Fuente actual |
|---------|--------|---------------|
| **AUTH** | Migrado | AuthContext + Supabase Auth |
| **PERFILES** | Migrado | profilesSupabase → data/profiles.js |
| **ALERTAS** | Migrado | alertsSupabase → data/alerts.js |
| **RESERVAS** | Migrado | alertsSupabase (status reserved) |
| **CHAT** | Migrado | chatSupabase → data/chat.js |
| **NOTIFICACIONES** | Migrado | notificationsSupabase → data/notifications.js |
| **TRANSACCIONES** | Migrado | transactionsSupabase → data/transactions.js |
| **UPLOADS** | Migrado | uploadsSupabase → data/uploads.js |
| **USER LOCATIONS** | Migrado | userLocationsSupabase → data/userLocations.js |
| **MAPAS** | Estable* | MapboxMap + ParkingMap (*requiere VITE_MAPBOX_TOKEN válido) |

Todos los adapters en `src/data/*.js` delegan a servicios Supabase. No hay doble fuente de verdad en runtime.

---

## 3. Restos encontrados de base44

### Eliminados en esta auditoría
- `src/api/base44Client.js` — **ELIMINADO** (código muerto, nadie lo importaba)
- `src/lib/app-params.js` — **ELIMINADO** (solo base44Client lo usaba)

### Referencias restantes (solo documentación)
- `docs/*.md` — menciones históricas en MIGRATION_*.md, AUDITORIA_*.md, etc.
- Comentarios en servicios: "Sustituye base44.entities.X" — informativos
- `supabase/migrations/20260304150000_create_parking_alerts.sql` — comentario "migración desde base44"

### package.json
- No hay `@base44/sdk` ni `@base44/vite-plugin` en dependencias.
- `vite.config.js` no usa plugin base44.

### Verificación
```bash
grep -r "base44" src/  # Solo comentarios en servicios
grep -r "base44Client\|app-params" src/  # Sin resultados
```

---

## 4. Causa exacta del problema del mapa

### Diagnóstico
El mapa no se ve en el simulador cuando:

1. **Token inválido o ausente:** `VITE_MAPBOX_TOKEN` no está en `.env` o tiene valor placeholder (`PEGA_AQUI_EL_TOKEN`, `YOUR_MAPBOX_PUBLIC_TOKEN`). MapboxMap muestra "Mapa no disponible".

2. **Contenedor con dimensiones inestables:** En iOS/WebView, el contenedor puede tener altura 0 o cambiar tras el layout. Mapbox necesita un contenedor con tamaño definido para renderizar.

3. **Viewport en móvil:** `100vh` en iOS puede no coincidir con el viewport visible (barra de direcciones, safe area).

### Correcciones aplicadas
- `minHeight: '100dvh'` en el contenedor del mapa (mejor soporte móvil).
- `minWidth: '100%'` para evitar colapso horizontal.
- **ResizeObserver** para llamar `map.resize()` cuando cambia el tamaño del contenedor.
- Resizes escalonados (100ms, 400ms, 800ms) tras el load para estabilizar el layout.

### Acción recomendada
1. Crear `.env` con `VITE_MAPBOX_TOKEN=pk.xxx` (token real de https://account.mapbox.com/).
2. Si sigue sin verse: comprobar en DevTools que el contenedor del mapa tenga `height > 0` y que no haya errores 401 en la pestaña Network para tiles de Mapbox.

---

## 5. Bugs críticos encontrados

| Severidad | Descripción | Estado |
|-----------|-------------|--------|
| Alta | base44Client.js y app-params.js eran código muerto con dependencia inexistente (@base44/sdk) | Corregido: eliminados |
| Media | Mapa puede no renderizar en simulador por dimensiones del contenedor | Corregido: ResizeObserver + 100dvh |
| Media | Workflows de CI deshabilitados — no hay validación automática en push | Pendiente: reactivar |
| Baja | Chunk principal > 500KB (mapbox-gl, radix, etc.) | Pendiente: code-split |

---

## 6. Archivos muertos o prescindibles

| Archivo | Clasificación | Notas |
|---------|---------------|-------|
| `src/api/base44Client.js` | Borrar ya | Eliminado |
| `src/lib/app-params.js` | Borrar ya | Eliminado |
| `ios__backup_black_screen__20260304_202001/` | Mantener temporalmente | Backup iOS; evaluar si añadir a .gitignore |
| `functions/searchGooglePlaces.ts` | Refactorizar después | No usa base44; evaluar si se usa en producción |
| Docs obsoletos (MIGRATION_STATUS, etc.) | Refactorizar después | Consolidar en un único MIGRATION_COMPLETE.md |

---

## 7. Riesgos de arquitectura

1. **DemoFlowManager + datos reales:** La app mezcla flujos demo (localStorage) con datos reales (Supabase). En Chats, History, etc. hay lógica bifurcada. Riesgo: confusión y bugs si se extiende el demo.

2. **mockNearby.js:** Home usa `getMockNearbyAlerts()` para el modo búsqueda en lugar de alertas reales de Supabase. Es intencional para demo, pero puede confundir si se esperan datos reales.

3. **Sin CI activo:** Los workflows están en `workflows_disabled/`. Cualquier push a main no ejecuta lint, tests ni build.

4. **Variables de entorno:** La app requiere `.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`. No hay validación en build; solo MissingEnvScreen para Supabase al arrancar.

---

## 8. Automatizaciones aplicadas

- Eliminación de `base44Client.js` y `app-params.js`.
- Mejoras en MapboxMap: ResizeObserver, 100dvh, resizes escalonados.
- Creación de este documento de auditoría.

---

## 9. Cambios hechos automáticamente

1. **MapboxMap.jsx**
   - `minHeight: '100dvh'`, `minWidth: '100%'` en el contenedor.
   - ResizeObserver para `map.resize()` al cambiar tamaño.
   - Resizes escalonados (100, 400, 800 ms) tras load.
   - Cleanup del ResizeObserver en unmount.

2. **Eliminación de archivos**
   - `src/api/base44Client.js`
   - `src/lib/app-params.js`

---

## 10. Cambios pendientes recomendados

1. **Reactivar CI:** Mover workflows de `workflows_disabled/` a `workflows/` y configurar secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN).

2. **Documentar .env:** Añadir a README o SETUP.md la lista exacta de variables y cómo obtenerlas.

3. **Evaluar ios__backup_black_screen__*:** Decidir si excluirlo del repo (`.gitignore`) o eliminarlo.

4. **Code-split:** Considerar `React.lazy` para rutas pesadas (History, Profile) y `import()` dinámico para mapbox-gl donde sea posible.

5. **Actualizar docs de migración:** Crear `MIGRATION_COMPLETE.md` que indique que base44 está eliminado y la migración está cerrada.

---

## 11. Veredicto final

| Criterio | Puntuación (0–10) |
|----------|-------------------|
| Migración Supabase | 10 |
| Limpieza base44 | 10 |
| Estabilidad del mapa | 7 |
| CI/CD | 4 |
| Documentación | 6 |
| Estructura de código | 8 |
| Seguridad (RLS, envs) | 8 |

**Total: 7.5/10**

El proyecto está en buen estado para desarrollo y producción en cuanto a datos y arquitectura. Los principales puntos débiles son la ausencia de CI activo y la dependencia de configuración manual de `.env`. Con los cambios aplicados, el mapa debería mostrarse correctamente en el simulador si `VITE_MAPBOX_TOKEN` está configurado.
