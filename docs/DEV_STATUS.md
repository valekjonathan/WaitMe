# Estado Global del Proyecto — WaitMe

**Última actualización:** 2026-03-09 18:30

---

## Estado real del simulador (reportado por usuario)

| Estado | Observado |
|--------|-----------|
| Cargando... | A veces |
| Error cargando WaitMe | A veces |
| Login | A veces (captura 18:29) |
| Home | Pendiente |

**Comportamiento inconsistente.** No afirmar "Login correcto" ni "crash corregido" sin verificar.

---

## Verificación de build nueva

- **Marcador:** WAITME RUNTIME CHECK — BUILD: HH:MM:SS (parte inferior en App.jsx)
- **Condición:** VITE_IOS_DEV_BUILD=1 (ios:refresh lo usa)
- **Si aparece el marcador:** simulador ejecuta build nueva
- **Si no aparece:** posible build vieja o caché

---

## ios-refresh.sh (verificado)

1. terminate
2. uninstall
3. rm -rf dist
4. VITE_IOS_DEV_BUILD=1 npm run build
5. npx cap sync ios
6. npx cap run ios --target=UUID
7. xcrun simctl launch booted com.waitme.app

---

## Rutas evidencia

- devcontext/latest-simulator.png
- devcontext/latest-auth-log.txt
- devcontext/latest-ios-refresh-log.txt
