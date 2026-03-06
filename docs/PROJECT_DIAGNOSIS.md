# Diagnóstico del proyecto WaitMe

El script `scripts/diagnose-project.js` comprueba que el proyecto esté correctamente configurado.

---

## Qué revisa el script

| Comprobación | Descripción |
|--------------|-------------|
| **Existencia de .env** | Que exista el archivo `.env` en la raíz. |
| **Variables necesarias** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN` definidas. |
| **Placeholders** | Que las variables no tengan valores placeholder (`PEGA_AQUI_EL_TOKEN`, `tu_anon_key`, etc.). |
| **Supabase** | Que la URL tenga formato Supabase y la anon key esté presente. |
| **Mapbox** | Que el token tenga formato `pk.xxx` si está configurado. |
| **Build de Vite** | Que `npm run build` complete sin errores. |
| **Estructura básica** | Que existan `src/main.jsx`, `src/App.jsx`, `src/pages/Home.jsx`, `src/lib/supabaseClient.js`, `src/data/alerts.js`, `supabase/migrations`, `vite.config.js`, `package.json`. |

---

## Cómo usarlo

```bash
npm run diagnose
```

El script imprime un informe en consola con ✓ (ok), ⚠ (advertencia) o ✗ (error).

---

## Cómo interpretar errores

| Mensaje | Acción |
|---------|--------|
| `.env no existe` | Copiar `.env.example` a `.env` y configurar las variables. |
| `VITE_SUPABASE_URL no está definida` | Añadir en `.env` la URL del proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY no está definida` | Añadir en `.env` la anon key (Project Settings → API). |
| `VITE_MAPBOX_TOKEN no está definida` | Añadir en `.env` el token de Mapbox (https://account.mapbox.com/). |
| `tiene valor placeholder` | Sustituir por el valor real. No dejar `PEGA_AQUI_EL_TOKEN` ni `tu_anon_key`. |
| `Build falla` | Ejecutar `npm run build` manualmente y revisar el error. Corregir dependencias o código. |
| `X no existe` | Verificar que el archivo o carpeta exista. Puede indicar estructura corrupta o incompleta. |

---

## Códigos de salida

- **0** — Todo OK o solo advertencias.
- **1** — Hay errores. Revisar mensajes y corregir antes de continuar.
