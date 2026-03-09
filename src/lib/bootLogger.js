/**
 * Boot logger — logs tempranos para diagnosticar crash/intermitencia.
 * Se guardan en window.__WAITME_BOOT_LOGS y se envían a localhost:9999 si el servidor está activo.
 */
const LOGS = [];
const LOG_SERVER = 'http://localhost:9999';

function bootLog(tag, ...args) {
  const entry = {
    t: Date.now(),
    tag,
    args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
  };
  LOGS.push(entry);
  const msg = [tag, ...args]
    .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ');
  console.log(msg);
  if (typeof window !== 'undefined') {
    window.__WAITME_BOOT_LOGS = LOGS;
  }
}

function flushToServer() {
  if (typeof window === 'undefined') return;
  try {
    const payload = LOGS.map((e) => `[${e.t}] ${e.tag} ${e.args.join(' ')}`).join('\n');
    fetch(`${LOG_SERVER}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
    }).catch(() => {});
  } catch (_) {}
}

// Enviar logs al servidor tras 3s (da tiempo al boot)
if (typeof window !== 'undefined') {
  window.__WAITME_BOOT_LOGS = LOGS;
  setTimeout(flushToServer, 3000);
  setInterval(flushToServer, 5000);
}

export { bootLog, flushToServer, LOGS };
