# WaitMe — Local Automation (Final)

Sistema operativo local para el proyecto. Supervisor central + mode runners.

---

## ARQUITECTURA

```
waitme-supervisor.sh (controlador central)
├── waitme-simulator.sh  → dev server + bridge + simulador + auto-login
├── waitme-iphone.sh     → build producción + Xcode
├── waitme-state.sh      → LIVE_PROJECT_STATE.json
├── waitme-snapshot.sh   → tmp/waitme_project_snapshot.zip
└── waitme-stop.sh       → para dev server y bridge
```

---

## SIMULATOR MODE — Para qué sirve

- **UI / visual:** Cambios de layout, estilos, componentes
- **Preview en tiempo real:** Live reload al guardar
- **Siempre logueado:** Dev user automático, sin Google
- **Rápido:** No hace build completo

**Qué hacer después:** La app se abre en el simulador. Edita código y guarda → recarga solo.

---

## IPHONE MODE — Para qué sirve

- **Google login real:** Probar OAuth en dispositivo físico
- **Validación real:** Ubicación, notificaciones, rendimiento
- **Build de producción:** Sin localhost, bundle local

**Qué hacer después:** Xcode se abre. Selecciona tu iPhone físico en el target y pulsa Run (▶).

---

## LOS 5 COMANDOS

| Comando | Qué hace |
|---------|----------|
| `npm run waitme:simulator` | Abre simulador con live reload y auto-login |
| `npm run waitme:iphone` | Build limpio, abre Xcode para iPhone físico |
| `npm run waitme:state` | Regenera LIVE_PROJECT_STATE.json |
| `npm run waitme:snapshot` | Genera tmp/waitme_project_snapshot.zip |
| `npm run waitme:stop` | Para dev server y bridge |
| `npm run waitme:launcher` | Menú interactivo Node |

**Alternativa:** `node scripts/waitme-launcher.js <simulator|iphone|state|snapshot|stop>`

---

## QUÉ HACER DESPUÉS DE CADA COMANDO

### waitme:simulator
1. Espera a que se abra el simulador
2. La app carga sola (auto-login)
3. Edita en tu editor → guarda → la app recarga
4. Para salir: Ctrl+C en la terminal

### waitme:iphone
1. Espera a que se abra Xcode
2. En Xcode: selecciona tu iPhone en el selector de dispositivos
3. Pulsa Run (▶)
4. En el iPhone: inicia sesión con Google si hace falta

### waitme:state
- Muestra el estado actual en consola
- Actualiza devcontext/LIVE_PROJECT_STATE.json

### waitme:snapshot
- Crea tmp/waitme_project_snapshot.zip
- Útil para enviar contexto a ChatGPT

### waitme:stop
- Para el dev server si está corriendo
- Para el bridge si está corriendo

---

## QUÉ NO USAR SIMULATOR PARA

- Probar Google login real (usa iphone)
- Validar ubicación GPS real (usa iphone)
- Probar notificaciones push en dispositivo (usa iphone)
- Build final para TestFlight/App Store (usa iphone + Xcode)

---

## QUÉ NO USAR IPHONE MODE PARA

- Iterar rápido en UI (usa simulator)
- Cambios visuales frecuentes (usa simulator)
- Desarrollo sin cable (simulator no requiere dispositivo)

---

## LÍMITE HONESTO: CHATGPT NO LEE TU REPO LOCAL

ChatGPT no puede acceder directamente a los archivos de tu Mac.

**Workaround:** El repo exporta siempre:
- `devcontext/LIVE_PROJECT_STATE.json` — estado actual
- `tmp/waitme_project_snapshot.zip` — snapshot completo
- `devcontext/LAST_ERROR_SUMMARY.md` — último error si hubo

Para dar contexto a ChatGPT: adjunta el ZIP o pega el JSON en el chat.

