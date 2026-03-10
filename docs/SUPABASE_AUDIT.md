# Supabase Audit — WaitMe

---

## 1. Auth

- **Cliente:** @supabase/supabase-js
- **Punto único:** src/lib/supabaseClient.js
- **Auth options:** persistSession, autoRefreshToken, detectSessionInUrl: false
- **iOS:** storage = Capacitor Preferences, flowType = pkce
- **Web:** storage por defecto (localStorage)

### Providers

- Google — configurado en código
- Apple — botón presente, "no configurado todavía" en catch

---

## 2. Session Flow

1. Boot: getSession()
2. Si session: applySession → ensureUserInDb → setUser
3. onAuthStateChange: SIGNED_IN → applySession
4. OAuth callback: exchangeCodeForSession(code) → getSession → setSession (workaround #1566)

---

## 3. Profiles / Data Sync

- ensureUserInDb: insert en profiles si no existe
- profile se lee de tabla profiles
- Campos: email, full_name, avatar_url, brand, model, vehicle_type, etc.

---

## 4. Riesgos

- **ensureUserInDb timeout (5s):** Fallback a session.user — aceptable
- **Supabase no disponible:** getSupabase() devuelve null, app muestra MissingEnvScreen
- **Redirect URL mal configurado:** OAuth falla en redirect — verificar Dashboard

---

## 5. Escalabilidad

- Arquitectura limpia: adapters → services → Supabase
- Sin base44 en código activo
- Migraciones versionadas en supabase/migrations/
