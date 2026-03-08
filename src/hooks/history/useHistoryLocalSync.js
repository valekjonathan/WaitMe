import { useState, useEffect } from 'react';

export function useHistoryLocalSync() {
  const [thinkingRequests, setThinkingRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]');
    } catch {
      return [];
    }
  });
  const [rejectedRequests, setRejectedRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const reload = () => {
      try {
        setThinkingRequests(JSON.parse(localStorage.getItem('waitme:thinking_requests') || '[]'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    };
    window.addEventListener('waitme:thinkingUpdated', reload);
    return () => window.removeEventListener('waitme:thinkingUpdated', reload);
  }, []);

  useEffect(() => {
    const reload = () => {
      try {
        setRejectedRequests(JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    };
    window.addEventListener('waitme:rejectedUpdated', reload);
    return () => window.removeEventListener('waitme:rejectedUpdated', reload);
  }, []);

  return { thinkingRequests, setThinkingRequests, rejectedRequests };
}
