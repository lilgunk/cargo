import { useState, useMemo } from 'react';
import { SAMPLE_CARGO, VEHICLES } from '../data/mockData';
import type { CargoItem, Vehicle, VehicleId, PlacedUnit } from '../types';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#4ade80'];

function placeCargo(items: CargoItem[], vehicle: Vehicle): PlacedUnit[] {
  const result: PlacedUnit[] = [];
  let curX = 0, curY = 0, curZ = 0;
  let rowMaxY = 0, layerMaxZ = 0;

  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      if (curX + item.length > vehicle.length) {
        curX = 0;
        curY += rowMaxY;
        rowMaxY = 0;
      }
      if (curY + item.width > vehicle.width) {
        curX = 0;
        curY = 0;
        curZ += layerMaxZ;
        layerMaxZ = 0;
        rowMaxY = 0;
      }
      if (curZ + item.height > vehicle.height) {
        return result;
      }
      result.push({
        cargoId: item.id,
        color: item.color,
        x: curX, y: curY, z: curZ,
        length: item.length, width: item.width, height: item.height,
      });
      curX += item.length;
      rowMaxY = Math.max(rowMaxY, item.width);
      layerMaxZ = Math.max(layerMaxZ, item.height);
    }
  }
  return result;
}

export function useCargoStore() {
  const [vehicleId, setVehicleId] = useState<VehicleId>('large');
  const [cargoItems, setCargoItems] = useState<CargoItem[]>(SAMPLE_CARGO);

  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[2];

  function addCargo(fields: { length: number; width: number; height: number; weight: number; quantity: number }) {
    setCargoItems((prev) => {
      const color = COLORS[prev.length % COLORS.length];
      return [...prev, {
        id: `cargo-${Date.now()}`,
        name: `Груз ${prev.length + 1}`,
        ...fields,
        color,
      }];
    });
  }

  function removeCargo(id: string) {
    setCargoItems((prev) => prev.filter((c) => c.id !== id));
  }

  const placed = useMemo(() => placeCargo(cargoItems, vehicle), [cargoItems, vehicle]);

  const totalWeight = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems = cargoItems.reduce((s, c) => s + c.quantity, 0);
  const usedVolumeMm3 = cargoItems.reduce((s, c) => s + c.length * c.width * c.height * c.quantity, 0);
  const maxVolumeMm3 = vehicle.length * vehicle.width * vehicle.height;
  const usedVolume = usedVolumeMm3 / 1e9;
  const maxVolume = maxVolumeMm3 / 1e9;
  const freeVolume = Math.max(0, maxVolume - usedVolume);
  const occupancy = Math.min(100, Math.round((usedVolumeMm3 / maxVolumeMm3) * 100));

  return {
    vehicleId, setVehicleId,
    cargoItems, addCargo, removeCargo,
    vehicle, placed,
    totalWeight, totalItems,
    usedVolume, maxVolume, freeVolume, occupancy,
  };
}

export type CargoStore = ReturnType<typeof useCargoStore>;
