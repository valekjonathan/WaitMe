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
  'docs/archive/quarantine',
  'ios/App/App/public/assets',
]);

const EXCLUDE_FILES = new Set([]);
const EXCLUDE_PATTERNS = [
  /.log$/,
  /playwright-report\//,
  /test-results\//,
  /\.env$/,
  /\.env\.local$/,
  /\.env\..*$/,
  /\.xcuserstate$/,
];

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
  '.jsonc',
  '.json5',
  '.md',
  '.mdx',
  '.markdown',
  '.html',
  '.htm',
  '.xhtml',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.yml',
  '.yaml',
  '.xml',
  '.toml',
  '.ini',
  '.cfg',
  '.conf',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.sql',
  '.graphql',
  '.gql',
  '.vue',
  '.svelte',
  '.astro',
  '.py',
  '.rb',
  '.php',
  '.java',
  '.kt',
  '.swift',
  '.go',
  '.rs',
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.cc',
  '.cxx',
  '.r',
  '.R',
  '.jl',
  '.lua',
  '.pl',
  '.pm',
  '.txt',
  '.log',
  '.csv',
  '.tsv',
  '.lock',
  '.config',
  '.rc',
]);

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.bmp',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.a',
  '.o',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.7z',
  '.rar',
  '.mp3',
  '.mp4',
  '.wav',
  '.ogg',
  '.webm',
  '.webp',
  '.avif',
  '.wasm',
  '.map',
  '.bin',
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

  let quarantineList = '';
  try {
    const qDir = join(ROOT, 'quarantine');
    const listAll = async (d) => {
      const acc = [];
      const entries = await readdir(d, { withFileTypes: true });
      for (const e of entries) {
        const full = join(d, e.name);
        if (e.isDirectory()) acc.push(...(await listAll(full)));
        else acc.push(relative(ROOT, full));
      }
      return acc;
    };
    quarantineList = (await listAll(qDir)).sort().join('\n') || '(vacío)';
  } catch {
    quarantineList = '(carpeta no existe)';
  }

  const indexContent = [
    '# Codebase Export Index',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total files exported: ${files.length}`,
    `Parts: ${tempParts.length}`,
    '',
    '## Incluido',
    '- src/**',
    '- public/**',
    '- tests/**',
    '- .storybook/**',
    '- docs/** (excepto CODEBASE_EXPORT_*)',
    '- package.json, package-lock.json',
    '- vite.config.js, playwright.config.js',
    '- eslint/prettier config',
    '- capacitor.config.*',
    '- supabase config y migrations',
    '- .env.example',
    '',
    '## Excluido',
    '- node_modules, dist, storybook-static, coverage',
    '- .git, quarantine',
    '- ios/App/App/public/assets (build output)',
    '- .env, .env.local, .env.* (secretos)',
    '- archivos binarios (png, woff, etc.)',
    '',
    '## Quarantine (solo listado)',
    '```',
    quarantineList,
    '```',
    '',
    '## File tree',
    '',
    '```',
    treeToStr(tree),
    '```',
    '',
    '## Snapshot parts',
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
