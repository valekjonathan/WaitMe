# Auditoría OAuth iOS — WaitMe

**Fecha:** 2026-03-07

---

## 1. Problema real

En iPhone/Simulator el login con Google se queda en accounts.google.com y **no vuelve** a la app.

---

## 2. Flujo actual

1. Usuario pulsa "Continuar con Google"
2. Login.jsx: `signInWithOAuth({ provider: 'google', redirectTo: 'capacitor://localhost', skipBrowserRedirect: true })`
3. Supabase devuelve `data.url` → `Browser.open({ url })` abre Safari
4. Usuario inicia sesión en Google
5. Google redirige a Supabase callback
6. Supabase redirige a `capacitor://localhost#access_token=...&refresh_token=...`
7. **Esperado:** Sistema abre la app con esa URL; App.jsx `appUrlOpen` recibe la URL; `processOAuthUrl` parsea hash y `setSession`
8. **Real:** La app no recibe la URL; el usuario se queda en Safari

---

## 3. Causas probables

| Causa | Verificación |
|-------|--------------|
| **Supabase Redirect URLs** | Dashboard → Auth → URL Configuration → Redirect URLs debe incluir `capacitor://localhost` |
| **URL scheme iOS** | Info.plist tiene `capacitor`; `capacitor://localhost` debería abrir la app |
| **Safari handoff** | En Simulator, Safari a veces no hace handoff a custom schemes |
| **Hash en redirect** | Supabase usa hash por defecto; debe llegar a la app |
| **Browser plugin** | `Browser.open` abre en Safari externo; al redirect, Safari debe abrir capacitor:// |

---

## 4. Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `src/pages/Login.jsx` | redirectTo: capacitor://localhost, Browser.open |
| `src/App.jsx` | processOAuthUrl, appUrlOpen, getLaunchUrl |
| `ios/App/App/Info.plist` | CFBundleURLSchemes: capacitor |
| `capacitor.config.ts` | appId: com.waitme.app |
| Supabase Dashboard | Redirect URLs |

---

## 5. Correcciones a aplicar

### 5.1 Supabase Dashboard (manual)

1. Ir a Supabase Dashboard → Authentication → URL Configuration
2. **Redirect URLs** debe incluir exactamente:
   - `capacitor://localhost`
   - `com.waitme.app://`
   - `com.waitme.app://auth/callback`
3. **Site URL** puede ser `https://tu-dominio.vercel.app` para web

### 5.2 Info.plist — Añadir scheme alternativo

Añadir `com.waitme.app` como scheme alternativo para mejor compatibilidad:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.waitme.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>capacitor</string>
    </array>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
  </dict>
  <dict>
    <key>CFBundleURLName</key>
    <string>WaitMe Auth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.waitme.app</string>
    </array>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
  </dict>
</array>
```

### 5.3 Login.jsx — Probar redirect alternativo

Si `capacitor://localhost` falla en Simulator, probar `com.waitme.app://auth/callback` y actualizar `processOAuthUrl` en App.jsx para aceptar ambos.

### 5.4 Sign in with Apple (preparado)

- Info.plist: Añadir Sign in with Apple capability en Xcode
- Supabase: Habilitar Apple provider
- Login.jsx: Ya tiene botón; `signInWithOAuth('apple')` funcionará cuando esté configurado

---

## 6. Validación

1. Simulator: Login Google → debe volver a la app y mostrar Home
2. iPhone físico: Idem
3. Web: No afectado (usa redirectTo web)
