# Árbol real del proyecto WaitMe — Snapshot actual

**Fecha:** 2025-03-07  
**ZIP:** `tmp/waitme-full-audit-snapshot.zip`

---

## Árbol de carpetas (src, docs, quarantine)

```
WaitMenuevo/
├── src/
│   ├── App.jsx
│   ├── Layout.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── globals.css
│   ├── types/
│   │   └── global.d.ts
│   ├── config/
│   │   └── alerts.js
│   ├── core/
│   │   └── ErrorBoundary.jsx
│   ├── diagnostics/
│   │   ├── SafeModeShell.jsx
│   │   └── MissingEnvScreen.jsx
│   ├── dev/
│   │   ├── diagnostics.js
│   │   └── layoutInspector.js
│   ├── lib/
│   │   ├── AuthContext.jsx
│   │   ├── LayoutContext.jsx
│   │   ├── supabaseClient.js
│   │   ├── alertsQueryKey.js
│   │   ├── alertSelectors.js
│   │   ├── finalizedAtStore.js
│   │   ├── geohash.js
│   │   ├── mapLayoutPadding.js
│   │   ├── mockNavigateCars.js
│   │   ├── mockNearby.js
│   │   ├── mockOviedoAlerts.js
│   │   ├── profile.ts
│   │   ├── sentry.js
│   │   ├── transactionEngine.js
│   │   ├── utils.js
│   │   ├── vehicleIcons.js
│   │   └── waitmeRequests.js
│   ├── data/
│   │   ├── alerts.js
│   │   ├── chat.js
│   │   ├── notifications.js
│   │   ├── profiles.js
│   │   ├── transactions.js
│   │   ├── uploads.js
│   │   └── userLocations.js
│   ├── services/
│   │   ├── alertsSupabase.js
│   │   ├── chatSupabase.js
│   │   ├── notificationsSupabase.js
│   │   ├── profilesSupabase.js
│   │   ├── transactionsSupabase.js
│   │   ├── uploadsSupabase.js
│   │   └── userLocationsSupabase.js
│   ├── hooks/
│   │   ├── useArrivingAnimation.js
│   │   ├── useMyAlerts.js
│   │   └── useProfileGuard.ts
│   ├── components/
│   │   ├── AddressAutocompleteInput.jsx
│   │   ├── BottomNav.jsx
│   │   ├── CenterPin.jsx
│   │   ├── CreateMapOverlay.jsx
│   │   ├── CreateMapOverlay.stories.jsx
│   │   ├── DemoFlowManager.jsx
│   │   ├── Header.jsx
│   │   ├── IncomingRequestModal.jsx
│   │   ├── Logo.jsx
│   │   ├── MapboxMap.jsx
│   │   ├── MapZoomControls.jsx
│   │   ├── MapZoomControls.stories.jsx
│   │   ├── SearchMapOverlay.jsx
│   │   ├── SellerLocationTracker.jsx
│   │   ├── StreetSearch.jsx
│   │   ├── WaitMeRequestScheduler.jsx
│   │   ├── cards/
│   │   │   ├── CreateAlertCard.jsx
│   │   │   ├── CreateAlertCard.stories.jsx
│   │   │   ├── MarcoCard.jsx
│   │   │   └── UserAlertCard.jsx
│   │   ├── map/
│   │   │   ├── MapFilters.jsx
│   │   │   └── ParkingMap.jsx
│   │   └── ui/
│   │       ├── badge.jsx
│   │       ├── button.jsx
│   │       ├── dialog.jsx
│   │       ├── input.jsx
│   │       ├── label.jsx
│   │       ├── select.jsx
│   │       ├── slider.jsx
│   │       ├── switch.jsx
│   │       ├── tabs.jsx
│   │       └── use-toast.jsx
│   ├── system/
│   │   ├── layout/
│   │   │   ├── AppDeviceFrame.jsx
│   │   │   ├── BottomNavLayer.jsx
│   │   │   ├── MapLayer.jsx
│   │   │   ├── OverlayLayer.jsx
│   │   │   └── index.js
│   │   └── map/
│   │       ├── MapScreenPanel.jsx
│   │       ├── MapViewportShell.jsx
│   │       └── index.js
│   ├── pages/
│   │   ├── Chat.jsx
│   │   ├── Chats.jsx
│   │   ├── DevDiagnostics.jsx
│   │   ├── History.jsx
│   │   ├── HistoryBuyerView.jsx
│   │   ├── HistorySellerView.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Navigate.jsx
│   │   ├── NotificationSettings.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── assets/
│   │   ├── d2ae993d3_WaitMe.png
│   │   └── react.svg
│   └── styles/
│       └── no-zoom.css
├── docs/
│   ├── (60+ archivos .md)
│   └── audit-icono/
├── quarantine/
│   ├── README.md
│   ├── realtime/
│   │   ├── alertsRealtime.js
│   │   ├── appStore.js
│   │   └── useRealtimeAlerts.js
│   ├── components/
│   │   ├── ActiveAlertCard.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── UserNotRegisteredError.jsx
│   ├── hooks/
│   │   ├── useAlertsQuery.js
│   │   ├── useDebouncedSave.js
│   │   ├── use-mobile.jsx
│   │   └── useMapMatch.js
│   ├── lib/
│   │   ├── logger.js
│   │   ├── PageNotFound.jsx
│   │   ├── query-client.js
│   │   └── maps/
│   │       ├── carUtils.js
│   │       ├── mapConstants.js
│   │       └── mapMarkers.js
│   ├── services/
│   │   └── alertService.js
│   ├── github-workflows/
│   │   ├── README.md
│   │   └── ci.yml
│   └── pages.config.js
├── ios/
├── functions/
├── tmp/
│   └── waitme-audit-snapshot.zip
└── (config: package.json, vite.config, etc.)
```

---

## Pantallas principales

| Pantalla | Archivo | Ruta |
|----------|---------|------|
| Home | Home.jsx | /, /home |
| History | History.jsx | /history, /alertas |
| Chats | Chats.jsx | /chats |
| Chat | Chat.jsx | /chat, /chat/:id |
| Notifications | Notifications.jsx | /notifications |
| Profile | Profile.jsx | /profile |
| Settings | Settings.jsx | /settings |
| Navigate | Navigate.jsx | /navigate |
| Login | Login.jsx | (auth flow) |

---

## Componentes de mapa (Home)

| Componente | Función |
|------------|---------|
| MapboxMap | Mapa Mapbox GL JS |
| MapViewportShell | Viewport del mapa |
| MapLayer | Capa absoluta del mapa |
| OverlayLayer | Capa de overlays |
| CreateMapOverlay | Overlay "Estoy aparcado aquí" |
| SearchMapOverlay | Overlay "¿Dónde quieres aparcar?" |
| MapScreenPanel | Tarjeta flotante |
| CenterPin | Pin centrado (palito + bolita) |
| MapZoomControls | Botones +/- |

---

## Hooks

| Hook | Uso |
|------|-----|
| useProfileGuard | Guard de perfil |
| useMyAlerts | Alertas del usuario |
| useArrivingAnimation | Animación de llegada |

---

## Scripts (package.json)

- `dev` — Vite dev server
- `build` — Build producción
- `test` — Vitest
- `lint` — ESLint
- `typecheck` — tsc

---

## Tests

- Vitest en `*.test.js`, `*.spec.js`
- Storybook en `*.stories.jsx`

---

## Quarantine

Código desactivado o migrado:
- realtime, components, hooks, lib, services, github-workflows
