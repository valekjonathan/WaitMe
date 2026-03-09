# Mapa completo del flujo Auth real — Auditoría forense

**Fecha:** Marzo 2026

---

## 1. UBICACIONES EXACTAS DE TÉRMINOS AUTH

### appUrlOpen
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/oauthCapture.js | 99 | initOAuthCapture (IIFE) |

### getLaunchUrl
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/oauthCapture.js | 103 | initOAuthCapture (IIFE) |

### exchangeCodeForSession
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/oauthCapture.js | 53 | processOAuthUrl |

### setSession
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/oauthCapture.js | 81 | processOAuthUrl |
| src/lib/AuthContext.jsx | 300 | useEffect (hash #access_token, solo web) |

### onAuthStateChange
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/AuthContext.jsx | 241 | useEffect |

### getSession
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/oauthCapture.js | 63 | processOAuthUrl |
| src/lib/AuthContext.jsx | 170 | resolveSession |

### navigate('/') (redirige a Home)
| Archivo | Línea | Función |
|---------|-------|---------|
| src/App.jsx | 59 | onOAuthSuccess (en useEffect) |

### navigate('/login')
No existe. Login se muestra por AuthRouter cuando `!user?.id`.

### isAuthenticated
| Archivo | Línea | Uso |
|---------|-------|-----|
| src/lib/AuthContext.jsx | 91, 210, 245, 267, 275, 334, 353, 367 | Estado y context |
| src/pages/DevDiagnostics.jsx | 11, 32 | Diagnóstico |

### user == null / !user?.id
| Archivo | Línea | Decisión |
|---------|-------|----------|
| src/App.jsx | 20 | AuthRouter: si !user?.id → Login |

### signOut
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/AuthContext.jsx | 337 | logout |

### clearSupabaseAuthStorage
| Archivo | Línea | Función |
|---------|-------|---------|
| src/lib/AuthContext.jsx | 338 | logout |
| src/lib/supabaseClient.js | 85 | definición |

### localStorage (auth)
Supabase usa storage. En Capacitor: Preferences, no localStorage. localStorage solo en otros módulos (demo, etc.).

### Preferences
| Archivo | Línea | Uso |
|---------|-------|-----|
| src/lib/supabaseClient.js | 9, 15, 19, 22, 33, 87-90 | capacitorStorage, clearSupabaseAuthStorage |

---

## 2. CONFIRMACIÓN DE HALLAZGOS

### oauthCapture.js es el único procesador de callback
**SÍ.** Solo oauthCapture.js registra appUrlOpen y getLaunchUrl. App.jsx no procesa URLs OAuth.

### App.jsx redirige a login
**NO directamente.** App.jsx no llama navigate('/login'). AuthRouter muestra Login cuando `!user?.id`. La "redirección" a login es: AuthContext tiene user=null → AuthRouter renderiza Login.

### AuthContext marca loading/user/profile en qué orden
1. useState init: user, profile, isAuthenticated, isLoadingAuth
2. useEffect: resolveSession() → getSession → getUser → ensureUserInDb → setUser, setProfile, setIsAuthenticated
3. onAuthStateChange: SIGNED_IN/TOKEN_REFRESHED → setUser, setProfile, setIsAuthenticated

### ¿Existe carrera entre App y AuthContext?
**Posible.** Secuencia:
1. oauthCapture procesa URL → exchangeCodeForSession → dispatch waitme:oauth-complete
2. App escucha waitme:oauth-complete → checkUserAuth() (que es resolveSession) + navigate('/')
3. AuthContext onAuthStateChange puede dispararse por exchangeCodeForSession
4. Si checkUserAuth() y onAuthStateChange corren en paralelo, authInFlightRef puede causar que uno se salte
5. resolveSession hace getSession; onAuthStateChange hace setUser. Ambos actualizan estado. Si hay race, isLoadingAuth podría quedar true o user null momentáneamente.

### Punto crítico: isDevAutoLogin
En **build de producción** (ios:fresh): import.meta.env.DEV = false → isDev = false → AuthContext usa flujo real.
En **npm run dev**: DEV = true, isDevBypassAuth = false por defecto → isDev = true → AuthContext **SALTA** todo el useEffect (early return línea 226-228) y usa mock user. Para probar login real en dev hay que usar VITE_DEV_BYPASS_AUTH=true.

---

## 3. CADENA QUE DEBE FUNCIONAR

```
callback URL (appUrlOpen o getLaunchUrl)
  → processOAuthUrl (oauthCapture.js)
  → exchangeCodeForSession / setSession
  → sesión guardada en Preferences (Supabase storage)
  → waitme:oauth-complete dispatched
  → App: checkUserAuth (resolveSession) + navigate('/')
  → AuthContext: resolveSession → getSession → setUser
  → AuthRouter: user?.id → Layout (Home)
  → persistencia: al reabrir, resolveSession + getSession restauran
```

**Eslabones donde puede romperse:**
1. URL no llega (appUrlOpen/getLaunchUrl vacíos)
2. exchangeCodeForSession falla
3. Sesión no se persiste en Preferences
4. resolveSession no ve la sesión (timing)
5. onAuthStateChange no dispara o se ignora
6. authInFlightRef bloquea
7. navigate('/') pero user sigue null en siguiente render
