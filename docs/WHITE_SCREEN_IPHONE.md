# Pantalla blanca en iPhone físico — Causa y solución

## Causa raíz

La app instalada con **waitme:visual** o **waitme:install** usa `server.url` apuntando al dev server (ej. `http://192.168.x.x:5173`). Si abres la app cuando:

- El dev server no está corriendo
- El Mac y el iPhone no están en la misma red
- La IP del Mac ha cambiado

→ **Pantalla blanca**: el WebView intenta cargar desde una URL inalcanzable.

## Solución

Para usar la app en iPhone **sin** dev server (modo standalone):

1. Ejecuta: **Tasks → WaitMe: REAL DEVICE MODE** (o `npm run waitme:iphone`)
2. Espera a que abra Xcode
3. En Xcode: selecciona tu iPhone físico en el selector de dispositivos
4. Pulsa **Run** (▶)

Eso genera un build limpio con bundle local (sin `server.url`) e instala la app correcta. La app anterior (de modo visual) queda sobrescrita.

## Verificación

Tras `npm run waitme:iphone`, el archivo `ios/App/App/capacitor.config.json` **no** debe contener la clave `"server"`. Si la contiene, el script falla con error explícito.
