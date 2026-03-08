# Auditoría icono iOS PWA — WaitMe

**Fecha:** 2025-03-06  
**Objetivo:** Identificar por qué `/apple-touch-icon.png` muestra solo el símbolo y no el logo completo de Home.

---

## 1. Archivo usado por Home.jsx

| Campo | Valor |
|-------|-------|
| **Archivo** | `src/assets/d2ae993d3_WaitMe.png` |
| **Import** | `import appLogo from '@/assets/d2ae993d3_WaitMe.png'` |
| **Uso** | `<img src={appLogo} width={212} height={212} ... />` (línea 835-841) |

**Importante:** Home.jsx renderiza el texto "WaitMe!" en un `<h1>` separado (línea 847-849) con `mt-[-38px]`, superpuesto visualmente debajo de la imagen. El usuario ve imagen + texto como un solo logo, pero la imagen y el texto son elementos distintos.

---

## 2. Contenido real del asset fuente

| Aspecto | Valor |
|---------|-------|
| **Dimensiones** | 1024 × 1024 px |
| **Formato** | PNG RGBA (hasAlpha: yes) |
| **Estructura** | Composición vertical en dos zonas |

### Estructura del PNG (1024×1024)

| Zona | Altura aprox. | Contenido |
|------|----------------|-----------|
| **Superior** | ~55% (0–563 px) | Icono cuadrado con efecto cristal: flechas moradas + cuadrado blanco. **Sin texto.** |
| **Inferior** | ~45% (563–1024 px) | Texto "WaitMe!" (blanco + morado). **Sin símbolo.** |

**Conclusión:** El asset contiene **icono + texto** en disposición vertical. El logo completo = icono (arriba) + texto (abajo).

---

## 3. Análisis del icono actual (`public/apple-touch-icon.png`)

| Campo | Valor |
|-------|-------|
| **Dimensiones** | 180 × 180 px |
| **Formato** | PNG RGB (sin alpha) |
| **Contenido visible** | Solo el símbolo (flechas + cuadrado blanco). **No se ve el texto "WaitMe!".** |

### Por qué no se ve el texto

1. **Escala:** El script escala el PNG completo (1024×1024) a 171×171 (95% de 180) con `fit: 'contain'`.
2. **Proporción del texto:** El texto ocupa ~45% de la altura → ~77 px en la salida.
3. **Tamaño de fuente:** En el original el texto tiene ~150–200 px de alto; al escalar a 77 px la tipografía queda muy pequeña.
4. **Resultado:** El texto existe en el PNG generado, pero es prácticamente ilegible en 180×180, por lo que se percibe como “solo símbolo”.

---

## 4. Análisis del script `scripts/generate-apple-touch-icon.mjs`

| Paso | Comportamiento |
|------|----------------|
| 1 | Lee `src/assets/d2ae993d3_WaitMe.png` (1024×1024) |
| 2 | Redimensiona a 171×171 con `fit: 'contain'` (imagen completa) |
| 3 | Compone sobre canvas 180×180 negro con padding ~4–5 px |
| 4 | Elimina alpha y guarda |

**Problemas:**

1. Usa el logo completo (icono + texto) en un espacio muy pequeño.
2. El texto se reduce demasiado y deja de ser legible.
3. El icono cuadrado queda con padding innecesario.
4. No se aprovecha bien el espacio útil para un icono iOS.

---

## 5. Recomendación: usar solo la parte cuadrada del logo

Para un icono iOS 180×180:

- El logo completo (icono + texto) es demasiado vertical y el texto no escala bien.
- La parte cuadrada del logo (icono con efecto cristal) es la que el usuario identifica en Home.
- Es la misma zona que Home muestra en la imagen (sin el `<h1>` superpuesto).

**Solución:** Extraer solo la región cuadrada del icono (parte superior del asset) y escalarla para ocupar prácticamente todo el 180×180.

### Región a extraer

- **Origen:** `src/assets/d2ae993d3_WaitMe.png`
- **Región:** Cuadrado centrado en la mitad superior (icono con efecto cristal).
- **Coordenadas:** `left: 230, top: 0, width: 563, height: 563` (aprox. 55% superior, centrado).
- **Salida:** 180×180, fondo negro, sin transparencia, sin padding extra.

---

## 6. Pruebas visuales

| Archivo | Descripción |
|---------|-------------|
| `tmp/audit-icono/source-d2ae993d3_WaitMe.png` | Asset fuente completo |
| `tmp/audit-icono/current-apple-touch-icon.png` | Icono actual (solo símbolo visible) |
| `tmp/audit-icono/crop-top-icon.png` | Zona superior (icono) |
| `tmp/audit-icono/crop-bottom-text.png` | Zona inferior (texto) |
| `tmp/audit-icono/icon-only-square.png` | Cuadrado extraído del icono |

---

## 7. Validación

1. **index.html:** Contiene  
   `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`
2. **URL:** Con `npm run dev`, abrir `http://localhost:5173/apple-touch-icon.png`.
3. **Resultado:** Icono cuadrado con efecto cristal (flechas moradas + cuadrado blanco) ocupando el 100% del área útil. Sin texto (por decisión de diseño: el logo completo no escala bien a 180×180).

---

## 8. Corrección aplicada (FASE 2)

| Antes | Después |
|------|---------|
| Escalaba el asset completo (icono+texto) a 95% | Extrae solo la región del icono (top 55%, centrada) |
| Texto ilegible por escala | Sin texto; icono cuadrado correcto |
| Padding innecesario | Icono ocupa 100% del canvas |
| `fit: 'contain'` en 171×171 | `fit: 'fill'` en 180×180 |

**Script actualizado:** `scripts/generate-apple-touch-icon.mjs` — extrae región `(230, 0, 563, 563)` del asset, redimensiona a 180×180, compone sobre negro.
