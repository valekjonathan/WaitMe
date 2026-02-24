# WaitMe — Flujo de trabajo (fuente de verdad)

## Objetivo
Trabajar desde 0 de forma profesional, con un flujo simple y sin errores.

## Reglas (obligatorias)
1) **Base44 = editor principal (fuente de verdad).**
2) **GitHub = backup + control de versiones.**
3) **Cursor = solo para refactors grandes o búsquedas masivas** (si Base44 no llega).
4) **Cada cambio**: Jeffry entrega **archivo completo** para reemplazar → se pega en Base44 → se prueba en **Vista Previa + Atlas**.
5) No se cambian aspectos visuales salvo que Jonathan lo pida explícitamente.

## Rama y estructura
- Rama única de trabajo: **main**
- No crear ramas nuevas salvo orden explícita.
- Si un cambio “no se ve”, la primera sospecha es **caché/sync**, no “otra rama”.

## Flujo de cambios (siempre igual)
1) Pedir cambio a Jeffry.
2) Jeffry responde con **archivo completo** a reemplazar.
3) Pegar en Base44 → guardar.
4) Confirmar en Base44 que aparece “Synced … from GitHub” (si aplica).
5) Refrescar Vista Previa.
6) Solo usar “Publicar” cuando sea una “versión” (no para cada cambio).

## Política de herramientas
- Base44 primero.
- GitHub para revisar histórico y tener respaldo.
- Cursor solo si hay:
  - refactor masivo multiarchivo,
  - búsquedas/renombres globales,
  - o Base44 no permite una acción concreta.

## Checklist rápido si “no se ve el cambio”
1) ¿Estás en **main**?
2) ¿Base44 muestra **Synced …**?
3) ¿Refrescaste Vista Previa?
4) ¿Hard refresh del navegador (Cmd+Shift+R)?
5) Si sigue igual: revisar que el archivo editado es el correcto.
