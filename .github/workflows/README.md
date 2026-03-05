# Workflows deshabilitados temporalmente

Los workflows de GitHub Actions (CI, Supabase, CodeQL) están deshabilitados para evitar emails de "Run failed".

Se han movido a `.github/workflows_disabled/` — GitHub solo ejecuta YAML dentro de `.github/workflows/`, por lo que no se dispararán automáticamente.

Para reactivarlos: mover los archivos de vuelta a `.github/workflows/`.
