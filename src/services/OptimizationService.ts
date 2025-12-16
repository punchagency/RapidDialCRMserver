import { Prospect, FieldRep } from '../entities/index.js';

/**
 * Optimization Service Class
 * Handles route optimization and priority scoring
 */
export class OptimizationService {
  /**
   * Calculate priority score for a prospect
   */
  calculatePriorityScore(prospect: Prospect): number {
    let score = 100;

    // Factor 1: Days since last contact (0-50 points)
    if (prospect.lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(prospect.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysSinceContact * 2, 50); // Max 50 points
    } else {
      score += 50; // Never contacted = highest priority for this factor
    }

    // Factor 2: Specialty value
    const specialtyWeights: Record<string, number> = {
      Chiropractor: 30,
      Dental: 25,
      Medical: 28,
      'Physical Therapy': 22,
      Dermatology: 20,
      Other: 15,
    };
    score += specialtyWeights[prospect.specialty] || 15;

    return Math.min(score, 300); // Cap at 300
  }

  /**
   * Estimate drive time between two coordinates
   */
  estimateDriveTime(startLat: number, startLng: number, endLat: number, endLng: number): number {
    // Haversine formula to get straight-line distance
    const R = 3959; // Earth radius in miles
    const lat1 = (startLat * Math.PI) / 180;
    const lat2 = (endLat * Math.PI) / 180;
    const deltaLat = ((endLat - startLat) * Math.PI) / 180;
    const deltaLng = ((endLng - startLng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Assume average speed of 40 mph
    const driveTimeMinutes = (distance / 40) * 60;

    return Math.round(driveTimeMinutes);
  }

  /**
   * Cluster prospects by geographic proximity
   */
  clusterProspects(prospects: Prospect[], numClusters: number = 3): Map<number, Prospect[]> {
    const clusters = new Map<number, Prospect[]>();

    if (prospects.length === 0) return clusters;

    // Initialize clusters
    for (let i = 0; i < numClusters; i++) {
      clusters.set(i, []);
    }

    // Simple clustering: sort by geography and distribute
    const sorted = [...prospects].sort((a, b) => {
      const aLat = parseFloat(a.addressLat?.toString() || '0');
      const bLat = parseFloat(b.addressLat?.toString() || '0');
      return aLat - bLat;
    });

    sorted.forEach((prospect, index) => {
      const clusterIndex = index % numClusters;
      clusters.get(clusterIndex)?.push(prospect);
    });

    return clusters;
  }

  /**
   * Optimize route using nearest neighbor algorithm
   */
  optimizeRoute(prospects: Prospect[], startLat: number, startLng: number): Prospect[] {
    if (prospects.length === 0) return [];
    if (prospects.length === 1) return prospects;

    const optimized: Prospect[] = [];
    const remaining = [...prospects];
    let currentLat = startLat;
    let currentLng = startLng;

    while (remaining.length > 0) {
      // Find nearest unvisited prospect
      let nearest: any = null // expects => Prospect | null;
      let nearestDistance = Infinity;
      let nearestIndex = 0;

      remaining.forEach((prospect, index) => {
        const pLat = parseFloat(prospect.addressLat?.toString() || '0');
        const pLng = parseFloat(prospect.addressLng?.toString() || '0');
        const distance = Math.hypot(pLat - currentLat, pLng - currentLng);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = prospect;
          nearestIndex = index;
        }
      });

      if (nearest && nearestDistance < Infinity) {
        optimized.push(nearest);
        currentLat = nearest.addressLat ? parseFloat(nearest.addressLat.toString()) : 0;
        currentLng = nearest.addressLng ? parseFloat(nearest.addressLng.toString()) : 0;
        remaining.splice(nearestIndex, 1);
      } else {
        break;
      }
    }

    return optimized;
  }

  /**
   * Generate smart calling list
   * Combines priority scoring, clustering, and route optimization
   */
  generateSmartCallingList(prospects: Prospect[], fieldRep: FieldRep): Prospect[] {
    // Step 1: Filter by territory
    const territoryProspects = prospects.filter((p) => p.territory === fieldRep.territory);

    // Step 2: Score and sort by priority
    const scored = territoryProspects.map((p) => ({
      prospect: p,
      score: this.calculatePriorityScore(p),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Step 3: Get top prospects (e.g., top 50)
    const topProspects = scored.slice(0, 50).map((s) => s.prospect);

    // Step 4: Cluster by geography
    const fieldRepLat = parseFloat(fieldRep.homeLat?.toString() || '0');
    const fieldRepLng = parseFloat(fieldRep.homeLng?.toString() || '0');

    if (fieldRepLat === 0 || fieldRepLng === 0) {
      // No home coordinates, return by priority only
      return topProspects;
    }

    const clusters = this.clusterProspects(topProspects, 3);

    // Step 5: Optimize each cluster's route
    const result: Prospect[] = [];
    clusters.forEach((cluster) => {
      const optimized = this.optimizeRoute(cluster, fieldRepLat, fieldRepLng);
      result.push(...optimized);
    });

    return result;
  }
}

// Singleton instance
let optimizationServiceInstance: OptimizationService | null = null;

/**
 * Get singleton instance of OptimizationService
 */
export function getOptimizationService(): OptimizationService {
  if (!optimizationServiceInstance) {
    optimizationServiceInstance = new OptimizationService();
  }
  return optimizationServiceInstance;
}

