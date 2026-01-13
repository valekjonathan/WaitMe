import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Loader } from '@googlemaps/js-api-loader';

export default function AddressSearchBox({ onPlaceSelected, value, onChange }) {
  const inputRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: 'AIzaSyBXrK5b0dHqG_5fF8vX2Y_5xZ3wQ7yZ8aM', // API key pública de demo
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        const autocompleteService = new google.maps.places.AutocompleteService();
        setAutocomplete(autocompleteService);
      } catch (error) {
        console.log('Error cargando Google Maps:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (!autocomplete || !newValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Buscar sugerencias
    autocomplete.getPlacePredictions(
      {
        input: newValue,
        types: ['address'],
        componentRestrictions: { country: 'es' }
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleSelectPlace = (prediction) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        onPlaceSelected({
          address: prediction.description,
          lat: location.lat(),
          lng: location.lng()
        });
        onChange(prediction.description);
        setShowSuggestions(false);
      }
    });
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Buscar dirección..."
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className="w-full bg-gray-900 border-gray-700 text-white pl-10 pr-10 rounded-xl h-11"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            setSuggestions([]);
            setShowSuggestions(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-gray-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPlace(prediction)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <Search className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}