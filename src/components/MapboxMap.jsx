import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/state/appStore';

const OVIEDO_CENTER = [-5.84476, 43.36139];
const DEFAULT_ZOOM = 15;
const DEFAULT_PITCH = 45;
const DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

export default function MapboxMap({
  center = OVIEDO_CENTER,
  zoom = DEFAULT_ZOOM,
  pitch = DEFAULT_PITCH,
  bearing = 0,
  className = '',
  style: mapStyle = DARK_STYLE,
  onMapLoad,
  children,
  ...rest
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapboxglRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [error, setError] = useState(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const alerts = useAppStore((s) => s.alerts.items);
  const location = useAppStore((s) => s.location);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || String(token).trim() === '' || token === 'PEGA_AQUI_EL_TOKEN') {
      setError('no_token');
      return;
    }
    if (!containerRef.current) return;

    let map = null;
    let cancelled = false;

    import('mapbox-gl')
      .then((mod) => {
        if (cancelled || !containerRef.current) return;
        const mapboxgl = mod.default;
        mapboxglRef.current = mapboxgl;
        import('mapbox-gl/dist/mapbox-gl.css');
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: mapStyle,
          center: Array.isArray(center) ? center : OVIEDO_CENTER,
          zoom: zoom ?? DEFAULT_ZOOM,
          pitch: pitch ?? DEFAULT_PITCH,
          bearing: bearing ?? 0,
          antialias: true,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapboxLoaded(true);
          onMapLoad?.(map);
        });

        map.on('error', (e) => {
          if (e.error?.message?.includes('token')) setError('no_token');
        });
      })
      .catch(() => setError('no_token'));

    return () => {
      cancelled = true;
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch {}
        userMarkerRef.current = null;
      }
      if (map) {
        try { map.remove(); } catch {}
      }
      mapRef.current = null;
      mapboxglRef.current = null;
      setMapboxLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapboxLoaded || !mapRef.current || !mapboxglRef.current || error) return;
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    const lat = location.lat;
    const lng = location.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch {}
      }
      const el = document.createElement('div');
      el.style.cssText =
        'width:20px;height:20px;background:#a855f7;border-radius:50%;box-shadow:0 0 12px rgba(168,85,247,0.8);border:3px solid white;';
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    }
  }, [mapboxLoaded, location.lat, location.lng, error]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        useAppStore.getState().setLocation(latitude, longitude, accuracy);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!mapboxLoaded || !mapRef.current || error) return;
    const map = mapRef.current;

    const features = alerts
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        type: 'Feature',
        properties: {
          id: a.id,
          price: Number(a.price) || 0,
          vehicle_type: a.vehicle_type || 'car',
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(a.lng), Number(a.lat)],
        },
      }));

    const geojson = { type: 'FeatureCollection', features };

    if (!map.getSource('alerts')) {
      map.addSource('alerts', { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
      map.addLayer({
        id: 'alerts-clusters',
        type: 'circle',
        source: 'alerts',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#a855f7',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'alerts-cluster-count',
        type: 'symbol',
        source: 'alerts',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
        },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: 'alerts-unclustered',
        type: 'circle',
        source: 'alerts',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#a855f7',
          'circle-radius': 12,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      map.addLayer({
        id: 'alerts-price',
        type: 'symbol',
        source: 'alerts',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['concat', ['to-string', ['get', 'price']], '€'],
          'text-size': 11,
          'text-offset': [0, 0],
        },
        paint: { 'text-color': '#fff' },
      });
    } else {
      map.getSource('alerts').setData(geojson);
    }
  }, [mapboxLoaded, alerts, error]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a1a] text-gray-500 text-sm ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        Mapa no disponible
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 200 }}
      {...rest}
    >
      {children}
    </div>
  );
}
