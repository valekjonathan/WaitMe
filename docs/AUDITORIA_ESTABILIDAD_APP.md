# Auditoría — Estabilidad de la App

**Fecha:** 2025-03-06  
**Objetivo:** Identificar fuentes de "en web se ve distinto que en iPhone" y problemas de estabilidad.

---

## A. Problemas reales detectados

| # | Problema | Impacto | Prioridad |
|---|----------|---------|-----------|
| 1 | SearchMapOverlay usaba `fixed` + valores distintos a CreateMapOverlay | Tarjeta más abajo en Simulator que en web | Alta |
| 2 | MapScreenPanel usaba `paddingBottom: 150px` hardcodeado | Gap inconsistente con --bottom-nav-h | Alta |
| 3 | MapboxMap fallback `100vh` en algunos casos | iOS Safari viewport incorrecto | Media |
| 4 | Duplicidad SearchMapOverlay vs CreateMapOverlay (geometría) | Mantenimiento, bugs visuales | Alta |
| 5 | Sin variable --header-h para overlays | Valores 60px/69px dispersos | Media |

---

## B. Impacto

- **Problema 1–2:** Usuarios ven la tarjeta en posiciones distintas según dispositivo.
- **Problema 3:** En iOS, el mapa puede no ocupar bien la pantalla.
- **Problema 4:** Cambios en un overlay no se reflejaban en el otro.
- **Problema 5:** Difícil mantener consistencia al cambiar altura del header.

---

## C. Prioridad

1. Alta: 1, 2, 4 (unificación mapa)
2. Media: 3, 5

---

## D. Arreglo propuesto (y aplicado)

| # | Arreglo | Estado |
|---|---------|--------|
| 1 | SearchMapOverlay usa `absolute` + MapScreenPanel | Hecho |
| 2 | MapScreenPanel usa `calc(var(--bottom-nav-h) + 10px)` | Hecho |
| 3 | MapboxMap solo usa `100dvh` | Hecho |
| 4 | MapViewportShell unificado; ambos overlays usan MapScreenPanel | Hecho |
| 5 | Añadido `--header-h: 69px` en globals.css | Hecho |

---

## E. Qué sí se arregló ahora

- Shell unificado (MapViewportShell)
- Misma geometría para "Dónde quieres aparcar" y "Estoy aparcado aquí"
- Eliminación de `fixed` en SearchMapOverlay
- Uso de variables CSS para header y bottom nav
- Gap tarjeta-nav consistente (10px)

---

## F. Qué no se arregló (fuera de alcance)

- Layout de otras pantallas (History, Chat, etc.) — no afectadas por el mapa
- Posibles diferencias de fuentes/rendering entre WebKit y Chrome
- Tests en dispositivo físico (requiere dispositivo conectado)

---

## G. Ramas, scripts, duplicidades

- **Ramas:** Proyecto usa `main`; no se detectaron ramas conflictivas.
- **Scripts:** `dev:ios` y `ios:dev` para live reload; `ios:run` para build completo.
- **Duplicidades de entorno:** `.env` para web; Capacitor usa el mismo build.
- **Componentes duplicados:** MapScreenShell deprecado en favor de MapViewportShell.
