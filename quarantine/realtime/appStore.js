/**
 * Store global con Zustand.
 * NO contiene llamadas a Supabase.
 */
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  auth: { user: null },
  profile: null,
  alerts: { items: [], loading: false },
  location: { lat: null, lng: null, accuracy: null },
  ui: { error: null },

  setUser: (user) => set((s) => ({ auth: { ...s.auth, user } })),
  setProfile: (profile) => set({ profile }),
  setLocation: (lat, lng, accuracy) =>
    set({ location: { lat, lng, accuracy } }),
  setAlerts: (items) =>
    set((s) => ({ alerts: { ...s.alerts, items: items ?? [], loading: false } })),
  setAlertsLoading: (loading) =>
    set((s) => ({ alerts: { ...s.alerts, loading } })),
  upsertAlert: (alert) =>
    set((s) => {
      const items = [...s.alerts.items];
      const idx = items.findIndex((a) => a.id === alert.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...alert };
      else items.push(alert);
      return { alerts: { ...s.alerts, items } };
    }),
  removeAlert: (id) =>
    set((s) => ({
      alerts: {
        ...s.alerts,
        items: s.alerts.items.filter((a) => a.id !== id),
      },
    })),
  setError: (error) => set({ ui: { error } }),
  clearError: () => set((s) => ({ ui: { ...s.ui, error: null } })),
}));
