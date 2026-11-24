// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCargoStore } from '../hooks/useCargoStore';
import { buildProject, planToCsv, projectService, slugify } from './projectService';

// In-memory stand-in for the Supabase `projects` table. Like Row Level Security,
// it shows and changes only the rows of the signed-in user (db.uid).
type Row = { id: string; user_id: string; name: string; data: unknown; saved_at: string };
const db = vi.hoisted(() => ({ rows: [] as Row[], uid: 'u1' }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      upsert: async (row: Omit<Row, 'user_id'>) => {
        const existing = db.rows.find(r => r.id === row.id);
        if (existing && existing.user_id !== db.uid) return { error: { message: 'row-level security' } };
        if (existing) Object.assign(existing, row);
        else db.rows.push({ ...row, user_id: db.uid });
        return { error: null };
      },
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => {
              const own = db.rows.filter(r => r.user_id === db.uid).sort((a, b) => b.saved_at.localeCompare(a.saved_at));
              return { data: own[0] ? { data: own[0].data } : null, error: null };
            },
          }),
        }),
      }),
    }),
  },
}));

beforeEach(() => { db.rows = []; db.uid = 'u1'; });

describe('projectService', () => {
  it('returns the newest own project and replaces a project with the same id', async () => {
    const { result } = renderHook(() => useCargoStore());
    const s = result.current;
    await projectService.save(buildProject('p1', 'Dostawa A', s.vehicle, s.cargoItems, null, new Date('2026-11-01')));
    await projectService.save(buildProject('p2', 'Dostawa B', s.vehicle, s.cargoItems, null, new Date('2026-11-02')));
    await projectService.save(buildProject('p1', 'Dostawa A v2', s.vehicle, s.cargoItems, null, new Date('2026-11-03')));
    expect(db.rows).toHaveLength(2);
    expect((await projectService.latest())?.name).toBe('Dostawa A v2');

    db.uid = 'u2';
    expect(await projectService.latest()).toBeUndefined();
    await expect(projectService.save(buildProject('p1', 'Cudzy', s.vehicle, s.cargoItems, null))).rejects.toBeTruthy();
  });

  it('round-trips a computed plan; the restored plan passes the verifier', async () => {
    const { result } = renderHook(() => useCargoStore());
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    expect(s.plan?.placed.length).toBeGreaterThan(0);
    await projectService.save(buildProject('p1', 'Test', s.vehicle, s.cargoItems, s.plan));

    const saved = await projectService.latest();
    const fresh = renderHook(() => useCargoStore());
    act(() => fresh.result.current.loadProject(saved!));
    expect(fresh.result.current.placed).toEqual(s.placed);
    expect(fresh.result.current.plan?.violations).toEqual([]);
    expect(fresh.result.current.step).toBe(s.placed.length);
  });

  it('exports a CSV with placed and unplaced rows', () => {
    const csv = planToCsv({
      placed: [{ step: 1, cargoId: 'a', name: 'Szafa; duża', color: '#000', weight: 80, x: 0, y: 0, z: 0, length: 600, width: 500, height: 1800, support: 'floor' }],
      unplaced: [{ cargoId: 'b', name: 'Pianino', reason: 'DOOR_OPENING' }],
    });
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('step;name;x_mm;y_mm;z_mm;length_mm;width_mm;height_mm;weight_kg;support;status');
    expect(lines[1]).toBe('1;"Szafa; duża";0;0;0;600;500;1800;80;floor;placed');
    expect(lines[2]).toContain('unplaced: DOOR_OPENING');
    expect(slugify('Dostawa AGD – Łódź')).toBe('dostawa-agd-lodz');
  });
});

describe('useCargoStore', () => {
  it('gives unique ids to items added in the same moment (verifier stays at 0 violations)', async () => {
    const { result } = renderHook(() => useCargoStore());
    act(() => {
      result.current.clearAll();
      for (let i = 0; i < 4; i++) {
        result.current.addCargo({ name: `x${i}`, length: 400 + i * 100, width: 300, height: 300, weight: 5, quantity: 2, rotation: 'any', stackable: true });
      }
    });
    const ids = result.current.cargoItems.map(c => c.id);
    expect(new Set(ids).size).toBe(4);
    await act(async () => { await result.current.optimize(); });
    expect(result.current.plan?.violations).toEqual([]);
    expect(result.current.placed).toHaveLength(8);
  });
});
