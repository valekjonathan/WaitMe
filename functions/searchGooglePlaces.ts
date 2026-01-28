export default async function searchGooglePlaces({ query }, { base44 }) {
  try {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return { suggestions: [], error: 'API key not configured' };
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:es&key=${GOOGLE_MAPS_API_KEY}&language=es`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.predictions) {
      return { suggestions: [] };
    }

    const suggestions = data.predictions.map(prediction => ({
      display_name: prediction.main_text + (prediction.secondary_text ? ', ' + prediction.secondary_text : ''),
      place_id: prediction.place_id,
      lat: null,
      lng: null
    }));

    return { suggestions };
  } catch (error) {
    return { suggestions: [], error: error.message };
  }
}