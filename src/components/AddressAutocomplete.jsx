import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder = "Buscar dirección..." }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Cargar script de Google Maps si no está cargado
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBpXRZ6E_JVwGhkHnLmH6eqzqvLFZ_YB0A&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && inputRef.current && !autocompleteRef.current) {
      // Configurar autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'es' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address']
      });

      // Listener para cuando se selecciona un lugar
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.geometry) {
          const address = place.formatted_address || place.name;
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          onChange(address);
          if (onPlaceSelect) {
            onPlaceSelect(address, location);
          }
        }
      });
    }
  }, [scriptLoaded, onChange, onPlaceSelect]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900 border-gray-700 text-white pl-10 rounded-xl h-11"
      />
    </div>
  );
}