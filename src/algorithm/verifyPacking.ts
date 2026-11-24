// Independent check of a finished loading plan.
//
// It does NOT reuse packCargo's code — every rule is checked again from scratch,
// so a bug in the heuristic cannot hide itself. Used in tests and in the UI
// ("0 naruszeń").

import type { CargoItem, PlacedUnit, Vehicle } from '../types';

export type ViolationCode =
  | 'UNKNOWN_CARGO'
  | 'TOO_MANY_UNITS'
  | 'BAD_ORIENTATION'
  | 'OUT_OF_BOUNDS'
  | 'ARCH_COLLISION'
  | 'CARGO_COLLISION'
  | 'DOOR_OPENING'
  | 'NOT_STACKABLE'
  | 'FLOOR_ONLY'
  | 'NO_SUPPORT'
  | 'UNSTABLE'
  | 'LOADING_ORDER'
  | 'PAYLOAD_EXCEEDED';

export interface Violation { code: ViolationCode; step?: number }

type R = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };

const rect = (u: PlacedUnit): R => ({ x0: u.x, x1: u.x + u.length, y0: u.y, y1: u.y + u.width, z0: u.z, z1: u.z + u.height });
const ov = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
const solidOverlap = (a: R, b: R) => ov(a.x0, a.x1, b.x0, b.x1) > 0 && ov(a.y0, a.y1, b.y0, b.y1) > 0 && ov(a.z0, a.z1, b.z0, b.z1) > 0;
const footArea = (a: R, b: R) => ov(a.x0, a.x1, b.x0, b.x1) * ov(a.y0, a.y1, b.y0, b.y1);

function inHull(px: number, py: number, pts: { x: number; y: number }[]): boolean {
  const turn = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const s = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const chain = (list: typeof s) => {
    const h: typeof s = [];
    for (const p of list) { while (h.length >= 2 && turn(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
    return h;
  };
  const hull = chain(s).slice(0, -1).concat(chain([...s].reverse()).slice(0, -1));
  if (hull.length < 3) return false;
  return hull.every((a, i) => turn(a, hull[(i + 1) % hull.length], { x: px, y: py }) >= 0);
}

export function verifyPacking(items: CargoItem[], vehicle: Vehicle, placed: PlacedUnit[], supportRatio: number): Violation[] {
  const out: Violation[] = [];
  const byId = new Map(items.map(i => [i.id, i]));
  const used = new Map<string, number>();
  const W = vehicle.width;

  const arches: R[] = (vehicle.wheelArches ?? []).flatMap(a => [
    { x0: a.startX, x1: a.endX, y0: 0, y1: a.intrusionPerSide, z0: 0, z1: a.heightFromFloor },
    { x0: a.startX, x1: a.endX, y0: W - a.intrusionPerSide, y1: W, z0: 0, z1: a.heightFromFloor },
  ]);

  let mass = 0;
  const rs = placed.map(rect);
  placed.forEach((u, i) => {
    const item = byId.get(u.cargoId);
    if (!item) { out.push({ code: 'UNKNOWN_CARGO', step: u.step }); return; }
    used.set(item.id, (used.get(item.id) ?? 0) + 1);
    if (used.get(item.id)! > item.quantity) out.push({ code: 'TOO_MANY_UNITS', step: u.step });
    mass += item.weight;

    const dims = [u.length, u.width, u.height];
    const orig = [item.length, item.width, item.height];
    const sameMultiset = [...dims].sort((a, b) => a - b).join() === [...orig].sort((a, b) => a - b).join();
    const okRule =
      item.rotation === 'any' ? sameMultiset :
      item.rotation === 'horizontal' ? u.height === item.height && sameMultiset :
      u.length === item.length && u.width === item.width && u.height === item.height;
    if (!okRule) out.push({ code: 'BAD_ORIENTATION', step: u.step });

    const r = rs[i];
    if (r.x0 < 0 || r.y0 < 0 || r.z0 < 0 || r.x1 > vehicle.length || r.y1 > W || r.z1 > vehicle.height) out.push({ code: 'OUT_OF_BOUNDS', step: u.step });
    if (vehicle.rearDoor && (u.width > vehicle.rearDoor.width || u.height > vehicle.rearDoor.height)) out.push({ code: 'DOOR_OPENING', step: u.step });
    if (arches.some(a => solidOverlap(r, a))) out.push({ code: 'ARCH_COLLISION', step: u.step });
    for (let j = 0; j < i; j++) if (solidOverlap(r, rs[j])) out.push({ code: 'CARGO_COLLISION', step: u.step });

    if (item.floorOnly && r.z0 > 0) out.push({ code: 'FLOOR_ONLY', step: u.step });
    if (r.z0 > 0) {
      let area = 0;
      const pts: { x: number; y: number }[] = [];
      const contact = (s: R) => {
        const x0 = Math.max(r.x0, s.x0), x1 = Math.min(r.x1, s.x1), y0 = Math.max(r.y0, s.y0), y1 = Math.min(r.y1, s.y1);
        area += (x1 - x0) * (y1 - y0);
        pts.push({ x: 2 * x0, y: 2 * y0 }, { x: 2 * x1, y: 2 * y0 }, { x: 2 * x0, y: 2 * y1 }, { x: 2 * x1, y: 2 * y1 });
      };
      placed.forEach((v, j) => {
        if (j === i || rs[j].z1 !== r.z0 || footArea(r, rs[j]) === 0) return;
        contact(rs[j]);
        if (!byId.get(v.cargoId)?.stackable) out.push({ code: 'NOT_STACKABLE', step: u.step });
        if (v.step > u.step) out.push({ code: 'LOADING_ORDER', step: u.step });
      });
      arches.forEach(a => { if (a.z1 === r.z0 && footArea(r, a) > 0) contact(a); });
      const base = u.length * u.width;
      if (area < supportRatio * base) out.push({ code: 'NO_SUPPORT', step: u.step });
      else if (!inHull(r.x0 + r.x1, r.y0 + r.y1, pts)) out.push({ code: 'UNSTABLE', step: u.step });
    }
  });
  if (mass > vehicle.maxWeight) out.push({ code: 'PAYLOAD_EXCEEDED' });
  return out;
}
