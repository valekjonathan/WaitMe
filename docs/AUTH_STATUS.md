# Estado Auth — WaitMe

**Última actualización:** 2026-03-09

---

## Formato fijo

- **Flujo actual** — pasos 1-N del auth
- **Último resultado real** — qué pasó en última prueba
- **user null sí/no** — si user queda null tras login
- **SIGNED_IN sí/no** — si Supabase dispara el evento
- **Estado de persistencia** — storage, getSession

---

## Flujo actual

1. oauthCapture detecta URL OAuth (?code=xxx)
2. exchangeCodeForSession(code) — Supabase crea sesión
3. Supabase dispara onAuthStateChange(SIGNED_IN, session)
4. AuthContext.applySession(session):
   - ensureUserInDb(session.user) → appUser
   - Si appUser: setUser(appUser)
   - Si falla: setUser(session.user) (fallback)
5. Router: user != null → Home

---

## Último resultado real

- Pendiente validación manual en simulador
- Logs [AUTH STEP] añadidos para diagnóstico

---

## user null sí/no

- **Pendiente validar** — Si ensureUserInDb falla, fallback a session.user debería evitar null

---

## SIGNED_IN sí/no

- **Sí** — Supabase dispara SIGNED_IN tras exchangeCodeForSession
- AuthContext escucha onAuthStateChange

---

## Estado de persistencia

- Capacitor Preferences (supabaseClient con flowType: pkce)
- getSession() restaura sesión al reabrir app
