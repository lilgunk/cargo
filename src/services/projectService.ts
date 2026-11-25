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

/** One row of the project list — read without the (possibly large) saved plan. */
export interface ProjectSummary {
  id: string;
  name: string;
  savedAt: string;
  vehicleName: string;
  units: number;       // cargo units in the project
  planned: boolean;    // a computed plan was saved with it
}

interface SummaryRow {
  id: string; name: string; saved_at: string;
  vehicle: string | null; cargo: { quantity?: number }[] | null; plan: unknown;
}

export const projectService = {
  /** The signed-in user's projects, newest first (JSON paths keep the response small). */
  async list(): Promise<ProjectSummary[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, saved_at, vehicle:data->vehicle->>name, cargo:data->cargoItems, plan:data->plan->unplaced')
      .order('saved_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as SummaryRow[]).map(r => ({
      id: r.id,
      name: r.name,
      savedAt: r.saved_at,
      vehicleName: r.vehicle ?? '',
      units: (r.cargo ?? []).reduce((s, c) => s + (Number(c.quantity) || 0), 0),
      planned: r.plan != null,
    }));
  },

  async get(id: string): Promise<SavedProject | undefined> {
    const { data, error } = await supabase.from('projects').select('data').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data?.data as SavedProject | undefined) ?? undefined;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

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

// ── import (.loadopti.json) ──────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const nonNegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const ROTATIONS = ['none', 'horizontal', 'any'];

/**
 * Reads an exported project file. Throws on anything that is not a LoadOpti
 * project; a stored plan with malformed units is dropped (it can be recomputed),
 * and a valid one is re-checked by the verifier when the project is opened.
 */
export function parseProject(text: string): SavedProject {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('not json'); }
  if (!isObj(raw) || raw.format !== PROJECT_FORMAT || raw.version !== PROJECT_VERSION) throw new Error('not a project');

  const v = raw.vehicle;
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.name !== 'string'
    || ![v.length, v.width, v.height, v.maxWeight].every(positive)) throw new Error('bad vehicle');
  const vehicle = { ...v, wheelArches: Array.isArray(v.wheelArches) ? v.wheelArches : [] } as Vehicle;

  if (!Array.isArray(raw.cargoItems)) throw new Error('bad cargo');
  const cargoItems: CargoItem[] = raw.cargoItems.map((c: unknown) => {
    if (!isObj(c) || typeof c.id !== 'string' || ![c.length, c.width, c.height, c.weight, c.quantity].every(positive)
      || !Number.isInteger(c.quantity) || !ROTATIONS.includes(c.rotation as string)) throw new Error('bad cargo item');
    return {
      ...c,
      name: typeof c.name === 'string' ? c.name.slice(0, 60) : '',
      color: typeof c.color === 'string' && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#818cf8',
      stackable: c.stackable !== false,
      floorOnly: c.floorOnly === true,
      stop: Number.isInteger(c.stop) && (c.stop as number) > 1 ? c.stop : undefined,
    } as CargoItem;
  });

  let plan: SavedProject['plan'] = null;
  const p = raw.plan;
  if (isObj(p) && Array.isArray(p.placed) && Array.isArray(p.unplaced)
    && p.placed.every(u => isObj(u) && typeof u.cargoId === 'string'
      && [u.x, u.y, u.z, u.weight].every(nonNegative) && [u.length, u.width, u.height].every(positive))) {
    plan = p as unknown as SavedProject['plan'];
  }

  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : 'Projekt',
    savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : new Date().toISOString(),
    vehicle,
    cargoItems,
    plan,
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
