# Xcode / iOS Audit — WaitMe

---

## 1. Capacitor

- **Versión:** 8.x
- **appId:** com.waitme.app
- **webDir:** dist
- **config:** capacitor.config.ts — server.url solo si CAPACITOR_USE_DEV_SERVER=true

---

## 2. iOS Runtime

- **Modo normal (ios:refresh):** Build local empaquetada, sin server.url
- **Modo dev (ios:sync:dev):** CAPACITOR_USE_DEV_SERVER=true, server.url = localhost:5173
- **ios/App/App/capacitor.config.json:** Sin clave server (verificado)

---

## 3. Bundle vs Dev Server

- **ios:refresh:** unset CAPACITOR_USE_DEV_SERVER, build, cap sync, limpia server.url con node -e
- **Resultado:** Siempre bundle local en ios:refresh
- **No hay** path que cargue localhost por defecto

---

## 4. Deep Linking

- **URL scheme:** com.waitme.app
- **Info.plist:** CFBundleURLTypes con com.waitme.app
- **Callback:** com.waitme.app://auth/callback
- **Captura:** oauthCapture.js vía appUrlOpen, getLaunchUrl

---

## 5. Simulador vs iPhone Físico

- **Simulador:** "Entrar en modo test" visible (VITE_IOS_DEV_BUILD=1), bypass passkey
- **iPhone físico:** Flujo Google normal, sin bypass
- **Misma build:** ios:refresh usa VITE_IOS_DEV_BUILD=1 para ambos

---

## 6. Producción

- Build local adecuada para producción
- Sin dependencias de localhost en runtime normal
- URL scheme listo para OAuth

---

## 7. Riesgos iOS

- Passkey en simulador — mitigado
- Validación en dispositivo real — pendiente según docs
