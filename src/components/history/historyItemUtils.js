/** Dirección formato: "Calle Gran Vía, n1, Oviedo" */
export function formatAddress(addr) {
  const fallback = 'Calle Gran Vía, n1, Oviedo';
  const s = String(addr || '').trim();
  if (!s) return fallback;

  const hasOviedo = /oviedo/i.test(s);
  const m = s.match(/^(.+?),\s*(?:n\s*)?(\d+)\s*(?:,.*)?$/i);
  if (m) {
    const street = m[1].trim();
    const num = m[2].trim();
    return `${street}, n${num}, Oviedo`;
  }

  if (!hasOviedo) return `${s}, Oviedo`;
  return s;
}

export function formatPriceInt(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0 €';
  return `${Math.trunc(n)} €`;
}

export function formatRemaining(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
