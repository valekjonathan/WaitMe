# Google Login iOS — Checklist Final de Validación

---

## 1. Flujo oficial de build para iPhone físico

**Comando único:**
```bash
npm run ios:device
```

Esto hace: build limpio, sync sin server.url, abre Xcode. En Xcode: selecciona tu iPhone físico y pulsa Run.

**Alternativa manual:**
```bash
npm run build
bash scripts/cap-sync-clean.sh
npx cap open ios
```

**Importante:** NUNCA usar `npm run dev:ios` ni `npm run ios:live` para builds de iPhone físico. Esos usan dev server (192.168.x.x) y fallarán si el Mac no está en la misma red.

---

## 2. Supabase Dashboard — Redirect URLs

**Dónde:** Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**

**URL exacta requerida:**
```
com.waitme.app://auth/callback
```

Añadirla en **Additional Redirect URLs** si no está. Guardar cambios.

---

## 3. Flujo de prueba en iPhone físico

1. `npm run ios:device` (o flujo manual arriba)
2. En Xcode: seleccionar iPhone físico, Run
3. Abrir app en iPhone
4. Pulsar **Continuar con Google**
5. Completar login en Safari/Google
6. Verificar redirect automático a la app
7. Verificar que se muestra Home (usuario autenticado)

---

## 4. Qué indica éxito

- App carga desde bundle local (sin abrir Safari a 192.168.x.x al inicio)
- App vuelve de Safari a WaitMe tras OAuth sin error
- Pantalla Home visible (mapa, botones)
- Usuario autenticado (no vuelve a Login)

---

## 5. Si falla — qué revisar

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| App abre Safari a 192.168.x.x al inicio | Build contaminado con dev server | Borrar app, reinstalar con `npm run ios:device` |
| OAuth no vuelve a la app | Redirect URL mal configurado | Supabase Dashboard: añadir `com.waitme.app://auth/callback` |
| [AUTH FINAL 1] no aparece | Deep link no llegó | Info.plist CFBundleURLSchemes, com.waitme.app |
| [AUTH FINAL 2] exchange error | Redirect URL incorrecta o Supabase | Verificar Supabase Redirect URLs |

---

## 6. Logs a revisar si falla

Conectar iPhone a Mac, abrir **Console.app** o **Safari → Develop → [iPhone] → WaitMe**:

| Log | Significado |
|-----|-------------|
| `[AUTH FINAL 1] callback processed` | URL de callback recibida |
| `[AUTH FINAL 2] exchange success` | exchangeCodeForSession OK |
| `[AUTH FINAL 2] exchange error: ...` | Error en exchange (revisar redirect URL en Supabase) |
| `[AUTH FINAL 3] getSession after exchange true` | Sesión creada |
| `[AUTH LOAD] onAuthStateChange SIGNED_IN` | AuthContext aplicó sesión |

Si no aparece `[AUTH FINAL 1]`: el deep link no llegó (revisar Info.plist, URL scheme, Supabase Redirect URLs).

---

## 7. Simulador

- **Simulador:** `npm run ios:refresh` o `npm run ios:fresh` — build local, sin dev server.
- **Modo test:** Usar **Entrar en modo test** para evitar passkey de Google. Para probar Google real, el flujo es el mismo pero passkey puede fallar.
- **Dev server (solo desarrollo):** `npm run dev:ios` — usa 192.168.x.x, solo para Mac + iPhone en misma WiFi.
