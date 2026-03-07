# Entregable Final — Auditoría Maestra WaitMe

**Fecha:** 2026-03-07

---

## 1. Estado real general del proyecto

WaitMe es una app de marketplace de alertas de aparcamiento en tiempo real. Stack: React + Vite + Supabase + Mapbox. Arquitectura en capas (data → services → Supabase). Motor de ubicación con pipeline profesional (fraud → kalman → smoothing → map matching). Una instancia MapboxMap en Home; ParkingMap en overlays y Navigate.

---

## 2. Qué está bien ya a nivel profesional

- **Arquitectura:** Capas separadas, sin llamadas directas a Supabase desde componentes.
- **Ubicación inicial:** getPreciseInitialLocation con alta precisión, 3 reintentos si accuracy > 50m.
- **Pipeline:** Un solo watcher, sin listeners duplicados. Fraud detector, movement validator, kalman, smoothing.
- **Mapa único:** MapboxMap solo en Home; ParkingMap reutilizado.
- **20 coches:** mockNavigateCars genera 20 coches con datos realistas (foto, nombre, coche, matrícula, dirección).
- **Home search:** 20 coches, usuario más cercano seleccionado por defecto.
- **Navigate browse:** Cuando no hay alertId, 20 coches mock, nearest seleccionado, link "Ir a Mapa para reservar".

---

## 3. Qué seguía mal y por qué

| Problema | Causa | Solución aplicada |
|----------|-------|-------------------|
| Map Matching identity | locationMapMatcher no conectaba a API | Integración real vía Supabase map-match, feature flag VITE_USE_MAP_MATCHING |
| Navigate vacío sin alertId | Solo mostraba alerta específica | Modo browse con 20 mock cars, nearest por defecto |
| Árbol desactualizado | docs/ARBOL_REAL no reflejaba locationPipeline, etc. | Actualizado con estructura actual |
| CI/Vercel emails | Sin diagnóstico claro | docs/AUDITORIA_CI_Y_PAGOS_FINAL_WAITME.md |

---

## 4. Archivos modificados

- `docs/ARBOL_REAL_PROYECTO_ACTUAL.md` — Árbol actualizado
- `docs/AUDITORIA_MAESTRA_FINAL_WAITME.md` — Auditoría completa
- `docs/AUDITORIA_CI_Y_PAGOS_FINAL_WAITME.md` — CI, Vercel, tests skip
- `docs/ENTREGABLE_FINAL_AUDITORIA_MAESTRA.md` — Este entregable
- `src/lib/locationPipeline/locationMapMatcher.js` — Map Matching real (Supabase map-match)
- `src/pages/Navigate.jsx` — Modo browse 20 coches, nearest por defecto
- `.env.example` — Documentación VITE_USE_MAP_MATCHING

---

## 5. Qué se unificó o eliminó

- **Map Matching:** De identity a integración real con fallback. Feature flag para activar.
- **Navigate:** Unificado flujo con/sin alertId (browse con 20 coches).
- No se eliminó código; solo añadido y documentado.

---

## 6. Cómo quedó la ubicación inicial precisa

- `getPreciseInitialLocation()`: getCurrentPosition con enableHighAccuracy, timeout 10s, maximumAge 0.
- Si accuracy > 50m, reintenta hasta 3 veces.
- Usado en: MapboxMap (posición inicial), Home (mirilla), CreateAlertCard (botón Ubícate).
- La primera posición NO viene del smoothing/Kalman; el pipeline se aplica después vía LocationEngineStarter.

---

## 7. Cómo quedó Map Matching

- **Implementación:** `locationMapMatcher.js` conecta a Supabase Edge Function `map-match`.
- **Feature flag:** `VITE_USE_MAP_MATCHING=true` para activar.
- **Flujo:** Buffer de posiciones → cada 3s con 2+ puntos llama a map-match → caché de geometría → snapToRoadSync proyecta posición sobre geometría o devuelve identity.
- **Fallback:** Si API no responde, timeout 5s, o sin config → identity.
- **Requisitos:** Edge Function map-match desplegada, MAPBOX_SECRET_TOKEN en Supabase.

---

## 8. Cómo quedaron HOME / CREATE / NAVIGATE

- **HOME:** Sin scroll de pantalla. Mapa fijo. Modos search (20 coches) y create.
- **CREATE:** Sin scroll. Mapa se mueve con tarjeta. Palito + bolita (CenterPin).
- **NAVIGATE:** Con alertId = navegación a alerta. Sin alertId = browse 20 coches, nearest seleccionado, link a Home.

---

## 9. Medidas finales exactas

No se realizaron mediciones numéricas automatizadas (zoomTopCreate, zoomTopNavigate, differenceZoom, cardBottomCreate, cardBottomNavigate, differenceCard). Los tests visuales con skip siguen pendientes de estabilizar.

---

## 10. Confirmación real de scroll = 0 y drag de pantalla = 0

No se ejecutaron tests automatizados de scroll/drag. La arquitectura de layout (overflow, touch-action) está definida en los componentes; la validación numérica queda pendiente.

---

## 11. Confirmación real de Home inmóvil y Create/Navigate solo mueven mapa

Arquitectura definida: Home sin scroll; Create y Navigate mueven el mapa. No se modificó el layout en esta auditoría.

---

## 12. Confirmación real de 20 coches y usuario más cercano por defecto

- **Home search:** getMockNavigateCars(userLocation) → 20 coches. useEffect selecciona nearest por distancia.
- **Navigate browse:** getMockNavigateCars(userLocation) → 20 coches. nearestBrowseAlert = sorted[0] por haversineKm.
- **mockNavigateCars.js:** Genera exactamente 20 coches con datos no vacíos.

---

## 13. Causa real de los emails de CI/Vercel y cómo se arregló

**Causas típicas:**
1. Lint/Typecheck/Build fallan → secrets faltantes o errores de código.
2. Playwright falla → timing, selectores, login en CI.

**Arreglo:** Ver `docs/AUDITORIA_CI_Y_PAGOS_FINAL_WAITME.md`. Configurar secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN). Revisar tests con skip y arreglar causa raíz en lugar de tapar.

---

## 14. Qué queda pendiente para llegar al máximo nivel de precisión tipo apps grandes

1. **Map Matching en producción:** Activar VITE_USE_MAP_MATCHING, desplegar map-match, configurar MAPBOX_SECRET_TOKEN.
2. **Tests visuales:** Resolver tests con skip (geometría, selectores, timing).
3. **Validación numérica:** Medir zoomTopCreate, zoomTopNavigate, differenceZoom, cardBottom, etc. con tests automatizados.
4. **Scroll/drag:** Validar que scroll real = 0 y drag de pantalla = 0 en HOME/CREATE/NAVIGATE.

---

## 15. Ruta del ZIP generado

```
tmp/waitme-master-audit-snapshot.zip
```

Excluye: node_modules, dist, storybook-static, coverage, playwright-report, test-results, .git.
