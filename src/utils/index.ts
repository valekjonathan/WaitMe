export function createPageUrl(pageName: string) {
  const raw = String(pageName || '').trim();
  return '/' + raw.toLowerCase();
}