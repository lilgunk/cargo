// Saving and exporting loading plans (Z7).
//
// TODAY:  projects are stored per user in localStorage (works offline, GitHub Pages).
// FUTURE: swap the bodies of list/save for a backend call; the UI does not change.

import type { CargoItem, PackingResult, Vehicle } from '../types';
import type { PlanResult } from '../hooks/useCargoStore';

export const PROJECT_FORMAT = 'loadopti-project';
export const PROJECT_VERSION = 1;

export interface SavedProject {
  format: typeof PROJECT_FORMAT;
  version: typeof PROJECT_VERSION;
  id: string;
  name: string;
  savedAt: string;            // ISO date
  vehicle: Vehicle;           // snapshot — the file stays readable if the catalog changes
  cargoItems: CargoItem[];
  plan: (PackingResult & Pick<PlanResult, 'sortBy' | 'positions' | 'variantsTried'>) | null;
}

const key = (userId: string) => `lo_projects_${userId}`;

export const projectService = {
  list(userId: string): SavedProject[] {
    try {
      const all = JSON.parse(localStorage.getItem(key(userId)) ?? '[]') as SavedProject[];
      return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    } catch {
      return [];
    }
  },

  latest(userId: string): SavedProject | undefined {
    return this.list(userId)[0];
  },

  /** Inserts or replaces the project with the same id. */
  save(userId: string, project: SavedProject): void {
    const rest = this.list(userId).filter(p => p.id !== project.id);
    localStorage.setItem(key(userId), JSON.stringify([project, ...rest]));
  },
};

export function buildProject(id: string, name: string, vehicle: Vehicle, cargoItems: CargoItem[], plan: PlanResult | null, now = new Date()): SavedProject {
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id,
    name,
    savedAt: now.toISOString(),
    vehicle,
    cargoItems,
    plan: plan && { placed: plan.placed, unplaced: plan.unplaced, sortBy: plan.sortBy, positions: plan.positions, variantsTried: plan.variantsTried },
  };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Loading plan as CSV (semicolon-separated for Excel, mm and kg); unplaced units listed at the end. */
export function planToCsv(plan: PackingResult): string {
  const header = ['step', 'name', 'x_mm', 'y_mm', 'z_mm', 'length_mm', 'width_mm', 'height_mm', 'weight_kg', 'support', 'status'];
  const rows: (string | number)[][] = plan.placed.map(u => [
    u.step, u.name, u.x, u.y, u.z, u.length, u.width, u.height, u.weight, u.support, 'placed',
  ]);
  for (const u of plan.unplaced) rows.push(['', u.name, '', '', '', '', '', '', '', '', `unplaced: ${u.reason}`]);
  return [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export function slugify(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[łŁ]/g, 'l')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projekt';
}

export function download(filename: string, text: string, mime: string): void {
  // BOM so Excel opens Polish characters in CSV correctly
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + text : text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
