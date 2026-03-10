# Google Login iOS — Checklist Final de Validación

---

## 1. Supabase Dashboard — Redirect URLs

**Dónde:** Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs**

**URL exacta requerida:**
```
com.waitme.app://auth/callback
```

Añadirla en **Additional Redirect URLs** si no está. Guardar cambios.

---

## 2. Flujo de prueba en iPhone físico

1. `npm run ios:refresh` (o build en Xcode para dispositivo)
2. Conectar iPhone por cable
3. Abrir app en iPhone
4. Pulsar **Continuar con Google**
5. Completar login en Safari/Google
6. Verificar redirect automático a la app
7. Verificar que se muestra Home (usuario autenticado)

---

## 3. Qué indica éxito

- App vuelve de Safari a WaitMe sin error
- Pantalla Home visible (mapa, botones)
- Usuario autenticado (no vuelve a Login)

---

## 4. Logs a revisar si falla

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

## 5. Simulador (alternativa)

En simulador: usar **Entrar en modo test** para evitar passkey de Google. Para probar Google real en simulador, el flujo es el mismo pero passkey puede fallar.
