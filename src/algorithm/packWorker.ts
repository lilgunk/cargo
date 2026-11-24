/// <reference lib="webworker" />
// Runs the packing portfolio and the verifier off the main thread so the UI
// stays responsive for large cargo lists.
import type { CargoItem, Vehicle } from '../types';
import { packCargoBest } from './packCargo';
import { verifyPacking } from './verifyPacking';

export interface PackRequest { id: number; items: CargoItem[]; vehicle: Vehicle; supportRatio: number }

self.onmessage = (e: MessageEvent<PackRequest>) => {
  const { id, items, vehicle, supportRatio } = e.data;
  const t0 = performance.now();
  const best = packCargoBest(items, vehicle, supportRatio);
  const elapsedMs = performance.now() - t0;
  const violations = verifyPacking(items, vehicle, best.placed, supportRatio);
  self.postMessage({ id, plan: { ...best, violations, elapsedMs } });
};
