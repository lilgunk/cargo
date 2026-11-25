import { describe, expect, it } from 'vitest';
import type { PlacedUnit, Vehicle } from '../types';
import { weightDistribution } from './weightDistribution';

const van: Vehicle = { id: 'v', name: 'Test', length: 4000, width: 2000, height: 2000, maxWeight: 1500, wheelArches: [] };
const unit = (o: Partial<PlacedUnit>): PlacedUnit => ({
  step: 1, cargoId: 'a', name: 'a', color: '#888', weight: 10,
  x: 0, y: 0, z: 0, length: 500, width: 500, height: 500, support: 'floor', ...o,
});

describe('weightDistribution', () => {
  it('reports a neutral split for an empty plan', () => {
    const d = weightDistribution([], van);
    expect(d.centre).toBeNull();
    expect(d.leftShare).toBe(0.5);
    expect(d.lateralImbalance).toBe(false);
  });

  it('computes the centre of gravity as the weighted mean of box centres', () => {
    const d = weightDistribution([unit({ weight: 30 }), unit({ x: 1000, weight: 10 })], van);
    expect(d.total).toBe(40);
    expect(d.centre).toEqual({ x: (30 * 250 + 10 * 1250) / 40, y: 250, z: 250 });
  });

  it('splits a box that crosses the centre line in proportion to its width', () => {
    // 1000 mm wide box at y = 500 → half of it left of the 1000 mm centre line
    const d = weightDistribution([unit({ y: 500, width: 1000, weight: 20 })], van);
    expect(d.leftShare).toBeCloseTo(0.5);
    expect(d.lateralImbalance).toBe(false);
  });

  it('flags a load leaning to one side and a high centre of gravity', () => {
    const d = weightDistribution([unit({ weight: 80 }), unit({ y: 1500, weight: 20 }), unit({ z: 1500, weight: 200 })], van);
    expect(d.leftShare).toBeCloseTo(280 / 300);
    expect(d.lateralImbalance).toBe(true);
    expect(d.highCentre).toBe(true);
  });

  it('measures the front share from the cab', () => {
    const d = weightDistribution([unit({ x: 0, weight: 30 }), unit({ x: 3000, weight: 10 })], van);
    expect(d.frontShare).toBeCloseTo(0.75);
  });
});
