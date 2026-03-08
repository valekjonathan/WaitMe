import { useState, useEffect } from 'react';

export function useHistoryClock() {
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return nowTs;
}
