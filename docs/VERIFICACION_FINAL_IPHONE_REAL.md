# Verificación Final — iPhone Físico Real

**Fecha:** 2025-03-06

---

## 1. Info.plist — NSLocalNetworkUsageDescription

| Verificación | Estado |
|--------------|--------|
| Clave presente | ✓ `ios/App/App/Info.plist` líneas 49-50 |
| Texto | "WaitMe necesita acceso a la red local para cargar la app desde el servidor de desarrollo en tu Mac." |
| Integración en proyecto | ✓ `project.pbxproj` referencia `INFOPLIST_FILE = App/Info.plist` |

---

## 2. vite.config.js

| Parámetro | Valor | Estado |
|-----------|-------|--------|
| host | true | ✓ |
| port | 5173 | ✓ |
| strictPort | true | ✓ |

---

## 3. scripts/dev-ios.sh

| Verificación | Estado |
|--------------|--------|
| Imprime IP detectada | ✓ |
| Imprime puerto | ✓ |
| Imprime URL exacta | ✓ |
| Aborta si 5173 ocupado | ✓ |
| Ejecuta cap copy ios antes de cap run | ✓ |

---

## 4. Validación real ejecutada

| Prueba | Resultado |
|--------|-----------|
| `node scripts/get-ip.js` | 192.168.0.15 |
| Puerto 5173 libre | ✓ |
| `bash scripts/dev-ios.sh` (flujo completo) | IP, puerto, URL impresos; cap copy OK; Vite arranca |
| Vite escucha en 0.0.0.0:5173 | ✓ (Network: http://192.168.0.15:5173/) |
| `curl http://127.0.0.1:5173/` | 200 |
| `curl http://192.168.0.15:5173/` | 200 |
| capacitor.config.json en ios/App/App/ | server.url: http://192.168.0.15:5173 ✓ |

---

## 5. URL exacta que debe usar el iPhone

```
http://192.168.0.15:5173
```

*(La IP puede variar según la red WiFi; el script la imprime al ejecutar `npm run dev:ios`.)*

---

## 6. Reinstalación de la app en el iPhone

**Sí, hace falta reinstalar o al menos recompilar** si la app se instaló antes de añadir `NSLocalNetworkUsageDescription`:

1. **Borrar la app** del iPhone (mantener pulsado → Eliminar app).
2. Ejecutar `npm run dev:ios` de nuevo.
3. Cuando la app se instale, iOS mostrará el diálogo "Red local" la primera vez que intente conectar.
4. Pulsar **Permitir**.

Si la app ya estaba instalada con la clave en Info.plist pero el usuario denegó el permiso, ir a Ajustes → Privacidad y seguridad → Red local → Activar WaitMe.
