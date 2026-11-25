// Weight distribution of a loading plan: centre of gravity and how the mass is
// split left/right and front/rear. A unit that crosses a dividing line counts on
// each side in proportion to its length (uniform density inside a box).
import type { PlacedUnit, Vehicle } from '../types';

export interface WeightDistribution {
  total: number;                                       // kg
  centre: { x: number; y: number; z: number } | null;  // mm, null when nothing is loaded
  leftShare: number;   // 0..1, left half (y < width / 2, left wall at y = 0)
  frontShare: number;  // 0..1, front half (x < length / 2, cab at x = 0)
  /** more than 10 percentage points off a 50/50 left-right split */
  lateralImbalance: boolean;
  /** centre of gravity above half of the cargo-space height */
  highCentre: boolean;
}

/** Fraction of [a, a + size) that lies below `limit`. */
function shareBelow(a: number, size: number, limit: number): number {
  if (size <= 0) return 0;
  return Math.min(1, Math.max(0, (limit - a) / size));
}

export const LATERAL_TOLERANCE = 0.1;

export function weightDistribution(placed: PlacedUnit[], vehicle: Vehicle): WeightDistribution {
  let total = 0, mx = 0, my = 0, mz = 0, left = 0, front = 0;
  for (const u of placed) {
    total += u.weight;
    mx += u.weight * (u.x + u.length / 2);
    my += u.weight * (u.y + u.width / 2);
    mz += u.weight * (u.z + u.height / 2);
    left += u.weight * shareBelow(u.y, u.width, vehicle.width / 2);
    front += u.weight * shareBelow(u.x, u.length, vehicle.length / 2);
  }
  if (total === 0) {
    return { total: 0, centre: null, leftShare: 0.5, frontShare: 0.5, lateralImbalance: false, highCentre: false };
  }
  const leftShare = left / total;
  const centre = { x: mx / total, y: my / total, z: mz / total };
  return {
    total,
    centre,
    leftShare,
    frontShare: front / total,
    lateralImbalance: Math.abs(leftShare - 0.5) > LATERAL_TOLERANCE,
    highCentre: centre.z > vehicle.height / 2,
  };
}
