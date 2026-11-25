import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { CargoItem, Vehicle } from '../types';
import { allowedDims, intersects, MAX_UNITS, packCargo, packCargoBest, planQuality, portfolio } from './packCargo';
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

describe('time budget', () => {
  it('with no time left still returns one complete, valid variant', () => {
    const items = [item({ id: 'a', quantity: 30 }), item({ id: 'b', length: 700, width: 400, height: 300, quantity: 10 })];
    const r = packCargoBest(items, van(), 0.75, 0);
    expect(r.variantsTried).toBe(1);
    expect(r.placed.length + r.unplaced.length).toBe(40);
    expect(verifyPacking(items, van(), r.placed, 0.75)).toEqual([]);
  });

  it('a run past its deadline is marked aborted', () => {
    const r = packCargo([item({ id: 'a', quantity: 5 })], van(), { deadline: performance.now() - 1 });
    expect(r.aborted).toBe(true);
  });

  it('keeps the limit at a size the planner computes in seconds', () => {
    expect(MAX_UNITS).toBeLessThanOrEqual(1000);
  });
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

// ── "do not stack" cargo goes on top; loading sequence goes wall by wall ─────

describe('author feedback (2026-11-24)', () => {
  it('"do not stack" cargo is put on top of the stacks, not on the floor wasting the space above it', () => {
    const v = van({ length: 2000, width: 1000, height: 1000, maxWeight: 1e9 });
    // listed first on purpose: before the fix it took the floor
    const fragile = item({ id: 'fragile', length: 500, width: 1000, height: 500, quantity: 2, rotation: 'none', stackable: false });
    const boxes = item({ id: 'box', length: 500, width: 1000, height: 500, quantity: 4, rotation: 'none' });
    const r = packCargoBest([fragile, boxes], v);
    expect(r.unplaced).toEqual([]);
    expect(r.placed.filter(p => p.cargoId === 'fragile').every(p => p.z === 500)).toBe(true);
    expect(verifyPacking([fragile, boxes], v, r.placed, 0.75)).toEqual([]);
  });

  it('the Sprinter case from the screenshot: the non-stackable Box C ends up on top', () => {
    const sprinter = van({ length: 4325, width: 1762, height: 1900, maxWeight: 1100, rearDoor: { width: 1540, height: 1820 },
      wheelArches: [{ heightFromFloor: 270, intrusionPerSide: 265, startX: 2600, endX: 4000 }] });
    const items = [
      item({ id: 'A', length: 600, width: 400, height: 300, weight: 15, quantity: 8, rotation: 'any' }),
      item({ id: 'B', length: 800, width: 600, height: 400, weight: 25, quantity: 4, rotation: 'horizontal' }),
      item({ id: 'C', length: 1000, width: 500, height: 500, weight: 30, quantity: 2, rotation: 'horizontal', stackable: false }),
    ];
    const r = packCargoBest(items, sprinter);
    expect(r.unplaced).toEqual([]);
    expect(r.placed.filter(p => p.cargoId === 'C').every(p => p.z > 0)).toBe(true);
    expect(verifyPacking(items, sprinter, r.placed, 0.75)).toEqual([]);
  });

  it('loading steps build walls from the cab: a column is finished before moving towards the doors', () => {
    const v = van({ length: 1000, width: 500, height: 1000, maxWeight: 1e9 });
    const r = packCargoBest([item({ id: 'b', quantity: 4, rotation: 'none' })], v);
    expect(r.placed.map(p => [p.x, p.z])).toEqual([[0, 0], [0, 500], [500, 0], [500, 500]]);
  });

  it('every unit is loaded after everything it stands on (random plans)', () => {
    fc.assert(fc.property(vanArb, itemsArb, (v, items) => {
      const r = packCargoBest(items, v);
      for (const u of r.placed) {
        for (const s of r.placed) {
          const touches = s.z + s.height === u.z &&
            Math.min(u.x + u.length, s.x + s.length) > Math.max(u.x, s.x) &&
            Math.min(u.y + u.width, s.y + s.width) > Math.max(u.y, s.y);
          if (touches) expect(s.step).toBeLessThan(u.step);
        }
      }
    }), { numRuns: 60 });
  }, 300_000);
});

describe('delivery stops', () => {
  const box = (id: string, stop: number) => item({ id, length: 1000, width: 1000, height: 500, rotation: 'none', stop });

  it('puts cargo for a later stop deeper (at the cab) and loads it first', () => {
    const v = van({ length: 2000, width: 1000, height: 500 });
    const items = [box('first', 1), box('last', 2)];
    for (const r of [packCargo(items, v), packCargoBest(items, v)]) {
      expect(verifyPacking(items, v, r.placed, 0.75)).toEqual([]);
      const at = Object.fromEntries(r.placed.map(p => [p.cargoId, p]));
      expect(at.last).toMatchObject({ x: 0, step: 1 });
      expect(at.first).toMatchObject({ x: 1000, step: 2 });
    }
  });

  it('never puts cargo for a later stop in front of or on top of earlier deliveries', () => {
    fc.assert(fc.property(vanArb, itemsArb, (v, list) => {
      const items = list.map((it, i) => ({ ...it, stop: 1 + (i % 3) }));
      expect(verifyPacking(items, v, packCargoBest(items, v).placed, 0.75)).toEqual([]);
    }), { numRuns: 25 });
  });

  it('the verifier flags a buried delivery', () => {
    const v = van({ length: 2000, width: 1000, height: 1000 });
    const items = [box('first', 1), box('last', 2)];
    const unit = (cargoId: string, step: number, o: object) => ({
      step, cargoId, name: cargoId, color: '#888', weight: 10, x: 0, y: 0, z: 0, length: 1000, width: 1000, height: 500, support: 'floor' as const, ...o,
    });
    const codes = (ps: ReturnType<typeof unit>[]) => verifyPacking(items, v, ps, 0.75).map(x => x.code);
    expect(codes([unit('first', 1, {}), unit('last', 2, { x: 1000 })])).toContain('DELIVERY_ORDER');  // in front of it
    expect(codes([unit('first', 1, {}), unit('last', 2, { z: 500, support: 'stacked' })])).toContain('DELIVERY_ORDER'); // on top
    expect(codes([unit('last', 1, {}), unit('first', 2, { x: 1000 })])).toEqual([]);
  });
});

describe('load stability', () => {
  it('prefers low layers over a tall free-standing wall at the cab', () => {
    const v = van({ length: 4300, width: 1760, height: 1900 });
    const items = [item({ id: 'k', length: 600, width: 400, height: 300, weight: 15, quantity: 30 })];
    const best = packCargoBest(items, v);
    expect(best.placed).toHaveLength(30);
    expect(Math.max(...best.placed.map(u => u.z + u.height))).toBeLessThanOrEqual(900);
    expect(planQuality(best, v.height).comZ).toBeLessThan(0.25 * v.height);
  });
});
