// Cargo packing heuristic: Extreme Points (Crainic, Perboli, Tadei 2008) with
// the constraints from the thesis scope. Units: mm, kg.
//
// Coordinates: origin at the front-left floor corner of the cargo space,
// x → rear doors, y → right wall, z → up.
//
// The result is a heuristic proposal — it is NOT guaranteed to be optimal.
// The search is deterministic: the same input always gives the same result.

import type { CargoItem, PackingResult, PlacedUnit, SupportKind, UnplacedReason, UnplacedUnit, Vehicle } from '../types';

export interface Box { x: number; y: number; z: number; l: number; w: number; h: number }
type Point = { x: number; y: number; z: number };
type Dims = { l: number; w: number; h: number };

export const DEFAULT_SUPPORT_RATIO = 0.75;

/** Order in which units are packed (always descending). */
export type SortRule = 'volume' | 'baseArea' | 'height' | 'longestEdge' | 'weight';
/** Lexicographic preference of candidate positions. */
export type PositionRule = 'floor-first' | 'cab-first' | 'wall-first' | 'max-contact';

export interface PackOptions {
  supportRatio?: number;
  sortBy?: SortRule;
  positions?: PositionRule;
}

const SORT_VALUE: Record<SortRule, (i: CargoItem) => number> = {
  volume: i => i.length * i.width * i.height,
  baseArea: i => i.length * i.width,
  height: i => i.height,
  longestEdge: i => Math.max(i.length, i.width, i.height),
  weight: i => i.weight,
};

const POSITION_ORDER: Record<PositionRule, (a: Point, b: Point) => number> = {
  'floor-first': (a, b) => a.z - b.z || a.x - b.x || a.y - b.y, // cover the floor, then stack
  'cab-first': (a, b) => a.x - b.x || a.z - b.z || a.y - b.y,   // build full-height walls from the cab
  'wall-first': (a, b) => a.x - b.x || a.y - b.y || a.z - b.z,  // columns along the left wall
  // touching-perimeter rule (Lodi, Martello, Vigo): best contact; this order only breaks ties
  'max-contact': (a, b) => a.z - b.z || a.x - b.x || a.y - b.y,
};

// ── geometry ─────────────────────────────────────────────────────────────────

/** Interiors overlap (touching faces is allowed). */
export function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.l && b.x < a.x + a.l
      && a.y < b.y + b.w && b.y < a.y + a.w
      && a.z < b.z + b.h && b.z < a.z + a.h;
}

function overlap1D(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

function footprintOverlap(a: Box, b: Box): number {
  return overlap1D(a.x, a.x + a.l, b.x, b.x + b.l) * overlap1D(a.y, a.y + a.w, b.y, b.y + b.w);
}

function containsPoint(b: Box, p: Point): boolean {
  return p.x >= b.x && p.x < b.x + b.l && p.y >= b.y && p.y < b.y + b.w && p.z >= b.z && p.z < b.z + b.h;
}

type P2 = { x: number; y: number };
const cross = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** Is `p` inside (or on the edge of) the convex hull of `pts`? */
function insideConvexHull(p: P2, pts: P2[]): boolean {
  const s = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const half = (list: P2[]) => {
    const h: P2[] = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    return h;
  };
  const hull = [...half(s).slice(0, -1), ...half([...s].reverse()).slice(0, -1)];
  if (hull.length < 3) return false;
  for (let i = 0; i < hull.length; i++) if (cross(hull[i], hull[(i + 1) % hull.length], p) < 0) return false;
  return true;
}

// ── vehicle ──────────────────────────────────────────────────────────────────

/**
 * Wheel arches as boxes: each arch protrudes `intrusionPerSide` from BOTH side
 * walls between startX and endX, up to `heightFromFloor`. The top of an arch
 * is a surface cargo may rest on.
 */
export function wheelArchBoxes(vehicle: Vehicle): Box[] {
  return (vehicle.wheelArches ?? []).flatMap(a => {
    const base = { x: a.startX, z: 0, l: a.endX - a.startX, w: a.intrusionPerSide, h: a.heightFromFloor };
    return [{ ...base, y: 0 }, { ...base, y: vehicle.width - a.intrusionPerSide }];
  });
}

/** Orientations allowed by the item's rotation rule (duplicates removed). */
export function allowedDims(item: Pick<CargoItem, 'length' | 'width' | 'height' | 'rotation'>): Dims[] {
  const { length: L, width: W, height: H } = item;
  const all: [number, number, number][] =
    item.rotation === 'none' ? [[L, W, H]] :
    item.rotation === 'horizontal' ? [[L, W, H], [W, L, H]] :
    [[L, W, H], [W, L, H], [L, H, W], [H, L, W], [W, H, L], [H, W, L]];
  const seen = new Set<string>();
  return all
    .filter(([l, w, h]) => { const k = `${l}x${w}x${h}`; return seen.has(k) ? false : (seen.add(k), true); })
    .map(([l, w, h]) => ({ l, w, h }));
}

// ── packing ──────────────────────────────────────────────────────────────────

interface Placed extends Box {
  item: CargoItem;
  support: SupportKind;
}

type Check = { ok: true; support: SupportKind } | { ok: false; hadRoom: boolean; reason: UnplacedReason };

/** Unprojected corner + projections on the nearest faces (Extreme Points). */
function extremePoints(b: Box, solids: Box[]): Point[] {
  const project = (p: Point, axis: 'x' | 'y' | 'z'): Point => {
    let stop = 0;
    for (const s of solids) {
      const inX = s.x <= p.x && p.x < s.x + s.l;
      const inY = s.y <= p.y && p.y < s.y + s.w;
      const inZ = s.z <= p.z && p.z < s.z + s.h;
      if (axis === 'x' && inY && inZ && s.x + s.l <= p.x) stop = Math.max(stop, s.x + s.l);
      if (axis === 'y' && inX && inZ && s.y + s.w <= p.y) stop = Math.max(stop, s.y + s.w);
      if (axis === 'z' && inX && inY && s.z + s.h <= p.z) stop = Math.max(stop, s.z + s.h);
    }
    return { ...p, [axis]: stop };
  };
  const px = { x: b.x + b.l, y: b.y, z: b.z };
  const py = { x: b.x, y: b.y + b.w, z: b.z };
  const pz = { x: b.x, y: b.y, z: b.z + b.h };
  // The unprojected corners are kept as well (documented deviation from the paper):
  // otherwise positions like "right on top of the box" can be lost.
  return [px, py, pz, project(px, 'y'), project(px, 'z'), project(py, 'x'), project(py, 'z'), project(pz, 'x'), project(pz, 'y')];
}

const STACK_REASONS: UnplacedReason[] = ['NOT_STACKABLE', 'UNSTABLE', 'INSUFFICIENT_SUPPORT'];

export function packCargo(items: CargoItem[], vehicle: Vehicle, options: PackOptions = {}): PackingResult {
  const supportRatio = options.supportRatio ?? DEFAULT_SUPPORT_RATIO;
  const sortValue = SORT_VALUE[options.sortBy ?? 'volume'];
  const positionOrder = POSITION_ORDER[options.positions ?? 'floor-first'];
  const maxContact = options.positions === 'max-contact';
  const arches = wheelArchBoxes(vehicle);
  const placed: Placed[] = [];
  const unplaced: UnplacedUnit[] = [];
  let points: Point[] = [];
  let placedWeight = 0;

  const solids = (): Box[] => [...arches, ...placed];

  function addPoints(ps: Point[]) {
    const all = solids();
    for (const p of ps) {
      if (p.x >= vehicle.length || p.y >= vehicle.width || p.z >= vehicle.height) continue;
      if (all.some(s => containsPoint(s, p))) continue;
      if (points.some(q => q.x === p.x && q.y === p.y && q.z === p.z)) continue;
      points.push(p);
    }
  }
  addPoints([{ x: 0, y: 0, z: 0 }, ...arches.flatMap(a => extremePoints(a, arches))]);

  function check(d: Dims, p: Point): Check {
    const box: Box = { ...p, ...d };
    // inside the cargo space
    if (box.x + box.l > vehicle.length || box.y + box.w > vehicle.width || box.z + box.h > vehicle.height) {
      return { ok: false, hadRoom: false, reason: 'NO_SPACE' };
    }
    // no collisions with arches or other cargo
    if (solids().some(s => intersects(box, s))) return { ok: false, hadRoom: false, reason: 'NO_SPACE' };
    // loading order: cannot be slid underneath cargo that is already in place
    if (placed.some(s => s.z === box.z + box.h && footprintOverlap(box, s) > 0)) {
      return { ok: false, hadRoom: false, reason: 'NO_SPACE' };
    }
    if (box.z === 0) {
      const inArchZone = arches.some(a => overlap1D(box.x, box.x + box.l, a.x, a.x + a.l) > 0);
      return { ok: true, support: inArchZone ? 'between_arches' : 'floor' };
    }
    // support: top faces lying exactly at the box bottom
    let area = 0;
    let onArch = false;
    const corners: P2[] = [];
    const addContact = (s: Box) => {
      const x0 = Math.max(box.x, s.x), x1 = Math.min(box.x + box.l, s.x + s.l);
      const y0 = Math.max(box.y, s.y), y1 = Math.min(box.y + box.w, s.y + s.w);
      area += (x1 - x0) * (y1 - y0);
      corners.push({ x: 2 * x0, y: 2 * y0 }, { x: 2 * x1, y: 2 * y0 }, { x: 2 * x0, y: 2 * y1 }, { x: 2 * x1, y: 2 * y1 });
    };
    for (const s of placed) {
      if (s.z + s.h !== box.z || footprintOverlap(box, s) === 0) continue;
      if (!s.item.stackable) return { ok: false, hadRoom: true, reason: 'NOT_STACKABLE' };
      addContact(s);
    }
    for (const a of arches) {
      if (a.z + a.h !== box.z || footprintOverlap(box, a) === 0) continue;
      addContact(a);
      onArch = true;
    }
    if (area < supportRatio * box.l * box.w) return { ok: false, hadRoom: true, reason: 'INSUFFICIENT_SUPPORT' };
    // stability: centre of the base above the convex hull of the contact areas (doubled coords)
    if (!insideConvexHull({ x: 2 * box.x + box.l, y: 2 * box.y + box.w }, corners)) {
      return { ok: false, hadRoom: true, reason: 'UNSTABLE' };
    }
    return { ok: true, support: onArch ? 'on_arch' : 'stacked' };
  }

  /** Area of the box faces touching the floor, the walls, arches or other cargo (mm²). */
  function contactArea(b: Box): number {
    let a = 0;
    if (b.z === 0) a += b.l * b.w;
    if (b.x === 0) a += b.w * b.h;
    if (b.x + b.l === vehicle.length) a += b.w * b.h;
    if (b.y === 0) a += b.l * b.h;
    if (b.y + b.w === vehicle.width) a += b.l * b.h;
    if (b.z + b.h === vehicle.height) a += b.l * b.w;
    for (const s of solids()) {
      const ox = overlap1D(b.x, b.x + b.l, s.x, s.x + s.l);
      const oy = overlap1D(b.y, b.y + b.w, s.y, s.y + s.w);
      const oz = overlap1D(b.z, b.z + b.h, s.z, s.z + s.h);
      if (s.z + s.h === b.z || b.z + b.h === s.z) a += ox * oy;
      if (s.x + s.l === b.x || b.x + b.l === s.x) a += oy * oz;
      if (s.y + s.w === b.y || b.y + b.w === s.y) a += ox * oz;
    }
    return a;
  }

  function place(item: CargoItem): UnplacedReason | null {
    const fitting = allowedDims(item).filter(d => d.l <= vehicle.length && d.w <= vehicle.width && d.h <= vehicle.height);
    if (fitting.length === 0) return 'TOO_LARGE';
    const door = vehicle.rearDoor;
    const throughDoor = door ? fitting.filter(d => d.w <= door.width && d.h <= door.height) : fitting;
    if (throughDoor.length === 0) return 'DOOR_OPENING';
    if (placedWeight + item.weight > vehicle.maxWeight) return 'PAYLOAD_EXCEEDED';

    const order = [...points].sort(positionOrder);
    const counts = new Map<UnplacedReason, number>();
    const commit = (p: Point, d: Dims, support: SupportKind) => {
      const box: Placed = { ...p, ...d, item, support };
      placed.push(box);
      placedWeight += item.weight;
      points = points.filter(q => !containsPoint(box, q));
      addPoints(extremePoints(box, solids()));
    };

    if (maxContact) {
      // Evaluate every feasible (point, orientation) and keep the one touching the most
      // surfaces (floor, walls, arches, other cargo); ties keep the floor-first order.
      let best: { p: Point; d: Dims; support: SupportKind; score: number } | null = null;
      for (const p of order) {
        for (const d of throughDoor) {
          const r = check(d, p);
          if (r.ok) {
            const score = contactArea({ ...p, ...d });
            if (!best || score > best.score) best = { p, d, support: r.support, score };
          } else if (r.hadRoom) {
            counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
          }
        }
      }
      if (best) { commit(best.p, best.d, best.support); return null; }
    } else {
      for (const p of order) {
        let best: { d: Dims; support: SupportKind } | null = null;
        for (const d of throughDoor) {
          const r = check(d, p);
          if (r.ok) {
            // tie-break between orientations at the same point: lower height first (more stable)
            if (!best || d.h < best.d.h) best = { d, support: r.support };
          } else if (r.hadRoom) {
            counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
          }
        }
        if (best) { commit(p, best.d, best.support); return null; }
      }
    }
    // There was room somewhere but a stacking rule forbade it → report that rule, else no room.
    let reason: UnplacedReason = 'NO_SPACE';
    let max = 0;
    for (const r of STACK_REASONS) if ((counts.get(r) ?? 0) > max) { max = counts.get(r)!; reason = r; }
    return reason;
  }

  // Units sorted by the chosen rule (largest first), then by volume, weight and input order.
  const units = items.flatMap((item, index) => Array.from({ length: item.quantity }, () => ({ item, index })));
  units.sort((a, b) =>
    sortValue(b.item) - sortValue(a.item) ||
    SORT_VALUE.volume(b.item) - SORT_VALUE.volume(a.item) ||
    b.item.weight - a.item.weight ||
    a.index - b.index);

  for (const { item } of units) {
    const reason = place(item);
    if (reason) unplaced.push({ cargoId: item.id, name: item.name, reason });
  }

  const result: PlacedUnit[] = placed.map((b, i) => ({
    step: i + 1,
    cargoId: b.item.id,
    name: b.item.name,
    color: b.item.color,
    weight: b.item.weight,
    x: b.x, y: b.y, z: b.z,
    length: b.l, width: b.w, height: b.h,
    support: b.support,
  }));
  return { placed: result, unplaced };
}

// ── portfolio ────────────────────────────────────────────────────────────────

export const SORT_RULES: SortRule[] = ['volume', 'baseArea', 'height', 'longestEdge', 'weight'];
export const POSITION_RULES: PositionRule[] = ['floor-first', 'cab-first', 'wall-first', 'max-contact'];

export interface PlanQuality { volume: number; units: number; weight: number; comZ: number }

export function planQuality(r: PackingResult): PlanQuality {
  let volume = 0, weight = 0, mz = 0;
  for (const u of r.placed) {
    volume += u.length * u.width * u.height;
    weight += u.weight;
    mz += u.weight * (u.z + u.height / 2);
  }
  return { volume, units: r.placed.length, weight, comZ: weight > 0 ? mz / weight : 0 };
}

/** a better than b: more volume loaded, then more units, then more mass, then lower centre of mass. */
function better(a: PlanQuality, b: PlanQuality): boolean {
  if (a.volume !== b.volume) return a.volume > b.volume;
  if (a.units !== b.units) return a.units > b.units;
  if (a.weight !== b.weight) return a.weight > b.weight;
  return a.comZ < b.comZ - 1e-9;
}

export interface BestPlan extends PackingResult {
  sortBy: SortRule;
  positions: PositionRule;
  variantsTried: number;
}

/**
 * Runs the heuristic for every combination of sorting and position rules
 * (5 × 4 = 20 deterministic runs) and keeps the best plan. Still a heuristic:
 * the result is the best of the tried variants, not a proven optimum.
 */
export function packCargoBest(items: CargoItem[], vehicle: Vehicle, supportRatio = DEFAULT_SUPPORT_RATIO): BestPlan {
  let best: BestPlan | null = null;
  let bestQ: PlanQuality | null = null;
  for (const positions of POSITION_RULES) {
    for (const sortBy of SORT_RULES) {
      const r = packCargo(items, vehicle, { supportRatio, sortBy, positions });
      const q = planQuality(r);
      if (!best || better(q, bestQ!)) {
        best = { ...r, sortBy, positions, variantsTried: 0 };
        bestQ = q;
      }
    }
  }
  return { ...best!, variantsTried: SORT_RULES.length * POSITION_RULES.length };
}
