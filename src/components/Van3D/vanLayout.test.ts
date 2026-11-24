import { describe, expect, it } from 'vitest';
import { wheelArchBoxes } from '../../algorithm/packCargo';
import { VEHICLES } from '../../data/mockData';
import type { Vehicle } from '../../types';
import { unitBox, vanLayout } from './vanLayout';

const unit = (b: { x: number; y: number; z: number; l: number; w: number; h: number }) =>
  ({ x: b.x, y: b.y, z: b.z, length: b.l, width: b.w, height: b.h });

describe('3D van layout matches the packing model', () => {
  it.each(VEHICLES.map(v => [v.name, v] as [string, Vehicle]))('%s: arches drawn exactly where the algorithm sees them', (_name, v) => {
    const L = vanLayout(v);
    const algo = wheelArchBoxes(v);
    expect(L.arches).toHaveLength(algo.length);
    algo.forEach((box, i) => {
      // map the algorithm's arch box through the same transform as cargo
      const { center, size } = unitBox(L, unit(box));
      const a = L.arches[i];
      expect(a.x0).toBeCloseTo(center.x - size.x / 2, 9);
      expect(a.x1).toBeCloseTo(center.x + size.x / 2, 9);
      expect(a.z0).toBeCloseTo(center.z - size.z / 2, 9);
      expect(a.z1).toBeCloseTo(center.z + size.z / 2, 9);
      expect(a.h).toBeCloseTo(size.y, 9);
    });
  });

  it('puts the rear axle under the centre of the wheel arch', () => {
    for (const v of VEHICLES.filter(x => x.wheelArches?.length)) {
      const L = vanLayout(v), a = v.wheelArches![0];
      expect(L.RA).toBeCloseTo(L.X1 - (a.startX + a.endX) / 2000, 9);
      expect(L.FA).toBeGreaterThan(L.X1);         // front axle under the cab
    }
  });

  it('cargo at the front-left floor corner sits at the bulkhead, left wall, on the floor (no mirroring)', () => {
    const v = VEHICLES[VEHICLES.length - 1];
    const L = vanLayout(v);
    const { center, size } = unitBox(L, { x: 0, y: 0, z: 0, length: 1000, width: 500, height: 400 });
    expect(center.x + size.x / 2).toBeCloseTo(L.X1, 9);     // touches the bulkhead
    expect(center.z - size.z / 2).toBeCloseTo(-L.hwI, 9);   // left wall is −z (right side / sliding door is +z)
    expect(center.y - size.y / 2).toBeCloseTo(L.fy, 9);     // stands on the floor
    // a unit at the rear doors on the right wall
    const r = unitBox(L, { x: v.length - 300, y: v.width - 300, z: 0, length: 300, width: 300, height: 300 });
    expect(r.center.x - r.size.x / 2).toBeCloseTo(L.X0, 9);
    expect(r.center.z + r.size.z / 2).toBeCloseTo(L.hwI, 9);
  });

  it('cargo space fits inside the body', () => {
    for (const v of VEHICLES) {
      const L = vanLayout(v);
      expect(L.hwI).toBeLessThan(L.HWX);
      expect(L.fy + L.cargoH).toBeLessThan(L.H);
      expect(L.X1).toBeLessThan(L.LEN);
      expect(L.rearDoor.width / 2).toBeLessThanOrEqual(L.hwI);
    }
  });
});
