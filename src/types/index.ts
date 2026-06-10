// VehicleId is a plain string — works with local array today, DB primary key tomorrow
export type VehicleId = string;

// A single wheel arch intrusion into the cargo floor
export interface WheelArch {
  heightFromFloor: number;   // Z (mm): arch blocks space below this height
  intrusionPerSide: number;  // Y (mm): how much the arch protrudes from each side wall
  startX: number;            // X (mm): arch begins at this distance from front wall
  endX: number;              // X (mm): arch ends here
}

export interface Vehicle {
  id: VehicleId;
  name: string;
  length: number;             // X axis (mm)
  width: number;              // Y axis (mm)
  height: number;             // Z axis (mm)
  maxWeight: number;          // kg
  cargoVolume?: number;       // m³ (informational, from manufacturer)
  wheelArches?: WheelArch[];  // empty array = flat floor, no restrictions
  images?: { front?: string; side?: string };
  // Photo-based cargo view: open-side cutaway image with cargo area calibration
  cargoView?: {
    src: string;         // path to cutaway image
    imgW: number;        // natural image width (px)
    imgH: number;        // natural image height (px)
    cargoLeft: number;   // px: cargo partition (behind cab)
    cargoRight: number;  // px: rear door
    cargoTop: number;    // px: cargo ceiling
    cargoFloor: number;  // px: cargo floor
    cropY?: number;      // px: crop top whitespace to zoom van
    cropH?: number;      // px: visible height after crop
  };
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
