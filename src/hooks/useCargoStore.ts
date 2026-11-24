import { useState } from 'react';
import { SAMPLE_CARGO } from '../data/mockData';
import { vehicleService } from '../services/vehicleService';
import { DEFAULT_SUPPORT_RATIO } from '../algorithm/packCargo';
import { verifyPacking } from '../algorithm/verifyPacking';
import { computePlan, type PlanResult } from '../algorithm/computePlan';
import type { CargoItem, RotationRule, VehicleId } from '../types';
import type { SavedProject } from '../services/projectService';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#4ade80'];

export interface NewCargo {
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  rotation: RotationRule;
  stackable: boolean;
  floorOnly?: boolean;
}

export type { PlanResult };

export function useCargoStore() {
  const defaultVehicle = vehicleService.getDefault();
  const [vehicleId, setVehicleIdRaw] = useState<VehicleId>(defaultVehicle.id);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>(SAMPLE_CARGO);
  const [plan, setPlanRaw] = useState<PlanResult | null>(null);
  const [step, setStepRaw] = useState(0);

  // a new plan is shown complete; no plan → step 0
  function setPlan(p: PlanResult | null) {
    setPlanRaw(p);
    setStepRaw(p?.placed.length ?? 0);
  }

  function setStep(n: number) {
    setStepRaw(Math.max(0, Math.min(plan?.placed.length ?? 0, n)));
  }

  const vehicle = vehicleService.getById(vehicleId) ?? defaultVehicle;

  function setVehicleId(id: VehicleId) {
    setVehicleIdRaw(id);
    setPlan(null);
  }

  function addCargo(fields: NewCargo): boolean {
    setCargoItems(prev => {
      const color = COLORS[prev.length % COLORS.length];
      const name = fields.name.trim() || `Ładunek ${prev.length + 1}`;
      return [...prev, { id: `cargo-${Date.now()}`, ...fields, name, color }];
    });
    setPlan(null);
    return true;
  }

  function removeCargo(id: string) {
    setCargoItems(prev => prev.filter(c => c.id !== id));
    setPlan(null);
  }

  function clearAll(newVehicleId?: VehicleId) {
    if (newVehicleId) setVehicleIdRaw(newVehicleId);
    setCargoItems([]);
    setPlan(null);
  }

  /** Removes the computed plan (the cargo list stays). */
  function clearPlan() {
    setPlan(null);
  }

  /** Restores a saved project; the stored plan is re-checked by the verifier. */
  function loadProject(p: SavedProject) {
    const v = vehicleService.getById(p.vehicle.id) ?? p.vehicle;
    setVehicleIdRaw(v.id);
    setCargoItems(p.cargoItems);
    setPlan(p.plan && {
      ...p.plan,
      violations: verifyPacking(p.cargoItems, v, p.plan.placed, DEFAULT_SUPPORT_RATIO),
      elapsedMs: 0,
    });
  }

  /** Computes the plan (in a Web Worker in the browser). */
  async function optimize() {
    setPlan(await computePlan(cargoItems, vehicle, DEFAULT_SUPPORT_RATIO));
  }

  const placed   = plan?.placed ?? [];
  const unplaced = plan?.unplaced ?? [];

  const totalWeight   = cargoItems.reduce((s, c) => s + c.weight * c.quantity, 0);
  const totalItems    = cargoItems.reduce((s, c) => s + c.quantity, 0);
  const cargoVolumeMm3 = cargoItems.reduce((s, c) => s + c.length * c.width * c.height * c.quantity, 0);
  const placedVolumeMm3 = placed.reduce((s, u) => s + u.length * u.width * u.height, 0);
  const placedWeight  = placed.reduce((s, u) => s + u.weight, 0);
  const maxVolumeMm3  = vehicle.length * vehicle.width * vehicle.height;
  const usedVolume    = placedVolumeMm3 / 1e9;
  const cargoVolume   = cargoVolumeMm3 / 1e9;
  const maxVolume     = maxVolumeMm3 / 1e9;
  const freeVolume    = Math.max(0, maxVolume - usedVolume);
  const occupancy     = Math.min(100, Math.round((placedVolumeMm3 / maxVolumeMm3) * 100));

  return {
    vehicleId, setVehicleId,
    cargoItems, addCargo, removeCargo, clearAll, clearPlan,
    vehicle, plan, placed, unplaced, optimize, step, setStep, loadProject,
    totalWeight, totalItems, placedWeight,
    usedVolume, cargoVolume, maxVolume, freeVolume, occupancy,
  };
}

export type CargoStore = ReturnType<typeof useCargoStore>;
