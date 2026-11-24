// Saving and exporting loading plans (Z7).
//
// Projects are stored in Supabase (table public.projects). Row Level Security lets each
// user read and write only their own rows, so no user id is passed from the browser.

import type { CargoItem, PackingResult, Vehicle } from '../types';
import type { PlanResult } from '../hooks/useCargoStore';
import { supabase } from '../lib/supabase';

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

export const projectService = {
  /** The signed-in user's most recently saved project. */
  async latest(): Promise<SavedProject | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select('data')
      .order('saved_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.data as SavedProject | undefined) ?? undefined;
  },

  /** Inserts or replaces the project with the same id (owner is set by the database). */
  async save(project: SavedProject): Promise<void> {
    const { error } = await supabase.from('projects').upsert({
      id: project.id,
      name: project.name.trim().slice(0, 120) || 'Projekt',
      data: project,
      saved_at: project.savedAt,
    });
    if (error) throw error;
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
