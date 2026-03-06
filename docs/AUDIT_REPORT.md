# Auditoría del proyecto WaitMe — Entorno de desarrollo

**Fecha:** 2025-03  
**Objetivo:** Flujo de desarrollo profesional que evite que cada cambio rompa otra parte de la app.

---

## 1. Herramientas ya instaladas

| Herramienta | Versión | Uso |
|--------------|---------|-----|
| **Playwright** | ^1.58.2 | E2E tests |
| **Percy** | ^5.0.0 | Visual testing (percy exec + playwright) |
| **Vitest** | ^4.0.18 | Unit/contract tests |
| **Vite** | ^6.1.0 | Build y dev server |
| **ESLint** | ^9.19.0 | Linting |
| **Prettier** | ^3.8.1 | Formateo |
| **Husky** | ^9.1.7 | Git hooks |
| **lint-staged** | ^15.4.3 | Pre-commit checks |

---

## 2. Herramientas faltantes

| Herramienta | Estado |
|-------------|--------|
| **Storybook** | ✓ Instalado (v10). Stories: CreateAlertCard, CreateMapOverlay, MapZoomControls. |
| **Chromatic** | Opcional. Incluido con Storybook para visual regression. |

---

## 3. Scripts actuales (package.json)

| Script | Comando | Estado |
|--------|---------|--------|
| dev | vite --host --port 5173 | ✓ Correcto |
| preview | vite preview --host --port 4173 | ✓ Correcto |
| test | playwright test | ✓ |
| test:e2e | playwright test | ✓ |
| test:e2e:ui | playwright test --ui | ✓ |
| test:ui | playwright test --ui | ✓ |
| test:visual | percy exec -- playwright test | ✓ |
| test:contracts | vitest run tests/contracts | ✓ |
| build | vite build | ✓ |
| lint | eslint . --max-warnings=9999 | ✓ |
| check | lint + build | ✓ |
| ios:run | bash scripts/ios-run.sh | ✓ |
| ios:run:dev | CAPACITOR_USE_DEV_SERVER=true npx cap run ios | ✓ |

---

## 4. Tests actuales (/tests)

| Archivo | Tipo | Cobertura |
|---------|------|-----------|
| **tests/smoke/load.spec.js** | E2E | App carga, no pantalla blanca, WaitMe visible |
| **tests/smoke/create.spec.js** | E2E | Botón aparcado, create abre, zoom, tarjeta, no error fatal |
| tests/app.spec.js | E2E | Flujo app |
| tests/profile.spec.js | E2E | Perfil |
| tests/map.spec.js | E2E | Mapa |
| tests/contracts/*.test.js | Unit | alerts, chat, notifications, transactions, uploads, userLocations |

**Smoke tests cubren:** App carga ✓, No pantalla blanca ✓, Home visible ✓, Botón "Estoy aparcado aquí" ✓, Pantalla create ✓, Botones zoom ✓, Botón Ubícate ✓

---

## 5. Vite config

| Opción | Valor actual | Requerido |
|--------|-------------|-----------|
| server.host | true | ✓ |
| server.port | 5173 | ✓ |
| preview.host | true | ✓ |
| preview.port | 4173 | ✓ |
| server.hmr.host | 192.168.0.11 (hardcoded) | ⚠️ Puede fallar si IP cambia |

---

## 6. Documentación existente

| Doc | Contenido |
|-----|-----------|
| docs/WAITME_DEV_WORKFLOW.md | Flujo dev, Playwright, Capacitor |
| docs/WORKFLOWS_WAITME.md | Prompts reutilizables |
| docs/SAFE_CHANGE_PROTOCOL.md | Protocolo de cambio seguro |
| docs/CURSOR_RULES_WAITME.md | Reglas del proyecto |
| docs/RENDER_AUDIT_REPORT.md | Diagnóstico pantalla negro/blanco |

---

## 7. Playwright config

| Opción | Estado |
|--------|--------|
| WebKit móvil (iPhone 14) | ✓ |
| Geolocation | ✓ |
| Permissions geolocation | ✓ |
| webServer (vite) | ✓ Puerto 5174 |
| projects: webkit-mobile, chromium | ✓ |

---

## 8. Recomendaciones

1. **Instalar Storybook** — Para probar CreateAlertCard, CreateMapOverlay, MapZoomControls sin montar toda la app.
2. **Crear docs/WAITME_FAST_WORKFLOW.md** — Guía rápida: dev → test:e2e → storybook → ios:run.
3. **HMR host** — Considerar usar `host: true` o variable de entorno en vez de IP fija.
4. **Smoke tests** — El locator `mapContainer.or(page.locator('#root'))` en create.spec puede causar strict mode; usar `.first()` o selector más específico si falla.
5. **No tocar** — AuthContext, MapboxMap, Home, Layout, lógica de mapas/login.
