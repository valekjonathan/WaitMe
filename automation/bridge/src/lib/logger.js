/**
 * Logger simple para el bridge.
 */
const PREFIX = '[bridge]';

export function log(level, ...args) {
  const ts = new Date().toISOString();
  const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  console.log(`${ts} ${PREFIX} [${level}] ${msg}`);
}

export function info(...args) {
  log('INFO', ...args);
}

export function warn(...args) {
  log('WARN', ...args);
}

export function error(...args) {
  log('ERROR', ...args);
}
