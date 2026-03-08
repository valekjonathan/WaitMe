# Auditoría final — Icono iOS WaitMe

**Fecha:** 2025-03-06  
**Objetivo:** Usar el badge cristal completo sin recortes.

---

## 1. Bounding box usado

| Paso | Descripción |
|------|-------------|
| **Región inicial** | Top 700px del asset `(0, 0, 1024, 700)` — contiene el badge, sin texto |
| **Trim** | `trim({ threshold: 20 })` — detecta el bounding box real eliminando negro exterior |
| **Resultado trim** | 552 × 543 px — badge con bordes cristal visibles |
| **Cuadrado centrado** | min(552, 543) = 543 px — crop cuadrado del icono completo |

---

## 2. Coordenadas de crop

| Parámetro | Valor |
|-----------|-------|
| **Paso 1** | `extract(0, 0, 1024, 700)` — región del badge |
| **Paso 2** | `trim({ threshold: 20 })` — bounding box automático |
| **Paso 3** | `extract(4, 0, 543, 543)` — cuadrado centrado del resultado trim |
| **Paso 4** | `resize(171, 171)` — 95% de 180 |
| **Paso 5** | `composite` sobre canvas 180×180 negro, offset (4, 4) |

**NO se usa porcentaje vertical fijo** — el crop se deriva del bounding box real detectado por trim.

---

## 3. Confirmación: icono NO está cortado

- Badge cristal completo visible
- Bordes cristal visibles
- Flechas moradas y cuadrado blanco sin recortes
- Centrado perfecto
- Ocupa ~95% del área (171px en 180px)

---

## 4. Confirmación visual de /apple-touch-icon.png

- Cuadrado cristal (badge con efecto cristal) completo
- Flechas moradas y cuadrado blanco centrados
- Fondo negro, sin transparencia
- 180×180 px
- HTTP 200 en `/apple-touch-icon.png`

---

## 5. Archivos tocados

- `scripts/generate-apple-touch-icon.mjs` — detección por trim, crop cuadrado centrado
- `public/apple-touch-icon.png` — icono regenerado
