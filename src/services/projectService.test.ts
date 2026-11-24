// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCargoStore } from '../hooks/useCargoStore';
import { buildProject, planToCsv, projectService, slugify } from './projectService';

beforeEach(() => localStorage.clear());

describe('projectService', () => {
  it('saves per user, newest first, and replaces a project with the same id', () => {
    const { result } = renderHook(() => useCargoStore());
    const s = result.current;
    projectService.save('u1', buildProject('p1', 'Dostawa A', s.vehicle, s.cargoItems, null, new Date('2026-11-01')));
    projectService.save('u1', buildProject('p2', 'Dostawa B', s.vehicle, s.cargoItems, null, new Date('2026-11-02')));
    projectService.save('u1', buildProject('p1', 'Dostawa A v2', s.vehicle, s.cargoItems, null, new Date('2026-11-03')));
    projectService.save('u2', buildProject('p9', 'Cudzy', s.vehicle, s.cargoItems, null));
    expect(projectService.list('u1').map(p => p.name)).toEqual(['Dostawa A v2', 'Dostawa B']);
    expect(projectService.list('u2')).toHaveLength(1);
    expect(projectService.latest('u3')).toBeUndefined();
  });

  it('round-trips a computed plan; the restored plan passes the verifier', async () => {
    const { result } = renderHook(() => useCargoStore());
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    expect(s.plan?.placed.length).toBeGreaterThan(0);
    projectService.save('u1', buildProject('p1', 'Test', s.vehicle, s.cargoItems, s.plan));

    const fresh = renderHook(() => useCargoStore());
    act(() => fresh.result.current.loadProject(projectService.latest('u1')!));
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
