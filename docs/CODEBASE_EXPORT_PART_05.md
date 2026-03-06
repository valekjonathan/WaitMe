
================================================================
FILE: package.json
================================================================
```json
{
  "name": "waitme-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "predev": "rm -rf ios/App/App/public/assets 2>/dev/null || true",
    "dev": "vite --host --port 5173",
    "build": "vite build",
    "lint": "eslint . --max-warnings=9999",
    "lint:fix": "eslint . --fix",
    "test": "playwright test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:contracts": "vitest run tests/contracts",
    "test:ui": "playwright test --ui",
    "test:visual": "percy exec -- playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "check": "npm run lint && npm run build",
    "ship": "bash scripts/ship.sh",
    "prepare": "husky",
    "preview": "vite preview --host --port 4173",
    "dev:ios": "concurrently \"npm run dev\" \"CAPACITOR_USE_DEV_SERVER=true npx cap run ios\"",
    "ios:sync:dev": "npm run build && CAPACITOR_USE_DEV_SERVER=true npx cap sync ios",
    "ios:sync": "npm run build && npx cap sync ios",
    "ios:open": "npx cap open ios",
    "ios:reset": "bash scripts/ios-reset.sh",
    "ios:run": "bash scripts/ios-run.sh",
    "ios:run:dev": "CAPACITOR_USE_DEV_SERVER=true npx cap run ios",
    "supabase:migrate": "bash scripts/supabase-migrate.sh",
    "supabase:migrate:direct": "node scripts/run-profile-migration.mjs",
    "db:migrate:print": "node -e \"const fs=require('fs');const p='supabase/migrations';const files=fs.readdirSync(p).filter(f=>f.endsWith('.sql')).sort().reverse();const last=files[0];console.log(fs.readFileSync(p+'/'+last,'utf8'));\"",
    "diagnose": "node scripts/diagnose-project.js",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "audit:repo": "knip",
    "check:fast": "npm run build && npm run test:e2e tests/smoke/load.spec.js",
    "dev:safe": "VITE_SAFE_MODE=true vite --host --port 5173"
  },
  "dependencies": {
    "@capacitor/app": "^8.0.1",
    "@capacitor/browser": "^8.0.1",
    "@capacitor/cli": "^8.1.0",
    "@capacitor/core": "^8.1.0",
    "@capacitor/ios": "^8.1.0",
    "@capacitor/preferences": "^8.0.1",
    "@capacitor/status-bar": "^8.0.1",
    "@hello-pangea/dnd": "^17.0.0",
    "@hookform/resolvers": "^4.1.2",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@sentry/react": "^10.42.0",
    "@supabase/supabase-js": "^2.98.0",
    "@tanstack/react-query": "^5.84.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.5.2",
    "framer-motion": "^11.16.4",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.475.0",
    "mapbox-gl": "^3.19.1",
    "next-themes": "^0.4.4",
    "ngeohash": "^0.6.3",
    "react": "^18.2.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.54.2",
    "react-resizable-panels": "^2.1.7",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.15.4",
    "sonner": "^2.0.1",
    "tailwind-merge": "^3.0.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "zod": "^3.24.2",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^5.0.1",
    "@eslint/js": "^9.19.0",
    "@percy/cli": "^1.31.9",
    "@percy/playwright": "^1.0.10",
    "@playwright/test": "^1.58.2",
    "@storybook/addon-a11y": "^10.2.15",
    "@storybook/addon-docs": "^10.2.15",
    "@storybook/addon-onboarding": "^10.2.15",
    "@storybook/addon-vitest": "^10.2.15",
    "@storybook/react-vite": "^10.2.15",
    "@types/node": "^22.13.5",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/browser-playwright": "^4.0.18",
    "@vitest/coverage-v8": "^4.0.18",
    "autoprefixer": "^10.4.20",
    "baseline-browser-mapping": "^2.8.32",
    "concurrently": "^9.2.1",
    "eslint": "^9.19.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-prettier": "^5.5.5",
    "eslint-plugin-react": "^7.37.4",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.18",
    "eslint-plugin-unused-imports": "^4.3.0",
    "globals": "^15.14.0",
    "husky": "^9.1.7",
    "knip": "^5.85.0",
    "lint-staged": "^15.4.3",
    "percy": "^5.0.0",
    "pg": "^8.20.0",
    "playwright": "^1.58.2",
    "postcss": "^8.5.3",
    "prettier": "^3.8.1",
    "prop-types": "^15.8.1",
    "storybook": "^10.2.15",
    "supabase": "^2.76.16",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.2",
    "vite": "^6.1.0",
    "vitest": "^4.0.18"
  }
}

```

================================================================
FILE: playwright.config.js
================================================================
```js
// @ts-check
import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT || 5174;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

/** Geolocation Oviedo (configurable con PLAYWRIGHT_GEOLOCATION) */
const geolocation = process.env.PLAYWRIGHT_GEOLOCATION
  ? JSON.parse(process.env.PLAYWRIGHT_GEOLOCATION)
  : { latitude: 43.3619, longitude: -5.8494 };

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/contracts/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    geolocation,
    permissions: ['geolocation'],
  },
  projects: process.env.CI
    ? [{ name: 'webkit-mobile', use: { ...devices['iPhone 14'], browserName: 'webkit' } }]
    : [
        { name: 'webkit-mobile', use: { ...devices['iPhone 14'], browserName: 'webkit' } },
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  webServer: {
    command:
      process.env.VITE_SAFE_MODE === 'true'
        ? `VITE_SAFE_MODE=true npx vite --host --port ${port}`
        : `npx vite --host --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

```

================================================================
FILE: postcss.config.js
================================================================
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

================================================================
FILE: scripts/check_migrations_safety.sh
================================================================
```sh
#!/usr/bin/env bash
# Guardrail anti-destrucción: bloquea migraciones con SQL peligroso en producción.
# Falla si encuentra DROP TABLE, TRUNCATE, DROP SCHEMA o DELETE FROM (sin documentación SAFE).
set -euo pipefail

MIGRATIONS_DIR="${1:-supabase/migrations}"
FAILED=0

check_pattern() {
  local pattern="$1"
  local desc="$2"
  local files
  # Excluir líneas que son solo comentarios (empiezan con --)
  files=$(grep -rln -E "$pattern" "$MIGRATIONS_DIR" 2>/dev/null || true)
  if [[ -n "$files" ]]; then
    local found=""
    while read -r f; do
      matches=$(grep -n -E "$pattern" "$f" 2>/dev/null | while read -r line; do
        content="${line#*:}"
        [[ "$content" =~ ^[[:space:]]*-- ]] && continue
        echo "$line"
      done)
      if [[ -n "$matches" ]]; then
        found="$found"$'\n'"  - $f:"$'\n'"$matches"
        FAILED=1
      fi
    done <<< "$files"
    if [[ -n "$found" ]]; then
      echo "::error::Migraciones peligrosas detectadas ($desc):$found"
    fi
  fi
}

# DELETE FROM: permitir solo si tiene comentario "SAFE: ..." en la misma migración
check_delete() {
  local files
  files=$(grep -rln -E '\bDELETE\s+FROM\b' "$MIGRATIONS_DIR" 2>/dev/null || true)
  if [[ -n "$files" ]]; then
    while read -r f; do
      if grep -q '\bDELETE\s+FROM\b' "$f"; then
        if ! grep -q 'SAFE:\s*' "$f"; then
          echo "::error::DELETE FROM sin documentación SAFE en: $f"
          FAILED=1
        fi
      fi
    done <<< "$files"
  fi
}

echo "Verificando seguridad de migraciones en $MIGRATIONS_DIR..."

check_pattern '\bDROP\s+TABLE\b' "DROP TABLE"
check_pattern '\bTRUNCATE\b' "TRUNCATE"
check_pattern '\bDROP\s+SCHEMA\b' "DROP SCHEMA"
check_delete

if [[ $FAILED -eq 1 ]]; then
  echo "::error::Bloqueado: migraciones con SQL destructivo detectado."
  exit 1
fi

echo "OK: migraciones pasan el guardrail de seguridad."

```

================================================================
FILE: scripts/configure-supabase-secrets.sh
================================================================
```sh
#!/usr/bin/env bash
# Configure GitHub repository secrets for Supabase migrations
# Requires: gh CLI (https://cli.github.com/) authenticated
# Usage: ./scripts/configure-supabase-secrets.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is required. Install from https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: Run 'gh auth login' first."
  exit 1
fi

echo "=== Supabase GitHub Secrets Configuration ==="
echo ""
echo "You will need:"
echo "  1. SUPABASE_ACCESS_TOKEN - from https://supabase.com/dashboard/account/tokens"
echo "  2. SUPABASE_PROJECT_REF  - from Project Settings → General (e.g. abcdefghij)"
echo "  3. SUPABASE_DB_PASSWORD  - from Project Settings → Database"
echo ""
echo "Tip: Project ref can be extracted from VITE_SUPABASE_URL:"
echo "  https://<PROJECT_REF>.supabase.co"
echo ""

read -sp "SUPABASE_ACCESS_TOKEN: " TOKEN
echo ""
if [[ -z "$TOKEN" ]]; then
  echo "Error: Token cannot be empty."
  exit 1
fi

read -p "SUPABASE_PROJECT_REF: " REF
echo ""
if [[ -z "$REF" ]]; then
  echo "Error: Project ref cannot be empty."
  exit 1
fi

read -sp "SUPABASE_DB_PASSWORD: " DB_PASS
echo ""
if [[ -z "$DB_PASS" ]]; then
  echo "Error: Database password cannot be empty."
  exit 1
fi

echo ""
echo "Setting secrets..."

echo "$TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN
echo "$REF"   | gh secret set SUPABASE_PROJECT_REF
echo "$DB_PASS" | gh secret set SUPABASE_DB_PASSWORD

echo ""
echo "Done. Secrets configured:"
echo "  - SUPABASE_ACCESS_TOKEN"
echo "  - SUPABASE_PROJECT_REF"
echo "  - SUPABASE_DB_PASSWORD"
echo ""
echo "Next: Push a change to supabase/migrations/ or run the workflow manually."

```

================================================================
FILE: scripts/diagnose-project.js
================================================================
```js
#!/usr/bin/env node
/**
 * Diagnóstico del proyecto WaitMe.
 * Comprueba: .env, variables, estructura, build.
 * Uso: npm run diagnose
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_MAPBOX_TOKEN'];
const PLACEHOLDERS = ['PEGA_AQUI_EL_TOKEN', 'YOUR_MAPBOX_PUBLIC_TOKEN', 'tu_anon_key', 'TU_PROYECTO'];

let hasErrors = false;
let hasWarnings = false;

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg) {
  console.log(`  ⚠ ${msg}`);
  hasWarnings = true;
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  hasErrors = true;
}

function parseEnv(content) {
  const env = {};
  if (!content) return env;
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = (m[2] || '').trim();
  }
  return env;
}

console.log('\n=== Diagnóstico WaitMe ===\n');

// 1. Existencia de .env
const envPath = join(ROOT, '.env');
if (!existsSync(envPath)) {
  fail('.env no existe. Copia .env.example a .env y configura las variables.');
} else {
  ok('.env existe');
  const envContent = readFileSync(envPath, 'utf8');
  const env = parseEnv(envContent);

  // 2. Variables necesarias
  for (const key of REQUIRED_ENV) {
    const val = env[key];
    if (!val) {
      fail(`${key} no está definida en .env`);
    } else if (PLACEHOLDERS.some((p) => val.includes(p))) {
      warn(`${key} tiene valor placeholder. Sustituye por valor real.`);
    } else {
      ok(`${key} configurada`);
    }
  }

  // 3. Supabase
  const url = env.VITE_SUPABASE_URL || '';
  const key = env.VITE_SUPABASE_ANON_KEY || '';
  if (url && !url.includes('supabase.co')) {
    warn('VITE_SUPABASE_URL no parece una URL de Supabase válida');
  }
  if (url && key && !PLACEHOLDERS.some((p) => url.includes(p) || key.includes(p))) {
    ok('Supabase configurado (URL y anon key presentes)');
  }

  // 4. Mapbox
  const token = env.VITE_MAPBOX_TOKEN || '';
  if (token && !PLACEHOLDERS.some((p) => token.includes(p))) {
    if (token.startsWith('pk.')) {
      ok('Token Mapbox presente (formato pk.xxx)');
    } else {
      warn('VITE_MAPBOX_TOKEN no tiene formato pk.xxx típico');
    }
  }
}

// 5. Build de Vite
console.log('\n--- Build ---');
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  ok('Build de Vite posible');
} catch (e) {
  fail('Build falla. Ejecuta: npm run build');
}

// 6. Estructura básica
console.log('\n--- Estructura ---');
const requiredPaths = [
  'src/main.jsx',
  'src/App.jsx',
  'src/pages/Home.jsx',
  'src/lib/supabaseClient.js',
  'src/data/alerts.js',
  'supabase/migrations',
  'vite.config.js',
  'package.json',
];

for (const p of requiredPaths) {
  const full = join(ROOT, p);
  if (existsSync(full)) {
    ok(p);
  } else {
    fail(`${p} no existe`);
  }
}

// Resumen
console.log('\n--- Resumen ---');
if (hasErrors) {
  console.log('\n  Hay errores. Revisa los mensajes anteriores.');
  process.exit(1);
}
if (hasWarnings) {
  console.log('\n  Hay advertencias. El proyecto puede funcionar pero revisa la configuración.');
  process.exit(0);
}
console.log('\n  Todo OK. El proyecto está listo para desarrollo.\n');
process.exit(0);

```

================================================================
FILE: scripts/export-codebase.js
================================================================
```js
#!/usr/bin/env node
/**
 * Export codebase to markdown files for documentation/LLM context.
 * Splits output into ~80KB parts and creates an index.
 */

import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const PART_SIZE = 80 * 1024; // ~80KB
const OUTPUT_PREFIX = 'CODEBASE_EXPORT_PART';

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'storybook-static',
  '.git',
  'quarantine',
  'ios/App/App/public/assets',
]);

const EXCLUDE_FILES = new Set(['package-lock.json']);
const EXCLUDE_PATTERNS = [
  /package-lock.json$/, 
  /.log$/, 
  /playwright-report\//, 
  /test-results\//,
  /\.env$/,
  /\.xcuserstate$/,
];

const TEXT_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.json', '.jsonc', '.json5',
  '.md', '.mdx', '.markdown',
  '.html', '.htm', '.xhtml',
  '.css', '.scss', '.sass', '.less',
  '.yml', '.yaml',
  '.xml', '.toml', '.ini', '.cfg', '.conf',
  '.sh', '.bash', '.zsh', '.fish',
  '.sql', '.graphql', '.gql',
  '.vue', '.svelte', '.astro',
  '.py', '.rb', '.php', '.java', '.kt', '.swift', '.go', '.rs',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx',
  '.r', '.R', '.jl', '.lua', '.pl', '.pm',
  '.txt', '.log', '.csv', '.tsv',
  '.lock', '.config', '.rc',
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.svg',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.exe', '.dll', '.so', '.dylib', '.a', '.o',
  '.pdf', '.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.webp', '.avif',
  '.wasm', '.map', '.bin',
]);

function shouldExclude(path) {
  const rel = relative(ROOT, path);
  for (const part of rel.split(/[/\\]/)) {
    if (EXCLUDE_DIRS.has(part)) return true;
  }
  if (rel.includes('ios/App/App/public/assets')) return true;
  if (rel.includes('CODEBASE_EXPORT')) return true;
  if (EXCLUDE_FILES.has(rel.split(/[/\\]/).pop())) return true;
  for (const re of EXCLUDE_PATTERNS) {
    if (re.test(rel)) return true;
  }
  const ext = extname(path).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;
  return false;
}

function isTextFile(path) {
  const ext = extname(path).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (ext === '' && !path.includes('.')) return false;
  return false;
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!shouldExclude(full)) await walk(full, files);
    } else if (e.isFile()) {
      if (!shouldExclude(full) && isTextFile(full)) files.push(full);
    }
  }
  return files;
}

async function safeRead(path) {
  try {
    const buf = await readFile(path);
    const str = buf.toString('utf8');
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(str)) return null;
    return str;
  } catch {
    return null;
  }
}

function getExt(path) {
  const ext = extname(path).toLowerCase();
  return ext || 'txt';
}

async function main() {
  await mkdir(DOCS_DIR, { recursive: true });

  const existing = await readdir(DOCS_DIR).catch(() => []);
  for (const name of existing) {
    if (name.startsWith(OUTPUT_PREFIX) || name === 'CODEBASE_EXPORT_INDEX.md') {
      await unlink(join(DOCS_DIR, name));
    }
  }

  const files = await walk(ROOT);
  files.sort();

  const tree = {};
  for (const f of files) {
    const rel = relative(ROOT, f);
    const parts = rel.split(/[/\\]/);
    let cur = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p]) cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = null;
  }

  function treeToStr(obj, indent = '') {
    let out = '';
    const keys = Object.keys(obj).sort();
    for (const k of keys) {
      if (obj[k] === null) {
        out += indent + k + '\n';
      } else {
        out += indent + k + '/\n';
        out += treeToStr(obj[k], indent + '  ');
      }
    }
    return out;
  }

  const tempParts = [];
  let current = '';
  let partNum = 1;

  for (const f of files) {
    const content = await safeRead(f);
    if (content === null) continue;

    const rel = relative(ROOT, f);
    const ext = getExt(f);
    const block = [
      '',
      '='.repeat(64),
      `FILE: ${rel}`,
      '='.repeat(64),
      '```' + ext.replace(/^\./, '') + '\n' + content + '\n```',
      '',
    ].join('\n');

    if (current.length + block.length > PART_SIZE && current.length > 0) {
      tempParts.push(current);
      current = '';
      partNum++;
    }
    current += block;
  }
  if (current) tempParts.push(current);

  const partPaths = [];
  for (let i = 0; i < tempParts.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const name = `${OUTPUT_PREFIX}_${num}.md`;
    const outPath = join(DOCS_DIR, name);
    await writeFile(outPath, tempParts[i], 'utf8');
    partPaths.push(`docs/${name}`);
  }

  const indexContent = [
    '# Codebase Export Index',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total files: ${files.length}`,
    `Parts: ${tempParts.length}`,
    '',
    '## File tree',
    '',
    '```',
    treeToStr(tree),
    '```',
    '',
    '## Parts',
    '',
    ...partPaths.map((p, i) => `- [${OUTPUT_PREFIX}_${String(i + 1).padStart(2, '0')}.md](${p})`),
    '',
  ].join('\n');

  const indexPath = join(DOCS_DIR, 'CODEBASE_EXPORT_INDEX.md');
  await writeFile(indexPath, indexContent, 'utf8');

  const allPaths = ['docs/CODEBASE_EXPORT_INDEX.md', ...partPaths];
  console.log(allPaths.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

```

================================================================
FILE: scripts/github_hardening.sh
================================================================
```sh
#!/usr/bin/env bash
# github_hardening.sh — Blinda main con branch protection y environment production
# Requiere: gh CLI instalado y autenticado (gh auth login)
set -euo pipefail

if ! command -v gh &>/dev/null; then
  echo "Error: 'gh' (GitHub CLI) no está instalado."
  echo "  Instala: https://cli.github.com/ (brew install gh en macOS)"
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-}"
if [[ -z "$REPO" ]]; then
  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi
if [[ -z "$REPO" ]]; then
  # Fallback: extraer de git remote
  REMOTE=$(git remote get-url origin 2>/dev/null || true)
  if [[ "$REMOTE" =~ github\.com[:/]([^/]+/[^/.]+) ]]; then
    REPO="${BASH_REMATCH[1]%.git}"
  fi
fi
if [[ -z "$REPO" ]]; then
  echo "Error: No se pudo detectar el repo. Ejecuta desde un repo git con 'gh auth login'."
  exit 1
fi

BRANCH="${1:-main}"
CI_FILE=".github/workflows/ci.yml"

echo "=== GitHub Hardening ==="
echo "Repo: $REPO"
echo "Branch: $BRANCH"
echo ""

# 1) Extraer status checks del workflow ci.yml
# El check que bloquea merge es el nombre del job. GitHub Actions usa el job name como context.
# Solo job-level "name:" (4 espacios), no step names (6+ espacios)
STATUS_CHECKS=()
if [[ -f "$CI_FILE" ]]; then
  while IFS= read -r line; do
    cleaned=$(echo "$line" | sed 's/^[[:space:]]*name:[[:space:]]*["'\'']*//;s/["'\'']*[[:space:]]*$//')
    [[ -n "$cleaned" ]] && STATUS_CHECKS+=("$cleaned")
  done < <(grep -E '^    name:' "$CI_FILE" | head -20 | sed 's/^[[:space:]]*name:[[:space:]]*//;s/["'\'']//g')
  if [[ ${#STATUS_CHECKS[@]} -eq 0 ]]; then
    workflow_name=$(grep -m1 "^name:" "$CI_FILE" | sed 's/^name:[[:space:]]*//;s/["'\'']//g' | tr -d ' ')
    [[ -n "$workflow_name" ]] && STATUS_CHECKS=("$workflow_name")
  fi
fi
[[ ${#STATUS_CHECKS[@]} -eq 0 ]] && STATUS_CHECKS=("CI")

# Construir array JSON
CONTEXTS_JSON=$(printf '%s\n' "${STATUS_CHECKS[@]}" | jq -R . | jq -s .)
echo "Status checks a requerir: $CONTEXTS_JSON"
echo ""

# 2) Branch protection
echo ">>> Configurando branch protection en $BRANCH..."
PROTECTION_PAYLOAD=$(jq -n \
  --argjson contexts "$CONTEXTS_JSON" \
  '{
    required_status_checks: { strict: true, contexts: $contexts },
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    required_linear_history: true
  }')

if echo "$PROTECTION_PAYLOAD" | gh api "repos/$REPO/branches/$BRANCH/protection" -X PUT --input - 2>&1; then
  echo "✓ Branch protection aplicada."
else
  echo ":::error::Falló branch protection. ¿Tienes permisos admin? (Settings → Collaborators)"
  exit 1
fi

# 3) Environment production (opcional — a menudo requiere permisos especiales)
echo ""
echo ">>> Intentando configurar environment 'production' con required reviewers..."
CURRENT_USER_ID=$(gh api user -q .id 2>/dev/null || true)
if [[ -n "$CURRENT_USER_ID" ]]; then
  ENV_PAYLOAD=$(jq -n --argjson uid "$CURRENT_USER_ID" '{reviewers: [{type: "User", id: $uid}]}')
  if echo "$ENV_PAYLOAD" | gh api "repos/$REPO/environments/production" -X PUT --input - 2>/dev/null; then
    echo "✓ Environment 'production' creado/actualizado con required reviewers."
  else
    echo "⚠ No se pudo configurar environment por API (permisos o plan)."
    echo "  Sigue docs/ONE_TIME_GITHUB_CLICKS.md para hacerlo manualmente."
  fi
else
  echo "⚠ No se pudo obtener user ID. Sigue docs/ONE_TIME_GITHUB_CLICKS.md."
fi

echo ""
echo "=== Hardening completado ==="

```

================================================================
FILE: scripts/ios-reset.sh
================================================================
```sh
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "[ios:reset] 1. Backup ios..."
if [ -d ios ]; then
  BACKUP="ios__backup_black_screen__$(date +%Y%m%d_%H%M%S)"
  mv ios "$BACKUP"
  echo "  → Backup en $BACKUP"
fi

echo "[ios:reset] 2. Regenerar iOS..."
npx cap add ios

echo "[ios:reset] 3. Build y sync..."
npm run build
npx cap sync ios

echo "[ios:reset] 4. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:reset] 5. Buscar simulador iPhone 16e o similar..."
DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e|iPhone 16 |iPhone 17" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi

echo "[ios:reset] 6. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:reset] 7. Desinstalar app anterior..."
xcrun simctl uninstall "$DEVICE" com.waitme.app 2>/dev/null || true

echo "[ios:reset] 8. Instalar y lanzar..."
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" com.waitme.app

echo "[ios:reset] ✓ Listo. App lanzada en simulador."

```

================================================================
FILE: scripts/ios-run.sh
================================================================
```sh
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

BUNDLE_ID="com.waitme.app"
LOG_FILE="ios_run_last.log"

echo "[ios:run] 1. Clean..."
rm -rf dist
rm -rf ios/App/App/public

echo "[ios:run] 1b. Validar .env (solo WARNING)..."
if [ ! -f ".env" ]; then
  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "!!  WARNING: No existe archivo .env                                 !!"
  echo "!!  La app mostrará MissingEnvScreen en iOS.                        !!"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo ""
else
  HAS_URL=$(grep -E "^VITE_SUPABASE_URL=.+" .env 2>/dev/null | wc -l)
  HAS_KEY=$(grep -E "^VITE_SUPABASE_ANON_KEY=.+" .env 2>/dev/null | wc -l)
  if [ "${HAS_URL:-0}" -lt 1 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!  WARNING: VITE_SUPABASE_URL no encontrado o vacío en .env       !!"
    echo "!!  La app mostrará MissingEnvScreen en iOS si falta.               !!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo ""
  fi
  if [ "${HAS_KEY:-0}" -lt 1 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "!!  WARNING: VITE_SUPABASE_ANON_KEY no encontrado o vacío en .env   !!"
    echo "!!  La app mostrará MissingEnvScreen en iOS si falta.               !!"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo ""
  fi
fi

echo "[ios:run] 2. Build..."
npm run build

echo "[ios:run] 2b. Validar dist..."
if [ ! -f "dist/index.html" ]; then
  echo "[ios:run] ERROR: dist/index.html no existe"
  exit 1
fi
DIST_ENTRY=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$DIST_ENTRY" ]; then
  echo "[ios:run] ERROR: No existe dist/assets/index-*.js"
  exit 1
fi
echo "[ios:run]   dist/index.html OK, dist/assets/index-*.js OK"

echo "[ios:run] 3. Sync iOS..."
npx cap sync ios

echo "[ios:run] 4. Validar bundle iOS..."
if [ ! -f "ios/App/App/public/index.html" ]; then
  echo "[ios:run] ERROR: ios/App/App/public/index.html no existe"
  exit 1
fi
IOS_ENTRY=$(find ios/App/App/public/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -z "$IOS_ENTRY" ]; then
  echo "[ios:run] ERROR: No existe ios/App/App/public/assets/index-*.js"
  exit 1
fi
echo "[ios:run]   ios/App/App/public OK (index.html + assets/index-*.js)"

echo "[ios:run] 5. Compilar .app..."
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ./DerivedData build -quiet
cd ../..

APP_PATH="ios/App/DerivedData/Build/Products/Debug-iphonesimulator/App.app"

echo "[ios:run] 6. Buscar simulador (booted primero, sino iPhone 16e/16)..."
DEVICE=$(xcrun simctl list devices | grep "Booted" | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep -E "iPhone 16e|iPhone 16 |iPhone 17" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi
if [ -z "$DEVICE" ]; then
  DEVICE=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)
fi

if [ -z "$DEVICE" ]; then
  echo "[ios:run] ERROR: No se encontró simulador."
  exit 1
fi

SIM_NAME=$(xcrun simctl list devices | grep "$DEVICE" | head -1 | xargs)
echo "[ios:run] 7. Boot simulador si hace falta..."
xcrun simctl boot "$DEVICE" 2>/dev/null || true

echo "[ios:run] 8. Desinstalar app anterior..."
xcrun simctl uninstall "$DEVICE" "$BUNDLE_ID" 2>/dev/null || true

echo "[ios:run] 9. Instalar y lanzar..."
xcrun simctl install "$DEVICE" "$APP_PATH"
xcrun simctl launch "$DEVICE" "$BUNDLE_ID"

echo ""
echo "--- LAUNCHED OK ---"
echo "Bundle ID: $BUNDLE_ID"
echo "Simulador: $SIM_NAME"
echo ""

echo "[ios:run] 10. Capturando logs 12 segundos..."
log stream --style compact 2>&1 > "$LOG_FILE" &
LOGPID=$!
sleep 12
kill $LOGPID 2>/dev/null || true
if [ ! -s "$LOG_FILE" ]; then
  echo "NO LOGS CAPTURED" > "$LOG_FILE"
fi

echo ""
echo "--- TOP ERRORS ---"
if [ -f "$LOG_FILE" ]; then
  grep -iE "error|exception|failed|webkit|capacitor|chunk|module|router|auth" "$LOG_FILE" 2>/dev/null | head -40 || echo "(ninguna línea con error/exception/failed/webkit/capacitor/chunk/module/router/auth)"
else
  echo "NO LOGS CAPTURED"
fi
echo ""
echo "--- LAST 80 LINES ---"
if [ -f "$LOG_FILE" ]; then
  tail -80 "$LOG_FILE"
else
  echo "NO LOGS CAPTURED"
fi
echo ""
echo "Log completo guardado en: $LOG_FILE"

```

================================================================
FILE: scripts/run-profile-migration.mjs
================================================================
```mjs
#!/usr/bin/env node
/**
 * Ejecuta la migración de profiles directamente contra la base de datos.
 * Requiere: SUPABASE_DB_URL en .env o en entorno
 * Obtener en: Supabase Dashboard → Settings → Database → Connection string → URI
 * Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const migrationPath = join(rootDir, 'supabase/migrations/20260305120000_fix_profiles_rls_and_trigger.sql');

// Cargar .env si existe
const envPath = join(rootDir, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Error: SUPABASE_DB_URL no configurado.');
  console.error('  Obtener en: Supabase Dashboard → Settings → Database → Connection string → URI');
  console.error('  Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
  process.exit(1);
}

async function run() {
  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const sql = readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    console.log('Migración aplicada correctamente.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

```

================================================================
FILE: scripts/ship.sh
================================================================
```sh
#!/usr/bin/env bash
# Lint, fix, check, then commit and push.
# Usage: npm run ship

set -e

cd "$(dirname "$0")/.."

echo "=== Lint (with auto-fix) ==="
npm run lint:fix

echo ""
echo "=== Build check ==="
npm run build

echo ""
echo "=== Staging changes ==="
git add .
if ! git diff --staged --quiet 2>/dev/null; then
  echo "Committing (post-commit will push)..."
  git commit -m "chore: auto-update"
  echo "Done."
else
  echo "No changes to commit."
fi

```

================================================================
FILE: scripts/supabase-migrate.sh
================================================================
```sh
#!/usr/bin/env bash
# Aplica migraciones de Supabase al proyecto remoto.
# Requiere: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
# Obtener: https://supabase.com/dashboard/account/tokens (token)
#          Project Settings → General (ref)
#          Project Settings → Database (password)

set -e
cd "$(dirname "$0")/.."

# Cargar .env si existe (para VITE_SUPABASE_URL)
if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

# Project ref: desde env o extraer de VITE_SUPABASE_URL
REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "$REF" ] && [ -n "$VITE_SUPABASE_URL" ]; then
  REF=$(echo "$VITE_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
fi

TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
PASS="${SUPABASE_DB_PASSWORD:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN no configurado."
  echo "  Obtener en: https://supabase.com/dashboard/account/tokens"
  echo "  Ejecutar: export SUPABASE_ACCESS_TOKEN=tu_token"
  exit 1
fi

if [ -z "$REF" ]; then
  echo "Error: SUPABASE_PROJECT_REF no configurado."
  echo "  Obtener en: Project Settings → General (Reference ID)"
  echo "  O configurar VITE_SUPABASE_URL en .env"
  exit 1
fi

if [ -z "$PASS" ]; then
  echo "Error: SUPABASE_DB_PASSWORD no configurado."
  echo "  Obtener en: Project Settings → Database"
  echo "  Ejecutar: export SUPABASE_DB_PASSWORD=tu_password"
  exit 1
fi

echo "Enlazando proyecto $REF..."
npx supabase link --project-ref "$REF" --password "$PASS" --yes

echo "Aplicando migraciones..."
npx supabase db push --password "$PASS"

echo "Migraciones aplicadas correctamente."

```

================================================================
FILE: src/App.jsx
================================================================
```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import Layout from './Layout';
import Login from '@/pages/Login';
import DemoFlowManager from '@/components/DemoFlowManager';
import WaitMeRequestScheduler from '@/components/WaitMeRequestScheduler';
import IncomingRequestModal from '@/components/IncomingRequestModal';
import { useAuth } from '@/lib/AuthContext';
import { getSupabase } from '@/lib/supabaseClient';

async function processOAuthUrl(url, onSuccess) {
  if (!url?.startsWith('capacitor://localhost')) return false;
  try {
    await Browser.close();
  } catch {
    /* no-op */
  }
  const hash = url.split('#')[1];
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return false;
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return false;
  onSuccess?.();
  return true;
}

function AuthRouter() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div style={{ background: '#000', color: '#fff', padding: 24 }}>Cargando...</div>;
  }

  if (!user?.id) {
    return <Login />;
  }

  return (
    <>
      <DemoFlowManager />
      <WaitMeRequestScheduler />
      <IncomingRequestModal />
      <Layout />
    </>
  );
}

export default function App() {
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initStatusBar = async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // No-op en web / entorno no-Capacitor
      }
    };
    initStatusBar();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onOAuthSuccess = () => {
      checkUserAuth();
      navigate('/', { replace: true });
    };
    const handleUrl = async (url) => {
      await processOAuthUrl(url, onOAuthSuccess);
    };
    const handleAppUrlOpen = ({ url }) => handleUrl(url);
    let sub;
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen).then((s) => (sub = s));
    CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) handleUrl(result.url);
    }).catch(() => {});
    return () => sub?.remove?.();
  }, [checkUserAuth, navigate]);

  return (
    <div
      className="min-h-[100dvh] bg-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <AuthRouter />
    </div>
  );
}

```

================================================================
FILE: src/Layout.jsx
================================================================
```jsx
import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:Layout] ${msg}`, extra ?? '');
    } catch {}
  }
};
import { useEffect } from 'react';
import { LayoutProvider, useLayoutHeaderConfig } from '@/lib/LayoutContext';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Home from './pages/Home';

const Chats            = lazy(() => import('./pages/Chats'));
const Chat             = lazy(() => import('./pages/Chat'));
const Notifications    = lazy(() => import('./pages/Notifications'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Profile          = lazy(() => import('./pages/Profile'));
const Settings         = lazy(() => import('./pages/Settings'));
const Alertas          = lazy(() => import('./pages/History'));
const NavigatePage     = lazy(() => import('./pages/Navigate'));
const DevDiagnostics   = import.meta.env.DEV ? lazy(() => import('./pages/DevDiagnostics')) : null;

const ROUTE_HEADER = {
  '/': { title: 'WaitMe!' },
  '/home': { title: 'WaitMe!' },
  '/Home': { title: 'WaitMe!' },
  '/chats': { title: 'Chats', showBackButton: true, backTo: 'Home' },
  '/chat': { title: 'Chat', showBackButton: true, backTo: 'Chats' },
  '/notifications': { title: 'Notificaciones', showBackButton: true, backTo: 'Home', titleClassName: 'text-[20px] leading-[20px]' },
  '/notification-settings': { title: 'Notificaciones', showBackButton: true, backTo: 'Settings' },
  '/profile': { title: 'Mi Perfil', showBackButton: true },
  '/settings': { title: 'Ajustes', showBackButton: true, backTo: 'Home' },
  '/history': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/alertas': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/alerts': { title: 'Alertas', showBackButton: true, backTo: 'Home' },
  '/navigate': { title: 'Navegación', showBackButton: true, backTo: 'History', titleClassName: 'text-[13px] leading-[13px] font-semibold select-none text-center max-w-xs' },
  '/dev-diagnostics': { title: 'Dev Diagnostics', showBackButton: true, backTo: 'Home' },
};

function LayoutShell() {
  const location = useLocation();
  const path = location.pathname;
  RENDER_LOG('LayoutShell ENTER', { path });
  const routeConfig = ROUTE_HEADER[path] || ROUTE_HEADER['/'];
  const ctxConfig = useLayoutHeaderConfig();
  const baseConfig = { title: 'WaitMe!', showBackButton: false, backTo: null, onBack: null, onTitleClick: null, titleClassName: 'text-[24px] leading-[24px]' };
  const merged = { ...baseConfig, ...routeConfig, ...ctxConfig };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-black">
      <Header
        title={merged.title}
        showBackButton={merged.showBackButton}
        backTo={merged.backTo}
        onBack={merged.onBack}
        onTitleClick={merged.onTitleClick}
        titleClassName={merged.titleClassName}
      />
      <main className="flex-1 min-h-0 flex flex-col pt-[69px] pb-24">
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function Layout() {
  RENDER_LOG('Layout ENTER');
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), layoutMounted: true };
      return () => {
        window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), layoutMounted: false };
      };
    }
  }, []);
  useRealtimeAlerts(); // no-op si VITE_DISABLE_REALTIME=true
  RENDER_LOG('Layout RENDER Routes');
  return (
    <LayoutProvider>
      <Routes>
        <Route path="/" element={<LayoutShell />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="Home" element={<Home />} />
          <Route path="chats" element={<Chats />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notification-settings" element={<NotificationSettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="history" element={<Alertas />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="alerts" element={<Alertas />} />
          <Route path="navigate" element={<NavigatePage />} />
          {DevDiagnostics && <Route path="dev-diagnostics" element={<DevDiagnostics />} />}
        </Route>
      </Routes>
    </LayoutProvider>
  );
}

```

================================================================
FILE: src/components/AddressAutocompleteInput.jsx
================================================================
```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input con sugerencias de calles SOLO de España (Nominatim).
 * - Mantiene el look del <Input /> existente.
 * - Usa <datalist> nativo (cero cambios visuales extra).
 */
export default function AddressAutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  autoFocus,
  idPrefix = 'addr',
  limit = 6,
}) {
  const listId = useMemo(() => `${idPrefix}-datalist-${Math.random().toString(36).slice(2)}`, [idPrefix]);
  const [options, setOptions] = useState([]);
  const lastQueryRef = useRef('');
  const abortRef = useRef(null);

  useEffect(() => {
    const q = (value || '').trim();
    lastQueryRef.current = q;

    // Si está vacío o muy corto, no pedimos nada
    if (q.length < 3) {
      setOptions([]);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = null;
      return;
    }

    const t = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // España (viewbox aproximado + bounded=1 para forzar dentro)
        // lon_left, lat_top, lon_right, lat_bottom
        const viewbox = '-9.5,43.9,4.4,35.7';

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('q', q);
        url.searchParams.set('countrycodes', 'es');
        url.searchParams.set('featuretype', 'street');
        url.searchParams.set('bounded', '1');
        url.searchParams.set('viewbox', viewbox);
        url.searchParams.set('accept-language', 'es');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            // Nominatim recomienda identificar el cliente; sin emails/keys aquí.
            'Accept': 'application/json',
          },
        });
        if (!res.ok) return;

        const data = await res.json();
        const onlyStreets = Array.isArray(data)
          ? data.filter((it) => {
              const cls = String(it?.class || '').toLowerCase();
              const type = String(it?.type || '').toLowerCase();
              if (cls !== 'highway') return false;
              // Tipos de vía comunes
              return ['residential','tertiary','primary','secondary','unclassified','living_street','service','road','pedestrian'].includes(type);
            })
          : [];
        // Evita respuestas viejas si el usuario siguió escribiendo
        if (lastQueryRef.current !== q) return;

        const mapped = Array.isArray(onlyStreets)
          ? onlyStreets
              .map((it) => it?.display_name)
              .filter(Boolean)
              .slice(0, limit)
          : [];

        setOptions(mapped);
      } catch (e) {
        // Abort o red: silencioso
      }
    }, 200);

    return () => clearTimeout(t);
  }, [value, limit]);

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}

```

================================================================
FILE: src/components/BottomNav.jsx
================================================================
```jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { getVisibleActiveSellerAlerts, readHiddenKeys } from '@/lib/alertSelectors';
import { useMyAlerts } from '@/hooks/useMyAlerts';

const BASE_BTN =
  'flex-1 flex flex-col items-center justify-center text-purple-400 ' +
  'h-[60px] rounded-lg mx-1';
const ACTIVE_STYLE = 'bg-purple-700/30 border border-purple-500/50';
const LABEL_CLASS = 'text-[10px] font-bold leading-none mt-[2px] whitespace-nowrap';
const LABEL_CLASS_LONG = 'text-[9px] font-bold leading-none mt-[2px] whitespace-nowrap tracking-tight';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatUnread, setChatUnread] = useState(0);

  // Escuchar evento cuando llega un waitme aceptado o mensaje nuevo
  useEffect(() => {
    const handler = () => {
      try {
        const count = parseInt(localStorage.getItem('waitme:chat_unread') || '0', 10);
        setChatUnread(isNaN(count) ? 0 : count);
      } catch {}
    };
    handler(); // cargar inicial
    window.addEventListener('waitme:chatUnreadUpdate', handler);
    window.addEventListener('waitme:acceptedWaitMe', handler);
    return () => {
      window.removeEventListener('waitme:chatUnreadUpdate', handler);
      window.removeEventListener('waitme:acceptedWaitMe', handler);
    };
  }, []);

  // Una sola fuente de verdad: myAlerts (el badge se deriva de aquí)
  const { data: myAlerts = [], isFetched } = useMyAlerts();

  // activeCount = exact number of visible seller alerts in "Tus alertas → Activas".
  // Same selector as HistorySellerView so badge and list are always in sync.
  // Falls back to 0 until data is fetched (no ghost badge).
  const activeCount = useMemo(() => {
    if (!isFetched) return 0;
    const hiddenKeys = readHiddenKeys();
    return getVisibleActiveSellerAlerts(myAlerts, user?.id, user?.email, hiddenKeys).length;
  }, [isFetched, myAlerts, user?.id, user?.email]);

  // Refresco inmediato (cuando se crea/cancela/expira una alerta)
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'], refetchType: 'none' });
    };
    window.addEventListener('waitme:badgeRefresh', handler);
    return () => window.removeEventListener('waitme:badgeRefresh', handler);
  }, [queryClient]);

  const handleChatsClick = useCallback(() => {
    try { localStorage.setItem('waitme:chat_unread', '0'); setChatUnread(0); } catch {}
  }, []);

  const divider = <div className="w-px h-8 bg-gray-700" />;

  const isMapActive = location.pathname === '/';

  const handleMapClick = useCallback(
    (e) => {
      e?.preventDefault?.();
      try {
        window.dispatchEvent(new Event('waitme:goLogo'));
      } catch {}
      navigate('/', { replace: false });
    },
    [navigate]
  );

  return (
    <nav data-waitme-nav className="fixed bottom-0 left-0 right-0 px-4 pt-[6px] z-[2147483647] pointer-events-auto" style={{ backgroundColor: '#0B0B0F', borderTop: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'calc(4px + env(safe-area-inset-bottom, 0px))', paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))', paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))' }}>
      <div className="flex items-center max-w-md mx-auto pointer-events-auto">
        <NavLink
          to="/history"
          className={({ isActive }) => `${BASE_BTN} ${isActive ? ACTIVE_STYLE : ''}`}
          onClick={(e) => {
            e.preventDefault();
            navigate('/history');
          }}
        >
          <div className="relative">
            {activeCount > 0 && (
              <span
                // Ajuste fino: +4px derecha (número más centrado)
                className="absolute left-[-16px] top-[4px] w-5 h-5 rounded-full bg-green-500/25 border border-green-500/40 flex items-center justify-center text-[11px] font-extrabold text-green-200 shadow-md"
              >
                {activeCount > 9 ? '9+' : activeCount}
              </span>
            )}
            <svg
              className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path d="M30 8 L14 8 L14 5 L8 10 L14 15 L14 12 L30 12 Z" fill="currentColor" />
              <path d="M2 20 L18 20 L18 17 L24 22 L18 27 L18 24 L2 24 Z" fill="currentColor" />
            </svg>
          </div>
          <span className={LABEL_CLASS}>Alertas</span>
        </NavLink>

        {divider}

        {/* MAPA: no usar NavLink aquí, porque si ya estás en "/" no fuerza el reset del Home */}
        <a
          href="/"
          onClick={handleMapClick}
          className={`${BASE_BTN} ${isMapActive ? ACTIVE_STYLE : ''}`}
        >
          <svg
            className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className={LABEL_CLASS}>Mapa</span>
        </a>

        {divider}

        <NavLink
          to="/chats"
          className={({ isActive }) => `${BASE_BTN} ${isActive ? ACTIVE_STYLE : ''}`}
          onClick={(e) => {
            e.preventDefault();
            handleChatsClick();
            navigate('/chats');
          }}
        >
          <div className="relative">
            {chatUnread > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-black text-white z-10 border border-red-400 shadow-lg shadow-red-500/40">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
            <MessageCircle className="w-10 h-10 drop-shadow-[0_0_1px_rgba(255,255,255,0.85)]" />
          </div>
          <span className={LABEL_CLASS}>Chats</span>
        </NavLink>
      </div>
    </nav>
  );
}
```

================================================================
FILE: src/components/CenterPin.jsx
================================================================
```jsx
/**
 * Pin central tipo Uber — elemento UI fijo, no parte del mapa.
 * Posicionado exactamente entre StreetSearch y CreateAlertCard cuando top es medido.
 * El mapa se mueve por debajo; este pin NO se mueve.
 * @param {number} [top] — top en px (medido con ResizeObserver). Si no se pasa, usa calc(50% - 60px).
 * @param {string} [className] — clases adicionales (ej. pointer-events-none).
 */
export default function CenterPin({ top, className = '' }) {
  return (
    <div
      className={`absolute z-10 pointer-events-none flex flex-col items-center ${className}`.trim()}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        top: typeof top === 'number' ? `${top}px` : 'calc(50% - 60px)',
        width: 18,
      }}
    >
      <div
        className="w-[18px] h-[18px] rounded-full bg-purple-500"
        style={{ boxShadow: '0 0 15px rgba(168,85,247,0.8)' }}
      />
      <div className="w-0.5 h-9 bg-purple-500" />
    </div>
  );
}

```

================================================================
FILE: src/components/CreateMapOverlay.jsx
================================================================
```jsx
/**
 * Overlay "Estoy aparcado aquí" — SIN wrapper fullscreen.
 * Solo tarjeta, pin y zoom. La zona libre queda sin elementos → canvas recibe gestos.
 */
import { useEffect, useRef, useState } from 'react';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import CenterPin from '@/components/CenterPin';
import MapZoomControls from '@/components/MapZoomControls';

const PIN_HEIGHT = 54;
const HEADER_BOTTOM = 60;
/** MapboxMap container top from viewport (Layout main pt-[69px]) */
const MAP_TOP_VIEWPORT = 69;

export default function CreateMapOverlay({
  address,
  onAddressChange,
  onUseCurrentLocation,
  onRecenter,
  onCreateAlert,
  isLoading,
  mapRef,
}) {
  const cardRef = useRef(null);
  const [pinTop, setPinTop] = useState(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updatePinPosition = () => {
      const cardRect = card.getBoundingClientRect();
      const midPoint = (HEADER_BOTTOM + cardRect.top) / 2;
      const pinTopViewport = midPoint - PIN_HEIGHT;
      const pinTopInMap = pinTopViewport - MAP_TOP_VIEWPORT;
      setPinTop(Math.max(0, pinTopInMap));
    };

    updatePinPosition();
    const ro = new ResizeObserver(updatePinPosition);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
      {/* Tarjeta — pointer-events-auto solo en su área */}
      <div
        ref={cardRef}
        className="absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[460px] min-h-[200px] z-20 pointer-events-auto"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
          maxHeight: 'min(55vh, 340px)',
          overflowY: 'auto',
        }}
      >
        <CreateAlertCard
          address={address}
          onAddressChange={onAddressChange}
          onUseCurrentLocation={onUseCurrentLocation}
          onRecenter={onRecenter}
          mapRef={mapRef}
          useCurrentLocationLabel="Ubicación actual"
          onCreateAlert={onCreateAlert}
          isLoading={isLoading}
        />
      </div>

      {/* Pin — pointer-events-none para que pase al canvas */}
      {pinTop != null && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: 0 }}>
          <CenterPin top={pinTop} />
        </div>
      )}

      {/* Zoom — alineado con borde izquierdo de tarjeta (4% = mitad del margen 92%) */}
      <MapZoomControls mapRef={mapRef} className="left-[4%]" />
    </div>
  );
}

```

================================================================
FILE: src/components/CreateMapOverlay.stories.jsx
================================================================
```jsx
import CreateMapOverlay from './CreateMapOverlay';

export default {
  title: 'Components/CreateMapOverlay',
  component: CreateMapOverlay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  decorators: [
    (Story) => (
      <div className="relative w-full min-h-[500px] bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    address: 'C/ Campoamor, 13',
    onAddressChange: () => {},
    onUseCurrentLocation: () => {},
    onRecenter: () => {},
    onCreateAlert: () => {},
    isLoading: false,
    mapRef: { current: null },
  },
};

export const Loading = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

```

================================================================
FILE: src/components/DemoFlowManager.jsx
================================================================
```jsx

/* ======================================================
   DEMO CENTRAL ÚNICO (LIMPIO + SINCRONIZADO)
   - Unifica datos para Home / History / Chats / Chat / Notifications
   - Mantiene la app “viva” siempre
   - Compatibilidad: exports legacy + aliases
====================================================== */

let started = false;
let tickTimer = null;
const listeners = new Set();

function safeCall(fn) { try { fn?.(); } catch {} }
function notify() { listeners.forEach((l) => safeCall(l)); }

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function normalize(s) { return String(s || '').trim().toLowerCase(); }

function statusToTitle(status) {
  const s = normalize(status);
  if (s === 'thinking' || s === 'me_lo_pienso' || s === 'me lo pienso' || s === 'pending') return 'ME LO PIENSO';
  if (s === 'extended' || s === 'prorroga' || s === 'prórroga' || s === 'prorrogada') return 'PRÓRROGA';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancelada') return 'CANCELADA';
  if (s === 'expired' || s === 'expirada' || s === 'agotada') return 'AGOTADA';
  if (s === 'rejected' || s === 'rechazada') return 'RECHAZADA';
  if (s === 'completed' || s === 'completada') return 'COMPLETADA';
  if (s === 'reserved' || s === 'activa' || s === 'active') return 'ACTIVA';
  return 'ACTUALIZACIÓN';
}

/* ======================================================
   ESTADO DEMO (ÚNICA FUENTE DE VERDAD)
====================================================== */

export const demoFlow = {
  me: { id: 'me', name: 'Tú', photo: null },

  users: [],
  alerts: [],

  // lista para Chats
  conversations: [],

  // messages[conversationId] = []
  messages: {},

  // lista para Notifications
  notifications: []
};

/* ======================================================
   HELPERS INTERNOS
====================================================== */

function getConversation(conversationId) {
  return (demoFlow.conversations || []).find((c) => c.id === conversationId) || null;
}

function getAlert(alertId) {
  return (demoFlow.alerts || []).find((a) => a.id === alertId) || null;
}

function ensureMessagesArray(conversationId) {
  if (!demoFlow.messages) demoFlow.messages = {};
  if (!demoFlow.messages[conversationId]) demoFlow.messages[conversationId] = [];
  return demoFlow.messages[conversationId];
}

function pushMessage(conversationId, { mine, senderName, senderPhoto, text, attachments = null }) {
  const arr = ensureMessagesArray(conversationId);

  const msg = {
    id: genId('msg'),
    mine: !!mine,
    senderName: senderName || (mine ? demoFlow.me.name : 'Usuario'),
    senderPhoto: senderPhoto || null,
    text: String(text || '').trim(),
    attachments,
    ts: Date.now()
  };

  if (!msg.text) return null;

  arr.push(msg);

  const conv = getConversation(conversationId);
  if (conv) {
    conv.last_message_text = msg.text;
    conv.last_message_at = msg.ts;
    if (!msg.mine) conv.unread_count_p1 = Math.min(99, (conv.unread_count_p1 || 0) + 1);
  }

  return msg;
}

function addNotification({ type, title, text, conversationId, alertId, read = false }) {
  const noti = {
    id: genId('noti'),
    type: type || 'status_update',
    title: title || 'ACTUALIZACIÓN',
    text: text || 'Actualización.',
    conversationId: conversationId || null,
    alertId: alertId || null,
    createdAt: Date.now(),
    read: !!read
  };

  demoFlow.notifications = [noti, ...(demoFlow.notifications || [])];
  return noti;
}

function pickUser(userId) {
  return (demoFlow.users || []).find((u) => u.id === userId) || null;
}

/* ======================================================
   SEED (10 USUARIOS + ALERTAS + CONVERS + MENSAJES + NOTIS)
====================================================== */

function buildUsers() {
  demoFlow.users = [
    { id: 'u1', name: 'Sofía', photo: 'https://randomuser.me/api/portraits/women/68.jpg', brand: 'Renault', model: 'Clio', color: 'rojo', plate: '7733 MNP', phone: '+34677889901' },
    { id: 'u2', name: 'Marco', photo: 'https://randomuser.me/api/portraits/men/12.jpg', brand: 'BMW', model: 'Serie 1', color: 'gris', plate: '8890 LTR', phone: '+34677889902' },
    { id: 'u3', name: 'Laura', photo: 'https://randomuser.me/api/portraits/women/44.jpg', brand: 'Mercedes', model: 'Clase A', color: 'negro', plate: '7788 RTY', phone: '+34677889903' },
    { id: 'u4', name: 'Carlos', photo: 'https://randomuser.me/api/portraits/men/55.jpg', brand: 'Seat', model: 'León', color: 'azul', plate: '4321 PQR', phone: '+34677889904' },
    { id: 'u5', name: 'Elena', photo: 'https://randomuser.me/api/portraits/women/25.jpg', brand: 'Mini', model: 'Cooper', color: 'blanco', plate: '5567 ZXC', phone: '+34677889905' },
    { id: 'u6', name: 'Dani', photo: 'https://randomuser.me/api/portraits/men/41.jpg', brand: 'Audi', model: 'A3', color: 'gris', plate: '2145 KHB', phone: '+34677889906' },
    { id: 'u7', name: 'Paula', photo: 'https://randomuser.me/api/portraits/women/12.jpg', brand: 'Toyota', model: 'Yaris', color: 'verde', plate: '9001 LKD', phone: '+34677889907' },
    { id: 'u8', name: 'Iván', photo: 'https://randomuser.me/api/portraits/men/18.jpg', brand: 'Volkswagen', model: 'Golf', color: 'azul', plate: '3022 MJC', phone: '+34677889908' },
    { id: 'u9', name: 'Nerea', photo: 'https://randomuser.me/api/portraits/women/37.jpg', brand: 'Kia', model: 'Rio', color: 'rojo', plate: '6100 HJP', phone: '+34677889909' },
    { id: 'u10', name: 'Hugo', photo: 'https://randomuser.me/api/portraits/men/77.jpg', brand: 'Peugeot', model: '208', color: 'amarillo', plate: '4509 LST', phone: '+34677889910' }
  ];
}

function seedAlerts() {
  // ⚠️ En modo real, NO seedear alertas automáticamente.
  // La app solo debe mostrar alertas activas si el usuario las crea desde "Estoy aparcado aquí".
  demoFlow.alerts = [];
}


function seedConversationsAndMessages() {
  demoFlow.conversations = [];
  demoFlow.messages = {};

  const linked = demoFlow.alerts.filter((a) => normalize(a.status) !== 'active');

  linked.forEach((a) => {
    const other = pickUser(a.user_id);
    const convId = `conv_${a.id}_me`;

    a.reserved_by_id = 'me';
    a.reserved_by_name = demoFlow.me.name;
    a.reserved_by_photo = demoFlow.me.photo;

    const conv = {
      id: convId,

      participant1_id: 'me',
      participant2_id: other?.id,
      participant1_name: demoFlow.me.name,
      participant2_name: other?.name,
      participant1_photo: demoFlow.me.photo,
      participant2_photo: other?.photo,

      other_name: other?.name,
      other_photo: other?.photo,

      alert_id: a.id,

      last_message_text: '',
      last_message_at: Date.now() - 60_000,
      unread_count_p1: 0,
      unread_count_p2: 0
    };

    demoFlow.conversations.push(conv);
    ensureMessagesArray(convId);

    pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Ey! te he enviado un WaitMe!' });
    pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Perfecto, lo tengo. Te leo por aquí.' });

    const st = normalize(a.status);
    if (st === 'thinking') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Me lo estoy pensando… ahora te digo.' });
    if (st === 'extended') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'He pagado la prórroga.' });
    if (st === 'cancelled') pushMessage(convId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: 'Cancelo la operación.' });
    if (st === 'completed') pushMessage(convId, { mine: false, senderName: other?.name, senderPhoto: other?.photo, text: 'Operación completada ✅' });
  });

  demoFlow.conversations.sort((a, b) => (b.last_message_at || 0) - (a.last_message_at || 0));
}

function seedNotifications() {
  demoFlow.notifications = [];

  const findBy = (st) => demoFlow.alerts.find((a) => normalize(a.status) === st);

  const aReserved = findBy('reserved');
  const aThinking = findBy('thinking');
  const aExtended = findBy('extended');
  const aCancelled = findBy('cancelled');
  const aCompleted = findBy('completed');

  const convReserved = aReserved ? `conv_${aReserved.id}_me` : null;
  const convThinking = aThinking ? `conv_${aThinking.id}_me` : null;
  const convExtended = aExtended ? `conv_${aExtended.id}_me` : null;
  const convCancelled = aCancelled ? `conv_${aCancelled.id}_me` : null;
  const convCompleted = aCompleted ? `conv_${aCompleted.id}_me` : null;

  if (aReserved) addNotification({ type: 'incoming_waitme', title: 'ACTIVA', text: `${aReserved.user_name} te ha enviado un WaitMe.`, conversationId: convReserved, alertId: aReserved.id, read: false });
  if (aThinking) addNotification({ type: 'status_update', title: 'ME LO PIENSO', text: `${aThinking.user_name} se lo está pensando.`, conversationId: convThinking, alertId: aThinking.id, read: false });
  if (aExtended) addNotification({ type: 'prorroga_request', title: 'PRÓRROGA SOLICITADA', text: `${aExtended.user_name} pide una prórroga (+1€).`, conversationId: convExtended, alertId: aExtended.id, read: false });
  if (aCompleted) addNotification({ type: 'payment_completed', title: 'PAGO COMPLETADO', text: `Pago confirmado (${aCompleted.price}€).`, conversationId: convCompleted, alertId: aCompleted.id, read: true });
  if (aCancelled) addNotification({ type: 'cancellation', title: 'CANCELACIÓN', text: `Operación cancelada.`, conversationId: convCancelled, alertId: aCancelled.id, read: true });

  if (aReserved) addNotification({ type: 'buyer_nearby', title: 'COMPRADOR CERCA', text: `El comprador está llegando.`, conversationId: convReserved, alertId: aReserved.id, read: false });
  if (aReserved) addNotification({ type: 'reservation_accepted', title: 'RESERVA ACEPTADA', text: `Reserva aceptada.`, conversationId: convReserved, alertId: aReserved.id, read: true });
  if (aReserved) addNotification({ type: 'reservation_rejected', title: 'RESERVA RECHAZADA', text: `Reserva rechazada.`, conversationId: convReserved, alertId: aReserved.id, read: true });
  if (aReserved) addNotification({ type: 'time_expired', title: 'TIEMPO AGOTADO', text: `Se agotó el tiempo.`, conversationId: convReserved, alertId: aReserved.id, read: true });
}

function resetDemo() {
  buildUsers();
  seedAlerts();
  seedConversationsAndMessages();
  seedNotifications();
}

/* ======================================================
   API (EXPORTS) - lo que usan tus pantallas
====================================================== */

export function isDemoMode() {
  try {
    if (typeof window === 'undefined') return false;
    const qs = new URLSearchParams(window.location.search);
    return qs.get('demo') === '1';
  } catch {
    return false;
  }
}
export function getDemoState() { return demoFlow; }

export function startDemoFlow() {
  if (started) return;
  started = true;

  resetDemo();

  if (!tickTimer) {
    tickTimer = setInterval(() => notify(), 1000);
  }

  notify();
}

export function subscribeDemoFlow(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// alias legacy
export function subscribeToDemoFlow(cb) {
  return subscribeDemoFlow(cb);
}

// Chats
export function getDemoConversations() { return demoFlow.conversations || []; }
export function getDemoAlerts() { return demoFlow.alerts || []; }

// Alert getters (legacy + nuevos)
export function getDemoAlert(alertId) { return getAlert(alertId); }
export function getDemoAlertById(alertId) { return getAlert(alertId); } // <- para que NO rompa
export function getDemoAlertByID(alertId) { return getAlert(alertId); } // <- alias extra

// Chat
export function getDemoConversation(conversationId) { return getConversation(conversationId); }
export function getDemoConversationById(conversationId) { return getConversation(conversationId); }

export function getDemoMessages(conversationId) {
  return (demoFlow.messages && demoFlow.messages[conversationId]) ? demoFlow.messages[conversationId] : [];
}

export function sendDemoMessage(conversationId, text, attachments = null, isMine = true) {
  const clean = String(text || '').trim();
  if (!conversationId || !clean) return;

  const conv = getConversation(conversationId);
  if (!conv) return;

  if (isMine) {
    pushMessage(conversationId, { mine: true, senderName: demoFlow.me.name, senderPhoto: demoFlow.me.photo, text: clean, attachments });
  } else {
    pushMessage(conversationId, { mine: false, senderName: conv.participant2_name, senderPhoto: conv.participant2_photo, text: clean, attachments });
  }

  notify();
}

// Notifications
export function getDemoNotifications() { return demoFlow.notifications || []; }

// ✅ EXPORTS LEGACY QUE TE ESTÁN PIDIENDO AHORA MISMO
export function markDemoRead(notificationId) {
  const n = (demoFlow.notifications || []).find((x) => x.id === notificationId);
  if (n) n.read = true;
  notify();
}

// alias legacy
export function markDemoNotificationRead(notificationId) { return markDemoRead(notificationId); }
export function markDemoNotificationReadLegacy(notificationId) { return markDemoRead(notificationId); }
export function markAllDemoRead() {
  (demoFlow.notifications || []).forEach((n) => (n.read = true));
  notify();
}

/* ======================================================
   CONVERSACIÓN ↔ ALERTA
====================================================== */

export function ensureConversationForAlert(alertId, hint = null) {
  if (!alertId) return null;

  const existing = (demoFlow.conversations || []).find((c) => c.alert_id === alertId);
  if (existing) return existing;

  const alert = getAlert(alertId);

  const otherName =
    hint?.fromName ||
    hint?.otherName ||
    alert?.user_name ||
    'Usuario';

  const otherPhoto =
    hint?.otherPhoto ||
    hint?.fromPhoto ||
    alert?.user_photo ||
    null;

  const convId = `conv_${alertId}_me`;

  const conv = {
    id: convId,
    participant1_id: 'me',
    participant2_id: alert?.user_id || genId('u'),
    participant1_name: demoFlow.me.name,
    participant2_name: otherName,
    participant1_photo: demoFlow.me.photo,
    participant2_photo: otherPhoto,

    other_name: otherName,
    other_photo: otherPhoto,

    alert_id: alertId,
    last_message_text: '',
    last_message_at: Date.now(),
    unread_count_p1: 0,
    unread_count_p2: 0
  };

  demoFlow.conversations = [conv, ...(demoFlow.conversations || [])];
  ensureMessagesArray(convId);
  notify();
  return conv;
}

// legacy: si algún código espera ID string
export function ensureConversationForAlertId(alertId) {
  const conv = ensureConversationForAlert(alertId);
  return conv?.id || null;
}

/** Añade una alerta al estado demo (para que Chats y otros la vean). */
export function addDemoAlert(alert) {
  if (!alert?.id) return;
  const list = demoFlow.alerts || [];
  if (list.some((a) => a.id === alert.id)) return;
  demoFlow.alerts = [{ ...alert }, ...list];
  notify();
}

/**
 * Crea conversación para una alerta con el comprador indicado y añade el mensaje inicial del comprador.
 * Usado cuando se simula "Usuario quiere un WaitMe!" a los 30s de publicar.
 */
export function addIncomingWaitMeConversation(alertId, buyer) {
  if (!alertId) return null;
  const conv = ensureConversationForAlert(alertId, {
    fromName: buyer?.name || 'Usuario',
    otherPhoto: buyer?.photo || null
  });
  if (!conv?.id) return null;
  const arr = ensureMessagesArray(conv.id);
  const already = arr.some((m) => String(m?.text || '').toLowerCase().includes('te he enviado un waitme'));
  if (!already) {
    pushMessage(conv.id, {
      mine: false,
      senderName: buyer?.name || 'Usuario',
      senderPhoto: buyer?.photo || null,
      text: '¡Ey! Te he enviado un WaitMe!'
    });
  }
  notify();
  return conv.id;
}

export function ensureInitialWaitMeMessage(conversationId) {
  const conv = getConversation(conversationId);
  if (!conv) return null;

  const arr = ensureMessagesArray(conversationId);
  const already = arr.some((m) => String(m?.text || '').toLowerCase().includes('te he enviado un waitme'));
  if (already) return null;

  const msg = pushMessage(conversationId, {
    mine: true,
    senderName: demoFlow.me.name,
    senderPhoto: demoFlow.me.photo,
    text: 'Ey! te he enviado un WaitMe!'
  });

  notify();
  return msg?.id || null;
}

/* ======================================================
   ACCIONES (Notifications -> applyDemoAction)
====================================================== */

export function applyDemoAction({ conversationId, alertId, action }) {
  const a = normalize(action);
  const title = statusToTitle(a);

  const alert = alertId ? getAlert(alertId) : null;
  if (alert) alert.status = a;

  const conv = conversationId ? getConversation(conversationId) : (alertId ? ensureConversationForAlert(alertId) : null);
  const convId = conv?.id || null;

  addNotification({
    type: 'status_update',
    title,
    text: 'Estado actualizado.',
    conversationId: convId,
    alertId,
    read: false
  });

  if (convId) {
    let msgText = '';
    if (title === 'ME LO PIENSO') msgText = 'Me lo estoy pensando…';
    else if (title === 'PRÓRROGA') msgText = 'Pido una prórroga.';
    else if (title === 'CANCELADA') msgText = 'Cancelo la operación.';
    else if (title === 'RECHAZADA') msgText = 'Rechazo la operación.';
    else if (title === 'COMPLETADA') msgText = 'Operación completada ✅';
    else if (title === 'ACTIVA') msgText = 'Operación activa.';
    else msgText = 'Actualización de estado.';

    pushMessage(convId, {
      mine: false,
      senderName: conv?.participant2_name || 'Usuario',
      senderPhoto: conv?.participant2_photo || null,
      text: msgText
    });
  }

  notify();
}

/* ======================================================
   RESERVAR
====================================================== */

export function reserveDemoAlert(alertId) {
  const alert = getAlert(alertId);
  if (!alert) return null;
  if (normalize(alert.status) !== 'active') return null;

  alert.status = 'reserved';
  alert.reserved_by_id = 'me';
  alert.reserved_by_name = demoFlow.me.name;
  alert.reserved_by_photo = demoFlow.me.photo;

  const conv = ensureConversationForAlert(alertId, {
    fromName: alert.user_name,
    otherPhoto: alert.user_photo
  });

  ensureInitialWaitMeMessage(conv?.id);

  addNotification({
    type: 'status_update',
    title: 'ACTIVA',
    text: `Has enviado un WaitMe a ${alert.user_name}.`,
    conversationId: conv?.id,
    alertId,
    read: false
  });

  notify();
  return conv?.id || null;
}

// flags legacy
export function setDemoMode() { return true; }

/* ======================================================
   COMPONENTE
====================================================== */

export default function DemoFlowManager() {
  // useEffect(() => {
  //   // Siempre activo: la app arranca con datos y se ve igual en Preview y en iPhone (PWA).
  //   startDemoFlow();
  // }, []);
  return null;
}

```
