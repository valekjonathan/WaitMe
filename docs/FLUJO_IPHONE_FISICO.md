# Flujo iPhone Físico — WaitMe

**Objetivo:** Que el iPhone físico cargue la app con live reload usando el mismo servidor que web y Simulator.

---

## 1. Orden oficial

```bash
npm run dev:ios
```

Este comando:
1. Comprueba que el puerto 5173 está libre (falla si no)
2. Detecta la IP local del Mac
3. Sincroniza la config de Capacitor a iOS
4. Arranca Vite en 0.0.0.0:5173
5. Lanza la app iOS apuntando a la IP del Mac

---

## 2. URL que debe usar el iPhone

La URL exacta se muestra al ejecutar `npm run dev:ios`, por ejemplo:

```
URL iPhone:     http://192.168.1.42:5173
```

El iPhone carga la app desde esa URL. **Debe coincidir** con la IP que muestra el script.

---

## 3. Permiso "Red local" en iPhone

iOS 14+ pide permiso para acceder a la red local. Si se deniega, el iPhone no puede conectar con el Mac.

**Comprobar:**
1. Ajustes → Privacidad y seguridad → Red local
2. Buscar "WaitMe" en la lista
3. Activar el permiso si está desactivado

Si la app no aparece, ábrela una vez; iOS mostrará el aviso la primera vez que intente conectar.

---

## 4. Misma red WiFi

El iPhone y el Mac deben estar en la **misma red WiFi**.

**Comprobar:**
- Mac: Preferencias del Sistema → Red → WiFi → Ver IP (ej. 192.168.1.42)
- iPhone: Ajustes → WiFi → (i) en la red → Dirección IP (ej. 192.168.1.xx)
- Las IP deben ser del mismo rango (ej. 192.168.1.x)

**No funciona:**
- iPhone en datos móviles
- iPhone en otra WiFi (invitado, 5G, etc.)
- Mac por cable, iPhone por WiFi en otra red

---

## 5. Firewall y puerto

**macOS Firewall:**
1. Preferencias del Sistema → Red → Firewall
2. Si está activo, comprobar que permite conexiones entrantes para "node" o "Vite"
3. O desactivar temporalmente para probar

**Puerto 5173 ocupado:**
- El script falla con: `ERROR: El puerto 5173 está ocupado`
- Solución: cerrar el proceso que usa 5173 o usar `lsof -i :5173` para verlo

---

## 6. Resumen de comprobaciones

| Problema | Comprobación |
|----------|--------------|
| Puerto ocupado | El script muestra error al iniciar |
| Sin IP | El script falla con mensaje de get-ip |
| Red local denegada | Ajustes → Privacidad → Red local → WaitMe |
| Redes distintas | Misma WiFi en Mac e iPhone |
| Firewall | Permitir node/vite o desactivar temporalmente |
