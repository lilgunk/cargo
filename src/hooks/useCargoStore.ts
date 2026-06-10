import { useState } from 'react';
import { SAMPLE_CARGO } from '../data/mockData';
import { vehicleService } from '../services/vehicleService';
import { isBlockedByWheelArch } from '../utils/wheelArchCheck';
import type { CargoItem, Vehicle, VehicleId, PlacedUnit } from '../types';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#4ade80'];

type Dims = { length: number; width: number; height: number };

// All unique orientations of a box (up to 6 permutations of L/W/H)
function getAllOrientations(l: number, w: number, h: number): Dims[] {
  const seen = new Set<string>();
  return ([
    [l, w, h], [l, h, w], [w, l, h],
    [w, h, l], [h, l, w], [h, w, l],
  ] as [number, number, number][])
    .map(([a, b, c]) => ({ length: a, width: b, height: c }))
    .filter(d => {
      const key = `${d.length},${d.width},${d.height}`;
      return seen.has(key) ? false : (seen.add(key), true);
    });
}

// Extreme Point (EP) bin packing with wheel arch awareness.
//
// Each box candidate position is checked against:
//   1. Vehicle bounding box (length / width / height)
//   2. Overlap with already-placed boxes
//   3. Support (must rest on floor or another box)
//   4. Wheel arch intrusion (new) — box must not enter arch zone
function optimizeCargo(items: CargoItem[], vehicle: Vehicle): PlacedUnit[] {
  const units: CargoItem[] = [];
  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) units.push(item);
  }
  units.sort((a, b) => b.length * b.width * b.height - a.length * a.width * a.height);

  const result: PlacedUnit[] = [];
  type EP = { x: number; y: number; z: number };
  const eps: EP[] = [{ x: 0, y: 0, z: 0 }];

  function overlaps(px: number, py: number, pz: number, d: Dims): boolean {
    return result.some(r =>
      px < r.x + r.length && px + d.length > r.x &&
      py < r.y + r.width  && py + d.width  > r.y &&
      pz < r.z + r.height && pz + d.height > r.z
    );
  }

  function isSupported(px: number, py: number, pz: number, d: Dims): boolean {
    if (pz === 0) return true;
    return result.some(r =>
      r.z + r.height === pz &&
      r.x < px + d.length && r.x + r.length > px &&
      r.y < py + d.width  && r.y + r.width  > py
    );
  }

  for (const item of units) {
    const orientations = getAllOrientations(item.length, item.width, item.height);

    let bestX = -1, bestY = -1, bestZ = -1;
    let bestDims: Dims | null = null;
    let bestScore = Infinity;

    for (const { x, y, z } of eps) {
      for (const d of orientations) {
        if (x + d.length > vehicle.length) continue;
        if (y + d.width  > vehicle.width)  continue;
        if (z + d.height > vehicle.height) continue;
        if (overlaps(x, y, z, d)) continue;
        if (!isSupported(x, y, z, d)) continue;

        // Wheel arch check — skip if any part of the box enters an arch
        if (isBlockedByWheelArch({ x, y, z }, d, vehicle)) continue;

        const score = z * 1_000_000 + x * 1_000 + y;
        if (score < bestScore) {
          bestScore = score; bestX = x; bestY = y; bestZ = z; bestDims = d;
        }
      }
    }

    if (!bestDims) continue;

    // Gravity: slide box toward y=0 wall
    let finalY = bestY;
    {
      let wall = 0;
      for (const r of result) {
        if (
          bestX < r.x + r.length && bestX + bestDims.length > r.x &&
          bestZ < r.z + r.height && bestZ + bestDims.height > r.z
        ) {
          wall = Math.max(wall, r.y + r.width);
        }
      }
      // Only apply gravity if the slid-to position also clears wheel arches
      if (
        wall <= bestY &&
        isSupported(bestX, wall, bestZ, bestDims) &&
        !isBlockedByWheelArch({ x: bestX, y: wall, z: bestZ }, bestDims, vehicle)
      ) {
        finalY = wall;
      }
    }

    result.push({ cargoId: item.id, color: item.color, x: bestX, y: finalY, z: bestZ, ...bestDims });

    eps.push({ x: bestX + bestDims.length, y: finalY,                 z: bestZ });
    eps.push({ x: bestX,                   y: finalY + bestDims.width, z: bestZ });
    eps.push({ x: bestX,                   y: finalY,                 z: bestZ + bestDims.height });
  }

  return result;
}

export function useCargoStore() {
  const defaultVehicle = vehicleService.getDefault();
  const [vehicleId, setVehicleIdRaw] = useState<VehicleId>(defaultVehicle.id);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>(SAMPLE_CARGO);
  const [placed, setPlaced] = useState<PlacedUnit[]>([]);

  const vehicle = vehicleService.getById(vehicleId) ?? defaultVehicle;

  function setVehicleId(id: VehicleId) {
    setVehicleIdRaw(id);
    setPlaced([]);
  }

  function addCargo(fields: { length: number; width: number; height: number; weight: number; quantity: number }): boolean {
    const newVolume = fields.length * fields.width * fields.height * fields.quantity;
    if (usedVolumeMm3 + newVolume > maxVolumeMm3) return false;
    setCargoItems(prev => {
      const color = COLORS[prev.length % COLORS.length];
      return [...prev, { id: `cargo-${Date.now()}`, name: `Груз ${prev.length + 1}`, ...fields, color }];
    });
    setPlaced([]);
    return true;
  }

  function removeCargo(id: string) {
    setCargoItems(prev => prev.filter(c => c.id !== id));
    setPlaced([]);
  }

  function clearAll(newVehicleId?: VehicleId) {
    if (newVehicleId) setVehicleIdRaw(newVehicleId);
    setCargoItems([]);
    setPlaced([]);
  }

  function optimize() {
    setPlaced(optimizeCargo(cargoItems, vehicle));
  }

  const totalWeight   = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems    = cargoItems.reduce((s, c) => s + c.quantity, 0);
  const usedVolumeMm3 = cargoItems.reduce((s, c) => s + c.length * c.width * c.height * c.quantity, 0);
  const maxVolumeMm3  = vehicle.length * vehicle.width * vehicle.height;
  const usedVolume    = usedVolumeMm3 / 1e9;
  const maxVolume     = maxVolumeMm3 / 1e9;
  const freeVolume    = Math.max(0, maxVolume - usedVolume);
  const occupancy     = Math.min(100, Math.round((usedVolumeMm3 / maxVolumeMm3) * 100));

  return {
    vehicleId, setVehicleId,
    cargoItems, addCargo, removeCargo, clearAll,
    vehicle, placed, optimize,
    totalWeight, totalItems,
    usedVolume, maxVolume, freeVolume, occupancy,
  };
}

export type CargoStore = ReturnType<typeof useCargoStore>;
