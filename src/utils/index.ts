export function createPageUrl(pageName: string) {
    return '/?page=' + encodeURIComponent(pageName);
  }