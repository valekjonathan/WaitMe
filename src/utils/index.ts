export function createPageUrl(pageName: string) {
  const raw = String(pageName || '').trim();

  const qIndex = raw.indexOf('?');
  const page = qIndex >= 0 ? raw.slice(0, qIndex).trim() : raw;
  const query = qIndex >= 0 ? raw.slice(qIndex) : '';

  // Base44 navega con /?page=NombreDePagina + querystring
  return `/?page=${encodeURIComponent(page)}${query}`;
}