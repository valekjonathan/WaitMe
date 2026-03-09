# Estado Auth — WaitMe

**Última actualización:** 2026-03-09 16:39

---

## Flujo auth actual

1. oauthCapture: appUrlOpen/getLaunchUrl → processOAuthUrl(url)
2. Extrae code de URL: params.get('code')
3. exchangeCodeForSession(code) — **code, NO url**
4. getSession + setSession (workaround #1566)
5. Supabase → onAuthStateChange(SIGNED_IN, session)
6. applySession: ensureUserInDb → setUser(appUser) o fallback setUser(session.user)
7. Router: user != null → Home

---

## Último resultado real

- Corrección aplicada: code en vez de url
- Pendiente validación manual en simulador

---

## user null sí/no

- **Pendiente validar** — Fallback session.user si ensureUserInDb falla

---

## SIGNED_IN sí/no

- **Sí** — Supabase dispara tras exchangeCodeForSession
- AuthContext escucha onAuthStateChange

---

## session persistida sí/no

- **Sí** — Capacitor Preferences, flowType pkce
- setSession tras exchange para workaround #1566

---

## callback recibido sí/no

- **Sí** — oauthCapture appUrlOpen/getLaunchUrl

---

## punto actual del fallo si existe

- **Corregido**: Se pasaba url a exchangeCodeForSession; API espera code. Corregido.
- Si persiste: revisar logs [AUTH FINAL 1-12] para identificar paso exacto.
