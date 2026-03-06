
================================================================
FILE: src/components/ui/toggle-group.jsx
================================================================
```jsx
"use client";
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    (<ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants({
        variant: context.variant || variant,
        size: context.size || size,
      }), className)}
      {...props}>
      {children}
    </ToggleGroupPrimitive.Item>)
  );
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

```

================================================================
FILE: src/components/ui/toggle.jsx
================================================================
```jsx
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props} />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

```

================================================================
FILE: src/components/ui/tooltip.jsx
================================================================
```jsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

```

================================================================
FILE: src/components/ui/use-toast.jsx
================================================================
```jsx
// Inspired by react-hot-toast library
import { useState, useEffect } from "react";

const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastTimeouts = new Map();

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const _clearFromRemoveQueue = (toastId) => {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(toastId);
  }
};

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners = [];

let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () => {
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
    
    // Cuando se cierra un toast, crear notificación
    if (props.createNotificationOnClose && typeof window !== 'undefined') {
      setTimeout(() => {
        const event = new CustomEvent('waitme:toastClosed', {
          detail: props.notificationData || {}
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };
```

================================================================
FILE: src/config/alerts.js
================================================================
```js
/**
 * Configuración centralizada para alertas cercanas.
 * Única fuente de verdad para radio de búsqueda y umbral de refresco.
 */

/** Radio de búsqueda en km (Haversine). */
export const NEARBY_RADIUS_KM = 2;

/** Umbral en metros: solo refrescar alertas cuando el usuario se mueve más de esto. */
export const NEARBY_REFRESH_THRESHOLD_M = 150;

/** Minutos máximos para llegar tras reservar; pasado este tiempo la alerta vuelve a active. */
export const RESERVATION_TIMEOUT_MINUTES = 10;

```

================================================================
FILE: src/data/alerts.js
================================================================
```js
/**
 * Data Adapter para alertas (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: alertsSupabase.
 * Para cambiar: sustituir el import y re-exportar las mismas firmas.
 */
import * as provider from '@/services/alertsSupabase';

export const getAlert = provider.getAlert;
export const getMyAlerts = provider.getMyAlerts;
export const getAlertsReservedByMe = provider.getAlertsReservedByMe;
export const getAlertsForChats = provider.getAlertsForChats;
export const createAlert = provider.createAlert;
export const updateAlert = provider.updateAlert;
export const deleteAlert = provider.deleteAlert;
export const subscribeAlerts = provider.subscribeAlerts;
export const getNearbyAlerts = provider.getNearbyAlerts;
export const reserveAlert = provider.reserveAlert;

```

================================================================
FILE: src/data/chat.js
================================================================
```js
/**
 * Data Adapter para chat (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: chatSupabase.
 * Para cambiar: sustituir el import y re-exportar las mismas firmas.
 */
import * as provider from '@/services/chatSupabase';

export const getConversations = provider.getConversations;
export const getConversation = provider.getConversation;
export const createConversation = provider.createConversation;
export const getMessages = provider.getMessages;
export const sendMessage = provider.sendMessage;
export const subscribeMessages = provider.subscribeMessages;

```

================================================================
FILE: src/data/notifications.js
================================================================
```js
/**
 * Data Adapter para notificaciones (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 * Este adapter abstrae el proveedor; cambiar aquí permite migrar sin tocar componentes.
 *
 * Proveedor actual: notificationsSupabase.
 */
import * as provider from '@/services/notificationsSupabase';

export const createNotification = provider.createNotification;
export const listNotifications = provider.listNotifications;
export const markAsRead = provider.markAsRead;
export const markAllAsRead = provider.markAllAsRead;
export const subscribeNotifications = provider.subscribeNotifications;

```

================================================================
FILE: src/data/profiles.js
================================================================
```js
/**
 * Data Adapter para perfiles (Strangler pattern).
 */
import * as provider from '@/services/profilesSupabase';

export const updateProfile = provider.updateProfile;

```

================================================================
FILE: src/data/transactions.js
================================================================
```js
/**
 * Data Adapter para transacciones (Strangler pattern).
 * Los componentes NUNCA llaman a Base44 ni Supabase directamente.
 *
 * Proveedor actual: transactionsSupabase.
 */
import * as provider from '@/services/transactionsSupabase';

export const createTransaction = provider.createTransaction;
export const listTransactions = provider.listTransactions;

```

================================================================
FILE: src/data/uploads.js
================================================================
```js
/**
 * Data Adapter para uploads (Strangler pattern).
 * Sustituye base44.integrations.Core.UploadFile.
 *
 * Proveedor actual: uploadsSupabase.
 */
import * as provider from '@/services/uploadsSupabase';

export const uploadFile = provider.uploadFile;
export const getPublicUrl = provider.getPublicUrl;
export const deleteFile = provider.deleteFile;

```

================================================================
FILE: src/data/userLocations.js
================================================================
```js
/**
 * Data Adapter para ubicaciones de usuario.
 */
import * as provider from '@/services/userLocationsSupabase';

export const getLocationsByAlert = provider.getLocationsByAlert;
export const upsertLocationForAlert = provider.upsertLocationForAlert;

```

================================================================
FILE: src/diagnostics/MissingEnvScreen.jsx
================================================================
```jsx
import React from "react";

export default function MissingEnvScreen({ missing = [] }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "#e5e5e5",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#fca5a5",
          marginBottom: 16,
        }}
      >
        Falta configuración de Supabase
      </h1>
      <p style={{ marginBottom: 20, textAlign: "center", maxWidth: 320 }}>
        Sin estas variables la app no puede autenticarse ni cargar datos.
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 16,
          margin: 0,
          background: "#1a1a1a",
          borderRadius: 8,
          minWidth: 280,
        }}
      >
        {missing.map((v) => (
          <li
            key={v}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #333",
              fontFamily: "monospace",
              fontSize: 14,
            }}
          >
            ❌ {v}
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 20, fontSize: 13, color: "#888" }}>
        Añade las variables en <code style={{ background: "#222", padding: "2px 6px", borderRadius: 4 }}>.env</code> y reinicia.
      </p>
    </div>
  );
}

```

================================================================
FILE: src/diagnostics/SafeModeShell.jsx
================================================================
```jsx
/**
 * Shell mínima cuando VITE_SAFE_MODE=true.
 * App carga SIEMPRE. Navegación + diagnóstico.
 * Sin map, realtime, auth real (usa bypass).
 */
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import DevDiagnostics from "@/pages/DevDiagnostics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0 },
  },
});

function SafeHome() {
  return (
    <div
      style={{
        minHeight: "60vh",
        background: "#111",
        color: "#fff",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>WaitMe — SAFE MODE</h1>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>
        La app está en modo seguro. Capas problemáticas desactivadas.
      </p>
      <Link
        to="/dev-diagnostics"
        style={{ color: "#a855f7", textDecoration: "underline" }}
      >
        → Ir a Diagnóstico
      </Link>
    </div>
  );
}

export default function SafeModeShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <div
            style={{
              minHeight: "100vh",
              background: "#0a0a0a",
              color: "#fff",
            }}
          >
            <nav
              style={{
                padding: 16,
                borderBottom: "1px solid #333",
                display: "flex",
                gap: 16,
              }}
            >
              <Link to="/" style={{ color: "#a855f7" }}>
                Home
              </Link>
              <Link to="/dev-diagnostics" style={{ color: "#a855f7" }}>
                Diagnóstico
              </Link>
            </nav>
            <main style={{ padding: 24 }}>
              <Routes>
                <Route path="/" element={<SafeHome />} />
                <Route path="/dev-diagnostics" element={<DevDiagnostics />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

```

================================================================
FILE: src/globals.css
================================================================
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  touch-action: manipulation;
}

@layer base {
  :root {
    --background: 0 0% 0%;
    --foreground: 0 0% 100%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html, body {
    @apply text-white;
    background-color: #0B0B0F;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    height: 100%;
  }
  #root {
    min-height: 100dvh;
    min-height: 100dvh;
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: #0B0B0F;
  }
}

/* Custom styles for purple sliders */
[role="slider"] {
  @apply bg-purple-600;
}

.slider-track {
  @apply bg-purple-600/30;
}

[data-orientation="horizontal"][role="slider"] ~ span {
  @apply bg-purple-600;
}

/* DVH GLOBAL FIX (iOS PWA / Safari) */
html, body, #root { height: 100%; }
body { min-height: 100dvh; background: #0B0B0F; }

/* ── Safe-area (iPhone Dynamic Island / notch) ── */
:root {
  --safe-top:    env(safe-area-inset-top,    0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left,   0px);
  --safe-right:  env(safe-area-inset-right,  0px);
  /* Altura total BottomNav para que las páginas no queden tapadas */
  --bottom-nav-h: calc(64px + env(safe-area-inset-bottom, 0px));
}

/* Utilidades globales para safe-area (usable con className="pb-safe") */
.pt-safe { padding-top:    env(safe-area-inset-top,    0px); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
.pl-safe { padding-left:   env(safe-area-inset-left,   0px); }
.pr-safe { padding-right:  env(safe-area-inset-right,  0px); }
.mb-safe { margin-bottom:  env(safe-area-inset-bottom, 0px); }

/* Espacio inferior estándar para páginas (nav + safe area) */
.page-bottom-pad { padding-bottom: var(--bottom-nav-h); }


/* Ocultar la barra de scroll (mantener scroll) */
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
*::-webkit-scrollbar {
  display: none;
}
```

================================================================
FILE: src/hooks/useMyAlerts.js
================================================================
```js
/**
 * Shared hook and query options for the ['myAlerts'] query.
 *
 * Single source of truth for staleTime, refetchOnMount, refetchOnWindowFocus,
 * and the queryFn. Used by Home.jsx, History.jsx and BottomNav.jsx so all
 * three read from the exact same cache entry with the exact same policy.
 *
 * Usa data layer: import * as alerts from '@/data/alerts'.
 *
 * Policy rationale:
 *   - staleTime: 0  → data is always considered stale; explicit invalidation
 *                      controls when to refetch (no silent staleness window).
 *   - refetchOnMount: false → navigating back to a page does NOT auto-refetch;
 *                             prevents badge flashes on navigation.
 *   - refetchOnWindowFocus: true → when the user returns to the browser tab the
 *                                  badge and lists stay up-to-date.
 *   - refetchOnReconnect: true → recover from lost connectivity.
 *   - placeholderData: keepPrevious → lists/badge never become empty while
 *                                     re-fetching; no white flashes on navigate.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as alerts from '@/data/alerts';
import { useAuth } from '@/lib/AuthContext';

export const MY_ALERTS_QUERY_KEY = ['myAlerts'];

export const MY_ALERTS_OPTIONS = {
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  refetchInterval: false,
  refetchOnMount: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  placeholderData: (prev) => prev,
};

async function fetchMyAlerts(userId) {
  if (!userId) return [];
  const [sellerRes, buyerRes] = await Promise.all([
    alerts.getMyAlerts(userId),
    alerts.getAlertsReservedByMe(userId),
  ]);
  const asSeller = sellerRes.data ?? [];
  const asBuyer = buyerRes.data ?? [];
  const seen = new Set(asSeller.map((a) => a.id));
  const merged = [...asSeller];
  for (const a of asBuyer) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      merged.push(a);
    }
  }
  merged.sort((a, b) => toMs(b.created_at) - toMs(a.created_at));
  return merged;
}

function toMs(v) {
  if (v == null) return 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

/**
 * Drop-in replacement for the three inline useQuery(['myAlerts']) calls.
 * Returns the full query result so callers can destructure exactly what they need:
 *   const { data: myAlerts = [], isLoading, isFetched, isFetching } = useMyAlerts();
 */
export function useMyAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const result = useQuery({
    queryKey: MY_ALERTS_QUERY_KEY,
    enabled: !!userId,
    ...MY_ALERTS_OPTIONS,
    queryFn: () => fetchMyAlerts(userId),
  });

  useEffect(() => {
    if (!userId) return;
    const unsub = alerts.subscribeAlerts({
      onUpsert: (alert) => {
        if (alert?.seller_id === userId || alert?.user_id === userId) {
          queryClient.invalidateQueries({ queryKey: MY_ALERTS_QUERY_KEY });
        }
      },
      onDelete: () => {
        queryClient.invalidateQueries({ queryKey: MY_ALERTS_QUERY_KEY });
      },
    });
    return unsub;
  }, [userId, queryClient]);

  return result;
}

```

================================================================
FILE: src/hooks/useProfileGuard.ts
================================================================
```ts
import { useCallback, useMemo } from "react";
import { isProfileComplete, getMissingProfileFields } from "@/lib/profile";

export function useProfileGuard(profile) {
  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  const guard = useCallback(
    (callback) => {
      const missing = getMissingProfileFields(profile);
      if (missing.length) {
        const list = missing.map((f) => `• ${f}`).join("\n");
        alert(`Para usar WaitMe debes completar tu perfil.\n\nFaltan estos datos:\n\n${list}`);
        return;
      }
      callback();
    },
    [profile]
  );

  return { guard, complete };
}

```

================================================================
FILE: src/hooks/useRealtimeAlerts.js
================================================================
```js
/**
 * Hook que carga alertas activas y se suscribe a Realtime.
 * Actualiza el Zustand store.
 * Soporta esquema nuevo (seller_id, price_cents) y legacy (user_id, price).
 * No explota si la tabla no existe: setError en store.
 */
import { useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAppStore } from '@/state/appStore';
import { subscribeActiveAlerts } from '@/services/realtime/alertsRealtime';

function normalizeRow(r) {
  const sellerId = r.seller_id ?? r.user_id;
  const price = r.price_cents != null ? r.price_cents / 100 : (r.price ?? 0);
  const meta = r.metadata || {};
  return {
    id: r.id,
    user_id: sellerId,
    seller_id: sellerId,
    lat: r.lat,
    lng: r.lng,
    latitude: r.lat,
    longitude: r.lng,
    price,
    price_cents: r.price_cents,
    vehicle_type: r.vehicle_type ?? meta.vehicle_type ?? 'car',
    status: r.status,
    reserved_by: r.reserved_by ?? null,
    created_at: r.created_at,
    expires_at: r.expires_at,
    geohash: r.geohash ?? null,
    address_text: r.address_text,
  };
}

const isRealtimeDisabled = () => import.meta.env.VITE_DISABLE_REALTIME === 'true';

export function useRealtimeAlerts() {
  const setAlerts = useAppStore((state) => state.setAlerts);
  const setAlertsLoading = useAppStore((state) => state.setAlertsLoading);
  const upsertAlert = useAppStore((state) => state.upsertAlert);
  const removeAlert = useAppStore((state) => state.removeAlert);
  const setError = useAppStore((state) => state.setError);
  const clearError = useAppStore((state) => state.clearError);

  useEffect(() => {
    if (isRealtimeDisabled()) return;
    const supabase = getSupabase();
    if (!supabase) return;

    setAlertsLoading(true);
    clearError();

    supabase
      .from('parking_alerts')
      .select('*')
      .eq('status', 'active')
      .then(({ data, error }) => {
        setAlertsLoading(false);
        if (error) {
          console.error('Realtime alerts load error:', error);
          setError('realtime_error');
          return;
        }
        const items = (data || []).map(normalizeRow);
        setAlerts(items);
      })
      .catch((err) => {
        setAlertsLoading(false);
        console.error('Realtime alerts load error:', err);
        setError('realtime_error');
      });

    const unsub = subscribeActiveAlerts({
      onUpsert: (alert) => {
        if (alert.status === 'active') upsertAlert(alert);
        else removeAlert(alert.id);
      },
      onDelete: removeAlert,
    });

    return () => unsub();
  }, [setAlerts, setAlertsLoading, upsertAlert, removeAlert, setError, clearError]);
}

```

================================================================
FILE: src/index.css
================================================================
```css
html, body, #root { height: 100%; }
@tailwind base;
@tailwind components;
@tailwind utilities;


/* :root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100dvh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
} */



@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}



@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

================================================================
FILE: src/lib/AuthContext.jsx
================================================================
```jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getSupabase, clearSupabaseAuthStorage } from '@/lib/supabaseClient';

// DEV AUTO LOGIN
// Only active during local development (npm run dev)
const isDevAutoLogin = () => import.meta.env.DEV;

// DEV kill switch: bypass auth mock (use real Supabase flow)
const isDevBypassAuth = () =>
  import.meta.env.DEV &&
  (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true');

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV) {
    try {
      console.log(`[RENDER:AuthContext] ${msg}`, extra ?? '');
    } catch {}
  }
};

/** Usuario mock para desarrollo local — nunca en producción */
const DEV_MOCK_USER = {
  id: 'dev-user',
  name: 'Dev User',
  full_name: 'Dev User',
  display_name: 'Dev',
  email: 'dev@waitme.app',
  avatar: null,
  photo_url: null,
  brand: 'Dev',
  model: 'Coche',
  color: 'gris',
  vehicle_type: 'car',
  plate: '0000XXX',
  phone: '000000000',
  allow_phone_calls: false,
  notifications_enabled: true,
  email_notifications: true,
};

const DEV_MOCK_PROFILE = {
  id: 'dev-user',
  display_name: 'Dev',
  full_name: 'Dev User',
  email: 'dev@waitme.app',
  avatar_url: null,
  vehicle_type: 'car',
  brand: 'Dev',
  model: 'Coche',
  color: 'gris',
  plate: '0000XXX',
  phone: '000000000',
  allow_phone_calls: false,
  notifications_enabled: true,
  email_notifications: true,
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  RENDER_LOG('AuthProvider ENTER');
  // En DEV: estado inicial ya con usuario mock — sin esperar Supabase (excepto si VITE_DEV_BYPASS_AUTH=true)
  const isDev = isDevAutoLogin() && !isDevBypassAuth();
  const [user, setUser] = useState(() => {
    const init = isDev ? DEV_MOCK_USER : null;
    RENDER_LOG('useState init', { isDev, hasUser: !!init });
    return init;
  });
  const [profile, setProfile] = useState(() => (isDev ? DEV_MOCK_PROFILE : null));
  const [isAuthenticated, setIsAuthenticated] = useState(isDev);
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => {
    const loading = !isDev;
    RENDER_LOG('isLoadingAuth init', loading);
    return loading;
  });
  const [authError, setAuthError] = useState(null);
  const authInFlightRef = useRef(false);

  const ensureUserInDb = useCallback(async (authUser) => {
    const supabase = getSupabase();
    if (!supabase || !authUser?.id) return null;
    const email = authUser.email ?? '';
    const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '';
    const avatarUrl = authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? '';

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('profiles').insert({
        id: authUser.id,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
      });
      if (error) {
        if (error.code !== '23505') throw error;
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    return {
      id: authUser.id,
      email: profile?.email || email,
      full_name: profile?.full_name || fullName,
      display_name: profile?.display_name ?? (profile?.full_name || fullName)?.split(' ')[0] ?? '',
      photo_url: profile?.avatar_url || profile?.photo_url || avatarUrl,
      brand: profile?.brand ?? '',
      model: profile?.model ?? '',
      color: profile?.color ?? 'gris',
      vehicle_type: profile?.vehicle_type ?? 'car',
      plate: profile?.plate ?? '',
      phone: profile?.phone ?? '',
      allow_phone_calls: profile?.allow_phone_calls ?? false,
      notifications_enabled: profile?.notifications_enabled !== false,
      email_notifications: profile?.email_notifications !== false,
      ...authUser,
    };
  }, []);

  const resolveSession = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoadingAuth(false);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      const appUser = await ensureUserInDb(authUser);
      if (!appUser?.id) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      setUser(appUser);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE LOAD ERROR:", profileError);
      }
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({});
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth resolve failed:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error?.message || 'Error de autenticación' });
    } finally {
      setIsLoadingAuth(false);
      authInFlightRef.current = false;
    }
  }, [ensureUserInDb]);

  useEffect(() => {
    // DEV AUTO LOGIN — No tocar Supabase; estado inicial ya tiene user/isLoadingAuth
    if (isDevAutoLogin()) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        setIsLoadingAuth(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (authInFlightRef.current || !session?.user?.id) {
          setIsLoadingAuth(false);
          return;
        }
        authInFlightRef.current = true;
        try {
          const appUser = await ensureUserInDb(session.user);
          if (appUser?.id) {
            setUser(appUser);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profileError) console.error("PROFILE LOAD ERROR:", profileError);
            if (profileData) setProfile(profileData);
            else setProfile({});
            setIsAuthenticated(true);
            setAuthError(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
          authInFlightRef.current = false;
        }
        return;
      }
      setIsLoadingAuth(false);
    });

    // Procesar OAuth redirect: #access_token en la URL (web)
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname + '#/');
          })
          .catch(() => {})
          .finally(() => resolveSession());
        return () => subscription.unsubscribe();
      }
    }

    resolveSession();

    return () => subscription.unsubscribe();
  }, [resolveSession, ensureUserInDb]);

  const checkUserAuth = useCallback(async () => {
    await resolveSession();
  }, [resolveSession]);

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data ?? {});
    } catch (err) {
      console.error('refreshProfile failed:', err);
    }
  }, [user?.id]);

  const logout = useCallback(async (shouldRedirect = false) => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    await clearSupabaseAuthStorage();
    if (shouldRedirect) {
      window.location.href = window.location.origin + '/';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    // No-op when using Supabase; Login is shown by AuthRouter when !user?.id
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      profile: profile ?? {},
      setProfile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      appPublicSettings: null,
      isLoadingPublicSettings: false,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
      checkUserAuth,
      refreshProfile,
    }),
    [user, profile, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, checkUserAuth, refreshProfile]
  );

  RENDER_LOG('AuthProvider RENDER', { user: !!user?.id, isLoadingAuth, isAuthenticated });
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

```

================================================================
FILE: src/lib/LayoutContext.jsx
================================================================
```jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [headerConfig, setHeaderConfig] = useState({
    title: 'WaitMe!',
    showBackButton: false,
    backTo: null,
    onBack: null,
    onTitleClick: null,
    titleClassName: 'text-[24px] leading-[24px]',
  });
  const [profileFormData, setProfileFormData] = useState(null);

  const setHeader = useCallback((config) => {
    setHeaderConfig((prev) => ({ ...prev, ...config }));
  }, []);

  return (
    <LayoutContext.Provider value={{ headerConfig, setHeader, profileFormData, setProfileFormData }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutHeader() {
  const ctx = useContext(LayoutContext);
  return ctx?.setHeader ?? (() => {});
}

export function useLayoutHeaderConfig() {
  const ctx = useContext(LayoutContext);
  return ctx?.headerConfig ?? {};
}

export function useProfileFormData() {
  const ctx = useContext(LayoutContext);
  return ctx?.profileFormData ?? null;
}

export function useSetProfileFormData() {
  const ctx = useContext(LayoutContext);
  return ctx?.setProfileFormData ?? (() => {});
}

```

================================================================
FILE: src/lib/alertSelectors.js
================================================================
```js
/**
 * Shared pure selectors for parking alert data.
 * Used by HistorySellerView (via History.jsx) and BottomNav to guarantee
 * the badge count matches exactly what the seller tab renders.
 */

export function toMs(v) {
  if (v == null) return null;

  // Date
  if (v instanceof Date) return v.getTime();

  // Number (ms o seconds)
  if (typeof v === 'number') {
    return v > 1e12 ? v : v * 1000;
  }

  // String
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;

    // Si tiene zona horaria (Z o +hh:mm) → Date normal
    if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) {
      const t = new Date(s).getTime();
      return Number.isNaN(t) ? null : t;
    }

    // 🔴 CLAVE: string SIN zona → tratar como hora local (Madrid)
    const t = new Date(s + ':00').getTime();
    return Number.isNaN(t) ? null : t;
  }

  return null;
}

/**
 * Returns ALL alerts owned by the user with status 'active' or 'reserved'.
 * Ownership: user_id OR created_by OR user_email.
 * No limit on count — all visible seller alerts in "Tus alertas → Activas".
 *
 * Returns [] when no data or no qualifying alert.
 */
export function getActiveSellerAlerts(myAlerts, userId, userEmail) {
  if (!Array.isArray(myAlerts) || myAlerts.length === 0) return [];

  return myAlerts.filter((a) => {
    if (!a) return false;

    const isMine =
      (userId && (a.user_id === userId || a.created_by === userId)) ||
      (userEmail && a.user_email === userEmail);

    if (!isMine) return false;

    const status = String(a.status || '').toLowerCase();
    return status === 'active' || status === 'reserved';
  });
}

/**
 * Returns ALL active seller alerts that are not hidden in the UI.
 * hiddenKeys is the Set persisted in localStorage under 'waitme:hidden_keys'.
 * Cards use the key format `active-${alert.id}`.
 * Count matches exactly what HistorySellerView renders in "Tus alertas → Activas".
 */
export function getVisibleActiveSellerAlerts(myAlerts, userId, userEmail, hiddenKeys) {
  const active = getActiveSellerAlerts(myAlerts, userId, userEmail);
  if (!hiddenKeys || hiddenKeys.size === 0) return active;
  return active.filter((a) => !hiddenKeys.has(`active-${a.id}`));
}

/**
 * Returns the most reliable finalization timestamp for any item (ParkingAlert,
 * Transaction, or RejectedRequest).
 * Priority: updated_at > completed_at > cancelled_at > created_at >
 *           updated_date > created_date > savedAt (for rejected requests).
 * Always returns a NUMBER in milliseconds. Never returns null/undefined/string.
 * Returns 0 when no valid date field is found (safe for sort comparisons).
 */
export function getBestFinalizedTs(a) {
  if (!a) return 0;
  const t =
    toMs(a.finalized_at) ||   // client-stamped at cancellation/rejection
    toMs(a.updated_at) ||
    toMs(a.completed_at) ||
    toMs(a.cancelled_at) ||
    toMs(a.created_at) ||
    toMs(a.updated_date) ||
    toMs(a.created_date) ||
    toMs(a.savedAt) ||
    null;
  return typeof t === 'number' ? t : 0;
}

/** Read the persisted hiddenKeys Set from localStorage (safe fallback to empty Set). */
export function readHiddenKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem('waitme:hidden_keys') || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

```

================================================================
FILE: src/lib/alertsQueryKey.js
================================================================
```js
/**
 * Canonical factory for the ['alerts', mode, locationKey] query key.
 *
 * Using a single factory ensures every setQueryData / getQueryData /
 * invalidateQueries call in the app targets exactly the same key structure
 * as the useQuery that owns the data, eliminating key-mismatch bugs.
 *
 * For prefix-wide invalidation (all alert variants) pass no arguments:
 *   queryClient.invalidateQueries({ queryKey: alertsPrefix })
 */

import { NEARBY_REFRESH_THRESHOLD_M } from '@/config/alerts';

/** Exact key for a specific mode + location combination. */
export const alertsKey = (mode, locationKey) => ['alerts', mode, locationKey];

/** Key for nearby alerts (used by Home map in both logo and search modes). */
export const nearbyAlertsKey = (locationKey) => ['alerts', 'nearby', locationKey];

/** Prefix key — invalidates ALL alert query variants at once. */
export const alertsPrefix = ['alerts'];

/**
 * Extrae lat/lng de userLocation (array o objeto).
 * @param {[number,number]|{lat,lng,latitude,longitude}} userLocation
 * @returns {{ lat: number, lng: number }|null}
 */
export function extractLatLng(userLocation) {
  if (!userLocation) return null;
  const lat = Array.isArray(userLocation) ? userLocation[0] : userLocation?.latitude ?? userLocation?.lat;
  const lng = Array.isArray(userLocation) ? userLocation[1] : userLocation?.longitude ?? userLocation?.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Genera locationKey para nearby: solo cambia cuando el usuario se mueve
 * más de NEARBY_REFRESH_THRESHOLD_M. Evita refetches por movimientos mínimos.
 * @param {number} lat
 * @param {number} lng
 * @returns {string|null} "lat,lng" o null si inválido
 */
export function getLocationKeyForNearby(lat, lng) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const gridDeg = NEARBY_REFRESH_THRESHOLD_M / 111000;
  const latSnap = Math.floor(lat / gridDeg) * gridDeg;
  const lngSnap = Math.floor(lng / gridDeg) * gridDeg;
  return `${latSnap.toFixed(5)},${lngSnap.toFixed(5)}`;
}

```

================================================================
FILE: src/lib/finalizedAtStore.js
================================================================
```js
/**
 * Client-side store for finalized_at timestamps.
 *
 * Problem solved: server-side dates (updated_at, cancelled_at …) are unreliable
 * for sort order because:
 *   1. They can be null/missing on the server.
 *   2. After invalidateQueries the cache is overwritten by server data, losing
 *      any client-side field we added via setQueryData.
 *
 * Solution: stamp `Date.now()` in localStorage at the exact moment an alert
 * is finalized on the client. The stamp survives refetches because it lives
 * in localStorage, keyed by alert/request id.
 *
 * Usage:
 *   stampFinalizedAt(id)          → call at the cancel/complete action site
 *   getFinalizedAtMap()           → call inside useMemo to read the full map
 *   getFinalizedAt(id)            → convenience single-id lookup
 */

const STORE_KEY = 'waitme:finalized_at_map';

/** Returns the full {id: timestampMs} map from localStorage. */
export function getFinalizedAtMap() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return typeof map === 'object' && !Array.isArray(map) && map !== null
      ? map
      : {};
  } catch {
    return {};
  }
}

/** Returns the stamped timestamp for a single id, or null if not yet stamped. */
export function getFinalizedAt(id) {
  if (!id) return null;
  return getFinalizedAtMap()[id] ?? null;
}

/**
 * Stamps Date.now() for the given id.
 * Idempotent: if already stamped, the original timestamp is preserved so
 * the sort order never changes on subsequent renders/refetches.
 */
export function stampFinalizedAt(id) {
  if (!id) return;
  try {
    const map = getFinalizedAtMap();
    if (map[id]) return; // already stamped — keep original order
    map[id] = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {}
}

```

================================================================
FILE: src/lib/geohash.js
================================================================
```js
/**
 * Geohash encode (precision 7 ≈ 153m).
 */
import ngeohash from 'ngeohash';

export function encode(lat, lng, precision = 7) {
  return ngeohash.encode(lat, lng, precision);
}

/** Prefijos para búsqueda por radio: 5 (~5km), 6 (~1.2km), 7 (~150m) */
export function getNeighborPrefixes(geohash, radiusKm = 2) {
  const p = geohash || 'zzzzzzz';
  return [p.slice(0, 5), p.slice(0, 6), p.slice(0, 7)].filter(Boolean);
}

```

================================================================
FILE: src/lib/mockNearby.js
================================================================
```js
// ================================
// FILE: src/lib/mockNearby.js
// ================================

const OVIEDO_LAT = 43.3623;
const OVIEDO_LNG = -5.8489;

// 10 usuarios fijos (fotos realistas) + datos completos
export const MOCK_USERS = [
  {
    id: 'mock_u1',
    name: 'Sofía',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    vehicle_type: 'car',
    brand: 'SEAT',
    model: 'León',
    color: 'blanco',
    plate: '1234 JKL',
    phone: '+34 612 345 901'
  },
  {
    id: 'mock_u2',
    name: 'Hugo',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    vehicle_type: 'suv',
    brand: 'Nissan',
    model: 'Qashqai',
    color: 'gris',
    plate: '5678 MNP',
    phone: '+34 611 224 872'
  },
  {
    id: 'mock_u3',
    name: 'Nuria',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    vehicle_type: 'van',
    brand: 'Volkswagen',
    model: 'Transporter',
    color: 'negro',
    plate: '9012 BCD',
    phone: '+34 613 908 771'
  },
  {
    id: 'mock_u4',
    name: 'Iván',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    vehicle_type: 'car',
    brand: 'Renault',
    model: 'Clio',
    color: 'rojo',
    plate: '3456 FGH',
    phone: '+34 610 552 330'
  },
  {
    id: 'mock_u5',
    name: 'Marco',
    photo: 'https://randomuser.me/api/portraits/men/12.jpg',
    vehicle_type: 'car',
    brand: 'Peugeot',
    model: '208',
    color: 'azul',
    plate: '7890 QRS',
    phone: '+34 614 401 992'
  },
  {
    id: 'mock_u6',
    name: 'Laura',
    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
    vehicle_type: 'suv',
    brand: 'Kia',
    model: 'Sportage',
    color: 'verde',
    plate: '2468 TUV',
    phone: '+34 615 993 120'
  },
  {
    id: 'mock_u7',
    name: 'Dani',
    photo: 'https://randomuser.me/api/portraits/men/46.jpg',
    vehicle_type: 'car',
    brand: 'Toyota',
    model: 'Corolla',
    color: 'negro',
    plate: '1357 WXY',
    phone: '+34 616 220 415'
  },
  {
    id: 'mock_u8',
    name: 'Paula',
    photo: 'https://randomuser.me/api/portraits/women/25.jpg',
    vehicle_type: 'van',
    brand: 'Mercedes',
    model: 'Vito',
    color: 'gris',
    plate: '8642 ZAB',
    phone: '+34 617 882 064'
  },
  {
    id: 'mock_u9',
    name: 'Álvaro',
    photo: 'https://randomuser.me/api/portraits/men/19.jpg',
    vehicle_type: 'car',
    brand: 'Volkswagen',
    model: 'Golf',
    color: 'blanco',
    plate: '9753 CDE',
    phone: '+34 618 771 203'
  },
  {
    id: 'mock_u10',
    name: 'Claudia',
    photo: 'https://randomuser.me/api/portraits/women/55.jpg',
    vehicle_type: 'suv',
    brand: 'Hyundai',
    model: 'Tucson',
    color: 'morado',
    plate: '1122 FJK',
    phone: '+34 619 330 778'
  }
];

export function getMockNearbyAlerts(userLocation) {
  const baseLat = Array.isArray(userLocation) ? Number(userLocation[0]) : Number(userLocation?.latitude ?? userLocation?.lat);
  const baseLng = Array.isArray(userLocation) ? Number(userLocation[1]) : Number(userLocation?.longitude ?? userLocation?.lng);

  const lat0 = Number.isFinite(baseLat) ? baseLat : OVIEDO_LAT;
  const lng0 = Number.isFinite(baseLng) ? baseLng : OVIEDO_LNG;

  // offsets fijos (no aleatorios) para que siempre estén “cerca alrededor”
  const now = Date.now();
  const streets = [
    'Calle Uría, n18, Oviedo',
    'Calle Cervantes, n7, Oviedo',
    'Calle Campoamor, n12, Oviedo',
    'Calle Rosal, n3, Oviedo',
    'Calle Jovellanos, n9, Oviedo',
    'Avenida de Galicia, n22, Oviedo',
    'Calle Milicias Nacionales, n5, Oviedo',
    'Calle San Francisco, n14, Oviedo',
    'Calle Martínez Marina, n6, Oviedo',
    'Calle Independencia, n11, Oviedo',
    'Calle Fruela, n4, Oviedo', 'Calle Mon, n15, Oviedo', 'Calle Toreno, n8, Oviedo',
    'Calle Asturias, n22, Oviedo', 'Plaza Escandalera, Oviedo', 'Calle Gil de Jaz, n12, Oviedo'
  ];

  const minutes = [8, 12, 15, 18, 10, 22, 14, 9, 16, 20, 11, 13, 17, 19, 6, 21];
  const prices = [6, 8, 7, 9, 5, 10, 6, 7, 8, 9, 4, 11, 6, 7, 5, 10, 8];

  const count = 12 + Math.floor(Math.random() * 9);
  const result = [];
  const randomOffset = () => {
    const angle = Math.random() * 2 * Math.PI;
    const r = 0.0022 * (0.3 + Math.random() * 0.7);
    return [r * Math.cos(angle), r * Math.sin(angle)];
  };
  for (let i = 0; i < count; i++) {
    const u = MOCK_USERS[i % MOCK_USERS.length];
    const [dLat, dLng] = randomOffset();
    const available = minutes[i % minutes.length] || 15;
    const created = now - (i + 1) * 60 * 1000;

    result.push({
      id: `mock_alert_${u.id}_${i}`,
      user_id: u.id,
      user_name: u.name,
      user_photo: u.photo,

      // “todos los datos”
      brand: u.brand,
      model: u.model,
      plate: u.plate,
      phone: u.phone,

      vehicle_type: u.vehicle_type,
      vehicle_color: u.color,
      color: u.color,

      address: streets[i % streets.length] || 'Calle Gran Vía, n1, Oviedo',

      latitude: lat0 + dLat,
      longitude: lng0 + dLng,

      price: prices[i % prices.length] || 8,
      available_in_minutes: available,
      created_date: created,
      wait_until: created + available * 60 * 1000,
      status: 'active'
    });
  }
  return result;
}

```

================================================================
FILE: src/lib/mockOviedoAlerts.js
================================================================
```js
/**
 * Dataset mock temporal para probar UI en Oviedo.
 * 30 coches dentro de 600m del usuario + 20 repartidos por Oviedo.
 * Solo se usa cuando la base de datos devuelve pocas alertas.
 */

const OVIEDO_CENTER = { lat: 43.3619, lng: -5.8494 };

const VEHICLE_TYPES = ['car', 'van', 'suv'];
const COLORS = ['white', 'black', 'blue', 'red', 'gray', 'green', 'yellow', 'purple', 'orange'];
const STREETS = [
  'Calle Uría', 'Calle Cervantes', 'Calle Campoamor', 'Calle Rosal', 'Calle Jovellanos',
  'Avenida de Galicia', 'Calle Milicias Nacionales', 'Calle San Francisco', 'Calle Martínez Marina',
  'Calle Independencia', 'Calle Fruela', 'Calle Mon', 'Calle Toreno', 'Calle Asturias',
  'Plaza Escandalera', 'Calle Gil de Jaz', 'Calle Gascona', 'Plaza de la Catedral',
  'Calle Palacio Valdés', 'Calle Magdalena', 'Calle Caveda', 'Calle Posada Herrera',
  'Calle Santa Cruz', 'Calle San Juan', 'Calle Rúa', 'Calle Canóniga', 'Calle Altamirano',
];

const NAMES = ['Sofía', 'Hugo', 'Nuria', 'Iván', 'Marco', 'Laura', 'Dani', 'Paula', 'Álvaro', 'Claudia', 'Carlos', 'Elena', 'Miguel', 'Ana', 'Pablo'];

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera 50 alertas mock: 30 cerca del usuario (radio ~600m), 20 repartidas por Oviedo.
 * @param {Object} userLocation - { lat, lng } o [lat, lng]
 * @returns {Array} alertas con estructura compatible con MapboxMap
 */
export function getMockOviedoAlerts(userLocation) {
  const baseLat = Array.isArray(userLocation) ? userLocation[0] : userLocation?.lat ?? OVIEDO_CENTER.lat;
  const baseLng = Array.isArray(userLocation) ? userLocation[1] : userLocation?.lng ?? OVIEDO_CENTER.lng;

  const now = Date.now();
  const result = [];

  // 30 coches dentro de radio 600m del usuario (lat ± 0.005, lng ± 0.005 ≈ 550m)
  const NEARBY_R = 0.005;
  for (let i = 0; i < 30; i++) {
    const dLat = (Math.random() * 2 - 1) * NEARBY_R;
    const dLng = (Math.random() * 2 - 1) * NEARBY_R;
    const lat = baseLat + dLat;
    const lng = baseLng + dLng;

    const price = randomInt(2, 10);
    const available_in_minutes = [5, 10, 15, 20, 25, 30][i % 6];
    const created = now - (i + 1) * 45 * 1000;

    result.push({
      id: `mock_near_${i}_${Date.now()}`,
      user_id: `mock_u${(i % 10) + 1}`,
      user_name: pick(NAMES),
      user_photo: null,

      vehicle_type: pick(VEHICLE_TYPES),
      vehicle_color: pick(COLORS),
      color: pick(COLORS),

      address: `${pick(STREETS)}, ${randomInt(1, 50)}, Oviedo`,

      latitude: lat,
      longitude: lng,
      lat,
      lng,

      price,
      available_in_minutes,
      availableInMinutes: available_in_minutes,
      created_date: created,
      wait_until: new Date(created + available_in_minutes * 60 * 1000).toISOString(),
      status: 'active',

      is_mock: true,
    });
  }

  // 20 coches repartidos por Oviedo (offsets mayores)
  const OVIEDO_R = 0.008;
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * 2 * Math.PI * 2 + Math.random() * 0.5;
    const r = OVIEDO_R * (0.3 + Math.random() * 0.7);
    const dLat = r * Math.cos(angle);
    const dLng = r * Math.sin(angle);
    const lat = OVIEDO_CENTER.lat + dLat;
    const lng = OVIEDO_CENTER.lng + dLng;

    const price = randomInt(2, 10);
    const available_in_minutes = [5, 10, 15, 20, 25, 30][i % 6];
    const created = now - (30 + i + 1) * 45 * 1000;

    result.push({
      id: `mock_oviedo_${i}_${Date.now()}`,
      user_id: `mock_u${(i % 10) + 1}`,
      user_name: pick(NAMES),
      user_photo: null,

      vehicle_type: pick(VEHICLE_TYPES),
      vehicle_color: pick(COLORS),
      color: pick(COLORS),

      address: `${pick(STREETS)}, ${randomInt(1, 50)}, Oviedo`,

      latitude: lat,
      longitude: lng,
      lat,
      lng,

      price,
      available_in_minutes,
      availableInMinutes: available_in_minutes,
      created_date: created,
      wait_until: new Date(created + available_in_minutes * 60 * 1000).toISOString(),
      status: 'active',

      is_mock: true,
    });
  }

  return result;
}

```

================================================================
FILE: src/lib/profile.ts
================================================================
```ts
export function normalizeProfile(profile) {
  const p = profile ?? {};
  return {
    full_name: String(p.full_name || p.name || "").trim(),
    phone: String(p.phone || p.phone_number || "").trim(),
    brand: String(p.brand || "").trim(),
    model: String(p.model || "").trim(),
    color: String(p.color || "").trim(),
    vehicle_type: String(p.vehicle_type || p.vehicle || "").trim(),
    plate: String(p.plate || "").trim(),
  };
}

export function getMissingProfileFields(profile) {
  const p = normalizeProfile(profile);
  const missing = [];
  if (!p.full_name) missing.push("Nombre");
  if (!p.phone) missing.push("Teléfono");
  if (!p.brand) missing.push("Marca");
  if (!p.model) missing.push("Modelo");
  if (!p.color) missing.push("Color");
  if (!p.vehicle_type) missing.push("Vehículo");
  if (!p.plate) missing.push("Matrícula");
  return missing;
}

export function isProfileComplete(profile) {
  return getMissingProfileFields(profile).length === 0;
}

/** Crea payload para Supabase profiles desde formData */
export function toProfilePayload(formData) {
  const p = normalizeProfile(formData);
  return {
    full_name: p.full_name,
    phone: p.phone,
    brand: p.brand,
    model: p.model,
    color: p.color || 'gris',
    vehicle_type: p.vehicle_type || 'car',
    plate: p.plate,
    avatar_url: formData?.avatar_url ?? '',
    allow_phone_calls: formData?.allow_phone_calls ?? false,
    notifications_enabled: formData?.notifications_enabled !== false,
    email_notifications: formData?.email_notifications !== false,
  };
}

```

================================================================
FILE: src/lib/sentry.js
================================================================
```js
/**
 * Inicialización de Sentry para observabilidad.
 * Solo se activa si VITE_SENTRY_DSN está configurado.
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn && typeof dsn === 'string' && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

```

================================================================
FILE: src/lib/supabaseClient.js
================================================================
```js
/**
 * Punto único de entrada para Supabase.
 * Inicialización LAZY: no se crea el cliente hasta que se llama getSupabase().
 * Si faltan envs, getSupabase() devuelve null (no lanza).
 * En iOS Capacitor usa Preferences para persistir la sesión.
 */
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

let _client = null;

const capacitorStorage = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
  },
};

function getAuthOptions() {
  const base = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  };
  if (Capacitor.isNativePlatform()) {
    return { ...base, storage: capacitorStorage };
  }
  return base;
}

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const missing = [];
  if (!url || String(url).trim() === "") missing.push("VITE_SUPABASE_URL");
  if (!anonKey || String(anonKey).trim() === "") missing.push("VITE_SUPABASE_ANON_KEY");
  const ok = missing.length === 0;
  return { url: url || "", anonKey: anonKey || "", ok, missing };
}

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config.ok) return null;
  if (_client) return _client;
  try {
    _client = createClient(config.url, config.anonKey, {
      auth: getAuthOptions(),
    });
    return _client;
  } catch {
    return null;
  }
}

/**
 * Borra las claves de sesión de Supabase en Preferences (Capacitor).
 * Usar tras signOut para asegurar logout completo.
 */
export async function clearSupabaseAuthStorage() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { keys } = await Preferences.keys();
    const supabaseKeys = (keys || []).filter((k) => k.startsWith("sb-"));
    await Promise.all(supabaseKeys.map((key) => Preferences.remove({ key })));
  } catch {
    /* no-op */
  }
}

```

================================================================
FILE: src/lib/transactionEngine.js
================================================================
```js
/**
 * Motor central de transacciones ficticias para WaitMe.
 * Gestiona estados finales, reglas económicas y estado en memoria (balance, ban, comisión extra).
 * No realiza llamadas a API ni modifica UI.
 */

// --- Estados finales ---
export const OUTCOME = {
  FINALIZADA_OK: 'finalizada_ok',
  FINALIZADA_NO_SHOW: 'finalizada_no_show',
  FINALIZADA_CANCELADA_POR_COMPRADOR: 'finalizada_cancelada_por_comprador',
  FINALIZADA_CANCELADA_POR_VENDEDOR: 'finalizada_cancelada_por_vendedor'
};

// --- Reglas económicas (porcentajes 0-1) ---
const SELLER_SHARE = 0.67;
const APP_SHARE = 0.33;
const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const EXTRA_COMMISSION_PENALTY = 0.33; // 33% adicional en próxima operación

// --- Estado en memoria por usuario ---
/** @type {Map<string, { balance: number, banUntil: number | null, extraCommissionNext: boolean }>} */
const userState = new Map();

function ensureUser(userId) {
  if (!userId) return null;
  const key = String(userId);
  if (!userState.has(key)) {
    userState.set(key, { balance: 0, banUntil: null, extraCommissionNext: false });
  }
  return userState.get(key);
}

/**
 * Obtiene el balance actual de un usuario (en memoria).
 * @param {string} userId
 * @returns {number}
 */
export function getBalance(userId) {
  const u = ensureUser(userId);
  return u ? u.balance : 0;
}

/**
 * Indica si el usuario está baneado (penalización 24h).
 * @param {string} userId
 * @returns {boolean}
 */
export function isBanned(userId) {
  const u = ensureUser(userId);
  if (!u || !u.banUntil) return false;
  return Date.now() < u.banUntil;
}

/**
 * Fecha/hora hasta la que el usuario está baneado (timestamp ms), o null.
 * @param {string} userId
 * @returns {number | null}
 */
export function getBanUntil(userId) {
  const u = ensureUser(userId);
  if (!u || !u.banUntil) return null;
  return Date.now() < u.banUntil ? u.banUntil : null;
}

/**
 * Indica si en la próxima operación el vendedor tiene comisión adicional (33%).
 * @param {string} userId
 * @returns {boolean}
 */
export function getExtraCommissionNext(userId) {
  const u = ensureUser(userId);
  return u ? u.extraCommissionNext : false;
}

/**
 * Aplica penalización al vendedor: ban 24h + próxima operación comisión adicional 33%.
 * @param {string} sellerId
 */
function applySellerPenalty(sellerId) {
  const u = ensureUser(sellerId);
  if (u) {
    u.banUntil = Date.now() + BAN_DURATION_MS;
    u.extraCommissionNext = true;
  }
}

/**
 * Finaliza una transacción con el resultado indicado y aplica reglas económicas.
 * Actualiza balances en memoria. No llama a API.
 *
 * @param {Object} params
 * @param {string} params.outcome - OUTCOME.FINALIZADA_* 
 * @param {number} params.amount - Importe total de la operación (ej. precio de la alerta)
 * @param {string} params.sellerId - ID del vendedor
 * @param {string} params.buyerId - ID del comprador
 * @param {boolean} [params.sellerCancelledOrMoved] - true si vendedor canceló o se movió >5m (para aplicar penalización)
 * @returns {{ sellerAmount: number, buyerAmount: number, appAmount: number, sellerBannedUntil: number | null, extraCommissionNext: boolean }}
 */
export function finalize({ outcome, amount, sellerId, buyerId, sellerCancelledOrMoved = false }) {
  const total = Number(amount) || 0;
  const seller = ensureUser(sellerId);
  const buyer = ensureUser(buyerId);

  let sellerAmount = 0;
  let buyerAmount = 0;
  const appAmount = Math.round((total * APP_SHARE) * 100) / 100;

  if (outcome === OUTCOME.FINALIZADA_CANCELADA_POR_VENDEDOR || sellerCancelledOrMoved) {
    // Vendedor cancela o se mueve >5m: vendedor 0€, comprador recupera 67%, app 33%
    buyerAmount = Math.round((total * SELLER_SHARE) * 100) / 100; // lo que “recupera” el comprador
    if (buyer) buyer.balance += buyerAmount;
    applySellerPenalty(sellerId);
  } else {
    // Operación normal (ok, no_show, cancelada_por_comprador): vendedor 67%, app 33%
    let sellerShare = SELLER_SHARE;
    if (seller && seller.extraCommissionNext) {
      // Próxima operación comisión adicional: app se queda con 33% + 33% = 66%, vendedor 34%
      sellerShare = 1 - APP_SHARE - EXTRA_COMMISSION_PENALTY; // 0.34
      seller.extraCommissionNext = false; // consumida
    }
    sellerAmount = Math.round((total * sellerShare) * 100) / 100;
    if (seller) seller.balance += sellerAmount;
  }

  const sellerBannedUntil = getBanUntil(sellerId);
  const extraCommissionNext = getExtraCommissionNext(sellerId);

  try {
    window.dispatchEvent(new Event('balanceUpdated'));
  } catch (_) {}

  return {
    sellerAmount,
    buyerAmount,
    appAmount,
    sellerBannedUntil,
    extraCommissionNext
  };
}

/**
 * Resetea el estado en memoria de un usuario (útil para tests o logout).
 * @param {string} [userId] - Si no se pasa, resetea todos.
 */
export function resetUserState(userId) {
  if (userId) {
    userState.delete(String(userId));
  } else {
    userState.clear();
  }
}

```

================================================================
FILE: src/lib/utils.js
================================================================
```js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

```

================================================================
FILE: src/lib/vehicleIcons.js
================================================================
```js
/**
 * Iconos de vehículo — mapa, tarjetas, botón "¡Estoy aparcado aquí!".
 * Tipos: car, suv, van. Colores del perfil del usuario.
 */

const COLOR_MAP = {
  white: '#FFFFFF',
  black: '#1a1a1a',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  gray: '#6b7280',
  gris: '#6b7280',
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  azul: '#3b82f6',
  rojo: '#ef4444',
  verde: '#22c55e',
  amarillo: '#eab308',
  morado: '#a855f7',
  naranja: '#f97316',
};

function toHexColor(color) {
  if (!color || typeof color !== 'string') return COLOR_MAP.gray;
  const key = String(color).toLowerCase().trim();
  return COLOR_MAP[key] ?? COLOR_MAP.gray;
}

function getCarSvgPath(type, hex) {
  const t = String(type || 'car').toLowerCase();
  if (t === 'van') {
    return `<path d="M6 12 L6 24 L42 24 L42 14 L38 12 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="3" fill="#333"/><circle cx="34" cy="24" r="3" fill="#333"/>`;
  }
  if (t === 'suv') {
    return `<path d="M8 18 L10 10 L16 8 L32 8 L38 10 L42 16 L42 24 L8 24 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><circle cx="14" cy="24" r="4" fill="#333"/><circle cx="36" cy="24" r="4" fill="#333"/>`;
  }
  return `<path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${hex}" stroke="white" stroke-width="1.5"/><path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/><circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/><circle cx="14" cy="18" r="2" fill="#666"/><circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/><circle cx="36" cy="18" r="2" fill="#666"/>`;
}

/**
 * Icono 52px con precio centrado — para marcadores del mapa.
 * @param {string} type - car | suv | van
 * @param {string} color - white | black | blue | ...
 * @param {number} price - precio en euros
 */
export function getCarWithPriceHtml(type = 'car', color = 'gray', price = 0) {
  const hex = toHexColor(color);
  const path = getCarSvgPath(type, hex);
  const priceText = `€${Math.round(Number(price) || 0)}`;
  return `<div class="waitme-car-marker" style="width:52px;height:32px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
    <svg width="52" height="32" viewBox="0 0 48 24" fill="none" style="display:block">${path}</svg>
    <div style="position:absolute;top:6px;left:0;right:0;text-align:center;font-size:11px;font-weight:700;color:white;text-shadow:0 1px 2px rgba(0,0,0,0.8)">${priceText}</div>
  </div>`;
}

/**
 * SVG idéntico a CarIconProfile (botón "¡Estoy aparcado aquí!").
 * @param {string} color - white | black | blue | ... (o español)
 */
export function getCarIconHtml(color = 'gray') {
  const hex = toHexColor(color);
  const svg = `<svg width="48" height="24" viewBox="0 0 48 24" fill="none">
    <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill="${hex}" stroke="white" stroke-width="1.5"/>
    <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" stroke-width="0.5"/>
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
    <circle cx="14" cy="18" r="2" fill="#666"/>
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" stroke-width="1"/>
    <circle cx="36" cy="18" r="2" fill="#666"/>
  </svg>`;
  return `<div style="width:48px;height:24px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${svg}</div>`;
}

```

================================================================
FILE: src/lib/waitmeRequests.js
================================================================
```js
// ================================
// FILE: src/lib/waitmeRequests.js
// ================================

const STORAGE_KEY = 'waitme_requests_v1';

function safeJsonParse(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

export function getWaitMeRequests() {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const arr = safeJsonParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

export function saveWaitMeRequests(list) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch {}
}

export function upsertWaitMeRequest(req) {
  const list = getWaitMeRequests();
  const id = req?.id;
  if (!id) return;
  const next = list.slice();
  const idx = next.findIndex((r) => r?.id === id);
  if (idx >= 0) next[idx] = { ...next[idx], ...req };
  else next.unshift(req);
  saveWaitMeRequests(next);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}

export function setWaitMeRequestStatus(id, status, extra = {}) {
  if (!id) return;
  const list = getWaitMeRequests();
  const next = list.map((r) => {
    if (r?.id !== id) return r;
    return { ...r, status, ...extra, updatedAt: Date.now() };
  });
  saveWaitMeRequests(next);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}

export function clearWaitMeRequests() {
  saveWaitMeRequests([]);
  try { window.dispatchEvent(new Event('waitme:requestsChanged')); } catch {}
}

```
