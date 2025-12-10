import { Prospect, FieldRep } from "../db/schema";
/**
 * Priority Scoring Algorithm
 * Calculates priority score for prospects based on:
 * - Days since last contact (older = higher priority)
 * - Specialty match
 * - Territory assignment
 */
export declare function calculatePriorityScore(prospect: Prospect): number;
/**
 * Drive Time Estimation (simplified - no real API calls)
 * In production, use HERE Maps or Google Maps API
 * Returns estimated drive time in minutes
 */
export declare function estimateDriveTime(startLat: number, startLng: number, endLat: number, endLng: number): number;
/**
 * Simple Clustering Algorithm (K-means-like)
 * Groups prospects by geographic proximity
 */
export declare function clusterProspects(prospects: Prospect[], numClusters?: number): Map<number, Prospect[]>;
/**
 * Route Optimization
 * Orders prospects in a cluster for optimal visiting (nearest neighbor algorithm)
 */
export declare function optimizeRoute(prospects: Prospect[], startLat: number, startLng: number): Prospect[];
/**
 * Generate smart calling list
 * Combines priority scoring, clustering, and route optimization
 */
export declare function generateSmartCallingList(prospects: Prospect[], fieldRep: FieldRep): Prospect[];
//# sourceMappingURL=optimization.d.ts.map