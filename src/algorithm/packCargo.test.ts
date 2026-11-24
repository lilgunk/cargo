import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { CargoItem, Vehicle } from '../types';
import { allowedDims, intersects, packCargo, packCargoBest, planQuality, portfolio } from './packCargo';
import { verifyPacking } from './verifyPacking';

const van = (o: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v', name: 'Test', length: 3000, width: 1600, height: 1800, maxWeight: 1500, wheelArches: [], ...o,
});
const item = (o: Partial<CargoItem> & { id: string }): CargoItem => ({
  name: o.id, length: 500, width: 500, height: 500, weight: 10, quantity: 1, color: '#888', rotation: 'horizontal', stackable: true, ...o,
});
const run = (v: Vehicle, items: CargoItem[]) => {
  const r = packCargo(items, v);
  return { ...r, violations: verifyPacking(items, v, r.placed, 0.75) };
};

describe('geometry', () => {
  it('touching boxes do not intersect', () => {
    expect(intersects({ x: 0, y: 0, z: 0, l: 10, w: 10, h: 10 }, { x: 10, y: 0, z: 0, l: 10, w: 10, h: 10 })).toBe(false);
    expect(intersects({ x: 0, y: 0, z: 0, l: 10, w: 10, h: 10 }, { x: 9, y: 9, z: 9, l: 10, w: 10, h: 10 })).toBe(true);
  });
  it('rotation rules', () => {
    expect(allowedDims({ length: 3, width: 2, height: 1, rotation: 'none' })).toHaveLength(1);
    expect(allowedDims({ length: 3, width: 2, height: 1, rotation: 'horizontal' }).every(d => d.h === 1)).toBe(true);
    expect(allowedDims({ length: 3, width: 2, height: 1, rotation: 'any' })).toHaveLength(6);
    expect(allowedDims({ length: 5, width: 5, height: 5, rotation: 'any' })).toHaveLength(1);
  });
});

describe('placement', () => {
  it('fills a cube exactly, numbering steps 1..n', () => {
    const v = van({ length: 1000, width: 1000, height: 1000 });
    const r = run(v, [item({ id: 'c', quantity: 8 })]);
    expect(r.violations).toEqual([]);
    expect(r.placed.map(p => p.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(r.unplaced).toEqual([]);
  });

  it('places between the arches and on top of them', () => {
    const v = van({ length: 1000, width: 1600, wheelArches: [{ startX: 0, endX: 1000, intrusionPerSide: 300, heightFromFloor: 300 }] });
    const r = run(v, [
      item({ id: 'filler', length: 1000, width: 1000, height: 300, rotation: 'none', weight: 50 }),
      item({ id: 'plate', length: 1000, width: 1600, height: 100, rotation: 'none', weight: 20 }),
    ]);
    expect(r.violations).toEqual([]);
    expect(r.placed.find(p => p.cargoId === 'filler')).toMatchObject({ y: 300, z: 0, support: 'between_arches' });
    expect(r.placed.find(p => p.cargoId === 'plate')).toMatchObject({ y: 0, z: 300, support: 'on_arch' });
  });

  it('never puts cargo into an arch', () => {
    const v = van({ length: 1000, width: 1600, wheelArches: [{ startX: 0, endX: 1000, intrusionPerSide: 300, heightFromFloor: 300 }] });
    const r = run(v, [item({ id: 'wide', length: 500, width: 1200, height: 200, rotation: 'none' })]);
    expect(r.placed).toHaveLength(0);
    expect(r.unplaced[0].reason).toBe('INSUFFICIENT_SUPPORT');
  });

  it('turns an item that may rotate so it passes the door', () => {
    const v = van({ length: 1000, width: 1000, height: 1000, rearDoor: { width: 800, height: 800 } });
    const r = run(v, [item({ id: 'x', length: 100, width: 900, height: 500, rotation: 'horizontal' })]);
    expect(r.violations).toEqual([]);
    expect(r.placed[0]).toMatchObject({ length: 900, width: 100 });
  });
});

describe('reasons', () => {
  const small = van({ length: 1000, width: 1000, height: 1000, rearDoor: { width: 800, height: 800 }, maxWeight: 100 });

  it('TOO_LARGE', () => {
    expect(run(small, [item({ id: 'x', length: 1100, width: 100, height: 100, rotation: 'any' })]).unplaced[0].reason).toBe('TOO_LARGE');
  });
  it('DOOR_OPENING', () => {
    expect(run(small, [item({ id: 'x', length: 100, width: 900, height: 900, rotation: 'horizontal' })]).unplaced[0].reason).toBe('DOOR_OPENING');
  });
  it('PAYLOAD_EXCEEDED', () => {
    const r = run(small, [item({ id: 'x', weight: 60, quantity: 2, length: 100, width: 100, height: 100 })]);
    expect(r.placed).toHaveLength(1);
    expect(r.unplaced[0].reason).toBe('PAYLOAD_EXCEEDED');
  });
  it('NO_SPACE', () => {
    const r = run(small, [item({ id: 'x', length: 1000, width: 800, height: 800, weight: 1, quantity: 2, rotation: 'none' })]);
    expect(r.unplaced[0].reason).toBe('NO_SPACE');
  });
  it('NOT_STACKABLE', () => {
    const r = run(small, [
      item({ id: 'base', length: 1000, width: 800, height: 450, weight: 5, rotation: 'none', stackable: false }),
      item({ id: 'top', length: 1000, width: 800, height: 400, weight: 5, rotation: 'none' }),
    ]);
    expect(r.unplaced[0]).toMatchObject({ cargoId: 'top', reason: 'NOT_STACKABLE' });
  });
});

describe('determinism', () => {
  it('same input → same plan', () => {
    const items = [item({ id: 'a', quantity: 5, rotation: 'any', length: 400, width: 300, height: 200 }), item({ id: 'b', quantity: 3 })];
    expect(packCargo(items, van())).toEqual(packCargo(items, van()));
  });
});

describe('verifier catches broken plans', () => {
  const v = van({ length: 1000, width: 1000, height: 1000, wheelArches: [{ startX: 500, endX: 1000, intrusionPerSide: 200, heightFromFloor: 200 }] });
  const items = [item({ id: 'a', length: 400, width: 400, height: 400, rotation: 'none', quantity: 2 })];
  const unit = (o: Partial<import('../types').PlacedUnit>) => ({
    step: 1, cargoId: 'a', name: 'a', color: '#888', weight: 10, x: 0, y: 0, z: 0, length: 400, width: 400, height: 400, support: 'floor' as const, ...o,
  });
  const codes = (ps: ReturnType<typeof unit>[]) => verifyPacking(items, v, ps, 0.75).map(x => x.code);
  it('collisions, arches, floating, bounds', () => {
    expect(codes([unit({}), unit({ step: 2, x: 100 })])).toContain('CARGO_COLLISION');
    expect(codes([unit({ x: 500 })])).toContain('ARCH_COLLISION');
    expect(codes([unit({ z: 100 })])).toContain('NO_SUPPORT');
    expect(codes([unit({ x: 700, y: 300 })])).toContain('OUT_OF_BOUNDS');
    expect(codes([unit({ width: 300 })])).toContain('BAD_ORIENTATION');
  });
});

// ── property tests: random vans and cargo, any result must pass the verifier ──

const vanArb = fc.record({
  L: fc.integer({ min: 800, max: 4500 }), W: fc.integer({ min: 800, max: 2000 }), H: fc.integer({ min: 600, max: 2200 }),
  payload: fc.integer({ min: 100, max: 3000 }), arch: fc.boolean(), door: fc.boolean(),
}).map(({ L, W, H, payload, arch, door }): Vehicle => van({
  length: L, width: W, height: H, maxWeight: payload,
  wheelArches: arch ? [{ startX: Math.floor(L * 0.5), endX: Math.floor(L * 0.8), intrusionPerSide: Math.floor(W * 0.15), heightFromFloor: Math.floor(H * 0.15) }] : [],
  rearDoor: door ? { width: Math.floor(W * 0.85), height: Math.floor(H * 0.9) } : undefined,
}));

const itemsArb = fc.array(fc.record({
  length: fc.integer({ min: 50, max: 1600 }), width: fc.integer({ min: 50, max: 1200 }), height: fc.integer({ min: 50, max: 1200 }),
  weight: fc.integer({ min: 1, max: 300 }), quantity: fc.integer({ min: 1, max: 6 }),
  rotation: fc.constantFrom('none' as const, 'horizontal' as const, 'any' as const), stackable: fc.boolean(),
  floorOnly: fc.boolean(),
}), { maxLength: 10 }).map(rs => rs.map((r, i) => item({ id: `i${i}`, ...r })));

describe('properties', () => {
  it('every plan passes the independent verifier and accounts for every unit once', () => {
    fc.assert(fc.property(vanArb, itemsArb, (v, items) => {
      const r = packCargo(items, v);
      expect(verifyPacking(items, v, r.placed, 0.75)).toEqual([]);
      expect(r.placed.length + r.unplaced.length).toBe(items.reduce((s, i) => s + i.quantity, 0));
    }), { numRuns: 300 });
  }, 120_000);
});

describe('best-of portfolio', () => {
  it('is never worse than the default single run, and always valid', () => {
    fc.assert(fc.property(vanArb, itemsArb, (v, items) => {
      const best = packCargoBest(items, v);
      const single = packCargo(items, v);
      expect(verifyPacking(items, v, best.placed, 0.75)).toEqual([]);
      expect(planQuality(best).volume).toBeGreaterThanOrEqual(planQuality(single).volume);
      expect(best.variantsTried).toBe(portfolio().length);
    }), { numRuns: 150 });
  }, 120_000);

  it('is deterministic', () => {
    const items = [item({ id: 'a', quantity: 7, rotation: 'any', length: 600, width: 400, height: 300 }), item({ id: 'b', quantity: 4, length: 1200, width: 800, height: 900 })];
    expect(packCargoBest(items, van())).toEqual(packCargoBest(items, van()));
  });
});

// ── reference: identical boxes in an empty van ───────────────────────────────

/** Units that fit as a simple grid in one orientation — a known feasible lower bound of the optimum. */
function gridBound(v: Vehicle, it: CargoItem): number {
  return Math.max(0, ...allowedDims(it).map(d =>
    Math.floor(v.length / d.l) * Math.floor(v.width / d.w) * Math.floor(v.height / d.h)));
}

describe('reference: never worse than a simple grid of identical boxes', () => {
  it('places at least the grid bound (random sizes and rotation rules)', () => {
    fc.assert(fc.property(
      fc.integer({ min: 150, max: 1200 }), fc.integer({ min: 150, max: 1000 }), fc.integer({ min: 150, max: 1000 }),
      fc.constantFrom('none' as const, 'horizontal' as const, 'any' as const),
      (l, w, h, rotation) => {
        const v = van({ length: 4325, width: 1762, height: 1900, maxWeight: 1e9 });
        const box = item({ id: 'b', length: l, width: w, height: h, rotation, weight: 1 });
        const bound = gridBound(v, box);
        fc.pre(bound > 0 && bound <= 300);
        const r = packCargoBest([{ ...box, quantity: bound + 3 }], v);
        expect(r.placed.length).toBeGreaterThanOrEqual(bound);
        expect(verifyPacking([{ ...box, quantity: bound + 3 }], v, r.placed, 0.75)).toEqual([]);
      }), { numRuns: 40 });
  }, 300_000);

  it('the case that used to lose 6 boxes (822×702×489): 36 placed', () => {
    const v = van({ length: 4325, width: 1762, height: 1900, maxWeight: 1e9 });
    const box = item({ id: 'b', length: 822, width: 702, height: 489, rotation: 'any', quantity: 41 });
    expect(packCargoBest([box], v).placed.length).toBeGreaterThanOrEqual(36);
  });
});

// ── non-standard (oversized / heavy) cargo in a Sprinter L3H2 ───────────────

describe('non-standard cargo', () => {
  const sprinter = van({
    length: 4325, width: 1762, height: 1900, maxWeight: 1100, rearDoor: { width: 1540, height: 1820 },
    wheelArches: [{ heightFromFloor: 270, intrusionPerSide: 265, startX: 2600, endX: 4000 }],
  });
  const one = (o: Partial<CargoItem>) => packCargoBest([item({ id: 'x', ...o })], sprinter);

  it('a pipe longer than the cargo space is TOO_LARGE; a 4.3 m pipe lies lengthwise between the arches', () => {
    expect(one({ length: 4400, width: 150, height: 150, rotation: 'any' }).unplaced[0].reason).toBe('TOO_LARGE');
    expect(one({ length: 150, width: 4300, height: 150, rotation: 'any' }).placed[0]).toMatchObject({ length: 4300, z: 0, support: 'between_arches' });
  });

  it('a wardrobe taller than the door cannot go in upright, but can lying down', () => {
    expect(one({ length: 600, width: 1000, height: 1850, rotation: 'horizontal' }).unplaced[0].reason).toBe('DOOR_OPENING');
    expect(one({ length: 600, width: 1000, height: 1850, rotation: 'any' }).placed[0].height).toBeLessThanOrEqual(1820);
  });

  it('a board wider than the door goes in on its edge when allowed', () => {
    expect(one({ length: 2500, width: 1700, height: 30, rotation: 'horizontal' }).unplaced[0].reason).toBe('DOOR_OPENING');
    expect(one({ length: 2500, width: 1700, height: 30, rotation: 'any' }).placed[0].width).toBe(30);
  });

  it('pallets stand on the floor, nothing on them, payload respected', () => {
    const pallets = item({ id: 'p', length: 1200, width: 800, height: 1500, weight: 400, quantity: 3, rotation: 'horizontal', stackable: false, floorOnly: true });
    const r = packCargoBest([pallets], sprinter);
    expect(r.placed).toHaveLength(2);
    expect(r.placed.every(p => p.z === 0)).toBe(true);
    expect(r.unplaced[0].reason).toBe('PAYLOAD_EXCEEDED');
  });

  it('floor-only cargo is never stacked; when the floor is full the reason says so', () => {
    const v = van({ length: 1000, width: 1000, height: 2000, maxWeight: 1e9 });
    const heavy = item({ id: 'h', length: 1000, width: 1000, height: 500, quantity: 2, rotation: 'none', floorOnly: true });
    const r = packCargoBest([heavy], v);
    expect(r.placed).toHaveLength(1);
    expect(r.unplaced[0].reason).toBe('NO_FLOOR_SPACE');
  });

  it('heavy floor-only items go on the floor first, light boxes on top of them', () => {
    const fridge = item({ id: 'f', length: 700, width: 700, height: 1800, weight: 90, quantity: 3, rotation: 'horizontal', stackable: false, floorOnly: true });
    const boxes = item({ id: 'b', length: 600, width: 400, height: 400, weight: 10, quantity: 20 });
    const r = packCargoBest([boxes, fridge], sprinter);
    expect(r.unplaced).toEqual([]);
    expect(r.placed.filter(p => p.cargoId === 'f').every(p => p.z === 0)).toBe(true);
    expect(verifyPacking([boxes, fridge], sprinter, r.placed, 0.75)).toEqual([]);
  });
});
