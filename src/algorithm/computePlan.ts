// Computes a plan in a Web Worker when available (browser), otherwise in place
// (tests / environments without workers). Same result either way.
import type { CargoItem, Vehicle } from '../types';
import { packCargoBest, type BestPlan } from './packCargo';
import { verifyPacking, type Violation } from './verifyPacking';
import type { PackRequest } from './packWorker';

export interface PlanResult extends BestPlan {
  violations: Violation[];
  elapsedMs: number;
}

export function computePlanSync(items: CargoItem[], vehicle: Vehicle, supportRatio: number): PlanResult {
  const t0 = performance.now();
  const best = packCargoBest(items, vehicle, supportRatio);
  const elapsedMs = performance.now() - t0;
  return { ...best, violations: verifyPacking(items, vehicle, best.placed, supportRatio), elapsedMs };
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (p: PlanResult) => void>();

export function computePlan(items: CargoItem[], vehicle: Vehicle, supportRatio: number): Promise<PlanResult> {
  if (typeof Worker === 'undefined') return Promise.resolve(computePlanSync(items, vehicle, supportRatio));
  if (!worker) {
    worker = new Worker(new URL('./packWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; plan: PlanResult }>) => {
      pending.get(e.data.id)?.(e.data.plan);
      pending.delete(e.data.id);
    };
  }
  const id = nextId++;
  return new Promise(resolve => {
    pending.set(id, resolve);
    worker!.postMessage({ id, items, vehicle, supportRatio } satisfies PackRequest);
  });
}
