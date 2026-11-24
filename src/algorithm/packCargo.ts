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
  /**
   * Preferred orientation: index into the item's allowed orientations (taken
   * modulo their count). Every unit of a type then uses the same orientation
   * whenever it fits, so identical boxes form regular rows instead of a mix.
   * Undefined → at each point the lowest orientation is preferred.
   */
  orientation?: number;
  /**
   * Pack "do not stack" cargo after everything else, so it ends up on top of
   * the stacks (nothing may stand on it anyway) instead of wasting the space
   * above it on the floor. Floor-only cargo is always packed first.
   */
  nonStackableLast?: boolean;
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

/** Orientations allowed by the item's rotation rule (duplicates removed, fixed order). */
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

/** Unprojected corners + their projections on the nearest faces (Extreme Points). */
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
  const solids: Box[] = [...arches];        // arches + placed cargo, kept up to date
  const unplaced: UnplacedUnit[] = [];
  let points: Point[] = [];
  const pointKeys = new Set<string>();
  let placedWeight = 0;

  function addPoints(ps: Point[]) {
    for (const p of ps) {
      if (p.x >= vehicle.length || p.y >= vehicle.width || p.z >= vehicle.height) continue;
      const k = `${p.x},${p.y},${p.z}`;
      if (pointKeys.has(k)) continue;
      if (solids.some(s => containsPoint(s, p))) continue;
      pointKeys.add(k);
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
    for (const s of solids) if (intersects(box, s)) return { ok: false, hadRoom: false, reason: 'NO_SPACE' };
    // loading order: cannot be slid underneath cargo that is already in place
    for (const s of placed) {
      if (s.z === box.z + box.h && footprintOverlap(box, s) > 0) return { ok: false, hadRoom: false, reason: 'NO_SPACE' };
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
    for (const s of solids) {
      const ox = overlap1D(b.x, b.x + b.l, s.x, s.x + s.l);
      const oy = overlap1D(b.y, b.y + b.w, s.y, s.y + s.w);
      const oz = overlap1D(b.z, b.z + b.h, s.z, s.z + s.h);
      if (s.z + s.h === b.z || b.z + b.h === s.z) a += ox * oy;
      if (s.x + s.l === b.x || b.x + b.l === s.x) a += oy * oz;
      if (s.y + s.w === b.y || b.y + b.w === s.y) a += ox * oz;
    }
    return a;
  }

  /** Orientations to try, best first. */
  function orientationsFor(item: CargoItem, dims: Dims[]): Dims[] {
    if (options.orientation === undefined) return [...dims].sort((a, b) => a.h - b.h);
    const all = allowedDims(item);
    const preferred = all[options.orientation % all.length];
    const first = dims.find(d => d.l === preferred.l && d.w === preferred.w && d.h === preferred.h);
    return first ? [first, ...dims.filter(d => d !== first).sort((a, b) => a.h - b.h)] : [...dims].sort((a, b) => a.h - b.h);
  }

  function place(item: CargoItem): UnplacedReason | null {
    const fitting = allowedDims(item).filter(d => d.l <= vehicle.length && d.w <= vehicle.width && d.h <= vehicle.height);
    if (fitting.length === 0) return 'TOO_LARGE';
    const door = vehicle.rearDoor;
    const throughDoor = door ? fitting.filter(d => d.w <= door.width && d.h <= door.height) : fitting;
    if (throughDoor.length === 0) return 'DOOR_OPENING';
    if (placedWeight + item.weight > vehicle.maxWeight) return 'PAYLOAD_EXCEEDED';

    const dims = orientationsFor(item, throughDoor);
    const candidates = (item.floorOnly ? points.filter(p => p.z === 0) : points).sort(positionOrder);
    const counts = new Map<UnplacedReason, number>();
    const commit = (p: Point, d: Dims, support: SupportKind) => {
      const box: Placed = { ...p, ...d, item, support };
      placed.push(box);
      solids.push(box);
      placedWeight += item.weight;
      points = points.filter(q => {
        if (!containsPoint(box, q)) return true;
        pointKeys.delete(`${q.x},${q.y},${q.z}`);
        return false;
      });
      addPoints(extremePoints(box, solids));
    };

    // "Do not stack" cargo packed last goes as high as possible: nothing may stand on it,
    // so the higher it is, the less space above it is lost.
    const preferHigh = !!options.nonStackableLast && !item.stackable && !item.floorOnly;
    if (maxContact || preferHigh) {
      // Evaluate every feasible (point, orientation) and keep the best one: the most contact
      // with floor, walls, arches and cargo — or the highest spot; ties keep the point order.
      let best: { p: Point; d: Dims; support: SupportKind; score: number } | null = null;
      for (const p of candidates) {
        for (const d of dims) {
          const r = check(d, p);
          if (r.ok) {
            const score = preferHigh ? p.z + d.h : contactArea({ ...p, ...d });
            if (!best || score > best.score) best = { p, d, support: r.support, score };
          } else if (r.hadRoom) {
            counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
          }
        }
      }
      if (best) { commit(best.p, best.d, best.support); return null; }
    } else {
      // First point (in the chosen order) where some orientation fits; orientations in preference order.
      for (const p of candidates) {
        for (const d of dims) {
          const r = check(d, p);
          if (r.ok) { commit(p, d, r.support); return null; }
          if (r.hadRoom) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
        }
      }
    }
    if (item.floorOnly) return 'NO_FLOOR_SPACE';
    // There was room somewhere but a stacking rule forbade it → report that rule, else no room.
    let reason: UnplacedReason = 'NO_SPACE';
    let max = 0;
    for (const r of STACK_REASONS) if ((counts.get(r) ?? 0) > max) { max = counts.get(r)!; reason = r; }
    return reason;
  }

  // Groups: floor-only first (they need the floor), then normal cargo, then — optionally —
  // "do not stack" cargo. Inside a group: the chosen rule (largest first), volume, weight, input order.
  const group = (i: CargoItem) => (i.floorOnly ? 0 : options.nonStackableLast && !i.stackable ? 2 : 1);
  const units = items.flatMap((item, index) => Array.from({ length: item.quantity }, () => ({ item, index })));
  units.sort((a, b) =>
    group(a.item) - group(b.item) ||
    sortValue(b.item) - sortValue(a.item) ||
    SORT_VALUE.volume(b.item) - SORT_VALUE.volume(a.item) ||
    b.item.weight - a.item.weight ||
    a.index - b.index);

  // Identical units fail identically as long as nothing new was placed (payload included).
  let lastFail: { item: CargoItem; placedCount: number; reason: UnplacedReason } | null = null;
  for (const { item } of units) {
    let reason: UnplacedReason | null;
    if (lastFail && lastFail.item === item && lastFail.placedCount === placed.length) reason = lastFail.reason;
    else reason = place(item);
    if (reason) {
      unplaced.push({ cargoId: item.id, name: item.name, reason });
      lastFail = { item, placedCount: placed.length, reason };
    }
  }

  const result: PlacedUnit[] = loadingSequence(placed).map((b, i) => ({
    step: i + 1,
    cargoId: b.item.id,
    name: b.item.name,
    color: b.item.color,
    weight: b.item.weight,
    x: b.x, y: b.y, z: b.z,
    length: b.l, width: b.w, height: b.h,
    support: b.support,
    kind: b.item.kind ?? 'box',
    stackable: b.item.stackable,
    floorOnly: b.item.floorOnly ?? false,
  }));
  return { placed: result, unplaced };
}

// ── loading sequence ─────────────────────────────────────────────────────────

/**
 * Order in which the units are actually loaded through the rear doors.
 *
 * The search places units in its own order (e.g. the whole floor first); a real
 * loader builds walls from the cab towards the doors instead. Each step takes
 * the unit closest to the cab (then lowest, then leftmost) among those whose
 * supports are already loaded — so a column at the cab is finished bottom-to-top
 * before the loader moves back, and nothing is ever loaded before its support.
 */
export function loadingSequence<T extends Box>(boxes: T[]): T[] {
  const supports = boxes.map(b => boxes
    .map((s, j) => ({ s, j }))
    .filter(({ s }) => s !== b && s.z + s.h === b.z && footprintOverlap(b, s) > 0)
    .map(({ j }) => j));
  const closerToCab = (a: Box, b: Box) => (a.x !== b.x ? a.x < b.x : a.z !== b.z ? a.z < b.z : a.y < b.y);
  const done = new Array(boxes.length).fill(false);
  const out: T[] = [];
  while (out.length < boxes.length) {
    let pick = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (done[i] || !supports[i].every(j => done[j])) continue;
      if (pick < 0 || closerToCab(boxes[i], boxes[pick])) pick = i;
    }
    done[pick] = true;
    out.push(boxes[pick]);
  }
  return out;
}

// ── portfolio ────────────────────────────────────────────────────────────────

export const SORT_RULES: SortRule[] = ['volume', 'baseArea', 'height', 'longestEdge', 'weight'];
export const POSITION_RULES: PositionRule[] = ['floor-first', 'cab-first', 'wall-first', 'max-contact'];

export interface PlanQuality {
  volume: number;
  units: number;
  weight: number;
  /** floor taken by "do not stack" cargo that is allowed higher up (mm²) — floor is the most valuable space */
  blockedFloor: number;
  /** empty space above "do not stack" cargo up to the roof — unusable (mm³) */
  deadSpace: number;
  /** how far from the cab the cargo reaches (mm) — less = more free floor at the doors */
  loadingLength: number;
  comZ: number;
}

export function planQuality(r: PackingResult, vehicleHeight = 0): PlanQuality {
  let volume = 0, weight = 0, mz = 0, deadSpace = 0, loadingLength = 0, blockedFloor = 0;
  for (const u of r.placed) {
    volume += u.length * u.width * u.height;
    weight += u.weight;
    mz += u.weight * (u.z + u.height / 2);
    if (u.stackable === false) deadSpace += u.length * u.width * Math.max(0, vehicleHeight - u.z - u.height);
    if (u.stackable === false && !u.floorOnly && u.z === 0) blockedFloor += u.length * u.width;
    loadingLength = Math.max(loadingLength, u.x + u.length);
  }
  return { volume, units: r.placed.length, weight, blockedFloor, deadSpace, loadingLength, comZ: weight > 0 ? mz / weight : 0 };
}

/**
 * a better than b: more volume loaded, more units, more mass; on a tie: less
 * floor taken by "do not stack" cargo, less wasted space above it, a shorter
 * loading length (free floor at the doors), then a lower centre of mass.
 */
function better(a: PlanQuality, b: PlanQuality): boolean {
  if (a.volume !== b.volume) return a.volume > b.volume;
  if (a.units !== b.units) return a.units > b.units;
  if (a.weight !== b.weight) return a.weight > b.weight;
  if (a.blockedFloor !== b.blockedFloor) return a.blockedFloor < b.blockedFloor;
  if (a.deadSpace !== b.deadSpace) return a.deadSpace < b.deadSpace;
  if (a.loadingLength !== b.loadingLength) return a.loadingLength < b.loadingLength;
  return a.comZ < b.comZ - 1e-9;
}

export interface Variant { sortBy: SortRule; positions: PositionRule; orientation?: number; nonStackableLast?: boolean }

export interface BestPlan extends PackingResult, Variant {
  variantsTried: number;
}

/** The deterministic list of variants tried by packCargoBest. */
export function portfolio(): Variant[] {
  const out: Variant[] = [];
  for (const nonStackableLast of [false, true]) {
    for (const positions of POSITION_RULES) for (const sortBy of SORT_RULES) out.push({ sortBy, positions, nonStackableLast });
  }
  // Uniform orientation per item type: keeps identical boxes in regular rows.
  for (const positions of ['floor-first', 'cab-first', 'wall-first'] as PositionRule[]) {
    for (let orientation = 0; orientation < 6; orientation++) out.push({ sortBy: 'volume', positions, orientation, nonStackableLast: true });
  }
  return out;
}

/**
 * Runs the heuristic for every variant of portfolio() and keeps the best plan.
 * Still a heuristic: the best of the tried variants, not a proven optimum.
 */
export function packCargoBest(items: CargoItem[], vehicle: Vehicle, supportRatio = DEFAULT_SUPPORT_RATIO): BestPlan {
  const variants = portfolio();
  let best: BestPlan | null = null;
  let bestQ: PlanQuality | null = null;
  for (const v of variants) {
    const r = packCargo(items, vehicle, { supportRatio, ...v });
    const q = planQuality(r, vehicle.height);
    if (!best || better(q, bestQ!)) {
      best = { ...r, ...v, variantsTried: variants.length };
      bestQ = q;
    }
  }
  return best!;
}
