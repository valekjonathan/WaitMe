/**
 * Estado de mapa — viewport, zoom, filters, contentArea, carsMode.
 */
import { useState, useEffect, useMemo } from 'react';
import { getBoundsKeyForViewport } from '@/lib/alertsQueryKey';
import { getCarsMovementMode, subscribeToCarsMovementMode } from '@/stores/carsMovementStore';
import {
  VIEWPORT_ALERTS_LIMIT_LOW_ZOOM,
  VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM,
  ZOOM_VIEWPORT_THRESHOLD,
} from '@/config/alerts';

export function useHomeMapState(mode) {
  const [viewportBounds, setViewportBounds] = useState(null);
  const [viewportZoom, setViewportZoom] = useState(null);
  const [filters, setFilters] = useState({
    maxPrice: 10,
    maxMinutes: 30,
    maxDistance: 10,
  });
  const [contentArea, setContentArea] = useState({ top: 0, height: 0 });
  const [carsMode, setCarsMode] = useState(getCarsMovementMode);

  useEffect(() => {
    return subscribeToCarsMovementMode(setCarsMode);
  }, []);

  useEffect(() => {
    if (!mode) return;
    const measure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const header = document.querySelector('[data-waitme-header]');
          const nav = document.querySelector('[data-waitme-nav]');
          if (!header || !nav) return;
          const headerRect = header.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          setContentArea({ top: headerRect.bottom, height: navRect.top - headerRect.bottom });
        });
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mode]);

  const viewportLimit = useMemo(() => {
    if (viewportZoom == null) return VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM;
    return viewportZoom < ZOOM_VIEWPORT_THRESHOLD
      ? VIEWPORT_ALERTS_LIMIT_LOW_ZOOM
      : VIEWPORT_ALERTS_LIMIT_HIGH_ZOOM;
  }, [viewportZoom]);

  const viewportBoundsKey = useMemo(
    () => (viewportBounds ? getBoundsKeyForViewport(viewportBounds) : null),
    [viewportBounds]
  );

  return {
    viewportBounds,
    setViewportBounds,
    viewportZoom,
    setViewportZoom,
    filters,
    setFilters,
    contentArea,
    carsMode,
    viewportLimit,
    viewportBoundsKey,
  };
}
