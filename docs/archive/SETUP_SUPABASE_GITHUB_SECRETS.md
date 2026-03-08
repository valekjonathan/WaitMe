# Configuración de GitHub Secrets para Supabase

Esta guía configura los secrets necesarios para que GitHub Actions ejecute migraciones de Supabase.

---

## 1. Obtener el Project Reference ID

El **Project Reference ID** es un string alfanumérico (10–20 caracteres) que identifica tu proyecto en Supabase.

### Opción A: Desde el Dashboard

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (WaitMe)
3. Ve a **Project Settings** (icono engranaje) → **General**
4. Copia el **Reference ID**

### Opción B: Desde la URL del proyecto

Si tienes `VITE_SUPABASE_URL` en tu `.env`, el formato es:

```
https://<PROJECT_REF>.supabase.co
```

Ejemplo: `https://abcdefghij.supabase.co` → el Project Ref es `abcdefghij`

---

## 2. Obtener el Access Token

1. Ve a [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Crea un token nuevo (o usa uno existente)
3. Copia el token (solo se muestra una vez)

---

## 3. Obtener la contraseña de la base de datos

1. En el Dashboard: **Project Settings** → **Database**
2. Si no la recuerdas: **Reset database password** (genera una nueva)
3. Guarda la contraseña de forma segura

---

## 4. Secrets requeridos en GitHub

| Secret | Descripción | Dónde obtenerlo |
|--------|-------------|-----------------|
| `SUPABASE_ACCESS_TOKEN` | Token de la cuenta Supabase | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | ID del proyecto | Project Settings → General → Reference ID |
| `SUPABASE_DB_PASSWORD` | Contraseña de Postgres | Project Settings → Database |

---

## 5. Configuración manual (GitHub UI)

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** para cada uno:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`

---

## 6. Configuración automática (GitHub CLI)

Si tienes [GitHub CLI](https://cli.github.com/) instalado y autenticado:

```bash
./scripts/configure-supabase-secrets.sh
```

O manualmente:

```bash
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_REF
gh secret set SUPABASE_DB_PASSWORD
```

(Te pedirá el valor de cada uno de forma segura)

---

## 7. Verificar

Tras configurar los secrets:

1. Haz un cambio en `supabase/migrations/` y push a `main`
2. O ejecuta el workflow manualmente: **Actions** → **Supabase Migrations** → **Run workflow**
3. Revisa que el job `migrate` termine correctamente

---

## Nota

Todos los workflows usan **`SUPABASE_PROJECT_REF`** como nombre del secret del project ID.
