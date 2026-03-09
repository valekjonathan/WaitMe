# WaitMe — Desarrollo iOS automático

Flujo de desarrollo con Live Reload para Simulador e iPhone físico. Sin comandos manuales.

---

## Uso

```bash
npm run start
```

O directamente:

```bash
npm run ios:auto
```

---

## Qué hace

1. **Detecta IP local** — `scripts/setDevServer.js` obtiene la IP (prioriza en0/WiFi).
2. **Arranca Vite** — `vite --host --port 5173` para que Simulator e iPhone accedan por red.
3. **Capacitor Live Reload** — `cap run ios --live-reload --host IP --port 5173`.
4. **Recarga automática** — Al cambiar código en `src/`, Vite HMR recarga la app sin reinstalar.

---

## Persistencia

Tras cerrar y reabrir el Mac:

```bash
cd WaitMenuevo
npm run start
```

No hace falta ejecutar más comandos. La app se actualiza sola al editar código.

---

## Simulador vs iPhone físico

| Dispositivo | Requisito |
|-------------|-----------|
| **Simulador** | Ninguno. Se abre automáticamente. |
| **iPhone físico** | Misma WiFi que el Mac + permiso "Red local" en el iPhone. |

---

## Scripts relacionados

| Script | Función |
|--------|---------|
| `start` | `ios:auto` — punto de entrada |
| `ios:auto` | Vite + cap run con live reload |
| `dev:ios` | Idem que `ios:auto` |
| `ios:live` | Alternativa solo Simulator (localhost) |
| `ios:watch` | Para flujo sin live reload (build + sync) |

---

## Archivos clave

- `scripts/dev-ios.sh` — flujo principal
- `scripts/setDevServer.js` — devuelve URL `http://IP:5173`
- `scripts/get-ip.js` — devuelve solo IP
- `capacitor.config.ts` — usa `CAPACITOR_DEV_SERVER_URL` para `server.url`
