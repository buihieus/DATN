import axios from 'axios';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

// Function to geocode an address using OpenStreetMap Nominatim API
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    if (!address || address.trim() === '') {
      return null;
    }
    
    // Use OpenStreetMap Nominatim API for geocoding (free service)
    // Adding Vietnamese context to improve accuracy for Vietnamese addresses
    const encodedAddress = encodeURIComponent(address + ', Vietnam');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1&accept-language=vi`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PhongTro123-Mobile-App/1.0',
        'Accept-Language': 'vi'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Function to reverse geocode coordinates to an address
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=vi`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PhongTro123-Mobile-App/1.0',
        'Accept-Language': 'vi'
      }
    });
    
    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};