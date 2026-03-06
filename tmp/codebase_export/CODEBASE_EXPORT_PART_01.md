
================================================================
FILE: .cursor/rules/waitme.md
================================================================
```md
# WaitMe — Reglas Cursor

## Arquitectura
- React + Vite + Tailwind + Zustand
- Supabase (Postgres, Auth, Realtime, Storage)
- Mapbox para mapas
- Adapters en `src/data/*.js` → servicios en `src/services/*Supabase.js`

## Reglas
- NO tocar Home.jsx sin orden explícita
- NO modificar visuales no pedidos
- Supabase = única fuente de verdad
- NO crear mocks si existe flujo real
- Mobile-first
- Cambios mínimos, documentar archivos tocados

## Pantallas
Home, History, Chats, Chat, Notifications, Profile, Settings, Navigate

## Env obligatorias
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN

## Docs
docs/CURSOR_RULES_WAITME.md, docs/SAFE_CHANGE_PROTOCOL.md, docs/WAITME_AGENT_CONTEXT.md

```

================================================================
FILE: .eslintrc.cjs
================================================================
```cjs
/**
 * Configuración ESLint para React + Vite.
 * El proyecto usa eslint.config.js (flat config) como fuente principal.
 * Este archivo existe para compatibilidad con herramientas que buscan .eslintrc.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', 'build', '*.config.js'],
};

```

================================================================
FILE: .github/dependabot.yml
================================================================
```yml
# Dependabot — actualización automática de dependencias
# https://docs.github.com/en/code-security/dependabot
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels: ["dependencies"]
    commit-message:
      prefix: "chore(deps)"
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types: ["minor", "patch"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 3
    labels: ["dependencies", "github-actions"]
    commit-message:
      prefix: "chore(ci)"

```

================================================================
FILE: .github/workflows/README.md
================================================================
```md
# GitHub Actions

## Activo

- **ci.yml** — Ejecuta en push/PR a `main`: lint, typecheck, build. Ver `docs/CI_SETUP.md` para secrets.

## Deshabilitados

Los workflows en `.github/workflows_disabled/` (supabase, codeql) no se ejecutan. Para reactivarlos: mover a `.github/workflows/` y configurar secrets.

```

================================================================
FILE: .github/workflows/ci.yml
================================================================
```yml
# CI — Lint, typecheck, build
# Pipeline mínimo para validar que el código compila y pasa checks básicos
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Build
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check migrations safety
        run: bash scripts/check_migrations_safety.sh

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Build
        run: npm run build

```

================================================================
FILE: .github/workflows_disabled/ci.yml
================================================================
```yml
# CI — Lint, typecheck, tests, build
# Gate único: todo debe pasar antes de migrations
name: disabled-temporarily

# Desactivado temporalmente: solo manual (workflow_dispatch)
on:
  workflow_dispatch:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Test, Build
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Check migrations safety (guardrail anti-destrucción)
        run: bash scripts/check_migrations_safety.sh

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            playwright-${{ runner.os }}-

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        if: steps.playwright-cache.outputs.cache-hit != 'true'

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Run tests
        run: npm run test

      - name: Contract tests (data layer API)
        run: npm run test:contracts

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

```

================================================================
FILE: .github/workflows_disabled/codeql.yml
================================================================
```yml
# CodeQL — análisis de seguridad de código
# https://docs.github.com/en/code-security/codeql-cli
name: disabled-temporarily

# Desactivado temporalmente: solo manual (workflow_dispatch)
on:
  workflow_dispatch:

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

```

================================================================
FILE: .github/workflows_disabled/supabase.yml
================================================================
```yml
# Supabase — Migraciones SOLO en main, tras CI exitoso
# Corre tras CI exitoso (workflow_run) o manual (workflow_dispatch)
name: disabled-temporarily

# Una sola ejecución por commit; cancelar duplicados (ej. re-runs de CI)
concurrency:
  group: supabase-${{ github.event.workflow_run.head_sha || github.sha }}
  cancel-in-progress: true

# Desactivado temporalmente: solo manual (workflow_dispatch)
on:
  workflow_dispatch:

env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

jobs:
  migrations_test:
    name: Verificar migrations desde cero
    runs-on: ubuntu-22.04
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase local stack
        run: supabase start

      - name: Apply all migrations from scratch
        run: supabase db reset --no-seed

      - name: Verify expected tables exist
        run: |
          sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client > /dev/null
          TABLES=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null || true)
          echo "Tablas en public:"
          echo "$TABLES"
          for t in profiles parking_alerts alert_reservations conversations messages transactions user_locations user_location_updates notifications; do
            if ! echo "$TABLES" | grep -qx "$t"; then
              echo "::error::Tabla esperada no encontrada: $t"
              exit 1
            fi
          done
          echo "OK: todas las tablas esperadas existen"

      - name: Stop Supabase
        if: always()
        run: supabase stop --no-backup

  migrate:
    name: Push migrations
    needs: [migrations_test]
    runs-on: ubuntu-22.04
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link project
        run: supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"

      - name: Push migrations
        run: supabase db push

      - name: Check for schema drift (post-push)
        run: |
          drift_output=$(supabase db diff --schema public 2>&1 || true)
          if echo "$drift_output" | grep -qE "^(CREATE|ALTER|DROP)"; then
            echo ":::error::Schema drift detected - remote DB has changes not in migrations"
            echo "$drift_output"
            exit 1
          fi

```

================================================================
FILE: .husky/_/husky.sh
================================================================
```sh
echo "husky - DEPRECATED

Please remove the following two lines from $0:

#!/usr/bin/env sh
. \"\$(dirname -- \"\$0\")/_/husky.sh\"

They WILL FAIL in v10.0.0
"
```

================================================================
FILE: .lintstagedrc.json
================================================================
```json
{
  "*.{js,jsx,ts,tsx}": "eslint --fix"
}

```

================================================================
FILE: .percy.yml
================================================================
```yml
version: 1
snapshot:
  widths: [375, 1280]
  min-height: 1024

```

================================================================
FILE: .storybook/main.js
================================================================
```js


/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite"
};
export default config;
```

================================================================
FILE: .storybook/preview.js
================================================================
```js
import '../src/globals.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;

```

================================================================
FILE: .storybook/vitest.setup.ts
================================================================
```ts
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
```

================================================================
FILE: .vscode/launch.json
================================================================
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "📱 iOS Simulator (Live Reload)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "sim"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "🚀 START DEV",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    }
  ]
}

```

================================================================
FILE: .vscode/settings.json
================================================================
```json
{
  "task.allowAutomaticTasks": "on"
}

```

================================================================
FILE: .vscode/tasks.json
================================================================
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "START DEV",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "isBackground": true,
      "problemMatcher": {
        "owner": "vite-dev",
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "VITE",
          "endsPattern": "Local:"
        }
      },
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    },
    {
      "label": "cap sync ios",
      "type": "shell",
      "command": "npx cap sync ios",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}

```

================================================================
FILE: CAPACITOR_DEV.md
================================================================
```md
# Flujo Vite + Capacitor para iOS (dev server)

Para que el simulador iOS **siempre** cargue desde el servidor de desarrollo (y no una build vieja):

## Flujo correcto

1. **Arrancar Vite:**
   ```bash
   npm run dev
   ```

2. **Ejecutar en simulador (usa dev server):**
   ```bash
   npm run ios:run:dev
   ```
   O manualmente:
   ```bash
   CAPACITOR_USE_DEV_SERVER=true npx cap run ios
   ```

## ⚠️ Importante

- **NO** uses `npx cap run ios` sin la variable: sobrescribe `capacitor.config.json` y elimina el bloque `server`, haciendo que cargue la build local.
- **SÍ** usa `npm run ios:run:dev` o `CAPACITOR_USE_DEV_SERVER=true npx cap run ios`.

## Verificación

- `ios/App/App/capacitor.config.json` debe contener:
  ```json
  "server": {
    "url": "http://192.168.0.11:5173",
    "cleartext": true
  }
  ```

- Si ves build vieja: `rm -rf ios/App/App/public` y re-sync con:
  ```bash
  CAPACITOR_USE_DEV_SERVER=true npx cap sync ios
  ```

```

================================================================
FILE: MAPBOX_SETUP.md
================================================================
```md
# Configuración de Mapbox

## Token requerido

1. Abre **.env** en la raíz del proyecto.
2. Asigna tu token público (empieza por `pk.`) a `VITE_MAPBOX_TOKEN=`.
3. Guarda y reinicia: `npm run dev`

Obtén tu token en: https://account.mapbox.com/access-tokens/

## Verificación (modo dev)

- HUD: `tokenLength` > 0, `tokenHasDots: true`, `mapCreated: true`, `canvasPresent: true`
- El token NUNCA se muestra en logs ni HUD (solo tokenLength y tokenHasDots)

```

================================================================
FILE: README-FLUJO.md
================================================================
```md
# WaitMe — Flujo de trabajo (fuente de verdad)

## Objetivo
Trabajar desde 0 de forma profesional, con un flujo simple y sin errores.

## Reglas (obligatorias)
1) **Base44 = editor principal (fuente de verdad).**
2) **GitHub = backup + control de versiones.**
3) **Cursor = solo para refactors grandes o búsquedas masivas** (si Base44 no llega).
4) **Cada cambio**: Jeffry entrega **archivo completo** para reemplazar → se pega en Base44 → se prueba en **Vista Previa + Atlas**.
5) No se cambian aspectos visuales salvo que Jonathan lo pida explícitamente.

## Rama y estructura
- Rama única de trabajo: **main**
- No crear ramas nuevas salvo orden explícita.
- Si un cambio “no se ve”, la primera sospecha es **caché/sync**, no “otra rama”.

## Flujo de cambios (siempre igual)
1) Pedir cambio a Jeffry.
2) Jeffry responde con **archivo completo** a reemplazar.
3) Pegar en Base44 → guardar.
4) Confirmar en Base44 que aparece “Synced … from GitHub” (si aplica).
5) Refrescar Vista Previa.
6) Solo usar “Publicar” cuando sea una “versión” (no para cada cambio).

## Política de herramientas
- Base44 primero.
- GitHub para revisar histórico y tener respaldo.
- Cursor solo si hay:
  - refactor masivo multiarchivo,
  - búsquedas/renombres globales,
  - o Base44 no permite una acción concreta.

## Checklist rápido si “no se ve el cambio”
1) ¿Estás en **main**?
2) ¿Base44 muestra **Synced …**?
3) ¿Refrescaste Vista Previa?
4) ¿Hard refresh del navegador (Cmd+Shift+R)?
5) Si sigue igual: revisar que el archivo editado es el correcto.

```

================================================================
FILE: README.md
================================================================
```md
# Base44 App

```

================================================================
FILE: capacitor.config.ts
================================================================
```ts
import type { CapacitorConfig } from '@capacitor/cli';

// Para desarrollo: CAPACITOR_USE_DEV_SERVER=true npx cap sync ios
const useDevServer = process.env.CAPACITOR_USE_DEV_SERVER === 'true';

const config: CapacitorConfig = {
  appId: 'com.waitme.app',
  appName: 'WaitMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  ...(useDevServer && {
    server: {
      url: 'http://192.168.0.15:5173',
      cleartext: true,
    },
  }),
};

export default config;

```

================================================================
FILE: components.json
================================================================
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

================================================================
FILE: docs/AGENT_ROLES_WAITME.md
================================================================
```md
# Roles de agente — WaitMe

Cuatro roles para estructurar el trabajo con Cursor. Cada uno tiene responsabilidades y entregables claros.

---

## 1. Auditor

**Qué hace:** Revisa el estado del proyecto sin aplicar cambios. Identifica problemas, deuda técnica y desviaciones de las reglas.

**Entregables:**
- Informe en `docs/` (ej. `AUDIT_YYYYMMDD.md`)
- Resumen en chat con hallazgos críticos
- Lista de archivos afectados y riesgos
- Recomendaciones priorizadas (crítico / medio / bajo)

**Cuándo usar:** Antes de refactors grandes, tras migraciones, o cuando algo "no cuadra".

**Prompt sugerido:** Workflow "Auditoría exhaustiva" en `docs/WORKFLOWS_WAITME.md`.

---

## 2. Implementador

**Qué hace:** Aplica cambios de código siguiendo el protocolo seguro. Hace commits atómicos y documenta.

**Entregables:**
- Código modificado
- Lista de archivos tocados
- Descripción del cambio y prueba recomendada
- Commit con mensaje claro

**Reglas:** No tocar Home.jsx sin orden explícita. No cambiar visuales no pedidos. Preferir cambios mínimos y reversibles.

**Cuándo usar:** Para features, fixes y refactors aprobados.

**Prompt sugerido:** Incluir siempre "Sigue docs/SAFE_CHANGE_PROTOCOL.md" y "docs/CURSOR_RULES_WAITME.md".

---

## 3. Tester visual

**Qué hace:** Valida que la UI funcione correctamente en móvil y desktop. Detecta regresiones visuales y de flujo.

**Entregables:**
- Checklist de pantallas probadas
- Lista de flujos validados (login, home, history, chat, mapa)
- Incidencias encontradas con pasos para reproducir
- Screenshots o descripción si hay anomalías

**Cuándo usar:** Tras cambios en UI, antes de releases, o cuando el usuario reporta "algo se ve mal".

**Prompt sugerido:**
```
Actúa como Tester visual. Valida los flujos críticos de WaitMe en viewport móvil:
- Login → Home
- Búsqueda y Crear alerta
- History → Chat / Navigate
- Mapas visibles
- Notificaciones y badge
Reporta incidencias con pasos para reproducir. No modifiques código.
```

---

## 4. Documentador

**Qué hace:** Mantiene la documentación actualizada. Crea y actualiza docs cuando cambia la arquitectura o los flujos.

**Entregables:**
- Actualización de `docs/PROJECT_SOURCE_OF_TRUTH.md` si cambian dominios/tablas
- Actualización de `docs/CI_SETUP.md` si cambian workflows o secrets
- Nuevos docs cuando se añaden features relevantes
- Changelog o notas de versión si aplica

**Cuándo usar:** Tras migraciones, cambios de arquitectura, o cuando la documentación queda desfasada.

**Prompt sugerido:**
```
Actúa como Documentador. Revisa la documentación de WaitMe y actualízala según el estado actual del código. Verifica:
- PROJECT_SOURCE_OF_TRUTH.md
- CURSOR_RULES_WAITME.md
- CI_SETUP.md
- MAP_DEBUG_CHECKLIST.md
Añade o corrige lo que falte. No modifiques código.
```

```

================================================================
FILE: docs/APLICAR_MIGRACION_PROFILES.md
================================================================
```md
# Aplicar migración de profiles (fix "Error al guardar")

La migración `20260305120000_fix_profiles_rls_and_trigger.sql` corrige el error al actualizar el perfil de usuario.

## Opción 1: Conexión directa (más rápido)

1. Obtén la **Connection string** en Supabase:
   - Dashboard → **Settings** → **Database**
   - En "Connection string" → **URI** (usa la conexión directa, puerto 5432)
   - Formato: `postgresql://postgres:[YOUR-PASSWORD]@db.acfzelpmvdmeszaqlokd.supabase.co:5432/postgres`

2. Añade a tu `.env` (no subir a git):
   ```
   SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.acfzelpmvdmeszaqlokd.supabase.co:5432/postgres
   ```

3. Ejecuta:
   ```bash
   npm run supabase:migrate:direct
   ```

## Opción 2: Supabase CLI

1. Obtén credenciales en [Supabase Dashboard](https://supabase.com/dashboard):
   - **Access Token**: Account → Access Tokens
   - **Database Password**: Project Settings → Database
   - **Project Ref**: Project Settings → General (o usa `acfzelpmvdmeszaqlokd`)

2. Ejecuta:
   ```bash
   export SUPABASE_ACCESS_TOKEN=tu_token
   export SUPABASE_PROJECT_REF=acfzelpmvdmeszaqlokd
   export SUPABASE_DB_PASSWORD=tu_password
   npm run supabase:migrate
   ```

## Opción 3: SQL Editor en Dashboard

1. Ve a Supabase Dashboard → **SQL Editor**
2. Copia el contenido de `supabase/migrations/20260305120000_fix_profiles_rls_and_trigger.sql`
3. Pega y ejecuta

## Verificación

Tras aplicar la migración:
- La tabla `profiles` tiene RLS con políticas SELECT/INSERT/UPDATE
- El trigger `on_auth_user_created` crea perfiles automáticamente
- Los usuarios existentes sin perfil reciben uno (backfill)
- El botón guardar del perfil debe funcionar sin errores

```

================================================================
FILE: docs/ARCHITECTURE_SNAPSHOT.md
================================================================
```md
# WaitMe — Architecture Snapshot

Documentación de la arquitectura actual del repositorio. **No modifica código**; solo describe el estado existente.

---

## 1. PROJECT STRUCTURE

| Folder | Purpose |
|--------|---------|
| **src/** | Código fuente principal de la aplicación |
| **src/api/** | Cliente Base44, entidades, integraciones |
| **src/components/** | Componentes UI (cards, map, primitivos) |
| **src/components/map/** | ParkingMap, MapFilters |
| **src/components/cards/** | CreateAlertCard, UserAlertCard, ActiveAlertCard, MarcoCard |
| **src/hooks/** | useMyAlerts, useRealtimeAlerts, useAlertsQuery, useMapMatch, useProfileGuard, useDebouncedSave |
| **src/lib/** | AuthContext, LayoutContext, supabaseClient, finalizedAtStore, geohash, profile, logger, sentry, alertSelectors |
| **src/pages/** | Home, History, HistorySellerView, HistoryBuyerView, Chat, Chats, Navigate, Login, Profile, Settings, Notifications, NotificationSettings |
| **src/services/** | alertService (Supabase), realtime/alertsRealtime |
| **src/state/** | appStore (Zustand) |
| **src/utils/** | carUtils, index.ts |
| **src/diagnostics/** | MissingEnvScreen |
| **supabase/** | config.toml, migrations, functions (map-match) |
| **docs/** | Auditorías, planes de migración, DB_SETUP, etc. |
| **scripts/** | supabase-migrate.sh, run-profile-migration.mjs, ios-run.sh, ship.sh |
| **ios/** | App Capacitor iOS (CapApp-SPM, AppDelegate, assets) |
| **tests/** | Playwright specs (app, map, profile) |
| **.github/workflows/** | lint-and-build, tests, supabase-migrations |

---

## 2. ENTRY POINTS

| File | Role |
|------|------|
| **index.html** | Shell HTML |
| **src/main.jsx** | Raíz: Sentry, HashRouter, QueryClientProvider, AuthProvider, App. Si faltan envs de Supabase → MissingEnvScreen |
| **src/App.jsx** | AuthRouter (Login vs Layout), manejo OAuth URL (Capacitor), DemoFlowManager, WaitMeRequestScheduler, IncomingRequestModal |
| **src/Layout.jsx** | LayoutProvider, useRealtimeAlerts, Routes, Header, BottomNav, lazy-loaded pages |

**Providers (orden de anidación):**
1. ErrorBoundary
2. HashRouter
3. QueryClientProvider
4. AuthProvider
5. LayoutProvider (dentro de Layout)

**Routing (react-router-dom v6):**

| Path | Component |
|------|-----------|
| `/`, `/home`, `/Home` | Home |
| `/chats` | Chats |
| `/chat`, `/chat/:id` | Chat |
| `/notifications` | Notifications |
| `/notification-settings` | NotificationSettings |
| `/profile` | Profile |
| `/settings` | Settings |
| `/history`, `/alertas` | History (Alertas) |
| `/navigate` | Navigate |

No hay ruta 404 configurada. Existe `PageNotFound.jsx` pero no está usada en las rutas.

---

## 3. STATE MANAGEMENT

| Type | Location | Contents |
|------|----------|----------|
| **AuthContext** | `src/lib/AuthContext.jsx` | user, profile, isAuthenticated, isLoadingAuth, authError, checkUserAuth |
| **LayoutContext** | `src/lib/LayoutContext.jsx` | Config del header (title, backButton, backTo, onBack, titleClassName) |
| **Zustand (appStore)** | `src/state/appStore.js` | auth.user, profile, alerts.items, alerts.loading, location (lat/lng/accuracy), ui.error |
| **finalizedAtStore** | `src/lib/finalizedAtStore.js` | localStorage `waitme:finalized_at_map` para timestamps de finalización |
| **React Query** | TanStack Query | myAlerts, myTransactions, conversation, chatMessages, unreadCount, etc. |

**Contextos UI (Radix):** FormFieldContext, FormItemContext, SidebarContext, CarouselContext, ToggleGroupContext, ChartContext.

---

## 4. DATA SOURCES

| Source | Client/Config | Usage |
|--------|---------------|-------|
| **Supabase** | `src/lib/supabaseClient.js` (lazy init) | Auth, profiles, parking_alerts, Realtime |
| **Base44** | `src/api/base44Client.js` | ParkingAlert, Conversation, ChatMessage, Transaction, Notification, auth.me |
| **Mapbox** | `mapbox-gl`, `VITE_MAPBOX_TOKEN` | MapboxMap, ParkingMap, Edge Function map-match |
| **Nominatim** | `https://nominatim.openstreetmap.org/reverse` | Reverse geocoding (Home.jsx) |
| **Supabase Edge Function** | `supabase/functions/map-match/index.ts` | Mapbox Map Matching API (MAPBOX_SECRET_TOKEN) |

---

## 5. REALTIME FLOWS

| Flow | Location | Mechanism |
|------|----------|------------|
| **Parking alerts** | `src/services/realtime/alertsRealtime.js`, `src/hooks/useRealtimeAlerts.js` | Supabase channel `parking_alerts_realtime`, postgres_changes (INSERT/UPDATE/DELETE) en `public.parking_alerts` |
| **Auth state** | `src/lib/AuthContext.jsx` | `supabase.auth.onAuthStateChange` |
| **Chat messages** | `src/pages/Chat.jsx` | `base44.entities.ChatMessage.subscribe` |
| **Polling (1s)** | History.jsx, Chats.jsx, IncomingRequestModal.jsx | `setInterval(() => setNowTs(Date.now()), 1000)` para countdowns |
| **Map match** | `src/hooks/useMapMatch.js` | `setInterval(runMatch, MATCH_INTERVAL_MS)` |
| **Demo flow** | `src/components/DemoFlowManager.jsx` | `setInterval(notify, 1000)`, `subscribeDemoFlow` |
| **Navigate animation** | `src/pages/Navigate.jsx` | `setInterval(moveTowardsDestination, 400)` |

---

## 6. MAP SYSTEM

| Component | File | Data source | Role |
|-----------|------|-------------|------|
| **MapboxMap** | `src/components/MapboxMap.jsx` | useAppStore (alerts.items, location) | Mapa de fondo en Home, clusters, marcador de usuario |
| **ParkingMap** | `src/components/map/ParkingMap.jsx` | Props (alerts, userLocation, sellerLocation, etc.) | Mapa de búsqueda/creación, rutas, marcadores |
| **MapFilters** | `src/components/map/MapFilters.jsx` | Props | Filtros de precio/distancia |
| **SellerLocationTracker** | `src/components/SellerLocationTracker.jsx` | Base44 ParkingAlert, UserLocation | Ubicación en vivo del vendedor en Navigate |

**Mapbox:** `VITE_MAPBOX_TOKEN`; import dinámico en MapboxMap, estático en ParkingMap.

---

## 7. ALERT SYSTEM

| Layer | File(s) | Role |
|-------|---------|------|
| **CRUD (Base44)** | Home.jsx, History.jsx, IncomingRequestModal, ActiveAlertCard, etc. | Crear/actualizar/eliminar vía `base44.entities.ParkingAlert` |
| **CRUD (Supabase)** | `src/services/alertService.js` | createAlert, getActiveAlerts, getActiveAlertsNear, reserveAlert, closeAlert |
| **Realtime** | `src/services/realtime/alertsRealtime.js`, `src/hooks/useRealtimeAlerts.js` | Supabase Realtime → appStore alerts |
| **Query hooks** | `useMyAlerts.js` (Base44), `useAlertsQuery.js` (alertService) | Fetch y cache de alertas |
| **History.jsx** | `src/pages/History.jsx` | UI principal de alertas: Activas/Finalizadas, Reservas, countdowns, cancelar/expirar/repetir |
| **HistorySellerView** | `src/pages/HistorySellerView.jsx` | Vista vendedor (alertas propias) |
| **HistoryBuyerView** | `src/pages/HistoryBuyerView.jsx` | Vista comprador (reservas) |

**History.jsx specifics:**
- Usa `useMyAlerts` (Base44) para datos
- `finalizedAtStore` para orden de finalizadas
- `alertSelectors` (getActiveSellerAlerts, getBestFinalizedTs)
- localStorage: `waitme:thinking_requests`, `waitme:rejected_requests`, `waitme:hidden_keys`, `alert-created-{id}`
- Custom events: `waitme:thinkingUpdated`, `waitme:rejectedUpdated`, `waitme:badgeRefresh`

---

## 8. CHAT SYSTEM

| Component | File | Data source |
|-----------|------|-------------|
| **Chats** | `src/pages/Chats.jsx` | Base44 Conversation, ParkingAlert, Notification |
| **Chat** | `src/pages/Chat.jsx` | Base44 Conversation, ChatMessage, auth.me; DemoFlowManager para demo |
| **IncomingRequestModal** | `src/components/IncomingRequestModal.jsx` | Base44 ParkingAlert, Conversation, ChatMessage |

**Flujo chat:** Base44 `Conversation.filter`, `ChatMessage.filter/create/update`, `ChatMessage.subscribe` para realtime. `UploadFile` para adjuntos.

---

## 9. SOURCE OF TRUTH

| Domain | Source of truth | Notes |
|--------|-----------------|-------|
| **Auth** | Supabase Auth | AuthContext, Login OAuth |
| **Profiles** | Supabase `profiles` | AuthContext, Profile.jsx; NotificationSettings aún usa base44.auth.updateMe |
| **Alerts** | Dual | Base44 para CRUD (Home, History); Supabase para Realtime + appStore; alertService existe pero no es el flujo principal |
| **Chat** | Base44 | Conversation, ChatMessage |
| **Maps** | Dual | MapboxMap: appStore (Supabase Realtime); ParkingMap: props (Base44/demo) |
| **Transactions** | Base44 | Navigate.jsx, History.jsx |
| **Notifications** | Base44 | Notifications.jsx, NotificationSettings.jsx |

---

## 10. DUPLICATIONS

| Duplication | Details |
|-------------|---------|
| **Alerts dual** | `useMyAlerts` (Base44) vs `useRealtimeAlerts` (Supabase → appStore). Home/History usan Base44; MapboxMap usa appStore. |
| **alertService poco usado** | `alertService.js` y `useAlertsQuery.js` apuntan a Supabase pero no son el flujo principal. |
| **User/profile** | AuthContext (user, profile) vs appStore (auth.user, profile); appStore.profile no se usa como fuente principal. |
| **Map components** | MapboxMap (Zustand) vs ParkingMap (props); distintas fuentes de datos y casos de uso. |
| **Query keys** | `alertsKey`/`alertsPrefix` (lib/alertsQueryKey) vs `alertsKeys` (useAlertsQuery) |
| **formatAddress / colores coche** | Helpers similares en History.jsx, IncomingRequestModal.jsx, ParkingMap.jsx |
| **Demo vs real** | DemoFlowManager (localStorage) vs Base44; lógica dividida en Chat, Chats, History |

---

*Documento generado a partir del escaneo del repositorio. No modifica código.*

```

================================================================
FILE: docs/AUDITORIA_ARQUITECTURA.md
================================================================
```md
# Auditoría exhaustiva de arquitectura — WaitMe

**Fecha:** 2026-03-05  
**Objetivo:** Documentar estado actual, duplicidades, anti-patrones y plan de migración Base44 → Supabase.

---

## 1. Diagrama textual de módulos y dependencias

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              main.jsx (entry)                                     │
│  getSupabaseConfig() → MissingEnvScreen | ErrorBoundary → HashRouter → App       │
│  import './lib/sentry' (top-level)                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │ supabaseClient│   │  app-params   │   │ base44Client  │
            │ (lazy init)   │   │ (top-level)   │   │ (top-level)   │
            └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
                   │                   │                   │
                   │                   └─────────┬─────────┘
                   │                             │
                   ▼                             ▼
            ┌──────────────┐              ┌──────────────┐
            │ AuthContext   │              │ base44 SDK   │
            │ (user,profile)│              │ (ParkingAlert,│
            └──────┬───────┘              │  Chat, etc)   │
                   │                      └──────┬───────┘
                   │                             │
    ┌──────────────┼──────────────┐               │
    ▼             ▼              ▼               │
┌─────────┐ ┌──────────┐ ┌─────────────┐         │
│ Login   │ │ Layout   │ │ Profile     │         │
└─────────┘ │ useRealtimeAlerts       │         │
           │ → alertsRealtime → Supabase         │
           └──────────┬──────────────┘           │
                      │                          │
                      ▼                          │
           ┌──────────────────┐                  │
           │ appStore (Zustand)│◄────────────────┘
           │ alerts.items      │   Home, History, Chats, etc.
           │ location          │   usan base44.entities.ParkingAlert
           └─────────┬─────────┘   Y useMyAlerts (base44)
                     │
                     ▼
           ┌──────────────────┐
           │ MapboxMap         │  ← lee alerts de appStore
           │ (solo background) │
           └──────────────────┘

FLUJOS PARALELOS:
- Auth: Supabase (AuthContext) ✓
- Profiles: Supabase (AuthContext, Profile.jsx) ✓
- Alertas: base44 (Home, History, Chats, Navigate, etc.) + Supabase (alertService, useRealtimeAlerts, appStore)
- Chat: base44 (Chat.jsx, Chats.jsx, IncomingRequestModal)
- Transacciones: base44 (Navigate.jsx, History.jsx)
- Notificaciones: base44 (Notifications.jsx, NotificationSettings)
- Mapas: MapboxMap (Zustand) + ParkingMap (props, base44/demo)
```

---

## 2. Fuente de verdad por dominio

| Dominio | Fuente actual | Archivos clave | Estado |
|---------|---------------|----------------|--------|
| **Auth** | Supabase | `AuthContext.jsx`, `Login.jsx`, `supabaseClient.js` | ✓ Única |
| **Profiles** | Supabase | `AuthContext.jsx`, `Profile.jsx`, tabla `profiles` | ✓ Única |
| **Alerts** | **DUAL** base44 + Supabase | `useMyAlerts.js` (base44), `alertService.js` (Supabase), `useRealtimeAlerts` (Supabase → appStore), `Home.jsx`, `History.jsx` (base44) | ⚠️ Duplicado |
| **Realtime** | Supabase | `alertsRealtime.js`, `useRealtimeAlerts.js` → appStore | ✓ Solo parking_alerts |
| **Maps** | Mapbox + 2 componentes | `MapboxMap.jsx` (Zustand), `ParkingMap.jsx` (props), `SellerLocationTracker.jsx` | ⚠️ MapboxMap usa appStore; ParkingMap recibe alerts por props (base44/demo) |
| **State** | **DUAL** AuthContext + Zustand | `AuthContext` (user, profile), `appStore` (alerts, location, ui.error) | ⚠️ profile en ambos |
| **Errors** | Disperso | `AuthContext.authError`, `appStore.ui.error`, `ErrorBoundary`, `logger.js` → Sentry | ⚠️ Sin centralizar |
| **Networking** | base44 + Supabase | `base44Client.js`, `getSupabase()`, `alertService.js` | ⚠️ Dos backends |

---

## 3. Duplicidades y anti-patrones

### 3.1 Base44 vs Supabase

| Problema | Detalle |
|----------|---------|
| Auth dual | AuthContext usa Supabase; base44 usa `appParams.token` (URL/localStorage). JWT Supabase NO se pasa a base44. |
| Alertas duales | `useMyAlerts` → base44; `useRealtimeAlerts` → Supabase parking_alerts; `alertService` → Supabase. Home/History crean/actualizan vía base44. |
| Perfil dual | `profiles` en Supabase; `base44.auth.updateMe()` en NotificationSettings para `notifications_enabled`. |
| Demo vs real | DemoFlowManager (localStorage) + base44 para datos reales. Lógica bifurcada en Chats, History. |

### 3.2 Múltiples servicios / estados duplicados

| Duplicidad | Ubicaciones |
|------------|-------------|
| Alertas | `useMyAlerts` (base44), `useRealtimeAlerts` (Supabase → appStore), `useAlertsQuery` (alertService), `getVisibleActiveSellerAlerts` (alertSelectors) |
| User/Profile | AuthContext (user, profile) vs appStore (auth.user, profile) — appStore.auth/profile no se usan activamente |
| Query keys | `alertsKey`/`alertsPrefix` (lib/alertsQueryKey) vs `alertsKeys` (useAlertsQuery) — estructuras distintas |

### 3.3 Inicializaciones top-level

| Módulo | Archivo | Riesgo iOS |
|--------|---------|------------|
| Sentry | `main.jsx` import `./lib/sentry` | Bajo: solo init si DSN; no bloquea |
| app-params | `base44Client.js` importa `app-params` | Medio: `getAppParams()` usa `window`, `localStorage` en top-level |
| base44 | `base44Client.js` crea cliente en import | Medio: depende de app-params; si falta config puede fallar |
| Mapbox | `ParkingMap.jsx`, `SellerLocationTracker.jsx` import estático | Bajo: token se lee en useEffect |
| Mapbox | `MapboxMap.jsx` import dinámico | ✓ Seguro |

### 3.4 Rutas y Capacitor

| Aspecto | Estado |
|---------|--------|
| Router | HashRouter ✓ (compatible Capacitor) |
| Deep links | `capacitor://localhost` en Login OAuth redirect; `appUrlOpen`, `getLaunchUrl` en App.jsx ✓ |
| Rutas | `/`, `/home`, `/chats`, `/chat/:id`, `/profile`, `/settings`, `/history`, `/alertas`, `/notifications`, `/navigate` |

---

## 4. Inventario: llamadas a Base44

### 4.1 Cliente y configuración

| Archivo | Uso |
|---------|-----|
| `src/api/base44Client.js` | `createClient` con appParams, envs `VITE_BASE44_*` |
| `src/lib/app-params.js` | `VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL`, `VITE_BASE44_API_BASE_URL`, `base44_access_token` |
| `vite.config.js` | Plugin `@base44/vite-plugin` |
| `package.json` | `@base44/sdk`, `@base44/vite-plugin` |

### 4.2 Llamadas por archivo

| Archivo | Entidad/API | Operaciones |
|---------|-------------|-------------|
| `src/pages/Home.jsx` | ParkingAlert, Notification | filter, create, update; Notification.filter |
| `src/pages/History.jsx` | ParkingAlert, Transaction | filter, create, update, delete, list |
| `src/pages/HistorySellerView.jsx` | ParkingAlert | update |
| `src/pages/HistoryBuyerView.jsx` | ParkingAlert, ChatMessage | update, create |
| `src/pages/Chats.jsx` | Conversation, ParkingAlert, Notification | list, filter, create |
| `src/pages/Chat.jsx` | auth.me, Conversation, ChatMessage | filter, create, update, subscribe; UploadFile |
| `src/pages/Navigate.jsx` | auth.me, ParkingAlert, Transaction, ChatMessage | filter, update, create |
| `src/pages/Notifications.jsx` | ParkingAlert | get, update |
| `src/pages/NotificationSettings.jsx` | auth.updateMe | updateMe |
| `src/hooks/useMyAlerts.js` | ParkingAlert | filter |
| `src/components/IncomingRequestModal.jsx` | ParkingAlert, auth.me, Conversation, ChatMessage | update, filter, create |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert | get |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert, UserLocation | filter |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert | update |
| `src/lib/PageNotFound.jsx` | auth.me | me |

### 4.3 Integraciones y entidades

| Archivo | Uso |
|---------|-----|
| `src/api/integrations.js` | Re-exporta base44.integrations.Core (InvokeLLM, SendEmail, UploadFile, etc.) |
| `src/api/entities.js` | Re-exporta base44.entities.Query, base44.auth |

---

## 5. BORRAR / UNIFICAR / REFACTORIZAR

### BORRAR (tras migración)

| Ruta | Motivo |
|------|--------|
| `src/api/base44Client.js` | Sustituido por Supabase |
| `src/api/entities.js` | Depende de base44 |
| `src/api/integrations.js` | Depende de base44; evaluar qué integraciones se usan |
| `src/lib/app-params.js` | Solo para base44; eliminar o reducir a lo mínimo |
| `vite.config.js` plugin base44 | Eliminar tras quitar SDK |
| `package.json` @base44/sdk, @base44/vite-plugin | Eliminar |
| `functions/searchGooglePlaces.ts` | Usa `base44` en signature; migrar o eliminar |

### UNIFICAR

| Qué | Cómo |
|-----|------|
| Alertas | Una sola fuente: Supabase `parking_alerts`. Eliminar `useMyAlerts` (base44), usar `alertService` + `useRealtimeAlerts` + `useAlertsQuery` |
| User/Profile | Mantener AuthContext como única fuente; no duplicar en appStore.auth/profile |
| Query keys | Unificar en `lib/alertsQueryKey.js` o `hooks/useAlertsQuery.js`; una sola convención |
| Notificaciones usuario | `profiles.notifications_enabled` en Supabase; eliminar `base44.auth.updateMe` en NotificationSettings |

### REFACTORIZAR

| Ruta | Cambio |
|------|--------|
| `src/pages/Home.jsx` | Sustituir base44.entities.ParkingAlert por alertService + useRealtimeAlerts |
| `src/pages/History.jsx` | Sustituir base44 por alertService; Transaction → tabla Supabase |
| `src/pages/Chats.jsx` | Conversation → Supabase (crear tabla) |
| `src/pages/Chat.jsx` | ChatMessage, Conversation → Supabase |
| `src/pages/Navigate.jsx` | ParkingAlert, Transaction, ChatMessage → Supabase |
| `src/pages/Notifications.jsx` | ParkingAlert.get/update → Supabase |
| `src/pages/NotificationSettings.jsx` | base44.auth.updateMe → supabase.from('profiles').update |
| `src/hooks/useMyAlerts.js` | Reescribir para usar alertService.getActiveAlerts |
| `src/components/IncomingRequestModal.jsx` | ParkingAlert, Conversation, ChatMessage → Supabase |
| `src/components/WaitMeRequestScheduler.jsx` | ParkingAlert.get → Supabase |
| `src/components/SellerLocationTracker.jsx` | ParkingAlert, UserLocation → Supabase (UserLocation puede requerir tabla) |
| `src/components/cards/ActiveAlertCard.jsx` | ParkingAlert.update → alertService.closeAlert |
| `src/lib/PageNotFound.jsx` | base44.auth.me → useAuth().user |

---

## 6. Plan en 10 pasos: migrar Base44 → Supabase sin romper iOS

| Paso | Acción | Archivos | Verificación |
|------|--------|----------|--------------|
| 1 | Crear tablas Supabase: `conversations`, `chat_messages`, `transactions`, `user_locations` (si aplica) | `supabase/migrations/` | `supabase db push` o migración directa |
| 2 | Crear servicios: `chatService.js`, `transactionService.js` | `src/services/` | Tests unitarios o manual |
| 3 | Sustituir `useMyAlerts` por `alertService` + `useRealtimeAlerts`; Home/History usan alertService para crear/actualizar | `useMyAlerts.js`, `Home.jsx`, `History.jsx` | Login → crear alerta → ver en mapa |
| 4 | Migrar NotificationSettings: `profiles.update` en lugar de `base44.auth.updateMe` | `NotificationSettings.jsx` | Cambiar toggle → verificar en Supabase |
| 5 | Migrar IncomingRequestModal y WaitMeRequestScheduler a Supabase | `IncomingRequestModal.jsx`, `WaitMeRequestScheduler.jsx` | Flujo reserva/aceptar |
| 6 | Migrar Chats y Chat: conversations + chat_messages en Supabase | `Chats.jsx`, `Chat.jsx` | Lista conversaciones, enviar mensaje |
| 7 | Migrar Navigate: completar alerta, crear transaction y mensaje en Supabase | `Navigate.jsx` | Flujo llegar → completar |
| 8 | Migrar History (Seller/Buyer views), ActiveAlertCard, SellerLocationTracker | Varios | Cancelar, prorrogar, ver ubicación |
| 9 | Eliminar base44: quitar imports, borrar base44Client, app-params, plugin Vite | Varios | Build sin errores |
| 10 | Limpieza: eliminar `api/entities.js`, `api/integrations.js`, ajustar envs | Varios | `npm run ios:run` ✓ |

**Regla por paso:** Hacer un paso → `npm run build` → `npm run ios:run` → verificar en simulador.

---

## 7. Cómo obtener info de Supabase (una captura)

**Opción más simple — una sola captura:**

1. Supabase Dashboard → tu proyecto → **SQL Editor**.
2. Pegar y ejecutar:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'parking_alerts', 'conversations', 'chat_messages', 'transactions')
ORDER BY table_name, ordinal_position;
```

3. Guardar el resultado (CSV o screenshot).

**URL y anon key:** Project Settings → API → `Project URL` = `VITE_SUPABASE_URL`, `anon public` = `VITE_SUPABASE_ANON_KEY`.

---

## 8. Top 15 riesgos y mitigación

| # | Riesgo | Mitigación |
|---|--------|------------|
| 1 | Auth dual (Supabase vs base44) desincroniza sesión | Pasar JWT Supabase a base44 mientras coexistan, o migrar todo a Supabase primero |
| 2 | base44 top-level init falla si falta token | Envolver en try/catch; degradar a modo "sin base44" si falla |
| 3 | Mapbox sin token rompe UI | ✓ Ya: "Mapa no disponible"; ParkingMap igual |
| 4 | Sentry init bloquea arranque | ✓ Ya: solo init si DSN; no bloquea |
| 5 | HashRouter → BrowserRouter rompe deep links iOS | No cambiar; mantener HashRouter |
| 6 | Preferences vs localStorage en logout | ✓ Ya: clearSupabaseAuthStorage usa Preferences.keys() |
| 7 | Realtime no conecta (RLS, publication) | Verificar `supabase_realtime` incluye `parking_alerts`; RLS permite SELECT |
| 8 | useMyAlerts (base44) y useRealtimeAlerts (Supabase) muestran datos distintos | Unificar: una sola fuente Supabase |
| 9 | DemoFlowManager y datos reales mezclados | Separar claramente; flag `useDemo` o similar |
| 10 | Transaction/Conversation sin tabla en Supabase | Crear migraciones antes de migrar código |
| 11 | UploadFile (base44) en Chat | Sustituir por Supabase Storage |
| 12 | SellerLocationTracker usa UserLocation (base44) | Crear tabla `user_locations` o usar otro mecanismo |
| 13 | app-params usa localStorage en SSR/build | ✓ Ya: `isNode` check; en build no hay window |
| 14 | Capacitor OAuth redirect incorrecto | ✓ Ya: `capacitor://localhost`; validar en Supabase Dashboard |
| 15 | Eliminar base44 rompe vite build (plugin) | Quitar plugin en último paso; probar build sin él |

---

## 9. Checklist de pruebas antes de cada merge

### Web

- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
- [ ] `npm run typecheck` sin errores
- [ ] `npm run test` (Playwright) pasa
- [ ] Login con Google en navegador
- [ ] Crear alerta → aparece en mapa
- [ ] Cerrar sesión → vuelve a Login
- [ ] Profile carga sin "Error al guardar"

### iOS Simulador

- [ ] `npm run ios:run` completa y lanza app
- [ ] No pantalla negra al abrir
- [ ] Login con Google (Browser externo → vuelve a app)
- [ ] Sesión persiste tras cerrar y reabrir app
- [ ] Mapa carga o muestra "Mapa no disponible"
- [ ] Navegación entre tabs/pantallas fluida
- [ ] Cerrar sesión desde Settings → vuelve a Login

### Variables de entorno mínimas

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_MAPBOX_TOKEN` (opcional; sin él mapa muestra mensaje)
- [ ] `VITE_BASE44_*` (solo mientras base44 siga en uso)

---

## 10. Resumen ejecutivo

- **Auth y Profiles:** Migrados a Supabase.
- **Alertas:** Estado híbrido; Realtime y alertService en Supabase; Home/History aún usan base44.
- **Chat, Transactions, Notifications:** base44.
- **Principales acciones:** Unificar alertas en Supabase; crear tablas para chat/transactions; migrar página a página; eliminar base44 al final.
- **Riesgo iOS:** Bajo si se mantiene HashRouter, init lazy de Supabase y manejo de Mapbox sin token.

```

================================================================
FILE: docs/AUDITORIA_EXHAUSTIVA_FINAL.md
================================================================
```md
# Auditoría Exhaustiva Final — WaitMe

**Fecha:** 6 de marzo de 2025  
**Alcance:** Repo completo, migración Supabase, mapa, archivos muertos, DevOps, seguridad.

---

## 1. Resumen ejecutivo

El proyecto WaitMe está **migrado a Supabase** en todos los dominios de datos. Los restos de base44 (`base44Client.js`, `app-params.js`) han sido **eliminados** en esta auditoría. El mapa Mapbox puede fallar por **token inválido o ausente** (`VITE_MAPBOX_TOKEN`) o por **dimensiones del contenedor** en el simulador iOS; se han aplicado correcciones (ResizeObserver, `100dvh`, resizes escalonados). Los workflows de GitHub Actions están **deshabilitados** (en `workflows_disabled/`). El build pasa correctamente.

**Veredicto global:** 7.5/10 — Proyecto funcional y migrado, con margen de mejora en CI/CD y documentación de entorno.

---

## 2. Estado real de migración a Supabase

| Dominio | Estado | Fuente actual |
|---------|--------|---------------|
| **AUTH** | Migrado | AuthContext + Supabase Auth |
| **PERFILES** | Migrado | profilesSupabase → data/profiles.js |
| **ALERTAS** | Migrado | alertsSupabase → data/alerts.js |
| **RESERVAS** | Migrado | alertsSupabase (status reserved) |
| **CHAT** | Migrado | chatSupabase → data/chat.js |
| **NOTIFICACIONES** | Migrado | notificationsSupabase → data/notifications.js |
| **TRANSACCIONES** | Migrado | transactionsSupabase → data/transactions.js |
| **UPLOADS** | Migrado | uploadsSupabase → data/uploads.js |
| **USER LOCATIONS** | Migrado | userLocationsSupabase → data/userLocations.js |
| **MAPAS** | Estable* | MapboxMap + ParkingMap (*requiere VITE_MAPBOX_TOKEN válido) |

Todos los adapters en `src/data/*.js` delegan a servicios Supabase. No hay doble fuente de verdad en runtime.

---

## 3. Restos encontrados de base44

### Eliminados en esta auditoría
- `src/api/base44Client.js` — **ELIMINADO** (código muerto, nadie lo importaba)
- `src/lib/app-params.js` — **ELIMINADO** (solo base44Client lo usaba)

### Referencias restantes (solo documentación)
- `docs/*.md` — menciones históricas en MIGRATION_*.md, AUDITORIA_*.md, etc.
- Comentarios en servicios: "Sustituye base44.entities.X" — informativos
- `supabase/migrations/20260304150000_create_parking_alerts.sql` — comentario "migración desde base44"

### package.json
- No hay `@base44/sdk` ni `@base44/vite-plugin` en dependencias.
- `vite.config.js` no usa plugin base44.

### Verificación
```bash
grep -r "base44" src/  # Solo comentarios en servicios
grep -r "base44Client\|app-params" src/  # Sin resultados
```

---

## 4. Causa exacta del problema del mapa

### Diagnóstico
El mapa no se ve en el simulador cuando:

1. **Token inválido o ausente:** `VITE_MAPBOX_TOKEN` no está en `.env` o tiene valor placeholder (`PEGA_AQUI_EL_TOKEN`, `YOUR_MAPBOX_PUBLIC_TOKEN`). MapboxMap muestra "Mapa no disponible".

2. **Contenedor con dimensiones inestables:** En iOS/WebView, el contenedor puede tener altura 0 o cambiar tras el layout. Mapbox necesita un contenedor con tamaño definido para renderizar.

3. **Viewport en móvil:** `100vh` en iOS puede no coincidir con el viewport visible (barra de direcciones, safe area).

### Correcciones aplicadas
- `minHeight: '100dvh'` en el contenedor del mapa (mejor soporte móvil).
- `minWidth: '100%'` para evitar colapso horizontal.
- **ResizeObserver** para llamar `map.resize()` cuando cambia el tamaño del contenedor.
- Resizes escalonados (100ms, 400ms, 800ms) tras el load para estabilizar el layout.

### Acción recomendada
1. Crear `.env` con `VITE_MAPBOX_TOKEN=pk.xxx` (token real de https://account.mapbox.com/).
2. Si sigue sin verse: comprobar en DevTools que el contenedor del mapa tenga `height > 0` y que no haya errores 401 en la pestaña Network para tiles de Mapbox.

---

## 5. Bugs críticos encontrados

| Severidad | Descripción | Estado |
|-----------|-------------|--------|
| Alta | base44Client.js y app-params.js eran código muerto con dependencia inexistente (@base44/sdk) | Corregido: eliminados |
| Media | Mapa puede no renderizar en simulador por dimensiones del contenedor | Corregido: ResizeObserver + 100dvh |
| Media | Workflows de CI deshabilitados — no hay validación automática en push | Pendiente: reactivar |
| Baja | Chunk principal > 500KB (mapbox-gl, radix, etc.) | Pendiente: code-split |

---

## 6. Archivos muertos o prescindibles

| Archivo | Clasificación | Notas |
|---------|---------------|-------|
| `src/api/base44Client.js` | Borrar ya | Eliminado |
| `src/lib/app-params.js` | Borrar ya | Eliminado |
| `ios__backup_black_screen__20260304_202001/` | Mantener temporalmente | Backup iOS; evaluar si añadir a .gitignore |
| `functions/searchGooglePlaces.ts` | Refactorizar después | No usa base44; evaluar si se usa en producción |
| Docs obsoletos (MIGRATION_STATUS, etc.) | Refactorizar después | Consolidar en un único MIGRATION_COMPLETE.md |

---

## 7. Riesgos de arquitectura

1. **DemoFlowManager + datos reales:** La app mezcla flujos demo (localStorage) con datos reales (Supabase). En Chats, History, etc. hay lógica bifurcada. Riesgo: confusión y bugs si se extiende el demo.

2. **mockNearby.js:** Home usa `getMockNearbyAlerts()` para el modo búsqueda en lugar de alertas reales de Supabase. Es intencional para demo, pero puede confundir si se esperan datos reales.

3. **Sin CI activo:** Los workflows están en `workflows_disabled/`. Cualquier push a main no ejecuta lint, tests ni build.

4. **Variables de entorno:** La app requiere `.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`. No hay validación en build; solo MissingEnvScreen para Supabase al arrancar.

---

## 8. Automatizaciones aplicadas

- Eliminación de `base44Client.js` y `app-params.js`.
- Mejoras en MapboxMap: ResizeObserver, 100dvh, resizes escalonados.
- Creación de este documento de auditoría.

---

## 9. Cambios hechos automáticamente

1. **MapboxMap.jsx**
   - `minHeight: '100dvh'`, `minWidth: '100%'` en el contenedor.
   - ResizeObserver para `map.resize()` al cambiar tamaño.
   - Resizes escalonados (100, 400, 800 ms) tras load.
   - Cleanup del ResizeObserver en unmount.

2. **Eliminación de archivos**
   - `src/api/base44Client.js`
   - `src/lib/app-params.js`

---

## 10. Cambios pendientes recomendados

1. **Reactivar CI:** Mover workflows de `workflows_disabled/` a `workflows/` y configurar secrets (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN).

2. **Documentar .env:** Añadir a README o SETUP.md la lista exacta de variables y cómo obtenerlas.

3. **Evaluar ios__backup_black_screen__*:** Decidir si excluirlo del repo (`.gitignore`) o eliminarlo.

4. **Code-split:** Considerar `React.lazy` para rutas pesadas (History, Profile) y `import()` dinámico para mapbox-gl donde sea posible.

5. **Actualizar docs de migración:** Crear `MIGRATION_COMPLETE.md` que indique que base44 está eliminado y la migración está cerrada.

---

## 11. Veredicto final

| Criterio | Puntuación (0–10) |
|----------|-------------------|
| Migración Supabase | 10 |
| Limpieza base44 | 10 |
| Estabilidad del mapa | 7 |
| CI/CD | 4 |
| Documentación | 6 |
| Estructura de código | 8 |
| Seguridad (RLS, envs) | 8 |

**Total: 7.5/10**

El proyecto está en buen estado para desarrollo y producción en cuanto a datos y arquitectura. Los principales puntos débiles son la ausencia de CI activo y la dependencia de configuración manual de `.env`. Con los cambios aplicados, el mapa debería mostrarse correctamente en el simulador si `VITE_MAPBOX_TOKEN` está configurado.

```

================================================================
FILE: docs/AUDITORIA_IMPLEMENTACION_UBER_LEVEL.md
================================================================
```md
# Auditoría: Implementación Nivel Uber/Airbnb

## Qué se hizo

### A) Estabilidad Auth + Perfil
- **AuthContext**: `refreshProfile()`, `profile` nunca null (fallback `{}`), `profile: profile ?? {}` en context
- **Guards**: `useProfileGuard` usa `profile` (persistido), mensaje dinámico con campos faltantes
- **Profile.jsx**: formData local, debounce 750ms, guardado inmediato en handleBack, sin guardar en cleanup

### B) Mapbox Premium + Realtime
- **MapboxMap.jsx**: carga alertas desde `parking_alerts` (Supabase), pinta en `parking_alerts_layer`
- **Realtime**: suscripción a INSERT/UPDATE/DELETE en `parking_alerts`, actualiza GeoJSON en vivo
- **Migración**: `20260304160000_enable_realtime_parking_alerts.sql` añade tabla a publicación

### C) Map Matching
- **Edge Function** `supabase/functions/map-match`: recibe puntos, llama Mapbox Matching API con `MAPBOX_SECRET_TOKEN`
- **Cliente** `useMapMatch.js`: buffer 10s, llama cada 5s, fallback a GPS crudo si falla
- **MapboxMap**: usa `corrected` cuando existe, sino `userPosition`

### D) Geo-index
- **Migración** `20260304170000_add_geohash_parking_alerts.sql`: columna `geohash`, índice compuesto
- **alertService**: `createAlert` calcula geohash (precision 7), `getActiveAlertsNear(lat, lng, radiusKm)`
- **ngeohash**: librería para encode

### E) Cache React Query
- **useAlertsQuery.js**: `useActiveAlertsQuery`, `useActiveAlertsNearQuery`, `useCreateAlertMutation`, `useReserveAlertMutation`, `useCloseAlertMutation`
- Invalidación en mutations; Realtime como principal

### F) Logging Sentry
- **main.jsx**: `Sentry.init` si `VITE_SENTRY_DSN`
- **ErrorBoundary**: `Sentry.captureException` en `componentDidCatch`
- **logger.js**: `logger.info`, `logger.warn`, `logger.error` con breadcrumbs

### G) Automatización
- **docs/PROD_READY.md**: setup, variables, deploy sin UI
- **GitHub Actions**: lint + build en push a main (ya existía)

### H) iOS Simulator
- **capacitor.config.ts**: `server.url` solo cuando `CAPACITOR_USE_DEV_SERVER=true`
- **dev:ios**: usa la variable; sin ella, app usa bundled (dist/) → no pantalla blanca

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Map-match Edge Function no desplegada | Fallback a GPS crudo en cliente |
| Realtime no habilitado en Supabase | Migración lo añade; verificar en dashboard |
| geohash null en filas antiguas | `getActiveAlertsNear` usa OR; filas sin geohash no matchean prefijos |
| Sentry sin DSN | Init no se ejecuta; app funciona igual |
| IP 192.168.0.10 distinta | `CAPACITOR_DEV_SERVER` env override |

---

## Checklist de pruebas

### 1. Auth + Perfil
- [ ] Login con OAuth
- [ ] Recargar página → profile no se vacía
- [ ] Editar perfil en Profile.jsx → guardar → back → datos persisten
- [ ] Perfil incompleto → intentar crear alerta → mensaje "Faltan: X, Y"

### 2. Mapa
- [ ] Abrir app con mapa (showBackgroundMap o modo search)
- [ ] Sin token Mapbox → mensaje "Configura VITE_MAPBOX_TOKEN"
- [ ] Con token → mapa carga, marcador usuario, círculo accuracy

### 3. Realtime Alertas
- [ ] Crear alerta en Supabase (insert manual o vía app)
- [ ] Mapa actualiza sin recargar

### 4. Map Matching
- [ ] Con Edge Function desplegada: moverse → marcador corregido
- [ ] Sin Edge Function: fallback a GPS crudo (sin error)

### 5. iOS Simulator
- [ ] `npm run build && npx cap sync ios && npx cap run ios` → app carga sin blanco
- [ ] `npm run dev:ios` → Vite + simulador, app carga desde localhost

### 6. Sentry
- [ ] Con VITE_SENTRY_DSN: provocar error → aparece en Sentry
- [ ] Sin DSN: app funciona

```

================================================================
FILE: docs/AUDITORIA_SUPABASE_MIGRACION_CI.md
================================================================
```md
# Auditoría Supabase + CI/CD — WaitMe

**Fecha:** 2025-03-04  
**Objetivo:** Preparar migración completa a Supabase y dejar CI/CD de migrations perfecto.

---

## 1. REVISIÓN CARPETA /supabase

### Estructura actual

```
supabase/
├── config.toml          # Config local (project_id: WaitMeNuevo)
├── .gitignore           # .branches, .temp, .env*
├── README.md            # Instrucciones
├── seed.sql             # Vacío (solo comentario)
├── migrations/
│   └── 20260304134200_create_profiles.sql
└── functions/
    └── .gitkeep         # Carpeta vacía
```

### config.toml

- `project_id = "WaitMeNuevo"` — identificador local, no el ref de Supabase Cloud
- `db.migrations.enabled = true`
- `db.seed.sql_paths = ["./seed.sql"]`
- `schema_paths = []` — correcto, usa migrations/

### seed.sql

- Contenido: solo comentario. Sin datos de prueba.

### functions/

- Carpeta vacía con .gitkeep. Sin Edge Functions.

---

## 2. MIGRACIONES EXISTENTES

| Archivo | Crea/Cambia |
|---------|-------------|
| `20260304134200_create_profiles.sql` | Crea tabla `public.profiles` con columnas: id, email, full_name, avatar_url, display_name, brand, model, color, vehicle_type, plate, phone, allow_phone_calls, notifications_enabled, email_notifications, created_at, updated_at. Habilita RLS. Políticas: select/update/insert con `auth.uid() = id`. |

---

## 3. WORKFLOWS GITHUB ACTIONS

### Estado actual

| Archivo | Trigger | Método CLI | Secrets |
|---------|---------|------------|---------|
| `main.yml` | push a main (sin paths) | `npm install -g supabase` ❌ deprecado | SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN. **Bug:** db push usa SUPABASE_ACCESS_TOKEN en vez de SUPABASE_DB_PASSWORD |
| `supabase-migrations.yml` | push a main si `supabase/migrations/**` | supabase/setup-cli@v1 ✅ | SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD ✅ |

### Problemas detectados

1. **Workflow duplicado:** main.yml y supabase-migrations.yml hacen lo mismo.
2. **main.yml usa método deprecado:** `npm install -g supabase` falla con "Installing Supabase CLI as a global module is not supported."
3. **main.yml bug:** `supabase db push` necesita `SUPABASE_DB_PASSWORD`, no `SUPABASE_ACCESS_TOKEN`.
4. **main.yml trigger amplio:** se ejecuta en cualquier push a main, no solo en cambios de migrations.

### Acción

- **Eliminar** `.github/workflows/main.yml`
- **Mantener** `.github/workflows/supabase-migrations.yml` como único workflow.

---

## 4. SECRETS ESPERADOS

| Secret | Uso |
|--------|-----|
| `SUPABASE_ACCESS_TOKEN` | Autenticación con Supabase API (link, etc.) |
| `SUPABASE_PROJECT_REF` | ID del proyecto (ej. `abcdefghij`) |
| `SUPABASE_DB_PASSWORD` | Contraseña de Postgres para `db push` |

**Verificar en repo:** Settings → Secrets and variables → Actions. Los tres deben existir.

---

## 5. CHECKLIST CI/CD

- [x] Workflow único: supabase-migrations.yml
- [x] Usa supabase/setup-cli@v1
- [x] Trigger: push a main solo si `supabase/migrations/**`
- [x] workflow_dispatch para ejecución manual
- [x] supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
- [x] supabase db push con SUPABASE_DB_PASSWORD
- [x] SUPABASE_ACCESS_TOKEN en paso de link
- [ ] Secrets configurados en el repo (manual)

---

## 6. PLAN DE MIGRACIÓN A SUPABASE

### Tablas mínimas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | ✅ Ya existe (migración actual) |
| `parking_alerts` | Alertas de aparcamiento (vendedor, comprador, estado) |
| `reservations` | Opcional: se puede modelar con `reserved_by_id` en parking_alerts |
| `chat_threads` | Hilos de conversación (1 por alerta + par seller/buyer) |
| `chat_messages` | Mensajes dentro de un thread |
| `transactions` | Pagos entre buyer y seller |

### Esquema propuesto (migraciones futuras)

#### 6.1 parking_alerts

```sql
create table public.parking_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  user_name text,
  user_photo text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  price numeric(10,2) not null,
  available_in_minutes integer not null,
  brand text,
  model text,
  color text default 'gris',
  vehicle_type text default 'car',
  plate text,
  phone text,
  allow_phone_calls boolean default false,
  status text not null default 'active',
  reserved_by_id uuid references auth.users(id) on delete set null,
  reserved_by_email text,
  reserved_by_name text,
  reserved_by_photo text,
  reserved_by_car text,
  reserved_by_car_color text,
  reserved_by_plate text,
  reserved_by_vehicle_type text,
  wait_until timestamptz,
  created_from text,
  created_date timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_parking_alerts_user_id on public.parking_alerts(user_id);
create index idx_parking_alerts_status on public.parking_alerts(status);
create index idx_parking_alerts_created_date on public.parking_alerts(created_date desc);
create index idx_parking_alerts_status_created on public.parking_alerts(status, created_date desc);

alter table public.parking_alerts enable row level security;

create policy "Users view own or reserved" on public.parking_alerts for select
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Authenticated view active" on public.parking_alerts for select
  using (auth.role() = 'authenticated' and status = 'active');
create policy "Users create own" on public.parking_alerts for insert
  with check (auth.uid() = user_id);
create policy "Users update own or reserved" on public.parking_alerts for update
  using (auth.uid() = user_id or auth.uid() = reserved_by_id);
create policy "Users delete own" on public.parking_alerts for delete
  using (auth.uid() = user_id);
```

#### 6.2 chat_threads (conversations)

```sql
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id) on delete cascade not null,
  participant1_id uuid references auth.users(id) on delete cascade,
  participant2_id uuid references auth.users(id) on delete cascade,
  last_message_text text,
  last_message_at timestamptz,
  unread_count_p1 integer default 0,
  unread_count_p2 integer default 0,
  created_at timestamptz default now()
);

create index idx_chat_threads_alert_id on public.chat_threads(alert_id);
create index idx_chat_threads_p1 on public.chat_threads(participant1_id);
create index idx_chat_threads_p2 on public.chat_threads(participant2_id);

alter table public.chat_threads enable row level security;

create policy "Participants view" on public.chat_threads for select
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants insert" on public.chat_threads for insert
  with check (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants update" on public.chat_threads for update
  using (auth.uid() = participant1_id or auth.uid() = participant2_id);
```

#### 6.3 chat_messages

```sql
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_chat_messages_thread_id on public.chat_messages(thread_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

alter table public.chat_messages enable row level security;

create policy "Participants view" on public.chat_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Sender insert" on public.chat_messages for insert
  with check (auth.uid() = sender_id);
create policy "Receiver update read" on public.chat_messages for update
  using (auth.uid() = receiver_id);
```

#### 6.4 transactions

```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.parking_alerts(id) on delete set null,
  buyer_id uuid references auth.users(id) on delete cascade not null,
  seller_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_transactions_buyer on public.transactions(buyer_id);
create index idx_transactions_seller on public.transactions(seller_id);
create index idx_transactions_alert on public.transactions(alert_id);

alter table public.transactions enable row level security;

create policy "Parties view" on public.transactions for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Parties insert" on public.transactions for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);
```

### Índices recomendados

| Tabla | Índice | Propósito |
|-------|--------|-----------|
| parking_alerts | user_id, status, created_date | Listar alertas del usuario |
| parking_alerts | (status, created_date) | Búsqueda de activas ordenadas |
| chat_threads | alert_id, participant1_id, participant2_id | Mis conversaciones |
| chat_messages | thread_id, created_at | Mensajes de un thread |
| transactions | buyer_id, seller_id, alert_id | Balance por usuario |

### Opcional: PostGIS para geolocalización

```sql
create extension if not exists postgis;
alter table public.parking_alerts add column location geography(Point, 4326);
create index idx_parking_alerts_location on public.parking_alerts using gist(location);
```

---

## 7. RESUMEN DE CAMBIOS APLICADOS

1. **Eliminado** `.github/workflows/main.yml` (workflow duplicado y deprecado)
2. **Mantenido** `.github/workflows/supabase-migrations.yml` como único workflow
3. **Verificado** que el workflow usa setup-cli, paths correctos, trigger y secrets adecuados

---

## 8. PRÓXIMOS PASOS

1. Configurar los 3 secrets en GitHub si no están.
2. Crear migraciones para parking_alerts, chat_threads, chat_messages, transactions cuando se migre de base44.
3. Añadir trigger `updated_at` en profiles (migración separada).
4. Crear bucket `avatars` y políticas Storage en Supabase Dashboard o migración.

```
