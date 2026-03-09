# Estado Auth — WaitMe

**Última actualización:** 2026-03-09

---

## Formato obligatorio

- **Flujo auth actual** — pasos 1-N
- **Último resultado real** — qué pasó
- **user null sí/no** — tras login
- **SIGNED_IN sí/no** — evento Supabase
- **session persistida sí/no** — getSession
- **callback recibido sí/no** — oauthCapture
- **punto actual del fallo** — si existe

---

## Flujo auth actual

1. oauthCapture detecta URL ?code=xxx
2. exchangeCodeForSession(code)
3. Supabase → onAuthStateChange(SIGNED_IN, session)
4. applySession: ensureUserInDb → setUser(appUser) o fallback setUser(session.user)
5. Router: user != null → Home

---

## Último resultado real

- Pendiente validación manual en simulador
- Logs [AUTH STEP] para diagnóstico

---

## user null sí/no

- **Pendiente validar** — Fallback session.user debería evitar null si ensureUserInDb falla

---

## SIGNED_IN sí/no

- **Sí** — Supabase dispara tras exchangeCodeForSession

---

## session persistida sí/no

- **Sí** — Capacitor Preferences, flowType pkce, getSession restaura

---

## callback recibido sí/no

- **Sí** — oauthCapture appUrlOpen/getLaunchUrl procesa URL

---

## punto actual del fallo si existe

- Ninguno identificado. Validar en simulador con logs [AUTH STEP].
