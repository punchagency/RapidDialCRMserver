/**
 * Priority Scoring Algorithm
 * Calculates priority score for prospects based on:
 * - Days since last contact (older = higher priority)
 * - Specialty match
 * - Territory assignment
 */
export function calculatePriorityScore(prospect) {
    let score = 100;
    // Factor 1: Days since last contact (0-50 points)
    if (prospect.lastContactDate) {
        const daysSinceContact = Math.floor((Date.now() - new Date(prospect.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        score += Math.min(daysSinceContact * 2, 50); // Max 50 points
    }
    else {
        score += 50; // Never contacted = highest priority for this factor
    }
    // Factor 2: Specialty value
    const specialtyWeights = {
        "Chiropractor": 30,
        "Dental": 25,
        "Medical": 28,
        "Physical Therapy": 22,
        "Dermatology": 20,
        "Other": 15,
    };
    score += specialtyWeights[prospect.specialty] || 15;
    return Math.min(score, 300); // Cap at 300
}
/**
 * Drive Time Estimation (simplified - no real API calls)
 * In production, use HERE Maps or Google Maps API
 * Returns estimated drive time in minutes
 */
export function estimateDriveTime(startLat, startLng, endLat, endLng) {
    // Haversine formula to get straight-line distance
    const R = 3959; // Earth radius in miles
    const lat1 = (startLat * Math.PI) / 180;
    const lat2 = (endLat * Math.PI) / 180;
    const deltaLat = ((endLat - startLat) * Math.PI) / 180;
    const deltaLng = ((endLng - startLng) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    // Assume average speed of 35 mph in urban areas, 50 mph rural
    // Average between them = ~40 mph
    const driveTimeMinutes = (distance / 40) * 60;
    return Math.round(driveTimeMinutes);
}
/**
 * Simple Clustering Algorithm (K-means-like)
 * Groups prospects by geographic proximity
 */
export function clusterProspects(prospects, numClusters = 3) {
    const clusters = new Map();
    if (prospects.length === 0)
        return clusters;
    // Initialize clusters
    for (let i = 0; i < numClusters; i++) {
        clusters.set(i, []);
    }
    // Simple clustering: sort by geography and distribute
    const sorted = [...prospects].sort((a, b) => {
        const aLat = parseFloat(a.addressLat?.toString() || "0");
        const bLat = parseFloat(b.addressLat?.toString() || "0");
        return aLat - bLat;
    });
    sorted.forEach((prospect, index) => {
        const clusterIndex = index % numClusters;
        clusters.get(clusterIndex)?.push(prospect);
    });
    return clusters;
}
/**
 * Route Optimization
 * Orders prospects in a cluster for optimal visiting (nearest neighbor algorithm)
 */
export function optimizeRoute(prospects, startLat, startLng) {
    if (prospects.length === 0)
        return [];
    if (prospects.length === 1)
        return prospects;
    const optimized = [];
    const remaining = [...prospects];
    let currentLat = startLat;
    let currentLng = startLng;
    while (remaining.length > 0) {
        // Find nearest unvisited prospect
        let nearest = null;
        let nearestDistance = Infinity;
        let nearestIndex = 0;
        remaining.forEach((prospect, index) => {
            const pLat = parseFloat(prospect.addressLat?.toString() || "0");
            const pLng = parseFloat(prospect.addressLng?.toString() || "0");
            const distance = Math.hypot(pLat - currentLat, pLng - currentLng);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = prospect;
                nearestIndex = index;
            }
        });
        if (nearest) {
            optimized.push(nearest);
            currentLat = nearest.addressLat ? parseFloat(nearest.addressLat.toString()) : 0;
            currentLng = nearest.addressLng ? parseFloat(nearest.addressLng.toString()) : 0;
            remaining.splice(nearestIndex, 1);
        }
        else {
            break;
        }
    }
    return optimized;
}
/**
 * Generate smart calling list
 * Combines priority scoring, clustering, and route optimization
 */
export function generateSmartCallingList(prospects, fieldRep) {
    // Step 1: Filter by territory
    const territoryProspects = prospects.filter(p => p.territory === fieldRep.territory);
    // Step 2: Score and sort by priority
    const scored = territoryProspects.map(p => ({
        prospect: p,
        score: calculatePriorityScore(p),
    }));
    scored.sort((a, b) => b.score - a.score);
    // Step 3: Get top prospects (e.g., top 50)
    const topProspects = scored.slice(0, 50).map(s => s.prospect);
    // Step 4: Cluster by geography
    const fieldRepLat = parseFloat(fieldRep.homeLat?.toString() || "0");
    const fieldRepLng = parseFloat(fieldRep.homeLng?.toString() || "0");
    if (fieldRepLat === 0 || fieldRepLng === 0) {
        // No home coordinates, return by priority only
        return topProspects;
    }
    const clusters = clusterProspects(topProspects, 3);
    // Step 5: Optimize each cluster's route
    const result = [];
    clusters.forEach((cluster) => {
        const optimized = optimizeRoute(cluster, fieldRepLat, fieldRepLng);
        result.push(...optimized);
    });
    return result;
}
//# sourceMappingURL=optimization.js.map