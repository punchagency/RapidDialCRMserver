import dotenv from 'dotenv';

dotenv.config();

/**
 * Geocoding Result Interface
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Full Address Result Interface
 */
export interface FullAddressResult {
  latitude: number;
  longitude: number;
  fullAddress: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Professional Search Result Interface
 */
export interface ProfessionalSearchResult {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude: number;
  longitude: number;
  category?: string;
  profession?: string;
}

/**
 * Geocoding Service Class
 * Handles geocoding operations using HERE Maps API
 */
export class GeocodingService {
  private hereApiKey: string;
  private googleApiKey: string;

  constructor() {
    this.googleApiKey = `${process.env.GOOGLE_API_KEY}`;
    this.hereApiKey = process.env.HERE_API_KEY || 'SOcYV3yCX4aztYkg3m5LTpQW4d1hHXBZo--Ue8HvzdY';
  }

  /**
   * Geocode a single address
   */
  async geocodeAddress(inputAddress: string): Promise<GeocodingResult | null> {
    try {
      const params = new URLSearchParams({
        address: inputAddress,
        key: this.googleApiKey,
      });

      // const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, { method: 'GET' });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { method: 'GET' });

      if (!response.ok) {
        console.error(`Geocoding error: ${response.status}`);
        return null;
      }

      const data = await response.json() as any;

      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const address = item.formatted_address;
        const latitude = item.geometry.location.lat;
        const longitude = item.geometry.location.lng;
        return {
          latitude,
          longitude,
          address,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get full address details from HERE API
   */
  async getFullAddressFromHere(address: string): Promise<FullAddressResult | null> {
    try {
      const params = new URLSearchParams({
        q: address,
        apikey: this.hereApiKey,
      });

      const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, { method: 'GET' });

      if (!response.ok) {
        console.error(`Geocoding error: ${response.status}`);
        return null;
      }

      const data = await response.json() as any;

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const addr = item.address;
        return {
          latitude: item.position.lat,
          longitude: item.position.lng,
          fullAddress: addr.label,
          street: addr.street || addr.houseNumber ? `${addr.houseNumber || ''} ${addr.street || ''}`.trim() : undefined,
          city: addr.city,
          state: addr.stateCode,
          zip: addr.postalCode,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode multiple prospects
   */
  async geocodeProspects(
    prospects: Array<{
      id: string;
      addressStreet?: string;
      addressCity?: string;
      addressState?: string;
      addressZip?: string;
    }>
  ): Promise<Array<{ id: string; lat: number; lng: number }>> {
    const results: Array<{ id: string; lat: number; lng: number }> = [];

    for (const prospect of prospects) {
      const address = [prospect.addressStreet, prospect.addressCity, prospect.addressState, prospect.addressZip]
        .filter(Boolean)
        .join(', ');

      if (!address) continue;

      const result = await this.geocodeAddress(address);
      if (result) {
        results.push({
          id: prospect.id,
          lat: result.latitude,
          lng: result.longitude,
        });
      }

      // Rate limiting - wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Get detailed place info from Google Place Details API
   */
  private async getGooglePlaceDetails(placeId: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'formatted_address,address_components,international_phone_number,website,opening_hours',
        key: this.googleApiKey,
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`, { method: 'GET' });

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as any;
      if (data.status === 'OK' && data.result) {
        return data.result;
      }

      return null;
    } catch (error) {
      console.error('Place Details error:', error);
      return null;
    }
  }

  /**
   * Get detailed place info from HERE Lookup API (legacy, kept for backward compatibility)
   */
  private async getDetailedPlaceInfo(placeId: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        id: placeId,
        apikey: this.hereApiKey,
      });

      const response = await fetch(`https://lookup.search.hereapi.com/v1/lookup?${params}`, { method: 'GET' });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Lookup error:', error);
      return null;
    }
  }

  /**
   * Search professionals by location
   */
  async searchProfessionalsByLocation(
    specialty: string,
    location: string,
    radius: number = 3000
  ): Promise<ProfessionalSearchResult[]> {
    try {
      // First geocode the location to get coordinates
      const locationResult = await this.geocodeAddress(location);
      if (!locationResult) {
        return [];
      }

      // // Map specialty to HERE category codes and profession types
      // const categoryMap: Record<string, { query: string; profession: string }> = {
      //   dental: { query: 'dentist', profession: 'Dentist' },
      //   dentist: { query: 'dentist', profession: 'Dentist' },
      //   chiropractor: { query: 'chiropractor', profession: 'Chiropractor' },
      //   optometry: { query: 'optometrist', profession: 'Optometrist' },
      //   optometrist: { query: 'optometrist', profession: 'Optometrist' },
      //   'physical therapy': { query: 'physical-therapist', profession: 'Physical Therapist' },
      //   'physical therapist': { query: 'physical-therapist', profession: 'Physical Therapist' },
      //   orthodontics: { query: 'dentist', profession: 'Orthodontist' },
      //   orthodontist: { query: 'dentist', profession: 'Orthodontist' },
      //   lawyer: { query: 'lawyer', profession: 'Lawyer' },
      //   attorney: { query: 'attorney', profession: 'Attorney' },
      //   law: { query: 'lawyer', profession: 'Lawyer' },
      // };

      const specialtyConfig = {
        query: specialty.toLowerCase(),
        profession: specialty.charAt(0).toUpperCase() + specialty.slice(1),
      };

      // const params = new URLSearchParams({
      //   at: `${locationResult.latitude},${locationResult.longitude}`,
      //   q: specialtyConfig.query,
      //   limit: '50',
      //   apikey: this.hereApiKey,
      // });

      // const response = await fetch(`https://discover.search.hereapi.com/v1/discover?${params}`, { method: 'GET' });

      const params = new URLSearchParams({
        location: `${locationResult.latitude},${locationResult.longitude}`,
        radius: radius.toString(),
        keyword: specialtyConfig.query,
        key: this.googleApiKey,
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`, { method: 'GET' });

      if (!response.ok) {
        console.error(`Search error: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      const results: ProfessionalSearchResult[] = [];

      // Check for API errors
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`Places API error: ${data.status}`, data.error_message);
        return [];
      }

      // Google Places API returns 'results' not 'items'
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          // Google Places API structure
          const latitude = item.geometry?.location?.lat;
          const longitude = item.geometry?.location?.lng;
          const name = item.name || '';
          const phone = item.international_phone_number || item.formatted_phone_number;
          const vicinity = item.vicinity || '';
          const placeId = item.place_id;

          // Default values from Nearby Search
          let address = vicinity;
          let city: string | undefined;
          let state: string | undefined;
          let zip: string | undefined;
          let website: string | undefined;

          // Fetch detailed info from Place Details API if place_id is available
          if (placeId) {
            try {
              const placeDetails = await this.getGooglePlaceDetails(placeId);
              if (placeDetails) {
                // Use formatted_address if available
                if (placeDetails.formatted_address) {
                  address = placeDetails.formatted_address;
                }

                // Parse address components
                if (placeDetails.address_components) {
                  for (const component of placeDetails.address_components) {
                    if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                      city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                      state = component.short_name;
                    }
                    if (component.types.includes('postal_code')) {
                      zip = component.long_name;
                    }
                  }
                }

                // Get contact info
                if (placeDetails.international_phone_number) {
                  // phone already set from Nearby Search, but use this if not available
                  if (!phone) {
                    // phone = placeDetails.international_phone_number;
                  }
                }
                if (placeDetails.website) {
                  website = placeDetails.website;
                }
              }
            } catch (e) {
              // Silently continue if Place Details fails
              console.warn(`Failed to fetch place details for ${placeId}:`, e);
            }
          }

          // Fallback: parse address from vicinity if no formatted address
          if (address === vicinity && address) {
            const addressParts = vicinity.split(',').map((part: string) => part.trim());
            if (addressParts.length > 1 && !city) {
              city = addressParts[addressParts.length - 1];
            }
          }

          results.push({
            name,
            phone,
            email: undefined, // Email not available in Google Places API
            website,
            address,
            city,
            state,
            zip,
            latitude,
            longitude,
            category: item.types?.[0] || '',
            profession: specialtyConfig.profession,
          });

          // Rate limiting for Place Details API calls
          if (placeId) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Professional search error:', error);
      return [];
    }
  }
}

// Singleton instance
let geocodingServiceInstance: GeocodingService | null = null;

/**
 * Get singleton instance of GeocodingService
 */
export function getGeocodingService(): GeocodingService {
  if (!geocodingServiceInstance) {
    geocodingServiceInstance = new GeocodingService();
  }
  return geocodingServiceInstance;
}

