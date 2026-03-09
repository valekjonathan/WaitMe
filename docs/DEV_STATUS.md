# Estado Global del Proyecto — WaitMe

**Última actualización:** 2026-03-09

---

## Formato obligatorio

- **Estado global** — tabla: auth iOS, Home, mapa, simulador, iPhone físico, build
- **Auth iOS** — resumen
- **Home** — resumen
- **Mapa** — resumen
- **Simulador** — scripts, watcher
- **iPhone físico** — live reload
- **Build actual** — vars, dist
- **Siguiente paso único** — acción concreta

---

## Estado global

| Área | Estado | Notas |
|------|--------|-------|
| Auth iOS | En validación | Flujo Supabase puro, fallback session.user |
| Home | En validación | Overlay, depende de auth |
| Mapa | OK | Mapbox, depende de Home |
| Simulador | OK | ios:refresh, scripts correctos |
| iPhone físico | OK | ios:auto, Mac encendido |
| Build | OK | Vite, VITE_IOS_DEV_BUILD en ios:refresh |

---

## ZIP vivo

- **Ruta:** tmp/waitme-live-context.zip
- **Tamaño:** ~128 MB
- **Timestamp generación:** 2026-03-09 15:21
- **Nota:** tmp/ está en .gitignore; ZIP y screenshot son locales. Para compartir con ChatGPT: subir ZIP a release o descargar desde máquina local.

---

## Auth iOS

- oauthCapture → exchangeCodeForSession → onAuthStateChange → applySession → setUser
- Fallback: ensureUserInDb falla → setUser(session.user)

---

## Home

- Overlay z-[100], logo/frases/botones en HomeHeader
- WAITME BUILD TEST con VITE_IOS_DEV_BUILD=1

---

## Mapa

- MapboxMap, VITE_MAPBOX_TOKEN, createMap

---

## Simulador

- npm run start, npm run ios:refresh

---

## iPhone físico

- npm run ios:auto, WiFi, Red local

---

## Build actual

- vite build, dist/, cap sync ios
- VITE_IOS_DEV_BUILD=1 en ios:refresh

---

## Siguiente paso único

Validar Login Google en simulador → Home. Revisar logs [AUTH STEP].
