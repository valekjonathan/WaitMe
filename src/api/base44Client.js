import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

// appBaseUrl is required for provider redirects (Google OAuth, etc.).
// Falls back to the base44 cloud platform if no custom backend is configured.
const appBaseUrl = serverUrl || import.meta.env.VITE_BASE44_BACKEND_URL || 'https://base44.app';

export const base44 = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl,
});

// Evitar error SSE si el SDK o algún flujo llama a sseError
export function sseError() {}
