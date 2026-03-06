# Protocolo de cambio seguro — WaitMe

Protocolo obligatorio antes de aplicar cambios. Reducir errores y facilitar rollback.

---

## 1. Antes de tocar código

Responder por escrito (en el chat o en un doc):

### Qué se va a tocar
- Lista exacta de archivos
- Tipo de cambio (nuevo / modificar / eliminar)

### Qué no se va a tocar
- Archivos protegidos (Home.jsx salvo orden explícita)
- Visuales no solicitados
- Flujos críticos sin necesidad

### Impacto esperado
- Qué comportamiento cambia
- Qué pantallas o flujos se ven afectados
- Riesgos conocidos

### Forma de validación
- Comando(s) para probar (ej. `npm run build`, `npm run dev`)
- Flujo manual a verificar
- Criterio de éxito

### Rollback simple si falla
- Cómo revertir (ej. `git revert`, restaurar archivo X)
- Si hay migraciones, cómo deshacerlas

---

## 2. Durante el cambio

- Hacer cambios **atómicos**: un commit por idea
- No mezclar refactors con features
- Seguir `docs/CURSOR_RULES_WAITME.md`

---

## 3. Después del cambio

- Ejecutar validación acordada
- Documentar en commit o en docs: archivos tocados, riesgos, prueba recomendada
- Si algo falla, aplicar rollback antes de seguir

---

## 4. Plantilla rápida

```
CAMBIO: [descripción breve]

TOCAR: [archivo1, archivo2, ...]
NO TOCAR: [Home.jsx, visuales, ...]

IMPACTO: [qué cambia]
VALIDACIÓN: [npm run build, probar flujo X]
ROLLBACK: [git revert / restaurar Y]
```

---

## 5. Excepciones

- Cambios triviales (typos, comentarios) no requieren protocolo completo
- Urgencias: documentar después, pero aplicar el protocolo en la medida de lo posible
