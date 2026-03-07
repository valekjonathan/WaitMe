# Integraciones externas

El repo **no dispara** migraciones Supabase. Esas integraciones viven en servicios externos.

| Servicio | Dónde se configura | Qué dispara emails |
|----------|-------------------|---------------------|
| Supabase Migrations | Integración GitHub en Supabase | Migraciones fallidas |
| Vercel | Deploy automático al push | Build fallido |
| GitHub CI | .github/workflows/ci.yml | Job fallido (corregido: Chromium) |
