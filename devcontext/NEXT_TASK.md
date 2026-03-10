PROJECT: WAITME

CURRENT_STAGE:
visual_closed_product_advance

NEXT_TASK:
history_reservations_app_real

PROJECT_STATUS:
ios_runtime_fixed
automation_pipeline_active
devcontext_operational
visual_home_alertas_fixed

BLOCKED_AREAS:
map
payments
production_auth

RULES:
never_modify_map_without_explicit_instruction
one_problem_at_a_time
fix_root_causes

LAST_VISUAL_FIXES:
- Home: bloque central centrado entre header y bottom nav (flex-1 min-h-0 en contenedor)
- Alertas/History: menú superior alineado con header (top: var(--header-h))

---

## SIGUIENTE BLOQUE FUNCIONAL ELEGIDO

**Mejorar el flujo de reservas / alertas activas / finalizadas para que ya parezca app real**

### Por qué esta es la siguiente correcta

1. **Impacto inmediato:** History es el "dashboard" del usuario. Es lo primero que ven tras crear una alerta. Si se siente incompleto, la app entera se percibe así.
2. **Flujo publicar alerta ya funciona:** CreateMapOverlay + CreateAlertCard permiten crear alertas. La mejora de usabilidad ahí es incremental.
3. **Reservas/alertas = core loop:** El usuario crea alerta → va a Alertas → ve activas/finalizadas. Ese flujo debe sentirse sólido antes de pulir el create.
4. **Un solo frente:** No abrir 10 mejoras. Enfocarse en History (Tus alertas + Tus reservas) hasta que parezca app real.

### Archivos clave (NO modificar aún, solo referencia)

- `src/pages/History.jsx` — Orquestador
- `src/pages/HistorySellerView.jsx` — Tus alertas (Activas, Finalizadas)
- `src/pages/HistoryBuyerView.jsx` — Tus reservas (Activas, Finalizadas)
- `src/components/history/HistoryFilters.jsx` — Tabs Tus alertas / Tus reservas
- `src/components/historySeller/HistorySellerCard.jsx` — Tarjeta alerta seller
- `src/components/historyBuyer/HistoryBuyerCard.jsx` — Tarjeta reserva buyer

### Mejoras concretas a preparar (para siguiente sprint)

1. **Feedback visual en acciones:** Loading states en botones (cancelar, aceptar, etc.)
2. **Empty states más claros:** Mensajes que guíen al usuario (ej. "Crea tu primera alerta desde el mapa")
3. **Transiciones suaves:** AnimatePresence en listas, feedback al cancelar/aceptar
4. **Consistencia de cards:** Mismo patrón visual en seller y buyer
5. **Skeleton o placeholder** mientras carga data

### NO tocar

- map
- payments
- login Google real
- Home.jsx (ya cerrado)
- CreateAlertCard (fuera de scope de este bloque)

LAST_UPDATE: 2026-03-10T17:38:23

---

## FLUJO VISUAL UNIFICADO (NUEVO)

**Modo oficial para paridad simulador ↔ iPhone:** `npm run waitme:visual`

- Un solo arranque
- Simulador e iPhone físico ven la misma app con live reload
- Usa IP de red (192.168.x.x) para que iPhone alcance el dev server
- Acción mínima: ejecutar `npm run waitme:visual` y elegir dispositivo en el selector
