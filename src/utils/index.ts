export function createPageUrl(pageName: string) {
    const raw = String(pageName || '').trim();
  
    const qIndex = raw.indexOf('?');
  
    if (qIndex === -1) {
      return '/?page=' + encodeURIComponent(raw);
    }
  
    const page = raw.slice(0, qIndex);
    const query = raw.slice(qIndex + 1);
  
    return '/?page=' + encodeURIComponent(page) + '&' + query;
  }