// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCargoStore } from '../hooks/useCargoStore';
import { SAMPLE_CARGO } from '../data/mockData';
import { buildProject, parseProject, planToCsv, projectService, slugify } from './projectService';

// In-memory stand-in for the Supabase `projects` table. Like Row Level Security,
// it shows and changes only the rows of the signed-in user (db.uid).
type Row = { id: string; user_id: string; name: string; data: unknown; saved_at: string };
const db = vi.hoisted(() => ({ rows: [] as Row[], uid: 'u1' }));

vi.mock('../lib/supabase', () => {
  const own = () => db.rows.filter(r => r.user_id === db.uid).sort((a, b) => b.saved_at.localeCompare(a.saved_at));
  // list(): the JSON-path columns of the real query, computed from the stored project
  const summary = (r: Row) => {
    const d = r.data as { vehicle: { name: string }; cargoItems: unknown[]; plan: { unplaced: unknown[] } | null };
    return { id: r.id, name: r.name, saved_at: r.saved_at, vehicle: d.vehicle.name, cargo: d.cargoItems, plan: d.plan?.unplaced ?? null };
  };
  return {
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
              maybeSingle: async () => ({ data: own()[0] ? { data: own()[0].data } : null, error: null }),
            }),
            then: (resolve: (v: unknown) => void) => resolve({ data: own().map(summary), error: null }),
          }),
          eq: (_: string, id: string) => ({
            maybeSingle: async () => {
              const r = own().find(x => x.id === id);
              return { data: r ? { data: r.data } : null, error: null };
            },
          }),
        }),
        delete: () => ({
          eq: async (_: string, id: string) => {
            db.rows = db.rows.filter(r => !(r.id === id && r.user_id === db.uid));
            return { error: null };
          },
        }),
      }),
    },
  };
});

beforeEach(() => { db.rows = []; db.uid = 'u1'; });

describe('projectService', () => {
  it('returns the newest own project and replaces a project with the same id', async () => {
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
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
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    expect(s.plan?.placed.length).toBeGreaterThan(0);
    await projectService.save(buildProject('p1', 'Test', s.vehicle, s.cargoItems, s.plan));

    const saved = await projectService.latest();
    const fresh = renderHook(() => useCargoStore(SAMPLE_CARGO));
    act(() => fresh.result.current.loadProject(saved!));
    expect(fresh.result.current.placed).toEqual(s.placed);
    expect(fresh.result.current.plan?.violations).toEqual([]);
    expect(fresh.result.current.step).toBe(s.placed.length);
  });

  it('lists own projects without their plans, opens one by id and deletes it', async () => {
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    await projectService.save(buildProject('p1', 'Z planem', s.vehicle, s.cargoItems, s.plan, new Date('2026-11-01')));
    await projectService.save(buildProject('p2', 'Bez planu', s.vehicle, s.cargoItems, null, new Date('2026-11-02')));
    db.uid = 'u2';
    await projectService.save(buildProject('p9', 'Cudzy', s.vehicle, s.cargoItems, null));
    db.uid = 'u1';

    const list = await projectService.list();
    expect(list.map(p => [p.name, p.planned])).toEqual([['Bez planu', false], ['Z planem', true]]);
    expect(list[0]).toMatchObject({ vehicleName: s.vehicle.name, units: 14 });
    expect((await projectService.get('p1'))?.plan?.placed.length).toBe(s.placed.length);
    expect(await projectService.get('p9')).toBeUndefined();

    await projectService.remove('p2');
    await projectService.remove('p9'); // someone else's: nothing happens
    expect((await projectService.list()).map(p => p.id)).toEqual(['p1']);
    expect(db.rows).toHaveLength(2);
  });

  it('imports an exported project file and re-checks its plan', async () => {
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    const file = JSON.stringify(buildProject('p1', 'Eksport', s.vehicle, s.cargoItems, s.plan));
    const p = parseProject(file);
    expect(p.name).toBe('Eksport');
    expect(p.cargoItems).toHaveLength(s.cargoItems.length);

    const fresh = renderHook(() => useCargoStore());
    act(() => fresh.result.current.loadProject(p));
    expect(fresh.result.current.plan?.violations).toEqual([]);
  });

  it('rejects files that are not projects and drops a malformed plan', () => {
    expect(() => parseProject('not json')).toThrow();
    expect(() => parseProject(JSON.stringify({ format: 'other' }))).toThrow();
    const base = buildProject('p1', 'X', { id: 'v', name: 'V', length: 3000, width: 1600, height: 1800, maxWeight: 900, wheelArches: [] },
      [{ id: 'a', name: 'A', length: 500, width: 400, height: 300, weight: 5, quantity: 2, color: 'red;}', rotation: 'any', stackable: true }], null);
    expect(() => parseProject(JSON.stringify({ ...base, cargoItems: [{ ...base.cargoItems[0], quantity: -1 }] }))).toThrow();
    const p = parseProject(JSON.stringify({ ...base, plan: { placed: [{ cargoId: 'a', x: 'evil' }], unplaced: [] } }));
    expect(p.plan).toBeNull();
    expect(p.cargoItems[0].color).toBe('#818cf8'); // not a hex colour → default
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
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
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
