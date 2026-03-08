# Workflows WaitMe — Prompts reutilizables

Prompts listos para pegar en Cursor. Copiar el bloque completo y adaptar si hace falta.

---

## 1. Auditoría exhaustiva

```
Haz una auditoría exhaustiva del proyecto WaitMe siguiendo docs/AUDITORIA_EXHAUSTIVA_FINAL.md y docs/CURSOR_RULES_WAITME.md. Incluye:
- Estado de migración Supabase por dominio
- Restos de base44 o código muerto
- Archivos sin uso
- Riesgos de arquitectura
- Validación de CI/CD
Entregar informe en docs/ y resumen en chat. No tocar Home.jsx ni cambiar visuales.
```

---

## 2. Arreglar mapa

```
El mapa no se renderiza correctamente en [simulador / build local / preview]. Sigue docs/MAP_DEBUG_CHECKLIST.md:
1. Verificar token Mapbox en .env
2. Revisar contenedor del mapa (altura, z-index)
3. Comprobar MapboxMap.jsx y ParkingMap.jsx
4. Aplicar solo fixes seguros. No cambiar diseño visual.
Documentar cambios y prueba recomendada.
```

---

## 3. Revisar migración Supabase

```
Revisa que todos los dominios (auth, profiles, alertas, chat, notificaciones, transacciones, uploads, user_locations) usen solo Supabase. Verifica:
- src/data/*.js delegan a servicios Supabase
- No hay imports de base44 ni mocks sustituyendo flujos reales
- Tablas en supabase/migrations coinciden con uso
Entregar veredicto por dominio: migrado / parcial / no migrado.
```

---

## 4. Limpieza de archivos muertos

```
Detecta archivos muertos, componentes duplicados y código sin uso en WaitMe. Clasifica como:
- borrar ya
- mantener temporalmente
- refactorizar después
No borrar sin confirmar que ningún import los referencia. No tocar Home.jsx, History.jsx ni flujos críticos.
```

---

## 5. Cambio visual seguro

```
Quiero cambiar [descripción exacta del cambio visual]. Aplica siguiendo docs/SAFE_CHANGE_PROTOCOL.md:
- Qué archivos se van a tocar
- Impacto esperado
- Forma de validación
Solo modificar lo estrictamente necesario. Mantener mobile-first.
```

---

## 6. Revisión antes de push

```
Antes de hacer push, revisa:
- Lint y build pasan
- No se han tocado Home.jsx, History.jsx ni mapas sin necesidad
- Cambios documentados
- No hay duplicidad de servicios/hooks
Lista archivos modificados y su propósito.
```

---

## 7. Validación de CI/CD

```
Revisa la configuración de CI/CD de WaitMe:
- .github/workflows/ activos
- Secrets documentados en docs/CI_SETUP.md
- Scripts de package.json (lint, build, test)
- Si algo falla, proponer fix sin romper el pipeline
```
