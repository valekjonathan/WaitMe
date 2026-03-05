# Configuración de GitHub Secrets para workflows

Valores detectados del proyecto y dónde copiarlos para cada secret.

---

## Valores detectados

| Variable | Detectado en proyecto |
|----------|------------------------|
| `VITE_SUPABASE_URL` | Sí (en `.env`) |
| `VITE_SUPABASE_ANON_KEY` | Sí (en `.env`) |
| `VITE_MAPBOX_TOKEN` | En `.env.example` como placeholder |
| Project Ref | `acfzelpmvdmeszaqlokd` (extraído de `VITE_SUPABASE_URL` en `.env`) |
| `project_id` en config | `WaitMeNuevo` (supabase/config.toml — identificador local, no es el ref de Supabase Cloud) |

---

## Secrets a configurar

Ir a **Settings → Secrets and variables → Actions** y crear cada secret:

### 1. SUPABASE_ACCESS_TOKEN

**Qué copiar:** Token de acceso a la API de Supabase.

**Dónde obtenerlo:**
1. [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Crear un token nuevo
3. Copiar el valor (solo se muestra una vez)

---

### 2. SUPABASE_PROJECT_REF

**Qué copiar:** `acfzelpmvdmeszaqlokd`

**Dónde obtenerlo:**
- **Opción A:** Copiar el valor anterior (detectado de tu `VITE_SUPABASE_URL`)
- **Opción B:** Supabase Dashboard → Project Settings → General → Reference ID
- **Opción C:** Si tienes `VITE_SUPABASE_URL` en `.env`, el ref es la parte antes de `.supabase.co`  
  Ejemplo: `https://acfzelpmvdmeszaqlokd.supabase.co` → ref = `acfzelpmvdmeszaqlokd`

---

### 3. VITE_SUPABASE_URL

**Qué copiar:** El valor de `VITE_SUPABASE_URL` de tu archivo `.env`.

**Dónde obtenerlo:**
- **Opción A:** Copiar de tu `.env` local
- **Opción B:** Supabase Dashboard → Project Settings → API → Project URL  
  Formato: `https://<PROJECT_REF>.supabase.co`

---

### 4. VITE_SUPABASE_ANON_KEY

**Qué copiar:** El valor de `VITE_SUPABASE_ANON_KEY` de tu archivo `.env`.

**Dónde obtenerlo:**
- **Opción A:** Copiar de tu `.env` local
- **Opción B:** Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

---

### 5. VITE_MAPBOX_TOKEN

**Qué copiar:** Token público de Mapbox (empieza por `pk.`).

**Dónde obtenerlo:**
- **Opción A:** Copiar de tu `.env` si ya lo tienes configurado
- **Opción B:** [Mapbox Account](https://account.mapbox.com/) → Access tokens → Default public token o crear uno nuevo

---

## Resumen rápido

| Secret | Valor a copiar |
|--------|----------------|
| `SUPABASE_ACCESS_TOKEN` | Token de [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | `acfzelpmvdmeszaqlokd` (o el ref de tu proyecto) |
| `VITE_SUPABASE_URL` | De `.env` o Dashboard → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | De `.env` o Dashboard → API → anon public |
| `VITE_MAPBOX_TOKEN` | De `.env` o [Mapbox Access Tokens](https://account.mapbox.com/access-tokens/) |

---

## Verificación

Tras configurar los secrets:
1. **Supabase Migrations:** push a `main` o ejecutar manualmente el workflow
2. **Tests:** push a `main` o abrir un PR para que se ejecuten los tests de Playwright
