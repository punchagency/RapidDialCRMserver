/**
 * Geocoding Service
 * Converts addresses to latitude/longitude coordinates
 * Uses HERE Maps Geocoding API
 */
const HERE_API_KEY = process.env.HERE_API_KEY || "SOcYV3yCX4aztYkg3m5LTpQW4d1hHXBZo--Ue8HvzdY";
export async function geocodeAddress(address) {
    try {
        const params = new URLSearchParams({
            q: address,
            apikey: HERE_API_KEY,
        });
        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, { method: "GET" });
        if (!response.ok) {
            console.error(`Geocoding error: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                latitude: item.position.lat,
                longitude: item.position.lng,
                address: item.address.label,
            };
        }
        return null;
    }
    catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
export async function getFullAddressFromHere(address) {
    try {
        const params = new URLSearchParams({
            q: address,
            apikey: HERE_API_KEY,
        });
        const response = await fetch(`https://geocode.search.hereapi.com/v1/geocode?${params}`, { method: "GET" });
        if (!response.ok) {
            console.error(`Geocoding error: ${response.status}`);
            return null;
        }
        const data = await response.json();
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
    }
    catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
export async function geocodeProspects(prospects) {
    const results = [];
    for (const prospect of prospects) {
        const address = [
            prospect.addressStreet,
            prospect.addressCity,
            prospect.addressState,
            prospect.addressZip,
        ]
            .filter(Boolean)
            .join(", ");
        if (!address)
            continue;
        const result = await geocodeAddress(address);
        if (result) {
            results.push({
                id: prospect.id,
                lat: result.latitude,
                lng: result.longitude,
            });
        }
        // Rate limiting - wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
}
async function getDetailedPlaceInfo(placeId) {
    try {
        const params = new URLSearchParams({
            id: placeId,
            apikey: HERE_API_KEY,
        });
        const response = await fetch(`https://lookup.search.hereapi.com/v1/lookup?${params}`, { method: "GET" });
        if (!response.ok) {
            return null;
        }
        return await response.json();
    }
    catch (error) {
        console.error("Lookup error:", error);
        return null;
    }
}
export async function searchProfessionalsByLocation(specialty, location, radius = 5000) {
    try {
        // First geocode the location to get coordinates
        const locationResult = await geocodeAddress(location);
        if (!locationResult) {
            return [];
        }
        // Map specialty to HERE category codes and profession types
        const categoryMap = {
            "dental": { query: "dentist", profession: "Dentist" },
            "dentist": { query: "dentist", profession: "Dentist" },
            "chiropractor": { query: "chiropractor", profession: "Chiropractor" },
            "optometry": { query: "optometrist", profession: "Optometrist" },
            "optometrist": { query: "optometrist", profession: "Optometrist" },
            "physical therapy": { query: "physical-therapist", profession: "Physical Therapist" },
            "physical therapist": { query: "physical-therapist", profession: "Physical Therapist" },
            "orthodontics": { query: "dentist", profession: "Orthodontist" },
            "orthodontist": { query: "dentist", profession: "Orthodontist" },
            "lawyer": { query: "lawyer", profession: "Lawyer" },
            "attorney": { query: "attorney", profession: "Attorney" },
            "law": { query: "lawyer", profession: "Lawyer" },
        };
        const specialtyConfig = categoryMap[specialty.toLowerCase()] || {
            query: specialty.toLowerCase(),
            profession: specialty.charAt(0).toUpperCase() + specialty.slice(1)
        };
        const params = new URLSearchParams({
            at: `${locationResult.latitude},${locationResult.longitude}`,
            q: specialtyConfig.query,
            limit: "50",
            apikey: HERE_API_KEY,
        });
        const response = await fetch(`https://discover.search.hereapi.com/v1/discover?${params}`, { method: "GET" });
        if (!response.ok) {
            console.error(`Search error: ${response.status}`);
            return [];
        }
        const data = await response.json();
        const results = [];
        if (data.items && Array.isArray(data.items)) {
            for (const item of data.items) {
                const addr = item.address;
                // Build clean address without duplication: street, city state zip
                const addressParts = [
                    addr.street ? `${addr.houseNumber || ''} ${addr.street}`.trim() : '',
                    addr.city,
                    addr.stateCode ? `${addr.stateCode} ${addr.postalCode}` : addr.postalCode
                ].filter(Boolean);
                // Remove any duplicate address components
                const uniqueParts = addressParts.filter((part, idx, arr) => arr.indexOf(part) === idx);
                const cleanAddress = uniqueParts.join(", ");
                // Extract contact info from Discover response, or use placeholder
                let phone = item.contacts?.phone?.[0]?.value;
                let email = item.contacts?.email?.[0]?.value;
                let website = item.contacts?.website?.[0]?.value;
                // If no phone found in Discover, try Lookup API for detailed contact info
                if (!phone && item.id) {
                    try {
                        const detailedInfo = await getDetailedPlaceInfo(item.id);
                        if (detailedInfo && detailedInfo.contacts) {
                            phone = detailedInfo.contacts[0]?.phone?.[0]?.value || phone;
                            email = detailedInfo.contacts[0]?.email?.[0]?.value || email;
                            website = detailedInfo.contacts[0]?.www?.[0]?.value || website;
                        }
                    }
                    catch (e) {
                        // Silently continue if lookup fails
                    }
                }
                results.push({
                    name: item.title || "",
                    phone,
                    email,
                    website,
                    address: cleanAddress || addr.label || "",
                    city: addr.city,
                    state: addr.stateCode,
                    zip: addr.postalCode,
                    latitude: item.position.lat,
                    longitude: item.position.lng,
                    category: item.resultType,
                    profession: specialtyConfig.profession,
                });
                // Rate limiting - small delay between lookup requests
                if (!phone && item.id) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        }
        return results;
    }
    catch (error) {
        console.error("Professional search error:", error);
        return [];
    }
}
//# sourceMappingURL=geocoding.js.map