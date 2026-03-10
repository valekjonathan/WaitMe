# Project Guard Rails — WaitMe

Protección de áreas críticas frente a cambios accidentales por Cursor, ChatGPT o desarrolladores.

---

## CRITICAL FILES — DO NOT MODIFY

- `src/pages/Home.jsx`
- `src/components/MapboxMap.jsx`
- `src/components/map/ParkingMap.jsx`
- `src/components/cards/CreateAlertCard.jsx`

---

## CRITICAL SYSTEMS

- map engine
- payment logic
- waitme transaction flow
- core business logic

---

## RULES

1. **Never modify map behaviour** unless task explicitly says MAP
2. **Never change Home.jsx** unless explicitly requested
3. **Never modify payment logic** in infrastructure tasks
4. **Infrastructure changes must not touch UI**
5. **One technical problem at a time**
6. **Always update devcontext** after infra changes
7. **Never auto-commit app code** under an infrastructure-only task

---

## AUTO-COMMIT SCOPE

Solo se hace commit automático de:

- `devcontext/*`
- `docs/*`
- `PROJECT_GUARDRAILS.md`

Nunca: `src/`, map, UI, payments, business logic.

---

## REFERENCE

Ver `docs/AUTOMATION_ARCHITECTURE.md` para el pipeline y `devcontext/STATE_OF_TRUTH.json` para estado actual.
