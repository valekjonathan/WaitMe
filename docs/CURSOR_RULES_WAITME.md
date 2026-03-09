# Reglas permanentes — WaitMe

Reglas que todo agente (humano o IA) debe seguir al trabajar en el proyecto. Mantener Cursor como IDE principal sin cambiar de herramienta.

---

## 0. Simulador iOS — última build siempre

**Regla obligatoria:** Tras cualquier cambio visual o funcional relevante, Cursor debe ejecutar automáticamente:

```bash
npm run ios:refresh
```

- Si el cambio es solo de lógica web sin necesidad de reinstall, puede usarse live reload (`npm run ios:auto`).
- **Si el resultado no se refleja en simulador, se considera fallo del flujo** y hay que corregir el flujo, no dar por hecho que el cambio está aplicado.
- **Nunca dar por aplicado un cambio en iOS** si no se ha reflejado en simulador o no se ha reinstalado la build.

Esto garantiza que el simulador siempre muestra la última build (cierre → desinstalación → recompilación → reinstalación → apertura).

---

## 1. Archivos protegidos

| Archivo | Regla |
|---------|-------|
| `src/pages/Home.jsx` | **No tocar** salvo orden explícita del usuario. Es el núcleo visual y de flujo principal. |
| `src/pages/History.jsx` | Evitar cambios estructurales. Lógica compleja de alertas, thinking_requests, rejected_requests. |
| `src/pages/Chat.jsx` | No romper flujo demo/real. Mantener compatibilidad con DemoFlowManager. |
| `src/components/MapboxMap.jsx` | No modificar sin seguir `docs/MAP_DEBUG_CHECKLIST.md`. |
| `src/components/map/ParkingMap.jsx` | Idem. |

---

## 2. Visuales

- **No cambiar** colores, tipografías, espaciados, animaciones ni layout salvo que el usuario lo pida explícitamente.
- Si un cambio funcional implica ajuste visual inevitable, hacerlo mínimo y documentarlo.

---

## 3. Datos y backend

- **Supabase** es la única fuente de verdad para datos persistentes.
- Los componentes usan adapters en `src/data/*.js`; nunca llaman a Supabase directamente.
- **No introducir mocks** si ya existe flujo real en Supabase para ese dominio.
- No crear duplicidades de servicios, hooks o stores. Reutilizar lo existente.

---

## 4. Documentación obligatoria

Antes de cerrar un cambio, documentar:

- Archivos tocados
- Riesgos identificados
- Prueba recomendada (manual o automatizada)

---

## 5. Estilo de cambios

- Preferir cambios **mínimos**, **limpios** y **reversibles**.
- Un commit = una idea. Evitar mezclar refactors con features.
- Mantener enfoque **mobile-first**: probar en viewport reducido.

---

## 6. Flujos críticos (no romper)

- Login → Home → Búsqueda / Crear alerta
- Home → History → Chat / Navigate
- IncomingRequestModal (aceptar/rechazar WaitMe)
- Mapas (MapboxMap, ParkingMap, SellerLocationTracker)
- Notificaciones y badge del BottomNav

---

## 7. Referencias

- `docs/PROJECT_SOURCE_OF_TRUTH.md` — dominios, tablas, pantallas
- `docs/MAP_DEBUG_CHECKLIST.md` — diagnóstico del mapa
- `docs/SAFE_CHANGE_PROTOCOL.md` — protocolo antes de aplicar cambios
- `docs/IOS_DEV_FLOW.md` — flujo desarrollo iOS (simulador, iPhone físico)
