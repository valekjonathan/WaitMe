import { useState } from 'react';

export function useHistoryFilters() {
  const [hiddenKeys, setHiddenKeys] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('waitme:hidden_keys') || '[]');
      return new Set(stored);
    } catch {
      return new Set();
    }
  });

  const hideKey = (key) => {
    const next = new Set(hiddenKeys);
    next.add(key);
    setHiddenKeys(next);
    try {
      localStorage.setItem('waitme:hidden_keys', JSON.stringify(Array.from(next)));
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  };

  return { hiddenKeys, hideKey };
}
