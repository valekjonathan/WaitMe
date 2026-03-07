declare global {
  interface Window {
    __WAITME_MAP__?: { getCenter?: () => { lat: number; lng: number } };
  }
}

export {};
