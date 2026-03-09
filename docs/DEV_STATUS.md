# Estado Global del Proyecto — WaitMe

**Última actualización:** 2026-03-09

---

## Formato fijo

- **Estado global** — tabla: auth iOS, Home, simulador, iPhone físico, mapa
- **Auth iOS** — resumen del flujo
- **Home** — resumen del estado
- **Simulador** — scripts y watcher
- **iPhone físico** — live reload
- **Mapa** — token, loader
- **Siguiente paso recomendado** — acción concreta

---

## Estado global

| Área | Estado | Notas |
|------|--------|-------|
| Auth iOS | En validación | Flujo Supabase puro, fallback session.user si ensureUserInDb falla |
| Home | En validación | Overlay con minHeight, depende de auth |
| Simulador | OK | ios:refresh funciona, scripts correctos |
| iPhone físico | OK | ios:auto con live reload, requiere Mac encendido |
| Mapa | OK | Mapbox con token, funciona si Home carga |

---

## Auth iOS

- Flujo: oauthCapture → exchangeCodeForSession(code) → Supabase → onAuthStateChange SIGNED_IN → applySession → setUser
- Sin eventos manuales ni variables globales
- Fallback: si ensureUserInDb falla, setUser(session.user)

---

## Home

- Overlay con z-[100], minHeight 100%, logo/frases/botones en HomeHeader
- WAITME BUILD TEST visible con VITE_IOS_DEV_BUILD=1 (ios:refresh)
- Depende de user != null (auth)

---

## Simulador

- npm run start → Vite + chokidar → ios:refresh al cambiar
- npm run ios:refresh → terminate, uninstall, build, sync, run

---

## iPhone físico

- npm run ios:auto → Vite + cap run con live reload
- Requiere: misma WiFi, permiso Red local, Mac encendido

---

## Mapa

- MapboxMap con VITE_MAPBOX_TOKEN
- Loader "Map loading..." hasta mapReady
- Funciona si Home se renderiza

---

## Siguiente paso recomendado

Validar en simulador: Login Google → Safari vuelve → user != null → Home con logo/frases/botones. Revisar logs [AUTH STEP] si user sigue null.
