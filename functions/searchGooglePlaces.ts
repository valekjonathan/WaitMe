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

    const suggestionsWithCoords = await Promise.all(
      data.predictions.slice(0, 5).map(async (prediction) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          const lat = detailsData.result?.geometry?.location?.lat || null;
          const lng = detailsData.result?.geometry?.location?.lng || null;

          return {
            display_name: prediction.main_text + (prediction.secondary_text ? ', ' + prediction.secondary_text : ''),
            place_id: prediction.place_id,
            lat,
            lng
          };
        } catch {
          return {
            display_name: prediction.main_text + (prediction.secondary_text ? ', ' + prediction.secondary_text : ''),
            place_id: prediction.place_id,
            lat: null,
            lng: null
          };
        }
      })
    );

    return { suggestions: suggestionsWithCoords };
  } catch (error) {
    return { suggestions: [], error: error.message };
  }
}