// src/components/DemoFlowManager.jsx
// Wrapper seguro: re-exporta la API de demo desde src/lib/demoFlow.js
// para que las páginas (Chats/Chat/Notifications) puedan importar siempre lo mismo.

import { useEffect } from 'react';
import { startDemoFlow, stopDemoFlow } from '@/lib/demoFlow';

// Re-export: lo que Base44 / páginas pueden estar importando.
export {
  demoFlow,
  startDemoFlow,
  stopDemoFlow,
  subscribeDemoFlow,
  getDemoConversation,
  getDemoMessages,
  sendDemoMessage,
  getDemoNotifications,
  markDemoRead,
  getDemoMode,
} from '@/lib/demoFlow';

export default function DemoFlowManager() {
  // Mantener la app “viva” en demo sin tocar UI: solo arranca el motor.
  useEffect(() => {
    startDemoFlow();
    return () => {
      stopDemoFlow();
    };
  }, []);

  return null;
}
