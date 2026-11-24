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
  // Clear opening of the rear doors (mm). Cargo must pass through it.
  rearDoor?: { width: number; height: number };
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

// none — keep as entered; horizontal — may turn 90° on the floor (height stays up);
// any — may be laid on any side
export type RotationRule = 'none' | 'horizontal' | 'any';

/** Visual kind of cargo: a carton/crate or a load on a wooden pallet (base 144 mm). */
export type CargoKind = 'box' | 'pallet';

export interface CargoItem {
  id: string;
  name: string;
  length: number; // mm
  width: number;  // mm
  height: number; // mm
  weight: number; // kg
  quantity: number;
  color: string;
  rotation: RotationRule;
  stackable: boolean; // may other cargo be placed on top of it
  floorOnly?: boolean; // must stand on the floor (pallets, heavy items)
  kind?: CargoKind;    // how it is drawn; 'box' when missing
}

export type SupportKind = 'floor' | 'between_arches' | 'on_arch' | 'stacked';

export interface PlacedUnit {
  step: number;      // 1-based loading order
  cargoId: string;
  name: string;
  color: string;
  weight: number;    // kg
  x: number; // mm from front wall
  y: number; // mm from left side
  z: number; // mm from floor
  length: number;    // size along X after rotation
  width: number;     // size along Y after rotation
  height: number;    // size along Z after rotation
  support: SupportKind;
  kind?: CargoKind;      // drawing only
  stackable?: boolean;   // drawing only (marks "do not stack")
  floorOnly?: boolean;
}

export type UnplacedReason =
  | 'TOO_LARGE'            // does not fit the cargo space in any allowed orientation
  | 'DOOR_OPENING'         // fits inside, but not through the rear door
  | 'PAYLOAD_EXCEEDED'     // would exceed the vehicle payload
  | 'NO_SPACE'             // no free room left
  | 'NO_FLOOR_SPACE'       // must stand on the floor, but the floor is full
  | 'NOT_STACKABLE'        // only free room is on top of non-stackable cargo
  | 'INSUFFICIENT_SUPPORT' // would hang in the air (too little support)
  | 'UNSTABLE';            // centre of the base not over the support

export interface UnplacedUnit {
  cargoId: string;
  name: string;
  reason: UnplacedReason;
}

export interface PackingResult {
  placed: PlacedUnit[];
  unplaced: UnplacedUnit[];
}

export interface PlacementStep {
  stepIndex: number;
  cargoId: string;
  cargoName: string;
  position: { x: number; y: number; z: number };
  description: string;
}
