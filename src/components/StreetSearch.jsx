import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

const MAPBOX_GEOCODE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const OVIEDO_PROXIMITY = '-5.8494,43.3619';
const LIMIT = 6;

/**
 * Formatea place_name de Mapbox a formato corto.
 * "Calle Campoamor, Asturias, Spain" → "C/ Campoamor, Oviedo"
 * "Calle Campoamor 13, Asturias, Spain" → "C/ Campoamor 13, Oviedo"
 */
function formatStreetName(placeName) {
  if (!placeName || typeof placeName !== 'string') return placeName || '';
  const parts = placeName.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return placeName;

  let street = parts[0] || '';
  street = street.replace(/^Calle\s+/i, 'C/ ').replace(/^Avenida\s+/i, 'Av. ').replace(/^Plaza\s+/i, 'Pl. ');

  return `${street}, Oviedo`;
}

/**
 * Buscador de calles con Mapbox Geocoding.
 * - Al escribir → sugerencias automáticas
 * - Al seleccionar → centrar mapa (callback con [lng, lat])
 * - Ubicación: debajo del header
 */
export default function StreetSearch({ onSelect, placeholder = 'Buscar calle o dirección...', className = '' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const abortRef = useRef(null);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const hasToken = token && String(token).trim() && !['PEGA_AQUI_EL_TOKEN', 'YOUR_MAPBOX_PUBLIC_TOKEN'].includes(String(token).trim());

  const fetchSuggestions = useCallback(async (q) => {
    if (!hasToken || !q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = new URL(`${MAPBOX_GEOCODE_URL}/${encodeURIComponent(q.trim())}.json`);
      url.searchParams.set('access_token', token);
      url.searchParams.set('limit', String(LIMIT));
      url.searchParams.set('proximity', OVIEDO_PROXIMITY);
      url.searchParams.set('country', 'ES');
      url.searchParams.set('language', 'es');

      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) throw new Error('Geocode failed');

      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      setSuggestions(features);
    } catch (err) {
      if (err?.name !== 'AbortError') setSuggestions([]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [hasToken]);

  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(() => fetchSuggestions(q), 250);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (feature) => {
    const center = feature?.geometry?.coordinates;
    if (Array.isArray(center) && center.length >= 2) {
      const [lng, lat] = center;
      const formatted = formatStreetName(feature.place_name || feature.text || '');
      setQuery(formatted);
      setSuggestions([]);
      setOpen(false);
      onSelect?.({ lng, lat, place_name: formatted });
    }
  };

  if (!hasToken) return null;

  return (
    <div ref={containerRef} className={`relative mt-[10px] ${className}`}>
      <div className="bg-gray-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl px-3 py-2 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm p-0 flex-1"
          autoComplete="off"
        />
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-md border-2 border-purple-500/50 rounded-xl overflow-hidden z-[100] max-h-[220px] overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-gray-400 text-sm">Buscando...</li>
          )}
          {suggestions.map((f) => (
            <li
              key={f.id || f.place_name}
              role="button"
              tabIndex={0}
              className="px-4 py-3 text-white text-sm hover:bg-purple-600/30 cursor-pointer border-b border-gray-700/50 last:border-b-0"
              onClick={() => handleSelect(f)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(f)}
            >
              {formatStreetName(f.place_name || f.text || '')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
