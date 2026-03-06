# Flujo Final — iPhone Físico Real

**Objetivo:** Que el iPhone físico cargue la app con live reload usando el mismo servidor que web y Simulator.

---

## 1. Único comando oficial

```bash
npm run dev:ios
```

Hace todo sin pasos manuales:
1. Comprueba que 5173 está libre
2. Detecta la IP del Mac
3. Sincroniza la config a iOS
4. Arranca Vite en 0.0.0.0:5173
5. Lanza la app iOS con live reload

---

## 2. URL exacta que debe abrir el iPhone

La URL se muestra al ejecutar `npm run dev:ios`:

```
URL iPhone:     http://192.168.x.x:5173
```

El iPhone carga la app desde esa URL. Debe coincidir con la IP mostrada.

---

## 3. Si WaitMe no aparece en "Red local"

**Primera vez:** Al abrir la app, iOS muestra el diálogo "WaitMe quiere encontrar y conectarse a dispositivos en tu red local". Pulsa **Permitir**.

**Si ya denegaste:** Ajustes → Privacidad y seguridad → Red local → Activar WaitMe.

**Si no aparece en la lista:** Abre la app una vez; iOS añadirá WaitMe cuando intente conectar.

---

## 4. Distinguir permiso vs URL/IP/puerto

| Síntoma | Causa probable | Comprobación |
|---------|----------------|--------------|
| Pantalla blanca, sin diálogo de permiso | Falta NSLocalNetworkUsageDescription | Ya añadido en Info.plist |
| Pantalla blanca, diálogo apareció y permitiste | URL/IP/puerto incorrectos | Ver sección 5 |
| Diálogo "Red local" nunca aparece | App no intenta conectar | Verificar que cap copy se ejecutó; misma WiFi |
| "No se puede conectar" o timeout | Firewall, red distinta, puerto ocupado | Ver sección 5 |

---

## 5. Si el puerto está ocupado

El script falla al iniciar:

```
[dev:ios] ERROR: El puerto 5173 está ocupado.
[dev:ios] Cierra el proceso que lo usa o ejecuta: lsof -i :5173
```

**Solución:** Cerrar el proceso que usa 5173 o ejecutar `lsof -i :5173` para verlo.

---

## 6. Comprobaciones de red

| Comprobación | Cómo |
|--------------|------|
| Misma WiFi | Mac e iPhone en la misma red (ej. 192.168.1.x) |
| Firewall macOS | Preferencias del Sistema → Red → Firewall; permitir node/vite o desactivar temporalmente |
| Puerto accesible | En el Mac: `curl -I http://localhost:5173` debe responder |
