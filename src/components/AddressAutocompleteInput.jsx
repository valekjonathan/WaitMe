import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input con sugerencias de calles SOLO de España (Nominatim).
 * - Mantiene el look del <Input /> existente.
 * - Usa <datalist> nativo (cero cambios visuales extra).
 */
export default function AddressAutocompleteInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  autoFocus,
  idPrefix = 'addr',
  limit = 6,
}) {
  const listId = useMemo(() => `${idPrefix}-datalist-${Math.random().toString(36).slice(2)}`, [idPrefix]);
  const [options, setOptions] = useState([]);
  const lastQueryRef = useRef('');
  const abortRef = useRef(null);

  useEffect(() => {
    const q = (value || '').trim();
    lastQueryRef.current = q;

    // Si está vacío o muy corto, no pedimos nada
    if (q.length < 3) {
      setOptions([]);
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = null;
      return;
    }

    const t = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // España (viewbox aproximado + bounded=1 para forzar dentro)
        // lon_left, lat_top, lon_right, lat_bottom
        const viewbox = '-9.5,43.9,4.4,35.7';

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('q', q);
        url.searchParams.set('countrycodes', 'es');
        url.searchParams.set('featuretype', 'street');
        url.searchParams.set('bounded', '1');
        url.searchParams.set('viewbox', viewbox);
        url.searchParams.set('accept-language', 'es');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            // Nominatim recomienda identificar el cliente; sin emails/keys aquí.
            'Accept': 'application/json',
          },
        });
        if (!res.ok) return;

        const data = await res.json();
        const onlyStreets = Array.isArray(data)
          ? data.filter((it) => {
              const cls = String(it?.class || '').toLowerCase();
              const type = String(it?.type || '').toLowerCase();
              if (cls !== 'highway') return false;
              // Tipos de vía comunes
              return ['residential','tertiary','primary','secondary','unclassified','living_street','service','road','pedestrian'].includes(type);
            })
          : [];
        // Evita respuestas viejas si el usuario siguió escribiendo
        if (lastQueryRef.current !== q) return;

        const mapped = Array.isArray(onlyStreets)
          ? onlyStreets
              .map((it) => it?.display_name)
              .filter(Boolean)
              .slice(0, limit)
          : [];

        setOptions(mapped);
      } catch (e) {
        // Abort o red: silencioso
      }
    }, 200);

    return () => clearTimeout(t);
  }, [value, limit]);

  return (
    <>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
