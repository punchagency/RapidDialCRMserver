/**
 * Geocoding Service
 * Converts addresses to latitude/longitude coordinates
 * Uses HERE Maps Geocoding API
 */
export interface GeocodingResult {
    latitude: number;
    longitude: number;
    address: string;
}
export interface FullAddressResult {
    latitude: number;
    longitude: number;
    fullAddress: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
}
export declare function geocodeAddress(address: string): Promise<GeocodingResult | null>;
export declare function getFullAddressFromHere(address: string): Promise<FullAddressResult | null>;
export declare function geocodeProspects(prospects: Array<{
    id: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
}>): Promise<Array<{
    id: string;
    lat: number;
    lng: number;
}>>;
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
export declare function searchProfessionalsByLocation(specialty: string, location: string, radius?: number): Promise<ProfessionalSearchResult[]>;
//# sourceMappingURL=geocoding.d.ts.map