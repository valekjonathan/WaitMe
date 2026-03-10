# WaitMe — Local Automation (Final)

Sistema operativo local para el proyecto. Tres modos oficiales (Uber/Stripe/Airbnb style).

---

## ARQUITECTURA

```
waitme-supervisor.sh (controlador central)
├── waitme-visual.sh     → VISUAL MODE: simulador + iPhone, misma app, live reload
├── waitme-iphone.sh     → REAL DEVICE MODE: build limpio, Google login real
├── waitme-stop.sh       → STOP MODE: parar todo
├── waitme-simulator.sh  → solo simulador (alternativa)
├── waitme-state.sh      → LIVE_PROJECT_STATE.json
└── waitme-snapshot.sh   → tmp/waitme_project_snapshot.zip
```

---

## CÓMO EJECUTAR (SIN ESCRIBIR COMANDOS)

**En Cursor / VS Code:**
1. `Cmd+Shift+P` → "Tasks: Run Task"
2. Elige: **WaitMe: VISUAL MODE** | **WaitMe: REAL DEVICE MODE** | **WaitMe: STOP**

**O desde el panel NPM Scripts:** clic en ▶ junto a `waitme:visual`, `waitme:iphone` o `waitme:stop`.

---

## VISUAL MODE — Desarrollo diario

**Botón:** WaitMe: VISUAL MODE (o `npm run waitme:visual`)

- **Simulador e iPhone físico:** La MISMA app, mismo dev server, live reload
- **Un solo arranque:** Dev server + selector de dispositivo
- **Paridad real:** Ambos apuntan a la misma URL (IP de red del Mac)
- **Sin build viejo:** Siempre instala app con server.url correcto

**Requisito:** iPhone y Mac en la misma red WiFi.

---

## REAL DEVICE MODE — Pruebas reales

**Botón:** WaitMe: REAL DEVICE MODE (o `npm run waitme:iphone`)

- **Google login real:** OAuth en dispositivo físico
- **Build limpio:** Sin localhost, bundle local
- **Validación real:** Ubicación, notificaciones, rendimiento

**Qué hacer:** Xcode se abre. Selecciona tu iPhone en el target y pulsa Run (▶).

---

## STOP MODE — Parar todo

**Botón:** WaitMe: STOP (o `npm run waitme:stop`)

- Cierra Vite dev server
- Cierra procesos duplicados
- Deja sistema en idle

---

## LOS 3 BOTONES PRINCIPALES

| Botón / Script | Modo | Uso |
|----------------|------|-----|
| **WaitMe: VISUAL MODE** | visual | Desarrollo diario, cambios en tiempo real |
| **WaitMe: REAL DEVICE MODE** | real-device | Google login real, pruebas finales |
| **WaitMe: STOP** | stop | Parar procesos |

---

## OTROS COMANDOS

| Script | Qué hace |
|--------|----------|
| `waitme:simulator` | Solo simulador (alternativa a visual) |
| `waitme:state` | Regenera LIVE_PROJECT_STATE.json |
| `waitme:snapshot` | Genera tmp/waitme_project_snapshot.zip |
| `waitme:launcher` | Menú interactivo Node |

---

## QUÉ HACER DESPUÉS DE CADA COMANDO

### waitme:visual
1. Espera a que se abra el selector de dispositivos
2. Selecciona **simulador** o **iPhone físico**
3. La app carga sola (auto-login)
4. Edita en tu editor → guarda → la app recarga en el dispositivo elegido
5. Para salir: Ctrl+C en la terminal

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

