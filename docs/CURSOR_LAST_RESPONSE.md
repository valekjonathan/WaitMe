# Cursor Last Response

**timestamp:** 2026-03-10 16:06

---

## task_objective

Restaurar Alertas visualmente. Auditoría maestra de paridad simulador vs iPhone. Corregir causa raíz y documentar.

---

## root_cause_bloque_bajo_iphone

- **Causa:** Safe areas asimétricas (notch/Dynamic Island): `--header-h` > `--bottom-nav-h` en iPhone → el centro geométrico del overlay queda ~12px más abajo que en simulador.
- **Solución:** `transform: translateY(calc(-0.5 * (var(--header-h) - var(--bottom-nav-h))))` en el contenedor del contenido del overlay Home para compensar y centrar visualmente en el viewport.

---

## files_modified

- src/pages/HistorySellerView.jsx — eliminado showCta de empty state Activas
- src/pages/HistoryBuyerView.jsx — eliminado showCta de empty state Activas
- src/components/history/HistoryFilters.jsx — restaurado TabsList/TabsTrigger estilo anterior (bg-gray-900 border-0, text-white)
- docs/VISUAL_PARITY_AUDIT.md — creado (auditoría completa)

---

## alertas_revertido

- CTAs eliminados de empty states (Tus alertas, Tus reservas)
- TabsList: bg-gray-900 border-0 shadow-none (antes era bg-gray-900/80 border rounded-lg)
- TabsTrigger: text-white (antes text-gray-300)
- top: var(--header-h) mantenido para paridad iPhone

---

## paridad_home_layout

- Transform compensatorio en Home overlay (ya aplicado anteriormente)
- MapScreenPanel: fórmula única bottom: calc(var(--bottom-nav-h) + 15px)
- Documentación en docs/VISUAL_PARITY_AUDIT.md

---

## validation_result

- lint: OK
- typecheck: OK
- build: OK
- waitme:state: OK

---

## blocked_areas_respected

- Pagos: NO tocado
- Login Google real: NO tocado
- Nuevas funciones: NO añadidas
- "Estoy aparcado aquí": NO tocado
- Infraestructura: NO tocada

---

## next_recommended_task

Verificar en simulador e iPhone físico que Alertas y Home coinciden visualmente.
