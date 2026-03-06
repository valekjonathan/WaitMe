# Auditoría final — Icono iOS WaitMe

**Fecha:** 2025-03-06  
**Objetivo:** Corregir el marco negro extra alrededor del icono iOS.

---

## 1. Causa exacta

El script anterior:
1. Extraía la región del icono (230, 0, 563, 563) que incluía **negro del asset** alrededor del badge.
2. **Componía** ese recorte sobre un **canvas negro 180×180**.
3. Resultado: doble marco negro — el del asset + el del canvas.

---

## 2. Archivo fuente usado

| Campo | Valor |
|-------|-------|
| **Archivo** | `src/assets/d2ae993d3_WaitMe.png` |
| **Dimensiones** | 1024 × 1024 px |
| **Uso en Home** | `<img src={appLogo} />` (línea 841) |

---

## 3. Recorte exacto aplicado

| Parámetro | Valor |
|-----------|-------|
| **left** | 272 |
| **top** | 40 |
| **width** | 480 |
| **height** | 480 |

Región `(272, 40, 480, 480)` — cuadrado centrado que contiene solo el badge cristal, minimizando el negro del asset.

**Pipeline:**
1. `extract(272, 40, 480, 480)` — solo el badge.
2. `resize(180, 180, { fit: 'fill' })` — escala directa a 180×180.
3. `removeAlpha()` — sin transparencia.
4. **Sin canvas negro** — el badge es el icono completo.

---

## 4. Qué se ve en /apple-touch-icon.png

- Cuadrado cristal (badge con efecto cristal) ocupando prácticamente todo el icono.
- Flechas moradas y cuadrado blanco centrados.
- Sin marco negro extra.
- Sin texto.
- 180×180 px, PNG RGB, sin alpha.

---

## 5. Validación

| Check | Estado |
|-------|--------|
| index.html `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />` | OK |
| HTTP 200 en `/apple-touch-icon.png` | OK |
| 180×180, sin alpha | OK |

---

## 6. Archivos tocados

- `scripts/generate-apple-touch-icon.mjs` — nuevo recorte, sin canvas negro.
- `public/apple-touch-icon.png` — icono regenerado.

## 7. Archivos NO tocados

- Home.jsx
- index.html
- manifest.json
- Cualquier lógica o UI
