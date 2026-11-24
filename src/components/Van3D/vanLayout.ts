// Geometry of the 3D van, derived from the same Vehicle data the packing
// algorithm uses. Pure functions (no WebGL) so they can be unit-tested.
//
// Body coordinates (metres): x from the rear bumper towards the front,
// y up from the ground, z across the van (+z = right side).
// Cargo coordinates (mm, as in packCargo): x from the bulkhead towards the
// rear doors, y from the left wall, z up from the floor.

import type { PlacedUnit, Vehicle } from '../../types';

const mm = (v: number) => v / 1000;

export interface VanLayout {
  /** overall body */
  LEN: number; HWX: number; H: number;
  /** floor height, half width of the cargo space, cargo height */
  fy: number; hwI: number; cargoH: number;
  /** rear wall (cargo rear) and bulkhead (cargo front) along body x */
  X0: number; X1: number;
  /** axles along body x */
  RA: number; FA: number;
  tireRadius: number; track: number; cabTop: number;
  rearDoor: { width: number; height: number };
  sideDoor: { width: number; height: number };
  /** wheel arches as boxes in body coordinates (both sides) */
  arches: { x0: number; x1: number; z0: number; z1: number; h: number }[];
}

/**
 * Exterior proportions are derived from the cargo space (values for a modern
 * large van, from the author's van-blueprint.js): cab section 2.6 m, front
 * overhang 0.99 m, floor 0.63 m. The rear axle is placed under the centre of
 * the first wheel arch, so the drawing always matches the arch data.
 */
export function vanLayout(v: Vehicle): VanLayout {
  const small = v.height < 1500;
  const fy = small ? 0.55 : 0.626;
  const cargoL = mm(v.length);
  const cargoH = mm(v.height);
  const hwI = mm(v.width) / 2;
  const X0 = 0.06;
  const X1 = X0 + cargoL;
  const LEN = X1 + (small ? 2.1 : 2.6);
  const HWX = hwI + 0.116;
  const H = fy + cargoH + 0.054;
  const first = v.wheelArches?.[0];
  const RA = first ? X1 - mm((first.startX + first.endX) / 2) : X1 - cargoL * 0.68;
  const FA = LEN - (small ? 0.85 : 0.992);
  const arches = (v.wheelArches ?? []).flatMap(a => {
    const x0 = X1 - mm(a.endX), x1 = X1 - mm(a.startX), h = mm(a.heightFromFloor), w = mm(a.intrusionPerSide);
    return [
      { x0, x1, z0: -hwI, z1: -hwI + w, h },  // left wall
      { x0, x1, z0: hwI - w, z1: hwI, h },    // right wall
    ];
  });
  return {
    LEN, HWX, H, fy, hwI, cargoH, X0, X1, RA, FA,
    tireRadius: small ? 0.31 : 0.356,
    track: HWX * 2 - 0.29,
    cabTop: Math.min(2.3, H - 0.02),
    rearDoor: v.rearDoor ? { width: mm(v.rearDoor.width), height: mm(v.rearDoor.height) } : { width: mm(v.width) - 0.2, height: cargoH - 0.08 },
    sideDoor: { width: Math.min(1.26, cargoL * 0.4), height: Math.min(1.818, cargoH - 0.08) },
    arches,
  };
}

/** Centre and size (metres, body coordinates) of a placed unit. */
export function unitBox(layout: VanLayout, u: Pick<PlacedUnit, 'x' | 'y' | 'z' | 'length' | 'width' | 'height'>) {
  const l = mm(u.length), w = mm(u.width), h = mm(u.height);
  return {
    center: { x: layout.X1 - mm(u.x) - l / 2, y: layout.fy + mm(u.z) + h / 2, z: -layout.hwI + mm(u.y) + w / 2 },
    size: { x: l, y: h, z: w },
  };
}
