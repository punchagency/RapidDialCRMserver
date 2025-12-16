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

  constructor() {
    this.hereApiKey = process.env.HERE_API_KEY || 'SOcYV3yCX4aztYkg3m5LTpQW4d1hHXBZo--Ue8HvzdY';
  }

  /**
   * Geocode a single address
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
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
        return {
          latitude: item.position.lat,
          longitude: item.position.lng,
          address: item.address.label,
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
   * Get detailed place info from HERE Lookup API
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
    radius: number = 5000
  ): Promise<ProfessionalSearchResult[]> {
    try {
      // First geocode the location to get coordinates
      const locationResult = await this.geocodeAddress(location);
      if (!locationResult) {
        return [];
      }

      // Map specialty to HERE category codes and profession types
      const categoryMap: Record<string, { query: string; profession: string }> = {
        dental: { query: 'dentist', profession: 'Dentist' },
        dentist: { query: 'dentist', profession: 'Dentist' },
        chiropractor: { query: 'chiropractor', profession: 'Chiropractor' },
        optometry: { query: 'optometrist', profession: 'Optometrist' },
        optometrist: { query: 'optometrist', profession: 'Optometrist' },
        'physical therapy': { query: 'physical-therapist', profession: 'Physical Therapist' },
        'physical therapist': { query: 'physical-therapist', profession: 'Physical Therapist' },
        orthodontics: { query: 'dentist', profession: 'Orthodontist' },
        orthodontist: { query: 'dentist', profession: 'Orthodontist' },
        lawyer: { query: 'lawyer', profession: 'Lawyer' },
        attorney: { query: 'attorney', profession: 'Attorney' },
        law: { query: 'lawyer', profession: 'Lawyer' },
      };

      const specialtyConfig = categoryMap[specialty.toLowerCase()] || {
        query: specialty.toLowerCase(),
        profession: specialty.charAt(0).toUpperCase() + specialty.slice(1),
      };

      const params = new URLSearchParams({
        at: `${locationResult.latitude},${locationResult.longitude}`,
        q: specialtyConfig.query,
        limit: '50',
        apikey: this.hereApiKey,
      });

      const response = await fetch(`https://discover.search.hereapi.com/v1/discover?${params}`, { method: 'GET' });

      if (!response.ok) {
        console.error(`Search error: ${response.status}`);
        return [];
      }

      const data = await response.json() as any;
      const results: ProfessionalSearchResult[] = [];

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const addr = item.address;
          // Build clean address
          const addressParts = [
            addr.street ? `${addr.houseNumber || ''} ${addr.street}`.trim() : '',
            addr.city,
            addr.stateCode ? `${addr.stateCode} ${addr.postalCode}` : addr.postalCode,
          ].filter(Boolean);

          const uniqueParts = addressParts.filter((part, idx, arr) => arr.indexOf(part) === idx);
          const cleanAddress = uniqueParts.join(', ');

          // Extract contact info
          let phone = item.contacts?.phone?.[0]?.value;
          let email = item.contacts?.email?.[0]?.value;
          let website = item.contacts?.website?.[0]?.value;

          // Try Lookup API for detailed contact info
          if (!phone && item.id) {
            try {
              const detailedInfo = await this.getDetailedPlaceInfo(item.id);
              if (detailedInfo && detailedInfo.contacts) {
                phone = detailedInfo.contacts[0]?.phone?.[0]?.value || phone;
                email = detailedInfo.contacts[0]?.email?.[0]?.value || email;
                website = detailedInfo.contacts[0]?.www?.[0]?.value || website;
              }
            } catch (e) {
              // Silently continue if lookup fails
            }
          }

          results.push({
            name: item.title || '',
            phone,
            email,
            website,
            address: cleanAddress || addr.label || '',
            city: addr.city,
            state: addr.stateCode,
            zip: addr.postalCode,
            latitude: item.position.lat,
            longitude: item.position.lng,
            category: item.resultType,
            profession: specialtyConfig.profession,
          });

          // Rate limiting
          if (!phone && item.id) {
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

