# WaitMe! — Flujo de trabajo rápido

Guía para trabajar sin romper la app.

---

## 1. Desarrollo rápido

```bash
npm run dev
```

- Servidor en `http://localhost:5173`
- Red local: `http://<TU_IP>:5173`
- Usar navegador o Safari para probar

---

## 2. Prueba automática

```bash
npm run test:e2e
```

Ejecuta Playwright (WebKit móvil + Chromium). Arranca el servidor en puerto 5174 si no hay uno activo.

```bash
npm run test:e2e tests/smoke/
```

Solo smoke tests.

```bash
npm run test:e2e:ui
```

Abre la UI de Playwright para depurar.

---

## 3. UI aislada (Storybook)

```bash
npm run storybook
```

- Abre en `http://localhost:6006`
- Componentes: CreateAlertCard, CreateMapOverlay, MapZoomControls
- Probar UI sin montar toda la app

---

## 4. Validación nativa final

```bash
npm run ios:run
```

Build + sync + ejecutar en simulador iOS.

```bash
npm run ios:run:dev
```

Simulador con dev server (hot reload).

---

## 5. Antes de commit

```bash
npm run check
```

Lint + build.

---

## 6. Resumen del flujo

| Paso | Comando | Cuándo |
|------|---------|--------|
| Desarrollo | `npm run dev` | Editar código |
| Tests E2E | `npm run test:e2e` | Tras cambios importantes |
| UI aislada | `npm run storybook` | Probar componentes |
| Nativo | `npm run ios:run` | Validación final |
| Pre-commit | `npm run check` | Antes de push |
