import type { Vehicle } from '../types';

type Position = { x: number; y: number; z: number };
type Dims     = { length: number; width: number; height: number };

// Returns true if placing a box at `pos` with dimensions `dims` would collide
// with any wheel arch of the vehicle.
//
// Logic per arch:
//   1. If the box is entirely above the arch height → no collision (clear)
//   2. If the box doesn't overlap the arch's X range → no collision (clear)
//   3. Otherwise check Y: box must fit between the two arch intrusions
export function isBlockedByWheelArch(pos: Position, dims: Dims, vehicle: Vehicle): boolean {
  if (!vehicle.wheelArches?.length) return false;

  for (const arch of vehicle.wheelArches) {
    // Box clears the arch vertically
    if (pos.z >= arch.heightFromFloor) continue;

    // Box doesn't overlap arch zone along vehicle length
    if (pos.x + dims.length <= arch.startX) continue;
    if (pos.x >= arch.endX) continue;

    // Box is in the arch zone — check lateral fit
    const leftLimit  = arch.intrusionPerSide;
    const rightLimit = vehicle.width - arch.intrusionPerSide;

    if (pos.y < leftLimit)               return true; // overlaps left arch
    if (pos.y + dims.width > rightLimit) return true; // overlaps right arch
  }

  return false;
}

// Returns the usable width at a given Z height and X position for a vehicle.
// Useful for display / stats — tells how wide the floor is at a given point.
export function usableWidthAt(z: number, x: number, vehicle: Vehicle): number {
  if (!vehicle.wheelArches?.length) return vehicle.width;

  for (const arch of vehicle.wheelArches) {
    if (z >= arch.heightFromFloor) continue;
    if (x < arch.startX || x >= arch.endX) continue;
    return vehicle.width - arch.intrusionPerSide * 2;
  }

  return vehicle.width;
}
