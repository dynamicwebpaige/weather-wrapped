
import { LocationInfo } from '../types';

export const geocodeCity = async (city: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WeatherWrapped2025App'
        }
      }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        name: city,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        address: result.display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed", error);
    return null;
  }
};
