export type VehicleId = 'small' | 'medium' | 'large';

export interface Vehicle {
  id: VehicleId;
  name: string;
  length: number; // mm
  width: number;  // mm
  height: number; // mm
  maxWeight: number; // kg
  images?: { front: string; side: string };
}

export interface CargoItem {
  id: string;
  name: string;
  length: number; // mm
  width: number;  // mm
  height: number; // mm
  weight: number; // kg
  quantity: number;
  color: string;
}

export interface PlacedUnit {
  cargoId: string;
  color: string;
  x: number; // mm from front wall
  y: number; // mm from left side
  z: number; // mm from floor
  length: number;
  width: number;
  height: number;
}

export interface PlacementStep {
  stepIndex: number;
  cargoId: string;
  cargoName: string;
  position: { x: number; y: number; z: number };
  description: string;
}
